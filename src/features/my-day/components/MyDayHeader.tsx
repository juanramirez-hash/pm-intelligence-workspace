// MD-003: title, data cutoff, "Mis marcas / Todas" (scope 'all' only) and
// the period selector (cutoff month and the 11 previous ones).

import {
  CalendarDays,
} from 'lucide-react'

import type {
  MyDayView,
} from '../api/myDayTypes'

import {
  buildPeriodOptions,
  formatDate,
} from '../format/myDayFormat'

interface MyDayHeaderProps {
  dataCutoff: string | null
  canViewAll: boolean
  view: MyDayView
  onViewChange: (view: MyDayView) => void
  period: string | null
  onPeriodChange: (period: string) => void
}

const VIEW_OPTIONS: Array<{ value: MyDayView, label: string }> = [
  { value: 'mine', label: 'Mis marcas' },
  { value: 'all', label: 'Todas' },
]

export function MyDayHeader({
  dataCutoff,
  canViewAll,
  view,
  onViewChange,
  period,
  onPeriodChange,
}: MyDayHeaderProps) {
  const periodOptions = buildPeriodOptions(dataCutoff)
  const selectedPeriod = period ?? periodOptions[0]?.value ?? ''

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F58220]">
          Inicio del PM
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Mi día
        </h1>

        <p
          data-my-day-cutoff="true"
          className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600"
        >
          <CalendarDays aria-hidden="true" className="text-blue-600" size={15} />
          Datos al corte: <strong className="font-semibold text-slate-900">{formatDate(dataCutoff)}</strong>
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {canViewAll ? (
          <div
            role="group"
            aria-label="Marcas"
            data-my-day-view-toggle="true"
            className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
          >
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                onClick={() => onViewChange(option.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  view === option.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Periodo de venta
          <select
            value={selectedPeriod}
            disabled={periodOptions.length === 0}
            onChange={(event) => onPeriodChange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm disabled:opacity-50"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  )
}
