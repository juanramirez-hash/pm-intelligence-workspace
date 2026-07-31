import { describe, expect, it } from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { inventoryImportPlugin } from './inventoryPlugin'

const longRows = [
  {
    'Fecha de corte': '2026-07-30',
    'Name (Grouped)': 'P-1',
    Marca: 'UNV',
    Modelo: 'IPC-A',
    'Location: Name (Grouped)': '002 CDMX',
    'On Hand': '10',
    Disponible: '8',
    Reservado: '2',
    'En tránsito': '4',
    'Total Value': '$1,250.50',
    Moneda: 'MXN',
  },
]

const wideRows = [
  {
    Item: '8R320HYT02',
    Marca: 'HYTERA',
    'CEDIS CDMX Cantidad Actual en Orden': 3,
    'CEDIS CDMX En Mano': 10,
    'CEDIS CDMX Cantidad Comprometida': 2,
    'CEDIS CDMX Cantidad Actual Disponible': 8,
    ' CEDIS CDMX Cantidad Actual en Tránsito': 4,
    'CEDIS CDMX Average Cost': 0.99,
    'VENTAS QRO Cantidad Actual en Orden': null,
    'VENTAS QRO En Mano': 1,
    'VENTAS QRO Cantidad Comprometida': 0,
    'VENTAS QRO Cantidad Actual Disponible': 1,
    'VENTAS QRO  Cantidad Actual en Tránsito': null,
    'VENTAS QRO Average Cost': 1.05,
    'TOTAL Cantidad Actual en Orden': 3,
    'TOTAL En Mano': 11,
    'TOTAL Cantidad Comprometida': 2,
    'TOTAL Cantidad Actual Disponible': 9,
    'TOTAL  Cantidad Actual en Tránsito': 4,
    'TOTAL Average Cost': 1,
  },
]

describe('IW-001 Inventory Import Plugin', () => {
  it('mantiene soporte para el formato largo', () => {
    const result = runImportEngine(
      inventoryImportPlugin,
      longRows,
    )

    expect(result.valid).toBe(true)
    expect(result.processedRows).toBe(1)
    expect(result.normalizedRows[0]).toMatchObject({
      productName: 'P-1',
      location: '002 CDMX',
      onHand: 10,
      available: 8,
    })
  })

  it('detecta y despivota inventario por sucursal', () => {
    const result = runImportEngine(
      inventoryImportPlugin,
      wideRows,
    )

    expect(result.valid).toBe(true)
    expect(result.reportType).toBe('inventory')
    expect(result.processedRows).toBe(2)
    expect(result.normalizedRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productName: '8R320HYT02',
          brand: 'HYTERA',
          location: 'CEDIS CDMX',
          onHand: 10,
          available: 8,
          committed: 2,
          inTransit: 4,
          onOrder: 3,
          unitCost: 0.99,
          inventoryValue: 9.9,
        }),
        expect.objectContaining({
          location: 'VENTAS QRO',
          onHand: 1,
          available: 1,
          unitCost: 1.05,
          inventoryValue: 1.05,
        }),
      ]),
    )
    expect(
      result.normalizedRows.some(
        (row) => row.location === 'TOTAL',
      ),
    ).toBe(false)
    expect(result.summary).toMatchObject({
      uniqueProducts: 1,
      uniqueLocations: 2,
      totalOnHand: 11,
      totalAvailable: 9,
      totalCommitted: 2,
      totalInTransit: 4,
      totalOnOrder: 3,
      totalInventoryValue: 10.95,
      processedRows: 2,
    })
  })

  it('reconoce el encabezado real aunque tenga espacios y acentos', () => {
    const detection = inventoryImportPlugin.detect([
      'Item',
      'Marca',
      'CEDIS CDMX En Mano',
      ' CEDIS CDMX Cantidad Actual en Tránsito',
      'VENTAS QRO  Cantidad Actual en Tránsito',
      'TOTAL En Mano',
    ])

    expect(detection.valid).toBe(true)
    expect(detection.reportType).toBe('inventory')
    expect(detection.confidence).toBeGreaterThanOrEqual(90)
    expect(detection.missingRequiredFields).toEqual([])
  })
})
