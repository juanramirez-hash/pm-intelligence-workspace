// MD-002-HOTFIX1: item records of the inventory import (inventory_items,
// migration 039): validation, chunk insert, finalize check against the
// positions and cleanup. Fake PostgreSQL client.

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  INVENTORY_ITEMS_MAX_PER_CHUNK,
  appendInventoryItems,
  cancelInventoryChunkImport,
  finalizeInventoryChunkImport,
  validateInventoryItems,
} from '../../server/services/inventoryChunkImportService.js'

interface VerifyRow {
  item_count: number
  item_positions: number
  item_on_hand: string
  item_on_order: string
  snapshot_positions: number
  snapshot_on_hand: string
  snapshot_on_order: string
}

function fakeClient({
  status = 'processing',
  verify,
}: { status?: string, verify?: VerifyRow } = {}) {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes('FROM data_imports') && sql.includes('FOR UPDATE')) {
      return {
        rows: [{ id: 41, dataset_type: 'inventory', status, source_row_count: 0 }],
        rowCount: 1,
      }
    }

    if (sql.includes('FROM inventory_import_staging') && sql.includes('COUNT(*)')) {
      return {
        rows: [{ row_count: 0, snapshot_dates: null, contains_null_snapshot: false }],
        rowCount: 1,
      }
    }

    if (sql.includes('item_count')) {
      return { rows: [verify], rowCount: 1 }
    }

    if (sql.includes('RETURNING *')) {
      return { rows: [{ id: 41, status: 'completed' }], rowCount: 1 }
    }

    return { rows: [], rowCount: 3 }
  })

  return { query, release: vi.fn() }
}

const sqlOf = (client: ReturnType<typeof fakeClient>) =>
  client.query.mock.calls.map(([sql]) => String(sql).replace(/\s+/g, ' ').trim())

const ITEM = {
  itemCode: 'AH041UNI01',
  brand: 'UNIARCH BY UNV',
  catalogStatus: 'DE LINEA',
  lastSaleDate: null,
  onHand: 0,
  committed: 0,
  available: 0,
  inTransit: 0,
  onOrder: 0,
  positions: 0,
}

const MATCHING: VerifyRow = {
  item_count: 2,
  item_positions: 3,
  item_on_hand: '416480.0000',
  item_on_order: '691406.0000',
  snapshot_positions: 3,
  snapshot_on_hand: '416480.0000',
  snapshot_on_order: '691406.0000',
}

describe('MD-002-HOTFIX1 item records validation', () => {
  it('accepts articles without any quantity and keeps no cost', () => {
    const [record] = validateInventoryItems([{ ...ITEM, unitCost: 10, inventoryValue: 99 }])

    expect(record).toEqual(ITEM)
  })

  it('rejects invalid records with 400', () => {
    for (const items of [
      'x',
      [{ ...ITEM, itemCode: ' ' }],
      [{ ...ITEM, onHand: 'diez' }],
      [{ ...ITEM, onOrder: Number.NaN }],
      [{ ...ITEM, positions: -1 }],
      [{ ...ITEM, lastSaleDate: '20/11/2026' }],
      Array(INVENTORY_ITEMS_MAX_PER_CHUNK + 1).fill(ITEM),
    ]) {
      expect(() => validateInventoryItems(items)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      )
    }
  })
})

