import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  normalizeSalesRow,
} from './salesNormalizer'

import {
  validateSalesColumns,
} from './salesValidator'

describe('PMC-005 sales product code support', () => {
  it('reconoce y normaliza el código ERP del producto', () => {
    const headers = [
      'Fecha',
      'Marca',
      'Venta',
      'Item: Name',
      'Modelo',
    ]

    const validation = validateSalesColumns(headers)

    expect(validation.columnMap.productCode).toBe('Item: Name')

    const row = normalizeSalesRow(
      {
        Fecha: '2026-06-20',
        Marca: 'UNV',
        Venta: 100,
        'Item: Name': ' ci-ipc-a ',
        Modelo: 'IPC-A',
      },
      validation.columnMap,
    )

    expect(row?.productCode).toBe('ci-ipc-a')
    expect(row?.model).toBe('IPC-A')
  })
})
