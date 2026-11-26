// MD-002: the inventory chunk import stores "Estatus" and "Fecha de ultima
// venta" (migration 038) in staging and copies them on finalize.

import { readFileSync } from 'node:fs'

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  appendInventoryChunk,
} from '../../server/services/inventoryChunkImportService.js'

function fakeClient() {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes('FROM data_imports')) {
      return { rows: [{ id: 41, dataset_type: 'inventory', status: 'processing' }], rowCount: 1 }
    }

    return { rows: [], rowCount: 0 }
  })

  return { query, release: vi.fn() }
}

const ROW = {
  snapshotDate: null,
  productName: '5I100MER01',
  productCode: null,
  brand: 'UNV',
  model: null,
  location: 'CEDIS CDMX',
  onHand: 0,
  available: 0,
  committed: 0,
  inTransit: null,
  onOrder: 40,
  unitCost: null,
  inventoryValue: null,
  currency: null,
}

async function stagedParams(row: Record<string, unknown>) {
  const client = fakeClient()

  await appendInventoryChunk(
    { connect: async () => client },
    { importId: 41, chunkIndex: 0, rows: [row] },
  )

  const insert = client.query.mock.calls.find(([sql]) =>
    String(sql).includes('INSERT INTO inventory_import_staging'),
  )!

  return { sql: String(insert[0]), params: insert[1] as unknown[] }
}

describe('MD-002 inventory chunk import', () => {
  it('stages the catalog status and the last sale date', async () => {
    const { sql, params } = await stagedParams({
      ...ROW,
      catalogStatus: 'DE LINEA',
      lastSaleDate: '2026-11-20',
    })

    expect(sql).toMatch(/currency,\s*catalog_status,\s*last_sale_date\s*\)/)
    expect(sql).toContain('$18')
    expect(params).toHaveLength(18)
    expect(params.slice(-3)).toEqual([null, 'DE LINEA', '2026-11-20'])
  })

  it('stores NULL when an older client does not send them', async () => {
    const { params } = await stagedParams(ROW)

    expect(params.slice(-2)).toEqual([null, null])
  })

  it('copies both columns from staging to inventory_snapshots on finalize', () => {
    const source = readFileSync(
      new URL('../../server/services/inventoryChunkImportService.js', import.meta.url),
      'utf8',
    )

    expect(source).toMatch(
      /INSERT INTO inventory_snapshots \([^)]*catalog_status,\s*last_sale_date\s*\)\s*SELECT[\s\S]*staging\.catalog_status,\s*staging\.last_sale_date\s*FROM inventory_import_staging/,
    )
  })
})
