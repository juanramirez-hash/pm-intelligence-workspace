// MB-001: "Exportar detalle". The server sends the lines of the period with
// the columns the user may see (no gross profit or margin without cost
// access); this builds the sheet and writes the Excel file with SheetJS,
// loaded only when the user exports.

import type {
  BrandExportResponse,
} from '../api/brandsTypes'

export const EXPORT_TRUNCATED_NOTICE =
  'El detalle superó el máximo de filas y se exportó incompleto. Elige un periodo más corto o pide el detalle completo al administrador.'

export const EXPORT_COST_NOTE =
  'Sin acceso a costos: el archivo no incluye utilidad bruta ni margen.'

/** Header row plus one row per line, in the order of the server columns. */
export function buildExportSheet(
  response: Pick<BrandExportResponse, 'columns' | 'rows'>,
): Array<Array<string | number | null>> {
  return [
    response.columns.map((column) => column.label),
    ...response.rows.map((row) => response.columns.map((column) => row[column.key] ?? null)),
  ]
}

export function exportFileName(brandKey: string, period: string | null): string {
  const safeBrand = brandKey.replace(/[^A-Za-z0-9_-]+/g, '_')

  return `detalle-ventas-${safeBrand}-${period ?? 'sin-periodo'}.xlsx`
}

/** Writes the Excel file in the browser. */
export async function downloadBrandDetail(response: BrandExportResponse): Promise<string> {
  const XLSX = await import('xlsx')
  const sheet = XLSX.utils.aoa_to_sheet(buildExportSheet(response))
  const workbook = XLSX.utils.book_new()
  const fileName = exportFileName(response.brandKey, response.period)

  XLSX.utils.book_append_sheet(workbook, sheet, 'Detalle')
  XLSX.writeFile(workbook, fileName)

  return fileName
}
