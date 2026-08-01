import type {
  ForecastExecutiveExportPayload,
  ForecastExportSheet,
} from './buildForecastExecutiveExport'

function maximumColumnCount(
  rows: readonly (readonly unknown[])[],
): number {
  return rows.reduce(
    (maximum, row) => Math.max(maximum, row.length),
    0,
  )
}

function applyColumnFormats(
  worksheet: Record<string, unknown>,
  sheet: ForecastExportSheet,
): void {
  if (!sheet.columnFormats) {
    return
  }

  for (const [columnText, format] of Object.entries(
    sheet.columnFormats,
  )) {
    const column = Number(columnText)

    if (!Number.isInteger(column) || column < 0) {
      continue
    }

    for (let row = 1; row < sheet.rows.length; row += 1) {
      const reference = String.fromCharCode(65 + column) + (row + 1)
      const cell = worksheet[reference]

      if (
        cell &&
        typeof cell === 'object' &&
        't' in cell &&
        (cell as { t?: string }).t === 'n'
      ) {
        const numericCell = cell as { z?: string }
        numericCell.z = format
      }
    }
  }
}

export async function downloadForecastExecutiveExport(
  payload: ForecastExecutiveExportPayload,
): Promise<void> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()

  for (const sheet of payload.sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows)

    if (sheet.columnWidths) {
      worksheet['!cols'] = sheet.columnWidths.map(
        (width) => ({ wch: width }),
      )
    }

    if (sheet.autoFilter && sheet.rows.length > 0) {
      const columnCount = maximumColumnCount(sheet.rows)

      if (columnCount > 0) {
        worksheet['!autofilter'] = {
          ref: XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: {
              r: Math.max(0, sheet.rows.length - 1),
              c: columnCount - 1,
            },
          }),
        }
      }
    }

    applyColumnFormats(
      worksheet as unknown as Record<string, unknown>,
      sheet,
    )

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name.slice(0, 31),
    )
  }

  XLSX.writeFile(workbook, payload.fileName, {
    compression: true,
  })
}
