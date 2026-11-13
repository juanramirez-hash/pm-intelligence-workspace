import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  datasetCache,
} from '../../server/middleware/datasetCache.js'
import {
  normalizeBrandKey,
  resolveCostScope,
} from '../../server/middleware/requireBrandScope.js'
import {
  createInventoryRouter,
} from '../../server/routes/inventory.js'
import {
  createSettingsRolesRouter,
} from '../../server/routes/settingsRoles.js'
import {
  loadInventoryDataset,
} from '../../server/services/inventoryReadService.js'
import {
  loadPricingDataset,
} from '../../server/services/pricingReadService.js'
import {
  loadProductDataset,
} from '../../server/services/productReadService.js'
import {
  loadPurchaseOrderDataset,
} from '../../server/services/purchaseOrderReadService.js'

type Row = Record<string, unknown>

const users = {
  pm: {
    role: 'pm',
    scope: 'assigned',
    writeAccess: true,
    costAccess: true,
    brandIds: ['Hikvision'],
  },
  engineering: {
    role: 'engineering',
    scope: 'assigned',
    writeAccess: false,
    costAccess: false,
    brandIds: ['Hikvision'],
  },
  admin: {
    role: 'admin',
    scope: 'all',
    writeAccess: true,
    costAccess: true,
    brandIds: [],
  },
}

const importRow = {
  file_name: 'fuente.xlsx',
  uploaded_at: new Date('2026-11-01T12:00:00.000Z'),
  ignored_rows: 0,
}

const cacheStateRow = {
  import_count: '3',
  max_import_id: '90',
  max_completed_at: new Date('2026-11-01T12:00:00.000Z'),
  data_version: 4,
}

/**
 * Emulates the cost visibility condition the services send to PostgreSQL:
 * TRUE, FALSE or brand_key(<column>) = ANY($n::TEXT[]). brand_key() is
 * emulated with normalizeBrandKey, which follows the same rule. The real
 * SQL is checked against PostgreSQL with server/scripts/sec003aVerification.sql.
 */
