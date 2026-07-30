import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  normalizeSalesRows,
} from './salesNormalizer'

import {
  validateSalesColumns,
} from './salesValidator'

describe('IQ-002 sales Name mapping', () => {
  it('mapea Name como identidad de producto separada de Modelo y Marca', () => {
    const row = {
      Date: '2026-07-01',
      Marca: 'UNV',
      Name: ' CI-IPC-A ',
      Modelo: 'IPC-A',
      Revenue: 100,
      Quantity: 1,
    }

    const validation = validateSalesColumns(
      Object.keys(row),
    )

    expect(validation.columnMap.productName).toBe('Name')
    expect(validation.columnMap.model).toBe('Modelo')
    expect(validation.columnMap.brand).toBe('Marca')

    const result = normalizeSalesRows(
      [row],
      validation.columnMap,
    )

    expect(result.rows[0]?.productName).toBe('CI-IPC-A')
    expect(result.rows[0]?.productCode).toBeNull()
    expect(result.rows[0]?.model).toBe('IPC-A')
    expect(result.rows[0]?.brand).toBe('UNV')
  })

  it('mapea el encabezado real Name (Grouped) de NetSuite', () => {
    const row = {
      Date: '2025-01-07',
      Marca: 'MERIVA TECHNOLOGY - STREAMAX',
      'Name (Grouped)': 'MOD4AMER26',
      Modelo: 'ADPLUS 2.0',
      Revenue: 807482.76,
      Quantity: 147,
    }

    const validation = validateSalesColumns(Object.keys(row))

    expect(validation.columnMap.productName).toBe('Name (Grouped)')
    expect(validation.columnMap.model).toBe('Modelo')
    expect(validation.columnMap.brand).toBe('Marca')

    const result = normalizeSalesRows([row], validation.columnMap)

    expect(result.rows[0]?.productName).toBe('MOD4AMER26')
    expect(result.rows[0]?.model).toBe('ADPLUS 2.0')
    expect(result.rows[0]?.brand).toBe('MERIVA TECHNOLOGY - STREAMAX')
  })

})
