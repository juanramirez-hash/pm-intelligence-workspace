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

describe('IQ-002 sales product Name support', () => {
  it('reconoce Item: Name como identidad primaria del producto', () => {
    const headers = [
      'Fecha',
      'Marca',
      'Venta',
      'Item: Name',
      'Modelo',
    ]

    const validation = validateSalesColumns(headers)

    expect(validation.columnMap.productName).toBe('Item: Name')
    expect(validation.columnMap.productCode).toBeUndefined()

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

    expect(row?.productName).toBe('ci-ipc-a')
    expect(row?.productCode).toBeNull()
    expect(row?.model).toBe('IPC-A')
  })
})
