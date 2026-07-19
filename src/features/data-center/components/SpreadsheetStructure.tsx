import { LoaderCircle } from 'lucide-react'

import { AtlasCard } from '../../../atlas/components/AtlasCard'
import { SectionHeader } from '../../../atlas/layout/SectionHeader'

interface SpreadsheetStructureProps {
  sheetNames: string[]
  selectedSheet: string
  columns: string[]
  isProcessingSheet: boolean
  isImporting: boolean
  onSheetChange: (sheetName: string) => void
  onRemoveFile: () => void
}

export function SpreadsheetStructure({
  sheetNames,
  selectedSheet,
  columns,
  isProcessingSheet,
  isImporting,
  onSheetChange,
  onRemoveFile,
}: SpreadsheetStructureProps) {
  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Estructura del archivo"
        description="Selecciona la hoja que deseas utilizar."
        action={
          <button
            type="button"
            onClick={onRemoveFile}
            disabled={isImporting}
            className="text-sm font-semibold text-slate-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Quitar archivo
          </button>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
        <div>
          <label
            htmlFor="sheet-selector"
            className="text-sm font-semibold text-slate-700"
          >
            Hoja seleccionada
          </label>

          <select
            id="sheet-selector"
            value={selectedSheet}
            disabled={
              isProcessingSheet ||
              isImporting
            }
            onChange={(event) =>
              onSheetChange(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {sheetNames.map((sheetName) => (
              <option
                key={sheetName}
                value={sheetName}
              >
                {sheetName}
              </option>
            ))}
          </select>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hojas detectadas
            </p>

            <p className="mt-2 text-xl font-bold text-slate-950">
              {sheetNames.length}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">
            Columnas detectadas
          </p>

          {isProcessingSheet ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-5">
              <LoaderCircle
                size={20}
                className="animate-spin text-blue-600"
              />

              <p className="text-sm text-slate-500">
                Procesando hoja...
              </p>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {columns.map((column) => (
                <span
                  key={column}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {column}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </AtlasCard>
  )
}