import { FileSpreadsheet } from 'lucide-react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'

interface SpreadsheetFileInformationProps {
  fileName: string
  fileSize: number
  totalRows: number
  totalColumns: number
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kilobytes = bytes / 1024

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`
}

export function SpreadsheetFileInformation({
  fileName,
  fileSize,
  totalRows,
  totalColumns,
}: SpreadsheetFileInformationProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AtlasCard className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileSpreadsheet size={21} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Archivo
            </p>

            <p className="mt-1 truncate font-semibold text-slate-950">
              {fileName}
            </p>
          </div>
        </div>
      </AtlasCard>

      <AtlasCard className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Tamaño
        </p>

        <p className="mt-2 text-2xl font-bold text-slate-950">
          {formatFileSize(fileSize)}
        </p>
      </AtlasCard>

      <AtlasCard className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Registros
        </p>

        <p className="mt-2 text-2xl font-bold text-slate-950">
          {new Intl.NumberFormat('es-MX').format(
            totalRows,
          )}
        </p>
      </AtlasCard>

      <AtlasCard className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Columnas
        </p>

        <p className="mt-2 text-2xl font-bold text-slate-950">
          {totalColumns}
        </p>
      </AtlasCard>
    </section>
  )
}