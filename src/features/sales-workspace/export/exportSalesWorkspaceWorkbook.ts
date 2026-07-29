import type {
  SalesWorkspaceViewModel,
} from '../types'

import {
  buildSalesExecutiveExport,
} from './buildSalesExecutiveExport'

export async function exportSalesWorkspaceWorkbook(
  workspace: SalesWorkspaceViewModel,
): Promise<string> {
  const XLSX =
    await import('xlsx')

  const payload =
    buildSalesExecutiveExport(
      workspace,
    )

  const workbook =
    XLSX.utils.book_new()

  for (const sheet of payload.sheets) {
    const worksheet =
      XLSX.utils.aoa_to_sheet(
        sheet.rows,
      )

    if (sheet.columnWidths) {
      worksheet['!cols'] =
        sheet.columnWidths.map(
          (width) => ({
            wch: width,
          }),
        )
    }

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name.slice(0, 31),
    )
  }

  XLSX.writeFile(
    workbook,
    payload.fileName,
    {
      compression: true,
    },
  )

  return payload.fileName
}
