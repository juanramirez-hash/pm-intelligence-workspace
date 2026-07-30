import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  runImportEngine,
} from '../../engine/importEngine'

import {
  productMasterImportPlugin,
} from './productMasterPlugin'

describe('IQ-001 Product Master import plugin', () => {
  it('detecta, normaliza y resume un Product Master', () => {
    const rows = [
      {
        'Internal ID': '1001',
        Marca: 'UNV',
        Name: 'CI-IPC-A',
        Modelo: 'IPC-A',
        Estatus: 'Activo',
        'On Hand': 12,
      },
      {
        'Internal ID': '1002',
        Marca: 'UNV',
        Name: 'CI-IPC-B',
        Modelo: 'IPC-B',
        Estatus: 'Activo',
        'On Hand': 0,
      },
    ]

    const result = runImportEngine(
      productMasterImportPlugin,
      rows,
      Object.keys(rows[0] ?? {}),
    )

    expect(result.valid).toBe(true)
    expect(result.normalizedRows).toHaveLength(2)
    expect(result.normalizedRows[0]?.name).toBe('CI-IPC-A')
    expect(result.summary.totalProducts).toBe(2)
    expect(result.summary.uniqueBrands).toBe(1)
    expect(result.summary.productsWithInventory).toBe(1)
  })
})
