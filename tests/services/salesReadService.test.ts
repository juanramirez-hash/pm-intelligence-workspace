import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  loadSalesDataset,
} from '../../server/services/salesReadService.js'

function buildSale(
  importId: number,
  date: string,
) {
  return {
    import_id: importId,
    sale_date: new Date(date),
    brand: 'ALTER',
    revenue: '100.50',
    gross_profit: '25.25',
    customer_id: '123456',
    customer_name: 'Cliente Demo',
    product_name: 'Producto Demo',
    product_code: 'SKU-1',
    model: 'MODEL-1',
    product_status: 'A',
    quantity: '2',
    document_number: 'FAC-1',
    location: 'CDMX',
    sales_rep: 'Vendedor',
    currency: 'MXN',
  }
}

type SalesRow =
  ReturnType<typeof buildSale>

interface ImportRow {
  id: number
  file_name: string
  uploaded_at: Date
}

interface PoolOptions {
  salesRows?: SalesRow[]
  importRows?: ImportRow[]
  salesError?: Error
}

function buildPool({
  salesRows = [],
  importRows = [
    {
      id: 77,
      file_name: 'sales.xlsx',
      uploaded_at: new Date(
        '2026-09-11T12:00:00.000Z',
      ),
    },
  ],
  salesError,
}: PoolOptions = {}) {
  const query = vi.fn(
    async (
      sql: string,
      ..._params: unknown[]
    ) => {
      if (
        sql.includes('FROM data_imports')
      ) {
        return {
          rowCount: importRows.length,
          rows: importRows,
        }
      }

      if (
        sql.includes('FROM sales_facts')
      ) {
        if (salesError) {
          throw salesError
        }

        return {
          rowCount: salesRows.length,
          rows: salesRows,
        }
      }

      throw new Error(
        `Unexpected query: ${sql}`,
      )
    },
  )

  const release = vi.fn()

  const pool = {
    connect: vi
      .fn()
      .mockResolvedValue({
        query,
        release,
      }),
  }

  return {
    pool,
    query,
    release,
  }
}

type QueryMock =
  ReturnType<typeof buildPool>['query']

function getSalesQueryCall(
  query: QueryMock,
) {
  const call =
    query.mock.calls.find(
      ([sql]) =>
        sql.includes('FROM sales_facts'),
    )

  if (!call) {
    throw new Error(
      'Expected a sales_facts query',
    )
  }

  return call
}

