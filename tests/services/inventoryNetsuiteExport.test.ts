// DC-002: the raw NetSuite export of "TS - Reporte de inventario por
// sucursal" imports as is (preamble, two-row header with merged branches,
// "Inventory Item" grouping row).

import {
  existsSync,
  readFileSync,
} from 'node:fs'
import { join } from 'node:path'

import {
  describe,
  expect,
  it,
} from 'vitest'

import * as XLSX from 'xlsx'

import {
  parseSpreadsheetSheet,
} from '../../src/features/data-center/parsers/spreadsheetParser'
import {
  inventoryImportPlugin,
} from '../../src/features/data-center/importers/inventory/inventoryPlugin'
import {
  inventoryImportWarnings,
  resolveInventoryLocation,
} from '../../src/features/data-center/importers/inventory/inventoryLocationAliases'

const METRICS = [
  'En Mano',
  'Cantidad Actual Disponible',
  ' Cantidad Actual en Tránsito',
  'Average Cost',
]
const FIXED_COLUMNS = ['Item', 'Marca', 'Internal ID', 'Description']

/**
 * Same structure as the NetSuite export: 5 merged preamble rows, branch
 * names merged over their metric columns, metrics on the next row, the
 * "Inventory Item" grouping row and the articles.
 */
function netsuiteWorkbook({
  groups = [
    '002 CDMX : VENTAS.',
    '011 QUERETARO : VENTAS',
    '021 MONTERREY : CEDIS MTY',
  ],
  withGroupMerges = true,
}: {
  groups?: string[]
  withGroupMerges?: boolean
} = {}): XLSX.WorkBook {
  const allGroups = [...groups, 'Total']
  const width = FIXED_COLUMNS.length + allGroups.length * METRICS.length
  const blank = () => Array<unknown>(width).fill(null)

  const preamble = [
    'TECNOSINERGIA S DE RL DE CV',
    'TS - Reporte de inventario por sucursal',
    '',
    '',
    'Options: Show Zeros',
  ].map((title) => {
    const row = blank()
    row[0] = title
    return row
  })

  const groupRow = blank()
  const metricRow = blank()

  FIXED_COLUMNS.forEach((title, index) => {
    groupRow[index] = title
  })
  metricRow[0] = ' '

  allGroups.forEach((group, groupIndex) => {
    const start = FIXED_COLUMNS.length + groupIndex * METRICS.length

    groupRow[start] = group
    METRICS.forEach((metric, metricIndex) => {
      metricRow[start + metricIndex] = metric
    })
  })

  // onHand, available, inTransit, cost per branch; Total = sum of onHand.
  const article = (
    item: string,
    brand: string,
    id: string,
    perBranch: Array<[number | null, number | null, number | null, number]>,
  ) => {
    const row = blank()
    row.splice(0, 4, item, brand, id, `${item} descripción`)
    const totals = [0, 0, 0, 0]

    perBranch.forEach((values, groupIndex) => {
      values.forEach((value, metricIndex) => {
        row[FIXED_COLUMNS.length + groupIndex * METRICS.length + metricIndex] = value
        totals[metricIndex] += Number(value ?? 0)
      })
    })
    totals.forEach((value, metricIndex) => {
      row[FIXED_COLUMNS.length + groups.length * METRICS.length + metricIndex] = value
    })

    return row
  }

  const groupingRow = blank()
  groupingRow[0] = 'Inventory Item'

  const branchValues = (
    ...values: Array<[number | null, number | null, number | null, number]>
  ) => groups.map((_, index) => values[index] ?? [null, null, null, 10])

  const rows = [
    ...preamble,
    groupRow,
    metricRow,
    groupingRow,
    article('A-1', 'UNV', '101', branchValues([5, 4, 1, 100], [2, 2, 0, 100], [0, 0, 3, 100])),
    article('A-2', 'HIKVISION', '102', branchValues([null, null, null, 50], [7, 6, null, 50], [1, 1, 0, 50])),
    article('A-3', 'UNV', '103', branchValues([0, 0, 0, 10], [0, 0, 0, 10], [3, 3, 0, 10])),
  ]

  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const merges: XLSX.Range[] = preamble.map((_, row) => ({
    s: { r: row, c: 0 },
    e: { r: row, c: width - 1 },
  }))

  FIXED_COLUMNS.slice(1).forEach((_, index) => {
    merges.push({ s: { r: 5, c: index + 1 }, e: { r: 6, c: index + 1 } })
  })

  if (withGroupMerges) {
    allGroups.forEach((_, groupIndex) => {
      const start = FIXED_COLUMNS.length + groupIndex * METRICS.length
      merges.push({
        s: { r: 5, c: start },
        e: { r: 5, c: start + METRICS.length - 1 },
      })
    })
  }

  sheet['!merges'] = merges

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'TS - Reporte de inventario por ')

  return workbook
}

function importWorkbook(workbook: XLSX.WorkBook) {
  const sheet = parseSpreadsheetSheet(workbook, workbook.SheetNames[0])
  const headers = inventoryImportPlugin.extractHeaders(sheet.rows)
  const validation = inventoryImportPlugin.validate(headers)
  const normalized = inventoryImportPlugin.normalize(sheet.rows, validation)

  return { sheet, validation, normalized }
}

