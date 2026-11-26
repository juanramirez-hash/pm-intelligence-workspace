// MD-002-HOTFIX1: one record per article, including the articles whose
// cells are all empty (NetSuite exports zeros as empty cells).

import { describe, expect, it } from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { buildInventoryItems } from './inventoryNormalizer'
import { inventoryImportPlugin } from './inventoryPlugin'
import type { InventoryValidationResult } from './inventoryValidator'

const branch = (
  name: string,
  values: { onHand?: number | null, committed?: number | null, available?: number | null, inTransit?: number | null, onOrder?: number | null },
) => ({
  [`${name} En Mano`]: values.onHand ?? null,
  [`${name} Cantidad Comprometida`]: values.committed ?? null,
  [`${name} Cantidad Actual Disponible`]: values.available ?? null,
  [`${name} Cantidad Actual en Tránsito`]: values.inTransit ?? null,
  [`${name} Cantidad Actual en Orden`]: values.onOrder ?? null,
})

const article = (
  item: string,
  status: string | null,
  lastSale: string | null,
  cedis: Parameters<typeof branch>[1],
  qro: Parameters<typeof branch>[1],
  total: Parameters<typeof branch>[1],
) => ({
  Item: item,
  Marca: 'UNV',
  Estatus: status,
  'Fecha de ultima venta': lastSale,
  ...branch('CEDIS CDMX', cedis),
  ...branch('VENTAS QRO', qro),
  ...branch('TOTAL', total),
})

const rows = [
  { Item: 'Inventory Item', Marca: null, Estatus: null, 'Fecha de ultima venta': null },
  article('STOCK', 'DE LINEA', '20/11/2026', { onHand: 5, available: 4, committed: 1 }, { onHand: 2, onOrder: 3 }, { onHand: 7, onOrder: 3 }),
  article('ORDERED', 'DE LINEA', null, { onOrder: 40 }, {}, { onOrder: 40 }),
  // Every cell empty: no position, still an article.
  article('EMPTY', 'DE LINEA', '06/02/2025', {}, {}, {}),
  article('EMPTY-NO-DATE', 'SOBRE PEDIDO', null, {}, {}, {}),
  // Same code twice: summed into one record.
  article('stock', 'DE LINEA', null, { onHand: 1 }, {}, { onHand: 1 }),
]

function importRows() {
  const result = runImportEngine(inventoryImportPlugin, rows)
  const items = buildInventoryItems(
    rows,
    result.validation as InventoryValidationResult,
    result.normalizedRows,
  )

  return { result, items: new Map(items.map((item) => [item.itemCode, item])) }
}

describe('MD-002-HOTFIX1 buildInventoryItems', () => {
  it('keeps every article, with or without positions, and no grouping row or Total', () => {
    const { result, items } = importRows()

    expect([...items.keys()]).toEqual(['STOCK', 'ORDERED', 'EMPTY', 'EMPTY-NO-DATE'])
    // The positions do not change: the empty articles are still ignored there.
    expect(result.normalizedRows.map((row) => row.productName)).not.toContain('EMPTY')
    expect(items.get('EMPTY')).toEqual({
      itemCode: 'EMPTY',
      brand: 'UNV',
      catalogStatus: 'DE LINEA',
      lastSaleDate: '2025-02-06',
      onHand: 0,
      committed: 0,
      available: 0,
      inTransit: 0,
      onOrder: 0,
      positions: 0,
    })
    expect(items.get('EMPTY-NO-DATE')).toMatchObject({ catalogStatus: 'SOBRE PEDIDO', lastSaleDate: null, positions: 0 })
    expect(items.get('ORDERED')).toMatchObject({ onHand: 0, onOrder: 40, positions: 1 })
  })

  it('sums every branch and the duplicated code, without the Total columns', () => {
    const { items } = importRows()

    expect(items.get('STOCK')).toMatchObject({
      onHand: 8,
      committed: 1,
      available: 4,
      onOrder: 3,
      positions: 3,
      lastSaleDate: '2026-11-20',
    })
  })

  it('matches the positions exactly (the server checks the same totals)', () => {
    const { result, items } = importRows()
    const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
    const records = [...items.values()]

    expect(sum(records.map((item) => item.onHand))).toBe(sum(result.normalizedRows.map((row) => row.onHand)))
    expect(sum(records.map((item) => item.onOrder))).toBe(
      sum(result.normalizedRows.map((row) => row.onOrder ?? 0)),
    )
    expect(sum(records.map((item) => item.positions))).toBe(result.normalizedRows.length)
  })

  it('builds the records from the positions in the long layout', () => {
    const longRows = [
      { Item: 'P-1', Location: '002 CDMX', 'On Hand': 5, 'On Order': 2, Estatus: 'DE LINEA' },
      { Item: 'P-1', Location: '011 QRO', 'On Hand': 1 },
      { Item: 'P-2', Location: '002 CDMX', 'On Hand': null },
    ]
    const result = runImportEngine(inventoryImportPlugin, longRows)
    const items = buildInventoryItems(longRows, result.validation as InventoryValidationResult)

    expect(items).toEqual([
      expect.objectContaining({ itemCode: 'P-1', onHand: 6, onOrder: 2, positions: 2, catalogStatus: 'DE LINEA' }),
    ])
  })
})
