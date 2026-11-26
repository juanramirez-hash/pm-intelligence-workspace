// MD-002-HOTFIX1 with the real NetSuite export of 26 Nov 2026
// ("TS - Reporte de inventario por sucursal", Options: Show Zeros). The file
// lives in tmp/ (outside Git); the test is skipped when it is not there.

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
  runDataCenterImport,
  type InventoryImportResult,
} from '../../src/features/data-center/services/importService'

const REAL_FILE = join(
  process.cwd(),
  'tmp',
  'TS-Reportedeinventarioporsucursal368.xlsx',
)

describe('MD-002-HOTFIX1 real inventory export of 26 Nov 2026', () => {
  it.skipIf(!existsSync(REAL_FILE))(
    'keeps every article, including the DE LINEA ones without any quantity',
    () => {
      const workbook = XLSX.read(readFileSync(REAL_FILE), { cellDates: true })
      const sheet = parseSpreadsheetSheet(workbook, workbook.SheetNames[0])
      const result = runDataCenterImport(sheet.rows, 'inventory') as InventoryImportResult
      const items = result.inventoryItems
      const deLineaZero = items.filter(
        (item) => item.catalogStatus === 'DE LINEA' && item.onHand <= 0,
      )
      const sum = (values: number[]) =>
        Math.round(values.reduce((total, value) => total + value, 0) * 10_000) / 10_000

      // Positions unchanged: 2,098 articles with some quantity.
      expect(result.normalizedRows).toHaveLength(6715)
      expect(new Set(result.normalizedRows.map((row) => row.productName)).size).toBe(2098)

      expect(items).toHaveLength(4682)
      expect(items.filter((item) => item.catalogStatus === 'DE LINEA')).toHaveLength(2216)
      expect(deLineaZero).toHaveLength(649)
      expect(deLineaZero.filter((item) => item.positions > 0)).toHaveLength(328)
      expect(deLineaZero.filter((item) => item.positions === 0)).toHaveLength(321)
      expect(deLineaZero.filter((item) => !item.lastSaleDate)).toHaveLength(245)

      // Same totals as the positions (and as the Excel).
      expect(sum(items.map((item) => item.onHand))).toBe(416480)
      expect(sum(items.map((item) => item.onOrder))).toBe(691406)
      expect(sum(items.map((item) => item.positions))).toBe(6715)
    },
    60_000,
  )
})
