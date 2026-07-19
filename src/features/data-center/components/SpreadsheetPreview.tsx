import {
  CheckCircle2,
  Database,
} from 'lucide-react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'
import { SectionHeader } from '../../../atlas/layout/SectionHeader'
import type { SpreadsheetRow } from '../parsers/spreadsheetParser'

interface SpreadsheetPreviewProps {
  rows: SpreadsheetRow[]
  columns: string[]
}

function formatCellValue(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  if (value instanceof Date) {
    return new Intl.DateTimeFormat(
      'es-MX',
    ).format(value)
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat('es-MX', {
      maximumFractionDigits: 2,
    }).format(value)
  }

  return String(value)
}

export function SpreadsheetPreview({
  rows,
  columns,
}: SpreadsheetPreviewProps) {
  const previewRows = rows.slice(0, 10)
  const visibleColumns = columns.slice(0, 12)

  return (
    <AtlasCard className="overflow-hidden">
      <div className="p-6">
        <SectionHeader
          title="Vista previa"
          description="Se muestran las primeras 10 filas y hasta 12 columnas."
          action={
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 size={17} />
              Archivo leído
            </div>
          }
        />
      </div>

      <div className="overflow-x-auto border-t border-slate-200">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="whitespace-nowrap px-5 py-3 font-semibold text-slate-500">
                #
              </th>

              {visibleColumns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap px-5 py-3 font-semibold text-slate-700"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {previewRows.map(
              (row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-400">
                    {rowIndex + 1}
                  </td>

                  {visibleColumns.map(
                    (column) => {
                      const value =
                        formatCellValue(
                          row[column],
                        )

                      return (
                        <td
                          key={`${rowIndex}-${column}`}
                          className="max-w-[260px] truncate whitespace-nowrap px-5 py-3 text-slate-600"
                          title={value}
                        >
                          {value}
                        </td>
                      )
                    },
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>

        {previewRows.length === 0 && (
          <div className="flex min-h-[180px] items-center justify-center">
            <div className="text-center">
              <Database
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-700">
                La hoja no contiene registros
              </p>
            </div>
          </div>
        )}
      </div>
    </AtlasCard>
  )
}