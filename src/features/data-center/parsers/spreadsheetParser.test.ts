import {
  describe,
  expect,
  it,
} from 'vitest'

import * as XLSX from 'xlsx'

import {
  parseSpreadsheetSheet,
} from './spreadsheetParser'

function buildWorkbook(
  rows: unknown[][],
): XLSX.WorkBook {
  const workbook =
    XLSX.utils.book_new()

  const worksheet =
    XLSX.utils.aoa_to_sheet(
      rows,
    )

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'TS - Detalle de ventas PM',
  )

  return workbook
}

describe('spreadsheetParser', () => {
  it('conserva el formato tabular normal con encabezados en la primera fila', () => {
    const workbook =
      buildWorkbook([
        [
          'Marca',
          'Transaction Total (Revenue)',
          'Date',
        ],
        [
          'UNV',
          100,
          '2026-09-01',
        ],
      ])

    const parsed =
      parseSpreadsheetSheet(
        workbook,
        'TS - Detalle de ventas PM',
      )

    expect(parsed.columns).toEqual([
      'Marca',
      'Transaction Total (Revenue)',
      'Date',
    ])

    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0]?.Marca).toBe('UNV')
  })

  it('detecta el encabezado real de un reporte nativo de NetSuite con preambulo', () => {
    const workbook =
      buildWorkbook([
        ['TECNOSINERGIA S DE RL DE CV'],
        ['TS - Detalle de ventas PM'],
        ['01 September 2026 - 30 September 2026'],
        [],
        ['Options: Show Zeros'],
        [
          'Marca',
          'Transaction Total (Revenue)',
          'Est. Gross Profit (Line)',
          'Document Number',
          'Customer/Project: Name (Grouped)',
          'Modelo',
          'Name (Grouped)',
          'Date',
          'Quantity',
        ],
        ['STREAMAX - MERIVA'],
        [
          null,
          1258240,
          304325.27,
          'F00824323',
          '038480 DISSEG DE MEXICO SA DE CV',
          'ADPLUS 2.0-V1.1',
          'MOD4AMER33',
          '2026-09-17',
          147,
        ],
      ])

    const parsed =
      parseSpreadsheetSheet(
        workbook,
        'TS - Detalle de ventas PM',
      )

    expect(parsed.columns).toContain('Marca')
    expect(parsed.columns).toContain(
      'Transaction Total (Revenue)',
    )
    expect(parsed.columns).toContain('Date')
    expect(parsed.columns).not.toContain(
      'TECNOSINERGIA S DE RL DE CV',
    )

    expect(parsed.rows).toHaveLength(2)
    expect(parsed.rows[0]?.Marca).toBe(
      'STREAMAX - MERIVA',
    )
    expect(
      parsed.rows[1]?.[
        'Transaction Total (Revenue)'
      ],
    ).toBe(1258240)
  })
})
