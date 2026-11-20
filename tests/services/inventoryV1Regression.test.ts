// DC-002 no-regression: inventory files whose header is on row 1 (the
// hand-normalized V1 layout) must import exactly as before the NetSuite
// raw-export support.
//
// The baselines were generated with the pre-DC-002 code:
//   INVENTORY_V1_WRITE_BASELINE=1 npx vitest run tests/services/inventoryV1Regression.test.ts
// Do not regenerate them to make this test pass.

import { createHash } from 'node:crypto'
import {
  existsSync,
  readFileSync,
  writeFileSync,
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

const SYNTHETIC_BASELINE = new URL(
  './fixtures/inventoryV1SyntheticBaseline.json',
  import.meta.url,
)
const REAL_BASELINE = new URL(
  './fixtures/inventoryV1RealBaseline.json',
  import.meta.url,
)
const REAL_V1_FILE = join(
  process.cwd(),
  'tmp',
  'TS-Reportedeinventarioporsucursal_V1_2026.xlsx',
)
const WRITE_BASELINE =
  process.env.INVENTORY_V1_WRITE_BASELINE === '1'

function importInventory(workbook: XLSX.WorkBook) {
  const sheet = parseSpreadsheetSheet(
    workbook,
    workbook.SheetNames[0],
  )
  const headers = inventoryImportPlugin.extractHeaders(sheet.rows)
  const validation = inventoryImportPlugin.validate(headers)
  const normalized = inventoryImportPlugin.normalize(
    sheet.rows,
    validation,
  )
  const model = inventoryImportPlugin.buildBusinessModel(
    normalized.rows,
    normalized.ignoredRows,
  )

  // Only what existed before DC-002; new validation fields are allowed.
  return {
    columns: sheet.columns,
    valid: validation.valid,
    sourceLayout: validation.sourceLayout,
    wideLocationColumns: validation.wideLocationColumns,
    warnings: validation.warnings,
    ignoredRows: normalized.ignoredRows,
    rows: normalized.rows,
    summary: model.summary,
  }
}

function syntheticV1Workbook(): XLSX.WorkBook {
  const header = [
    'Item',
    'Marca',
    'Internal ID',
    'Description',
    ...['CEDIS CDMX', 'VENTAS QRO', 'TOTAL'].flatMap((location) => [
      `${location} Cantidad Actual en Orden`,
      `${location} En Mano`,
      `${location} Cantidad Comprometida`,
      `${location} Cantidad Actual Disponible`,
      ` ${location} Cantidad Actual en Tránsito`,
      `${location} Average Cost`,
    ]),
  ]
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      header,
      ['A-1', 'UNV', '1', 'Camara', 0, 5, 1, 4, null, 100, 2, 3, 0, 3, null, 100, 2, 8, 1, 7, 0, 200],
      ['A-2', 'HIKVISION', '2', 'Switch', null, null, null, null, null, 50, 1, 0, 0, 0, 0, 50, 1, 0, 0, 0, 0, 100],
      ['A-3', 'UNV', '3', 'Cable', 0, 0, 0, 0, 4, 10, null, null, null, null, null, null, 0, 0, 0, 0, 4, 10],
    ]),
    'Inventario',
  )

  return workbook
}

function readOrWrite(
  url: URL,
  value: unknown,
): unknown {
  if (WRITE_BASELINE) {
    writeFileSync(url, `${JSON.stringify(value, null, 2)}\n`)
  }

  return JSON.parse(readFileSync(url, 'utf8'))
}

describe('inventory V1 layout (DC-002 no regression)', () => {
  it('imports a header-on-row-1 file exactly as before', () => {
    const output = JSON.parse(
      JSON.stringify(importInventory(syntheticV1Workbook())),
    )

    expect(output).toEqual(readOrWrite(SYNTHETIC_BASELINE, output))
  })

  it.skipIf(!existsSync(REAL_V1_FILE))(
    'imports the real V1 file of tmp/ exactly as before',
    () => {
      const output = importInventory(
        XLSX.read(readFileSync(REAL_V1_FILE), { cellDates: true }),
      )
      const fingerprint = {
        rows: output.rows.length,
        ignoredRows: output.ignoredRows,
        locations: Object.keys(output.wideLocationColumns).sort(),
        // Hash only: business data is not versioned.
        sha256: createHash('sha256')
          .update(JSON.stringify(output))
          .digest('hex'),
      }

      expect(fingerprint).toEqual(readOrWrite(REAL_BASELINE, fingerprint))
    },
    // Reading the real 2 MB workbook is slow under the full suite.
    60_000,
  )
})
