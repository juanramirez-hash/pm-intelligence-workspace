import {
  CalendarRange,
  GitCompareArrows,
  RotateCcw,
} from 'lucide-react'

import type {
  SalesComparisonMode,
  SalesWorkspacePeriodOption,
} from '../types'

interface SalesWorkspaceFilterBarProps {
  periodOptions: SalesWorkspacePeriodOption[]
  filterPeriodId: string | null
  effectivePeriodLabel: string
  comparisonMode: SalesComparisonMode
  onPeriodChange: (
    periodId: string | null,
  ) => void
  onComparisonModeChange: (
    comparisonMode: SalesComparisonMode,
  ) => void
  onReset: () => void
}

export function SalesWorkspaceFilterBar({
  periodOptions,
  filterPeriodId,
  effectivePeriodLabel,
  comparisonMode,
  onPeriodChange,
  onComparisonModeChange,
  onReset,
}: SalesWorkspaceFilterBarProps) {
  return (
    <section
      aria-label="Filtros globales de ventas"
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      data-sales-workspace-component="filter-bar"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Contexto global
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            Periodo y base de comparación
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Los indicadores, tendencias y rankings usan el mismo corte comercial.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-end">
          <label className="block min-w-60">
            <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-600">
              <CalendarRange size={14} />
              Periodo de análisis
            </span>

            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                onPeriodChange(
                  event.target.value ===
                    'latest'
                    ? null
                    : event.target.value,
                )
              }
              value={
                filterPeriodId ??
                'latest'
              }
            >
              <option value="latest">
                Último disponible · {effectivePeriodLabel}
              </option>

              {periodOptions.map(
                (period) => (
                  <option
                    key={period.id}
                    value={period.id}
                  >
                    {period.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="block min-w-60">
            <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-600">
              <GitCompareArrows size={14} />
              Comparar contra
            </span>

            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                onComparisonModeChange(
                  event.target.value as SalesComparisonMode,
                )
              }
              value={comparisonMode}
            >
              <option value="previous-period">
                Periodo anterior
              </option>

              <option value="previous-year">
                Mismo mes del año anterior
              </option>
            </select>
          </label>

          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            onClick={onReset}
            type="button"
          >
            <RotateCcw size={16} />
            Restablecer
          </button>
        </div>
      </div>
    </section>
  )
}
