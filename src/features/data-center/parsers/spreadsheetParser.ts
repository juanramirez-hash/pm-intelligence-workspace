import * as XLSX from 'xlsx'

export type SpreadsheetRow = Record<string, unknown>

export interface ParsedSpreadsheet {
  fileName: string
  fileSize: number
  sheetNames: string[]
  workbook: XLSX.WorkBook
}

export interface ParsedSpreadsheetSheet {
  sheetName: string
  rows: SpreadsheetRow[]
  columns: string[]
}

export const acceptedSpreadsheetExtensions = [
  '.xlsx',
  '.xls',
  '.xlsm',
  '.xlsb',
  '.csv',
  '.tsv',
  '.ods',
] as const

export const acceptedSpreadsheetFormats =
  acceptedSpreadsheetExtensions.join(',')

function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')

  if (lastDotIndex === -1) {
    return ''
  }

  return fileName.slice(lastDotIndex).toLowerCase()
}

function validateSpreadsheetExtension(fileName: string): void {
  const extension = getFileExtension(fileName)

  if (
    !acceptedSpreadsheetExtensions.includes(
      extension as (typeof acceptedSpreadsheetExtensions)[number],
    )
  ) {
    throw new Error(
      `Formato no compatible. Usa: ${acceptedSpreadsheetExtensions.join(', ')}`,
    )
  }
}

function detectColumns(rows: SpreadsheetRow[]): string[] {
  const columns = new Set<string>()

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      const normalizedKey = key.trim()

      if (normalizedKey) {
        columns.add(normalizedKey)
      }
    }
  }

  return [...columns]
}

function normalizeHeaderCandidate(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  return String(value)
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * NetSuite native report exports can contain a presentation preamble before
 * the actual table header. Sales currently arrives with rows such as company,
 * report name, period and options before the real header row.
 *
 * Detection is deliberately conservative: the parser changes the starting
 * row only when the same row contains the three canonical Sales signals.
 * All other spreadsheet imports preserve the previous row-1 behaviour.
 */
function detectNetSuiteSalesHeaderRow(
  worksheet: XLSX.WorkSheet,
): number | null {
  const worksheetReference =
    worksheet['!ref']

  if (!worksheetReference) {
    return null
  }

  const worksheetRange =
    XLSX.utils.decode_range(
      worksheetReference,
    )

  const probeEndRow = Math.min(
    worksheetRange.e.r,
    worksheetRange.s.r + 24,
  )

  const probeRows =
    XLSX.utils.sheet_to_json<unknown[]>(
      worksheet,
      {
        header: 1,
        defval: null,
        raw: true,
        blankrows: true,
        range: {
          s: {
            r: worksheetRange.s.r,
            c: worksheetRange.s.c,
          },
          e: {
            r: probeEndRow,
            c: worksheetRange.e.c,
          },
        },
      },
    )

  for (
    let rowOffset = 0;
    rowOffset < probeRows.length;
    rowOffset += 1
  ) {
    const row =
      probeRows[rowOffset] ?? []

    const normalizedValues =
      new Set(
        row
          .map(normalizeHeaderCandidate)
          .filter(Boolean),
      )

    const isSalesHeader =
      normalizedValues.has('marca') &&
      normalizedValues.has(
        'transaction total revenue',
      ) &&
      normalizedValues.has('date')

    if (isSalesHeader) {
      return (
        worksheetRange.s.r +
        rowOffset
      )
    }
  }

  return null
}

export async function parseSpreadsheetFile(
  file: File,
): Promise<ParsedSpreadsheet> {
  validateSpreadsheetExtension(file.name)

  const buffer = await file.arrayBuffer()

  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellFormula: false,
    cellText: false,
  })

  if (workbook.SheetNames.length === 0) {
    throw new Error('El archivo no contiene hojas disponibles.')
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames: workbook.SheetNames,
    workbook,
  }
}

export function parseSpreadsheetSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
): ParsedSpreadsheetSheet {
  const worksheet = workbook.Sheets[sheetName]

  if (!worksheet) {
    throw new Error(`No se encontró la hoja "${sheetName}".`)
  }

  const netSuiteSalesHeaderRow =
    detectNetSuiteSalesHeaderRow(
      worksheet,
    )

  let range:
    XLSX.Range | undefined

  if (
    netSuiteSalesHeaderRow !== null &&
    worksheet['!ref']
  ) {
    range = XLSX.utils.decode_range(
      worksheet['!ref'],
    )

    range.s.r =
      netSuiteSalesHeaderRow
  }

  const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(
    worksheet,
    {
      defval: null,
      raw: true,
      blankrows: false,
      ...(range
        ? { range }
        : {}),
    },
  )

  return {
    sheetName,
    rows,
    columns: detectColumns(rows),
  }
}