function emulateDataQuery(
  sql: string,
  params: unknown[] = [],
  rows: Row[],
) {
  const condition =
    sql.match(/WHERE (TRUE|FALSE|brand_key\(\w+\) = ANY\(\$\d+::TEXT\[\]\))/)?.[1] ??
    sql.match(/CASE WHEN (TRUE|FALSE|brand_key\(\w+\) = ANY\(\$\d+::TEXT\[\]\)) THEN/)?.[1]

  if (!condition) {
    throw new Error('Cost visibility condition not found')
  }

  const isVisible = (row: Row) => {
    if (condition === 'TRUE') {
      return true
    }

    if (condition === 'FALSE') {
      return false
    }

    const [, column, index] =
      condition.match(/brand_key\((\w+)\) = ANY\(\$(\d+)/) ?? []
    const brandKeys =
      params[Number(index) - 1] as string[]

    return brandKeys.includes(
      normalizeBrandKey(row[column]) ?? '',
    )
  }

  if (sql.includes('WHERE ')) {
    const filtered = rows.filter(isVisible)

    return {
      rows: filtered,
      rowCount: filtered.length,
    }
  }

  const maskedColumns = [
    ...sql.matchAll(/THEN (\w+) END AS (\w+)/g),
  ].map((match) => match[2])

  const masked = rows.map((row) =>
    isVisible(row)
      ? row
      : {
          ...row,
          ...Object.fromEntries(
            maskedColumns.map((column) => [column, null]),
          ),
        },
  )

  return {
    rows: masked,
    rowCount: masked.length,
  }
}

function buildPool(
  table: string,
  rows: Row[],
) {
  const query = vi.fn(
    async (sql: string, params?: unknown[]) => {
      if (sql.includes('data_cache_version')) {
        return { rows: [cacheStateRow], rowCount: 1 }
      }

      if (sql.includes('FROM data_imports')) {
        return { rows: [importRow], rowCount: 1 }
      }

      if (!sql.includes(`FROM ${table}`)) {
        throw new Error(`Unexpected query: ${sql}`)
      }

      return emulateDataQuery(sql, params, rows)
    },
  )

  return {
    query,
    connect: vi.fn(async () => ({
      query,
      release: vi.fn(),
    })),
  }
}

const inventoryRows = [
  {
    snapshot_date: new Date('2026-11-01T00:00:00.000Z'),
    product_name: 'Camara',
    product_code: 'HK-1',
    brand: 'HIKVISION',
    unit_cost: '10.5',
    inventory_value: '105',
    on_hand: '10',
  },
  {
    snapshot_date: new Date('2026-11-01T00:00:00.000Z'),
    product_name: 'Switch',
    product_code: 'DH-1',
    brand: 'DAHUA',
    unit_cost: '20',
    inventory_value: '200',
    on_hand: '10',
  },
]

const productRows = [
  {
    id: 1,
    code: 'HK-1',
    brand: 'HIKVISION',
    average_cost_usd: '10.5',
    total_value: '105',
    inventory_value_mxn: '2000',
    inventory_value_usd: '105',
  },
  {
    id: 2,
    code: 'DH-1',
    brand: 'DAHUA',
    average_cost_usd: '20',
    total_value: '200',
    inventory_value_mxn: '4000',
    inventory_value_usd: '200',
  },
]

const purchaseOrderRows = [
  {
    id: 1,
    line_key: 'PO-1:1',
    item_code: 'HK-1',
    brand: 'HIKVISION',
    quantity: '5',
    amount_foreign_currency: '52.5',
  },
  {
    id: 2,
    line_key: 'PO-2:1',
    item_code: 'DH-1',
    brand: 'DAHUA',
    quantity: '5',
    amount_foreign_currency: '100',
  },
]

const pricingRows = [
  {
    source_price_id: 'HK-1:MXN',
    product_id: 'HK-1',
    brand_id: 'Hikvision',
    cost: '10.5',
    list_price: '20',
    source_row_number: 1,
  },
  {
    source_price_id: 'DH-1:MXN',
    product_id: 'DH-1',
    brand_id: 'DAHUA',
    cost: '20',
    list_price: '40',
    source_row_number: 2,
  },
]

const costDatasets = [
  {
    name: 'inventory',
    table: 'inventory_snapshots',
    rows: inventoryRows,
    load: loadInventoryDataset,
    code: 'productCode',
    fields: ['unitCost', 'inventoryValue'],
  },
  {
    name: 'products',
    table: 'products',
    rows: productRows,
    load: loadProductDataset,
    code: 'code',
    fields: [
      'averageCostUsd',
      'totalValue',
      'inventoryValueMxn',
      'inventoryValueUsd',
    ],
  },
  {
    name: 'purchases',
    table: 'purchase_orders',
    rows: purchaseOrderRows,
    load: loadPurchaseOrderDataset,
    code: 'itemCode',
    fields: ['amountForeignCurrency'],
  },
]

async function loadFor(
  dataset: typeof costDatasets[number],
  user: Row,
) {
  const pool = buildPool(dataset.table, dataset.rows)
  const result = await dataset.load(
    pool,
    resolveCostScope(user),
  )

  return {
    pool,
    rowsByCode: new Map(
      result.normalizedRows.map((row: Row) => [
        row[dataset.code],
        row,
      ]),
    ),
  }
}

describe('SEC-003A cost visibility', () => {
  describe.each(costDatasets)('$name', (dataset) => {
    it('pm sees costs of its brand and NULL for other brands', async () => {
      const { pool, rowsByCode } =
        await loadFor(dataset, users.pm)
      const dataQuery = pool.query.mock.calls.find(
        ([sql]) => sql.includes(`FROM ${dataset.table}`),
      )

      expect(dataQuery?.[1]).toEqual([['HIKVISION']])
      expect(rowsByCode.size).toBe(2)

      for (const field of dataset.fields) {
        expect(rowsByCode.get('HK-1')?.[field]).not.toBeNull()
        expect(rowsByCode.get('DH-1')?.[field]).toBeNull()
      }
    })

    it('engineering receives NULL in every cost field and keeps the rows', async () => {
      const { pool, rowsByCode } =
        await loadFor(dataset, users.engineering)
      const [sql, params] = pool.query.mock.calls.find(
        ([text]) => text.includes(`FROM ${dataset.table}`),
      ) ?? []

      expect(sql).toContain('CASE WHEN FALSE THEN')
      expect(params).toEqual([])
      expect(rowsByCode.size).toBe(2)

      for (const row of rowsByCode.values()) {
        for (const field of dataset.fields) {
          expect(row[field]).toBeNull()
        }
      }
    })

    it('admin receives every cost', async () => {
      const { rowsByCode } =
        await loadFor(dataset, users.admin)

      for (const row of rowsByCode.values()) {
        for (const field of dataset.fields) {
          expect(row[field]).not.toBeNull()
        }
      }
    })

    it('hides costs when no cost scope is given', async () => {
      const pool = buildPool(dataset.table, dataset.rows)
      const result = await dataset.load(pool)

      for (const row of result.normalizedRows) {
        for (const field of dataset.fields) {
          expect(row[field]).toBeNull()
        }
      }
    })
  })

  describe('pricing', () => {
    async function loadPricingFor(user: Row) {
      const pool = buildPool('pricing_records', pricingRows)

      return loadPricingDataset(
        pool,
        resolveCostScope(user),
      )
    }

    it('pm receives only the pricing rows of its brand', async () => {
      const dataset = await loadPricingFor(users.pm)

      expect(
        dataset?.normalizedRows.map((row: Row) => row.productId),
      ).toEqual(['HK-1'])
    })

    it('engineering receives an empty dataset with the same shape', async () => {
      const dataset = await loadPricingFor(users.engineering)

      expect(dataset).toEqual({
        normalizedRows: [],
        ignoredRows: 0,
        lastImportedFile: 'fuente.xlsx',
        lastImportedAt: '2026-11-01T12:00:00.000Z',
      })
    })

    it('admin receives every pricing row', async () => {
      const dataset = await loadPricingFor(users.admin)

      expect(dataset?.normalizedRows).toHaveLength(2)
    })
  })
})

function buildRequest(authUser: Row) {
  return {
    authUser,
    get: vi.fn(() => undefined),
  }
}

function buildResponse() {
  const headers = new Map<string, string>()
  const res = {
    headers,
    statusCode: 200,
    body: undefined as unknown,
    set: vi.fn((name: string, value: string) => {
      headers.set(name, value)
      return res
    }),
    vary: vi.fn(() => res),
    status: vi.fn((code: number) => {
      res.statusCode = code
      return res
    }),
    end: vi.fn(() => res),
    json: vi.fn((body: unknown) => {
      res.body = body
      return res
    }),
  }

  return res
}

async function etagFor(user: Row, datasetType = 'inventory') {
  const pool = buildPool('inventory_snapshots', inventoryRows)
  const res = buildResponse()
  const next = vi.fn()

  await datasetCache(pool, {
    datasetType,
    costScoped: true,
  })(buildRequest(user), res, next)

  expect(next).toHaveBeenCalledTimes(1)

  return res.headers.get('ETag')
}

describe('SEC-003A cost-scoped ETag', () => {
  it.each(['pricing', 'inventory', 'products', 'purchases'])(
    'differs between pm, engineering and admin for %s',
    async (datasetType) => {
      const tags = await Promise.all([
        etagFor(users.pm, datasetType),
        etagFor(users.engineering, datasetType),
        etagFor(users.admin, datasetType),
      ])

      expect(new Set(tags).size).toBe(3)
    },
  )

  it('differs between pms with other brands and is stable for the same user', async () => {
    const otherPm = {
      ...users.pm,
      brandIds: ['Dahua'],
    }

    expect(await etagFor(users.pm)).toBe(await etagFor(users.pm))
    expect(await etagFor(users.pm)).not.toBe(await etagFor(otherPm))
  })
})

function findRouteHandlers(
  router: { stack: { route?: { path: string, methods: Record<string, boolean>, stack: { handle: Function }[] } }[] },
  method: string,
  path: string,
) {
  const layer = router.stack.find(
    (candidate) =>
      candidate.route?.path === path &&
      candidate.route.methods[method],
  )

  if (!layer?.route) {
    throw new Error(`Route ${method} ${path} not found`)
  }

  return layer.route.stack.map((routeLayer) => routeLayer.handle)
}

async function runHandlers(
  handlers: Function[],
  req: Row,
  res: ReturnType<typeof buildResponse>,
) {
  for (const handler of handlers) {
    let calledNext = false

    await handler(req, res, () => {
      calledNext = true
    })

    if (!calledNext) {
      return
    }
  }
}

describe('SEC-003A inventory route', () => {
  it('passes the authenticated user cost scope to the dataset', async () => {
    const pool = buildPool('inventory_snapshots', inventoryRows)
    const handlers = findRouteHandlers(
      createInventoryRouter(pool),
      'get',
      '/',
    )
    const res = buildResponse()

    await runHandlers(handlers, buildRequest(users.pm), res)

    const body = res.body as { data: { normalizedRows: Row[] } }
    const costs = body.data.normalizedRows.map((row) => row.unitCost)

    expect(costs).toEqual([10.5, null])
    expect(res.headers.get('ETag')).toBe(
      await etagFor(users.pm),
    )
  })
})

describe('SEC-003A settings roles', () => {
  function patchRole(
    roleKey: string,
    body: Row,
  ) {
    const pool = {
      query: vi.fn(async () => ({
        rows: [{ role_key: roleKey, cost_access: body.costAccess }],
      })),
    }
    const handlers = findRouteHandlers(
      createSettingsRolesRouter(pool),
      'patch',
      '/:roleKey',
    )
    const res = buildResponse()

    return runHandlers(
      handlers,
      { params: { roleKey }, body },
      res,
    ).then(() => ({ pool, res }))
  }

  it('does not let the admin role lose cost access', async () => {
    const { pool, res } = await patchRole('admin', {
      costAccess: false,
    })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({
      ok: false,
      error: 'Admin role must keep cost access',
    })
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('rejects a non-boolean cost access', async () => {
    const { pool, res } = await patchRole('pm', {
      costAccess: 'yes',
    })

    expect(res.statusCode).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('updates cost access for other roles', async () => {
    const { pool, res } = await patchRole('engineering', {
      costAccess: true,
    })
    const [sql, params] = pool.query.mock.calls[0] as unknown as [string, unknown[]]

    expect(res.statusCode).toBe(200)
    expect(sql).toContain('cost_access = $1')
    expect(sql).toContain('RETURNING')
    expect(params).toEqual([true, 'engineering'])
  })
})