describe('NetSuite raw inventory export (DC-002)', () => {
  it('combines the two-row header with the merged branch names', () => {
    const { sheet } = importWorkbook(netsuiteWorkbook())

    expect(sheet.columns).toEqual(
      expect.arrayContaining([
        'Item',
        'Marca',
        'Internal ID',
        '002 CDMX : VENTAS. En Mano',
        '011 QUERETARO : VENTAS Cantidad Actual en Tránsito',
        '021 MONTERREY : CEDIS MTY Average Cost',
        'Total En Mano',
      ]),
    )
    // The preamble and the metric row are not data.
    expect(sheet.rows.map((row) => row.Item)).toEqual([
      'Inventory Item',
      'A-1',
      'A-2',
      'A-3',
    ])
  })

  it('applies the branch aliases and excludes Total', () => {
    const { validation, normalized } = importWorkbook(netsuiteWorkbook())

    expect(validation.valid).toBe(true)
    expect(validation.sourceLayout).toBe('wide_by_location')
    expect(Object.keys(validation.wideLocationColumns)).toEqual([
      'VENTAS CDMX',
      'VENTAS QRO',
      'CEDIS MTY',
    ])
    expect(validation.unaliasedLocations).toEqual([])
    expect(
      [...new Set(normalized.rows.map((row) => row.location))].sort(),
    ).toEqual(['CEDIS MTY', 'VENTAS CDMX', 'VENTAS QRO'])
    expect(
      normalized.rows.find(
        (row) => row.productName === 'A-1' && row.location === 'VENTAS CDMX',
      ),
    ).toMatchObject({
      brand: 'UNV',
      onHand: 5,
      available: 4,
      inTransit: 1,
      unitCost: 100,
    })
  })

  it('ignores the grouping row without reporting an error', () => {
    const { normalized } = importWorkbook(netsuiteWorkbook())

    expect(normalized.ignoredRows).toBe(1)
    expect(
      normalized.rows.some((row) => row.productName === 'Inventory Item'),
    ).toBe(false)
    // A-2 has no data in VENTAS CDMX: 8 positions out of 9.
    expect(normalized.rows).toHaveLength(8)
  })

  it('carries the last branch when the group cells are not merged', () => {
    const merged = importWorkbook(netsuiteWorkbook())
    const unmerged = importWorkbook(
      netsuiteWorkbook({ withGroupMerges: false }),
    )

    expect(unmerged.sheet.columns).toEqual(merged.sheet.columns)
    expect(unmerged.normalized).toEqual(merged.normalized)
  })

  it('keeps a branch without alias and warns about it', () => {
    const { validation } = importWorkbook(
      netsuiteWorkbook({
        groups: ['002 CDMX : CEDIS', '099 NUEVA : VENTAS'],
      }),
    )

    expect(Object.keys(validation.wideLocationColumns)).toEqual([
      'CEDIS CDMX',
      '099 NUEVA : VENTAS',
    ])
    expect(inventoryImportWarnings(validation)).toEqual([
      'Sucursal sin alias: 099 NUEVA : VENTAS',
    ])
  })

  it('matches aliases without case, accents or repeated spaces', () => {
    expect(resolveInventoryLocation('019 mérida   :  ventas')).toEqual({
      location: 'VENTAS MER',
      aliased: true,
    })
    expect(resolveInventoryLocation('002 CDMX : VENTAS')).toEqual({
      location: 'VENTAS CDMX',
      aliased: true,
    })
    expect(resolveInventoryLocation('VENTAS QRO')).toEqual({
      location: 'VENTAS QRO',
      aliased: true,
    })
  })
})

const REAL_EXPORT = join(
  process.cwd(),
  'tmp',
  'TS-Reportedeinventarioporsucursal192.xlsx',
)

describe.skipIf(!existsSync(REAL_EXPORT))(
  'real NetSuite export in tmp/ (local check)',
  () => {
    it('imports 4,677 articles in the 10 short branches and keeps the totals', () => {
      const workbook = XLSX.read(readFileSync(REAL_EXPORT), {
        cellDates: true,
      })
      const { sheet, validation } = importWorkbook(workbook)
      const articles = sheet.rows.filter((row) => row.Marca)
      const locations = validation.wideLocationColumns

      expect(articles).toHaveLength(4677)
      expect(Object.keys(locations).sort()).toEqual([
        'CEDIS CDMX',
        'CEDIS MTY',
        'PROYECTOS',
        'VENTAS CDMX',
        'VENTAS GDL',
        'VENTAS MER',
        'VENTAS MTY',
        'VENTAS PUE',
        'VENTAS QRO',
        'VENTAS VER',
      ])
      expect(validation.unaliasedLocations).toEqual([])

      const mismatches = articles.filter((row) => {
        const branchOnHand = Object.values(locations).reduce(
          (total, columns) =>
            total + Number(row[columns.onHand as string] ?? 0),
          0,
        )

        return Math.abs(
          branchOnHand - Number(row['Total En Mano'] ?? 0),
        ) > 1e-6
      })

      expect(mismatches.map((row) => row.Item)).toEqual([])
    },
    // Reading the real 3 MB workbook is slow under the full suite.
    60_000)
  },
)
