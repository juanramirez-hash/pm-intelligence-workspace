// MD-002: "Estatus" and "Fecha de ultima venta" of the raw NetSuite
// inventory export travel with every branch position.

import { describe, expect, it } from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { lastSaleDateValue } from './inventoryNormalizer'
import { inventoryImportPlugin } from './inventoryPlugin'

const branchColumns = (branch: string, onHand: number | null, onOrder: number | null) => ({
  [`${branch} En Mano`]: onHand,
  [`${branch} Cantidad Actual en Orden`]: onOrder,
})

const wideRows = [
  // NetSuite grouping row: still ignored.
  { Item: 'Inventory Item', Marca: null, Estatus: null, 'Fecha de ultima venta': null },
  {
    Item: '5i100mer01',
    Marca: 'MERIVA TECHNOLOGY - STREAMAX',
    'Internal ID': '101',
    Estatus: ' de linea ',
    'Fecha de ultima venta': '20/11/2026',
    ...branchColumns('CEDIS CDMX', 0, 40),
    ...branchColumns('VENTAS QRO', 0, null),
    ...branchColumns('TOTAL', 0, 40),
  },
  {
    Item: 'A-2',
    Marca: '- Unassigned -',
    'Internal ID': '102',
    Estatus: null,
    'Fecha de ultima venta': null,
    ...branchColumns('CEDIS CDMX', 3, 0),
    ...branchColumns('VENTAS QRO', 1, 0),
    ...branchColumns('TOTAL', 4, 0),
  },
]

describe('MD-002 inventory catalog status and last sale date', () => {
  it('copies both item columns to every branch position of the wide export', () => {
    const result = runImportEngine(inventoryImportPlugin, wideRows)

    expect(result.valid).toBe(true)
    expect(result.normalizedRows).toHaveLength(4)
    expect(result.normalizedRows.filter((row) => row.productName === '5I100MER01')).toEqual([
      expect.objectContaining({
        location: 'CEDIS CDMX',
        onHand: 0,
        onOrder: 40,
        catalogStatus: 'DE LINEA',
        lastSaleDate: '2026-11-20',
      }),
      expect.objectContaining({
        location: 'VENTAS QRO',
        onOrder: null,
        catalogStatus: 'DE LINEA',
        lastSaleDate: '2026-11-20',
      }),
    ])
    // A missing status stays missing: never inferred.
    expect(result.normalizedRows.find((row) => row.productName === 'A-2')).toMatchObject({
      brand: '- Unassigned -',
      catalogStatus: null,
      lastSaleDate: null,
    })
    expect(result.normalizedRows.some((row) => row.productName === 'INVENTORY ITEM')).toBe(false)
    expect(result.normalizedRows.some((row) => row.location === 'TOTAL')).toBe(false)
  })

  it('accepts the accented header and the long layout', () => {
    const result = runImportEngine(inventoryImportPlugin, [{
      Item: 'P-1',
      Location: '002 CDMX',
      'On Hand': 5,
      Estatus: 'ULTIMAS PIEZAS',
      'Fecha de última venta': '2026-10-01',
    }])

    expect(result.normalizedRows[0]).toMatchObject({
      catalogStatus: 'ULTIMAS PIEZAS',
      lastSaleDate: '2026-10-01',
    })
  })

  it('keeps exports without the new columns valid and unchanged', () => {
    const result = runImportEngine(inventoryImportPlugin, [{
      Item: 'P-1',
      Location: '002 CDMX',
      'On Hand': 5,
    }])

    expect(result.valid).toBe(true)
    // The server stores them as NULL (row.catalogStatus ?? null).
    expect(result.normalizedRows[0]).not.toHaveProperty('catalogStatus')
    expect(result.normalizedRows[0]).not.toHaveProperty('lastSaleDate')
  })

  it('reads the last sale date day first and never guesses', () => {
    expect(lastSaleDateValue('05/11/2026')).toBe('2026-11-05')
    expect(lastSaleDateValue('5/1/2026')).toBe('2026-01-05')
    expect(lastSaleDateValue('2026-11-05')).toBe('2026-11-05')
    expect(lastSaleDateValue(46331)).toBe('2026-11-05')
    expect(lastSaleDateValue(new Date(2026, 10, 5))).toBe('2026-11-05')
    expect(lastSaleDateValue('31/02/2026')).toBeNull()
    expect(lastSaleDateValue('Nov 5 2026')).toBeNull()
    expect(lastSaleDateValue('')).toBeNull()
    expect(lastSaleDateValue(null)).toBeNull()
  })
})
