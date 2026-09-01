import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  runImportEngine,
} from '../../engine/importEngine'

import {
  customerMasterImportPlugin,
} from './customerMasterPlugin'

describe('Customer Master import plugin', () => {
  it('detecta, normaliza y resume un Customer Master', () => {
    const rows = [
      {
        'Internal ID': '8030568',
        ID: '036736',
        Name:
          'ATE SISTEMAS DE ENERGIA',
        Category:
          'INTEGRADOR CORPORATIVO',
        'Sales Rep': 'RH1009',
        Ubicacion:
          '002 CDMX : VENTAS',
        'Price Level': 'L 24%',
        'RFC (120)':
          'ABC123456XYZ',
        'Fecha de alta':
          new Date(
            '2023-10-19T06:00:00.000Z',
          ),
        'Fecha de Baja': null,
        'Clasificacion por ventas':
          'Activo',
        'CLASIFICACION VALOR (FRECUENCIA DE COMPRA)':
          'B',
        Email:
          'cliente1@example.com',
        Phone:
          '5555555555',
        Duplicate:
          'No',
      },
      {
        'Internal ID': '50505',
        ID:
          '008919 CIRCULO ALTERNATIVO SA DE CV',
        Name:
          'CIRCULO ALTERNATIVO SA DE CV',
        Category:
          'INTEGRADOR CORPORATIVO',
        'Sales Rep': 'RH1010',
        Ubicacion:
          '015 GUADALAJARA : VENTAS',
        'Price Level': 'L 30%',
        'RFC (120)':
          'DEF123456XYZ',
        'Fecha de alta':
          new Date(
            '2013-01-09T06:00:00.000Z',
          ),
        'Clasificacion por ventas':
          'Congelado',
        'CLASIFICACION VALOR (FRECUENCIA DE COMPRA)':
          'D',
        Duplicate:
          'Yes',
        'Fecha de Baja':
          new Date(
            '2024-08-27T06:00:00.000Z',
          ),
      },
    ]

    const result =
      runImportEngine(
        customerMasterImportPlugin,
        rows,
        Object.keys(
          rows[0] ?? {},
        ),
      )

    expect(result.valid)
      .toBe(true)

    expect(
      result.normalizedRows,
    ).toHaveLength(2)

    expect(
      result
        .normalizedRows[0]
        ?.customerId,
    ).toBe('036736')

    expect(
      result
        .normalizedRows[1]
        ?.customerId,
    ).toBe('008919')

    expect(
      result.summary.totalCustomers,
    ).toBe(2)

    expect(
      result
        .summary
        .duplicateCustomers,
    ).toBe(1)

    expect(
      result
        .summary
        .inactiveCustomers,
    ).toBe(1)

    expect(
      result
        .summary
        .uniqueCategories,
    ).toBe(1)

    expect(
      result
        .summary
        .uniqueLocations,
    ).toBe(2)

    expect(
      result
        .summary
        .uniqueSalesReps,
    ).toBe(2)

    expect(
      result
        .summary
        .uniquePriceLevels,
    ).toBe(2)

    expect(
      result
        .summary
        .processedRows,
    ).toBe(2)

    expect(
      result
        .summary
        .ignoredRows,
    ).toBe(0)
  })
})