import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  GitCompareArrows,
} from 'lucide-react'

import type {
  ExecutivePeriodPreset,
  ExecutivePeriodSelection,
} from '../types/executiveWorkspaceTypes'

interface ExecutiveAnalysisPeriodProps {
  selection:
    ExecutivePeriodSelection

  lastImportedAt:
    string | null

  onPresetChange:
    (preset: ExecutivePeriodPreset) => void

  onPreviousPeriod: () => void

  onNextPeriod: () => void
}

const DATE_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    'es-MX',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    },
  )

const PRESETS:
  readonly {
    id: ExecutivePeriodPreset
    label: string
  }[] = [
    {
      id: 'month',
      label: 'Último mes',
    },
    {
      id: 'last_3_months',
      label: '3 meses',
    },
    {
      id: 'last_6_months',
      label: '6 meses',
    },
    {
      id: 'year_to_date',
      label: 'Año actual',
    },
  ]

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return 'Sin sincronización registrada'
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime())
    ? value
    : DATE_TIME_FORMATTER.format(parsed)
}

export function ExecutiveAnalysisPeriod({
  selection,
  lastImportedAt,
  onPresetChange,
  onPreviousPeriod,
  onNextPeriod,
}: ExecutiveAnalysisPeriodProps) {
  const hasPeriods =
    selection.availablePeriods.length > 0

  return (
    <section
      data-executive-component="analysis-period"
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
          Contexto temporal
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Periodo de análisis
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Selecciona el corte que gobernará rendimiento comercial, prioridades, tendencias y Brand Intelligence.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-2 sm:w-fit">
            <button
              aria-label="Periodo anterior"
              className="flex size-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-35"
              disabled={
                selection.previousAnchorPeriodId ===
                null
              }
              onClick={onPreviousPeriod}
              type="button"
            >
              <ChevronLeft size={19} />
            </button>

            <div className="min-w-48 px-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                Periodo seleccionado
              </p>

              <p className="mt-1 text-base font-semibold text-slate-950">
                {selection.currentLabel}
              </p>
            </div>

            <button
              aria-label="Periodo siguiente"
              className="flex size-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-35"
              disabled={
                selection.nextAnchorPeriodId ===
                null
              }
              onClick={onNextPeriod}
              type="button"
            >
              <ChevronRight size={19} />
            </button>
          </div>

          <div
            aria-label="Rango de análisis"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {PRESETS.map(
              (preset) => {
                const active =
                  selection.preset ===
                  preset.id

                return (
                  <button
                    aria-pressed={active}
                    className={[
                      'rounded-xl border px-4 py-2 text-xs font-semibold transition',
                      active
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
                    ].join(' ')}
                    key={preset.id}
                    onClick={() =>
                      onPresetChange(
                        preset.id,
                      )
                    }
                    type="button"
                  >
                    {preset.label}
                  </button>
                )
              },
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <CalendarDays size={16} />

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                Selección activa
              </p>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {selection.currentLabel}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {selection.currentPeriodIds.length}{' '}
              {selection.currentPeriodIds.length === 1
                ? 'periodo incluido'
                : 'periodos incluidos'}.
            </p>
          </article>

          <article className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
            <div className="flex items-center gap-2 text-violet-700">
              <GitCompareArrows size={16} />

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                Comparación base
              </p>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {selection.comparisonLabel}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Ventana inmediatamente comparable.
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Database size={16} />

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                Periodos disponibles
              </p>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {selection.availablePeriods.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {hasPeriods
                ? `${selection.availablePeriods[0].label} – ${selection.availablePeriods.at(-1)?.label ?? ''}`
                : 'Pendiente de información mensual.'}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock3 size={16} />

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                Corte de información
              </p>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {formatDateTime(
                lastImportedAt,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Última carga de ventas registrada.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
