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

describe('NetSuite native grouped Sales import', () => {
  it('hereda la marca del grupo, ignora Total - MARCA y conserva filas con marca y venta en la misma fila', () => {
    const rows = [
      {
        Marca: 'STREAMAX - MERIVA',
        'Transaction Total (Revenue)': null,
        Date: null,
        'Document Number': null,
      },
      {
        Marca: null,
        'Transaction Total (Revenue)': 1258240,
        'Est. Gross Profit (Line)': 304325.27,
        'Document Number': 'F00824323',
        'Customer/Project: Name (Grouped)': '038480 DISSEG DE MEXICO SA DE CV',
        Modelo: 'ADPLUS 2.0-V1.1',
        'Name (Grouped)': 'MOD4AMER33',
        Date: '2026-09-17',
        Quantity: 147,
      },
      {
        Marca: 'Total - STREAMAX - MERIVA',
        'Transaction Total (Revenue)': 1258240,
        Date: null,
        'Document Number': null,
      },
      {
        Marca: 'EDWARDS',
        'Transaction Total (Revenue)': 200,
        'Est. Gross Profit (Line)': 50,
        'Document Number': 'F00829999',
        'Customer/Project: Name (Grouped)': '000001 CLIENTE PRUEBA',
        Modelo: 'MODEL-1',
        'Name (Grouped)': 'SKU-1',
        Date: '2026-09-30',
        Quantity: 1,
      },
    ]

    const validation =
      validateSalesColumns(
        Object.keys(rows[1]),
      )

    expect(validation.valid).toBe(true)

    const result =
      normalizeSalesRows(
        rows,
        validation.columnMap,
      )

    expect(result.rows).toHaveLength(2)
    expect(result.ignoredRows).toBe(2)

    expect(result.rows[0]).toMatchObject({
      brand: 'STREAMAX - MERIVA',
      revenue: 1258240,
      grossProfit: 304325.27,
      documentNumber: 'F00824323',
      model: 'ADPLUS 2.0-V1.1',
      productName: 'MOD4AMER33',
      quantity: 147,
    })

    expect(result.rows[1]).toMatchObject({
      brand: 'EDWARDS',
      revenue: 200,
      documentNumber: 'F00829999',
    })
  })
})
