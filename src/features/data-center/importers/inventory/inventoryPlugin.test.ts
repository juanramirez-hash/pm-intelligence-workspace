import { describe, expect, it } from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { inventoryImportPlugin } from './inventoryPlugin'

const rows = [
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
  {
    'Fecha de corte': '2026-07-30',
    'Name (Grouped)': 'P-2',
    Marca: 'UNV',
    Modelo: 'IPC-B',
    'Location: Name (Grouped)': '011 QUERETARO',
    'On Hand': '-1',
    Disponible: '-1',
    Reservado: '0',
    'En tránsito': '0',
    'Total Value': '0',
    Moneda: 'MXN',
  },
]

describe('IW-001 Inventory Import Plugin', () => {
  it('detecta y normaliza un reporte de inventario', () => {
    const result = runImportEngine(inventoryImportPlugin, rows)

    expect(result.valid).toBe(true)
    expect(result.reportType).toBe('inventory')
    expect(result.processedRows).toBe(2)
    expect(result.normalizedRows[0]).toMatchObject({
      snapshotDate: '2026-07-30',
      productName: 'P-1',
      location: '002 CDMX',
      onHand: 10,
      available: 8,
      committed: 2,
      inTransit: 4,
      inventoryValue: 1250.5,
      currency: 'MXN',
    })
    expect(result.summary).toMatchObject({
      uniqueProducts: 2,
      uniqueLocations: 2,
      totalOnHand: 9,
      totalAvailable: 7,
      totalCommitted: 2,
      totalInTransit: 4,
      totalInventoryValue: 1250.5,
      negativeStockRows: 1,
      processedRows: 2,
    })
  })

  it('rechaza archivos sin ubicación o existencia', () => {
    const detection = inventoryImportPlugin.detect([
      'Name (Grouped)',
      'Marca',
      'Modelo',
    ])

    expect(detection.valid).toBe(false)
    expect(detection.missingRequiredFields).toEqual([
      'location',
      'onHand',
    ])
  })
})
