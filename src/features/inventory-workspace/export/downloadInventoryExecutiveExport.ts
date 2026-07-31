import type {
  InventoryExecutiveExportPayload,
} from './buildInventoryExecutiveExport'

function maximumColumnCount(
  rows: readonly (readonly unknown[])[],
): number {
  return rows.reduce(
    (maximum, row) => Math.max(maximum, row.length),
    0,
  )
}

export async function downloadInventoryExecutiveExport(
  payload: InventoryExecutiveExportPayload,
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

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name,
    )
  }

  XLSX.writeFile(workbook, payload.fileName, {
    compression: true,
  })
}
