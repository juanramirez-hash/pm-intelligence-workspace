// MD-002 "Mi día" availability: SQL reads with a fake pool (no PostgreSQL).

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  groupLinesByItem,
  inventoryHasCatalogStatus,
  loadInventoryItems,
  loadItemSales,
  loadLatestImports,
  loadPendingPurchaseOrderLines,
} from '../../server/services/myDayAvailabilityService.js'

function fakePool(rows: Array<Record<string, unknown>> = []) {
  const query = vi.fn(async () => ({ rows }))

  return {
    pool: { query },
    calls: () => query.mock.calls.length,
    sql: () => String((query.mock.calls[0] as unknown[])[0]),
    params: () => (query.mock.calls[0] as unknown[])[1] as unknown[],
  }
}

const ITEM_KEY = "UPPER(BTRIM(REGEXP_REPLACE(product_name, '\\s+', ' ', 'g')))"

describe('MD-002 availability service', () => {
  it('finds the last completed import per dataset like the read services', async () => {
    const { pool, sql, params } = fakePool([
      { dataset_type: 'inventory', id: '41', uploaded_at: '2026-11-26T15:00:00.000Z' },
    ])

    const imports = await loadLatestImports(pool)

    expect(sql()).toContain("status = 'completed'")
    expect(sql()).toContain('ORDER BY dataset_type, completed_at DESC NULLS LAST, id DESC')
    expect(params()).toEqual([['inventory', 'purchases', 'sales']])
    expect(imports.get('inventory')).toEqual({
      importId: 41, uploadedAt: '2026-11-26T15:00:00.000Z',
    })
    expect(imports.has('purchases')).toBe(false)
  })

  it('checks whether the import carries any catalog status', async () => {
    const { pool, sql, params } = fakePool([{ has_status: false }])

    expect(await inventoryHasCatalogStatus(pool, 41)).toBe(false)
    expect(sql()).toContain('catalog_status IS NOT NULL')
    expect(params()).toEqual([41])
  })

  it('sums stock and on order of every branch of the latest import, by item code', async () => {
    const { pool, sql, params } = fakePool([
      {
        item_key: '5I100MER01', item_code: '5I100MER01', brand: '- Unassigned -',
        brand_key: 'UNASSIGNED', catalog_status: 'DE LINEA', last_sale_date: '2026-11-20',
        on_hand: '0.0000', on_order: '40.0000',
      },
    ])

    const items = await loadInventoryItems(pool, 41, ['UNASSIGNED', 'UNV'])

    expect(sql()).toContain(ITEM_KEY)
    expect(sql()).toContain('WHERE import_id = $1')
    expect(sql()).toContain('SUM(on_hand)')
    expect(sql()).toContain('SUM(COALESCE(on_order, 0))')
    expect(sql()).not.toContain('in_transit')
    expect(sql()).toContain('brand_key(items.brand) = ANY($2::TEXT[])')
    expect(params()).toEqual([41, ['UNASSIGNED', 'UNV']])
    // "- Unassigned -" is not hidden.
    expect(items).toEqual([{
      itemKey: '5I100MER01', itemCode: '5I100MER01', brand: '- Unassigned -',
      brandKey: 'UNASSIGNED', catalogStatus: 'DE LINEA', lastSaleDate: '2026-11-20',
      onHand: 0, pendingReceiptUnits: 40,
    }])
  })

  it('reads every brand without a brand filter in all-brands mode', async () => {
    const { pool, sql, params } = fakePool()

    await loadInventoryItems(pool, 41, null)

    expect(sql()).not.toContain('brand_key(items.brand) = ANY')
    expect(params()).toEqual([41])
  })

  it('reads net units of the window by item code', async () => {
    const { pool, sql, params } = fakePool([{ item_key: 'A', units: '-2' }])

    const sales = await loadItemSales(
      pool, ['A'], { from: '2026-08-25', to: '2026-11-24', days: 92, months: 3 },
    )

    expect(sql()).toContain('sale_date BETWEEN $1::DATE AND $2::DATE')
    expect(sql()).toContain('SUM(quantity)')
    expect(params()).toEqual(['2026-08-25', '2026-11-24', ['A']])
    expect(sales.get('A')).toBe(-2)

    const none = fakePool()

    expect(await loadItemSales(none.pool, [], { from: 'x', to: 'y' })).toEqual(new Map())
    expect(none.calls()).toBe(0)
  })

  it('reads pending product lines with the statuses as parameters, without cost', async () => {
    const { pool, sql, params } = fakePool([
      {
        item_key: 'A', purchase_order_number: 'PO1', supplier_name: 'Prov', status: 'Pending Bill',
        shipment_status: null, expected_receipt_date: '2026-12-01', currency: 'USD',
        brand: 'UNV', brand_key: 'UNV', cost_visible: false, amount: null,
      },
    ])

    const lines = await loadPendingPurchaseOrderLines(pool, { itemKeys: ['A'] }, { mode: 'none' })

    expect(sql()).toContain('line_type = $1')
    expect(sql()).toContain('status = ANY($2::TEXT[])')
    expect(sql()).toContain("UPPER(BTRIM(REGEXP_REPLACE(item_code, '\\s+', ' ', 'g'))) = ANY($3::TEXT[])")
    expect(sql()).toContain('CASE WHEN FALSE THEN amount_foreign_currency END AS amount')
    expect(sql()).not.toContain('Pending Supervisor Approval')
    expect(params()).toEqual(['product', ['Pending Receipt', 'Pending Bill'], ['A']])
    expect(lines).toEqual([{
      itemKey: 'A', purchaseOrderNumber: 'PO1', supplierName: 'Prov', status: 'Pending Bill',
      shipmentStatus: null, expectedReceiptDate: '2026-12-01', currency: 'USD',
      brand: 'UNV', brandKey: 'UNV', costVisible: false, amount: null,
    }])
  })

  it('applies the cost scope of the purchases service by purchase order brand', async () => {
    const assigned = fakePool()

    await loadPendingPurchaseOrderLines(
      assigned.pool,
      { brandKeys: ['UNV'] },
      { mode: 'assigned', brandKeys: ['UNV', 'HIKVISION'] },
    )

    expect(assigned.sql()).toContain('AND brand_key(brand) = ANY($3::TEXT[])')
    expect(assigned.sql()).toContain(
      'CASE WHEN brand_key(brand) = ANY($4::TEXT[]) THEN amount_foreign_currency END',
    )
    expect(assigned.params()).toEqual([
      'product', ['Pending Receipt', 'Pending Bill'], ['UNV'], ['UNV', 'HIKVISION'],
    ])

    const all = fakePool()

    await loadPendingPurchaseOrderLines(all.pool, { brandKeys: null }, { mode: 'all' })

    expect(all.sql()).toContain('CASE WHEN TRUE THEN amount_foreign_currency END')
    expect(all.sql()).not.toContain('brand_key(brand) = ANY')

    const empty = fakePool()

    expect(await loadPendingPurchaseOrderLines(empty.pool, { itemKeys: [] }, { mode: 'all' })).toEqual([])
    expect(empty.calls()).toBe(0)
  })

  it('groups lines by item', () => {
    const grouped = groupLinesByItem([
      { itemKey: 'A', purchaseOrderNumber: '1' },
      { itemKey: 'A', purchaseOrderNumber: '2' },
      { itemKey: 'B', purchaseOrderNumber: '3' },
    ])

    expect(grouped.get('A')).toHaveLength(2)
    expect(grouped.get('B')).toHaveLength(1)
  })
})
