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

  const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(
    worksheet,
    {
      defval: null,
      raw: true,
      blankrows: false,
    },
  )

  return {
    sheetName,
    rows,
    columns: detectColumns(rows),
  }
}