describe('loadSalesDataset', () => {
  it(
    'reads latest completed import metadata before sales facts',
    async () => {
      const {
        pool,
        query,
        release,
      } = buildPool()

      await loadSalesDataset(
        pool,
        {
          scope: 'all',
          brandIds: [],
        },
      )

      expect(query).toHaveBeenCalledTimes(2)

      const importSql =
        query.mock.calls[0][0]

      expect(importSql).toContain(
        'FROM data_imports',
      )
      expect(importSql).toContain(
        "dataset_type = 'sales'",
      )
      expect(importSql).toContain(
        "status = 'completed'",
      )
      expect(importSql).toContain(
        'completed_at DESC NULLS LAST',
      )
      expect(importSql).toContain(
        'id DESC',
      )
      expect(importSql).toContain(
        'LIMIT 1',
      )

      expect(
        query.mock.calls[1][0],
      ).toContain('FROM sales_facts')

      expect(
        release,
      ).toHaveBeenCalledOnce()
    },
  )

  it(
    'reads all sales history without restricting the import or period',
    async () => {
      const {
        pool,
        query,
      } = buildPool()

      await loadSalesDataset(
        pool,
        {
          scope: 'all',
          brandIds: [],
        },
      )

      const [
        salesSql,
        salesParams,
      ] = getSalesQueryCall(query)

      expect(salesSql).not.toMatch(
        /\bimport_id\b/i,
      )
      expect(salesSql).not.toMatch(
        /\bWHERE\b/i,
      )
      expect(salesSql).not.toMatch(
        /\bLIMIT\b/i,
      )
      expect(
        salesParams,
      ).toBeUndefined()
    },
  )

  it(
    'filters assigned brands across the complete sales history',
    async () => {
      const {
        pool,
        query,
      } = buildPool()

      await loadSalesDataset(
        pool,
        {
          scope: 'assigned',
          brandIds: [
            'ALTER',
            'MIKROTIK',
          ],
        },
      )

      const [
        salesSql,
        salesParams,
      ] = getSalesQueryCall(query)

      const compactSql =
        salesSql.replace(/\s+/g, ' ')

      expect(salesSql).not.toMatch(
        /\bimport_id\b/i,
      )
      expect(salesSql).not.toMatch(
        /\bLIMIT\b/i,
      )
      expect(compactSql).toMatch(
        /WHERE REGEXP_REPLACE\(\s*UPPER\(brand\),\s*'\[\^A-Z0-9\]',\s*'',\s*'g'\s*\) = ANY\(\$1::TEXT\[\]\)/,
      )
      expect(salesParams).toEqual([
        [
          'ALTER',
          'MIKROTIK',
        ],
      ])
    },
  )

  it(
    'keeps an empty brand filter when assigned scope has no brands',
    async () => {
      const {
        pool,
        query,
        release,
      } = buildPool()

      const dataset =
        await loadSalesDataset(
          pool,
          {
            scope: 'assigned',
            brandIds: [],
          },
        )

      const [
        salesSql,
        salesParams,
      ] = getSalesQueryCall(query)

      expect(salesSql).toContain(
        'ANY($1::TEXT[])',
      )
      expect(salesSql).not.toMatch(
        /\bimport_id\b/i,
      )
      expect(salesParams).toEqual([
        [],
      ])
      expect(dataset).toBeNull()
      expect(
        release,
      ).toHaveBeenCalledOnce()
    },
  )

  it(
    'returns null without reading facts when no completed import exists',
    async () => {
      const {
        pool,
        query,
        release,
      } = buildPool({
        importRows: [],
      })

      const dataset =
        await loadSalesDataset(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
        )

      expect(dataset).toBeNull()
      expect(query).toHaveBeenCalledTimes(1)
      expect(
        query.mock.calls[0][0],
      ).toContain('FROM data_imports')

      expect(
        release,
      ).toHaveBeenCalledOnce()
    },
  )

  it(
    'preserves rows from multiple imports and years with latest import metadata',
    async () => {
      const {
        pool,
        query,
      } = buildPool({
        salesRows: [
          buildSale(
            12,
            '2025-01-02T00:00:00.000Z',
          ),
          buildSale(
            65,
            '2026-08-20T00:00:00.000Z',
          ),
          buildSale(
            77,
            '2026-09-11T00:00:00.000Z',
          ),
        ],
      })

      const dataset =
        await loadSalesDataset(
          pool,
          {
            scope: 'assigned',
            brandIds: ['ALTER'],
          },
        )

      const [
        salesSql,
      ] = getSalesQueryCall(query)

      // El mock devuelve las filas indicadas:
      // esta aserción detecta la regresión SQL.
      expect(salesSql).not.toMatch(
        /\bimport_id\b/i,
      )

      const expectedRow = {
        brand: 'ALTER',
        revenue: 100.5,
        grossProfit: 25.25,
        customerId: '123456',
        customerName: 'Cliente Demo',
        productName: 'Producto Demo',
        productCode: 'SKU-1',
        model: 'MODEL-1',
        productStatus: 'A',
        quantity: 2,
        documentNumber: 'FAC-1',
        location: 'CDMX',
        salesRep: 'Vendedor',
        currency: 'MXN',
      }

      expect(dataset).toEqual({
        normalizedRows: [
          {
            ...expectedRow,
            date: '2025-01-02',
          },
          {
            ...expectedRow,
            date: '2026-08-20',
          },
          {
            ...expectedRow,
            date: '2026-09-11',
          },
        ],
        lastImportedFile: 'sales.xlsx',
        lastImportedAt:
          '2026-09-11T12:00:00.000Z',
      })
    },
  )

  it(
    'releases the connection when reading sales fails',
    async () => {
      const salesError =
        new Error('Sales query failed')

      const {
        pool,
        release,
      } = buildPool({
        salesError,
      })

      await expect(
        loadSalesDataset(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
        ),
      ).rejects.toThrow(salesError)

      expect(
        release,
      ).toHaveBeenCalledOnce()
    },
  )
    it(
    'normalizes assigned brands with spaces and hyphens',
    async () => {
      const { pool, query } = buildPool()

      await loadSalesDataset(pool, {
        scope: 'assigned',
        brandIds: [
          'C-DATA',
          'MARCAS VARIAS',
          'PLATINUM TOOLS',
          'NCS JAGUAR',
          ' mikrotik ',
          'SONOFF',
          'CDATA',
        ],
      })

      const [
        salesSql,
        salesParams,
      ] = getSalesQueryCall(query)

      expect(salesParams).toEqual([
        [
          'CDATA',
          'MARCASVARIAS',
          'PLATINUMTOOLS',
          'NCSJAGUAR',
          'MIKROTIK',
          'SONOFF',
        ],
      ])

      expect(salesSql).toContain(
        'ANY($1::TEXT[])',
      )

      expect(salesSql).not.toMatch(
        /\bimport_id\b/i,
      )
    },
  )
})