describe('MD-002-HOTFIX1 item records chunk', () => {
  it('inserts one chunk with UNNEST and ignores a re-sent chunk', async () => {
    const client = fakeClient()

    const result = await appendInventoryItems(
      { connect: async () => client },
      { importId: 41, items: [ITEM, { ...ITEM, itemCode: 'A-2', onHand: 5, positions: 2 }] },
    )

    const insert = client.query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO inventory_items'),
    )!

    expect(String(insert[0])).toContain('FROM UNNEST(')
    expect(String(insert[0])).toContain('ON CONFLICT (import_id, item_code) DO NOTHING')
    expect(String(insert[0])).not.toMatch(/unit_cost|inventory_value/)
    expect(insert[1]).toEqual([
      41,
      ['AH041UNI01', 'A-2'],
      ['UNIARCH BY UNV', 'UNIARCH BY UNV'],
      ['DE LINEA', 'DE LINEA'],
      [null, null],
      [0, 5],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 2],
    ])
    expect(result).toEqual({ receivedItems: 2, insertedItems: 3 })
    expect(sqlOf(client).at(-1)).toBe('COMMIT')
  })

  it('refuses items for an import that is not processing', async () => {
    const client = fakeClient({ status: 'completed' })

    await expect(
      appendInventoryItems({ connect: async () => client }, { importId: 41, items: [ITEM] }),
    ).rejects.toMatchObject({ statusCode: 409 })
    expect(sqlOf(client)).toContain('ROLLBACK')
  })
})

describe('MD-002-HOTFIX1 finalize', () => {
  it('checks count and totals, keeps only the latest item records', async () => {
    const client = fakeClient({ verify: MATCHING })

    const result = await finalizeInventoryChunkImport(
      { connect: async () => client },
      { importId: 41, expectedItemCount: 2 },
    )
    const statements = sqlOf(client)

    expect(result.itemCount).toBe(2)
    expect(statements.some((sql) => sql.includes('FROM inventory_items WHERE import_id = $1')
      && sql.includes('FROM inventory_snapshots WHERE import_id = $1'))).toBe(true)
    expect(statements).toContain('DELETE FROM inventory_items WHERE import_id <> $1')
    expect(statements.at(-1)).toBe('COMMIT')

    const metadata = client.query.mock.calls.find(([sql]) => String(sql).includes("'itemCount'"))!

    expect((metadata[1] as unknown[]).at(-1)).toBe(2)
  })

  it('fails with a clear 422 and rolls back when the totals do not match', async () => {
    for (const verify of [
      { ...MATCHING, item_count: 1 },
      { ...MATCHING, item_on_hand: '416479.0000' },
      { ...MATCHING, item_on_order: '691406.0002' },
      { ...MATCHING, item_positions: 2 },
    ]) {
      const client = fakeClient({ verify })

      await expect(
        finalizeInventoryChunkImport({ connect: async () => client }, { importId: 41, expectedItemCount: 2 }),
      ).rejects.toMatchObject({
        statusCode: 422,
        message: expect.stringContaining('no cuadra y no se aplicó (se conserva la carga anterior)'),
      })

      const statements = sqlOf(client)

      // The previous import is kept: no COMMIT, and the other imports'
      // item records are not deleted.
      expect(statements).toContain('ROLLBACK')
      expect(statements).not.toContain('COMMIT')
      expect(statements).not.toContain('DELETE FROM inventory_items WHERE import_id <> $1')
      // The failed import's own records are dropped after the rollback.
      expect(statements.at(-1)).toBe('DELETE FROM inventory_items WHERE import_id = $1')
    }
  })

  it('accepts a difference within the 0.0001 tolerance', async () => {
    const client = fakeClient({ verify: { ...MATCHING, item_on_hand: '416480.00005' } })

    await expect(
      finalizeInventoryChunkImport({ connect: async () => client }, { importId: 41, expectedItemCount: 2 }),
    ).resolves.toMatchObject({ itemCount: 2 })
  })

  it('keeps working for clients that send no item records', async () => {
    const client = fakeClient()

    const result = await finalizeInventoryChunkImport({ connect: async () => client }, { importId: 41 })

    expect(result.itemCount).toBeNull()
    expect(sqlOf(client).some((sql) => sql.includes('item_count'))).toBe(false)
  })

  it('drops the item records of a cancelled import', async () => {
    const client = fakeClient()

    const result = await cancelInventoryChunkImport({ connect: async () => client }, { importId: 41 })

    expect(sqlOf(client)).toContain('DELETE FROM inventory_items WHERE import_id = $1')
    expect(result.deletedItems).toBe(3)
  })
})
