import type {
  ForecastScenarioId,
} from '../../../core/business/forecast'

import type {
  ForecastWorkspaceScenarioOption,
} from '../types/forecastWorkspaceTypes'

import {
  formatForecastCurrency,
  formatForecastPercentage,
} from '../utils/forecastWorkspaceFormatters'

export interface ForecastScenarioSelectorProps {
  options: readonly ForecastWorkspaceScenarioOption[]
  onChange: (scenarioId: ForecastScenarioId) => void
  disabled?: boolean
}

export function ForecastScenarioSelector({
  options,
  onChange,
  disabled = false,
}: ForecastScenarioSelectorProps) {
  return (
    <div
      aria-label="Escenario de Forecast"
      data-forecast-component="scenario-selector"
      role="group"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
          Escenario de planeación
        </p>
        <p className="text-[11px] text-slate-500">
          Cambia el componente transaccional; proyecto facturado y pipeline maduro conservan sus hechos base.
        </p>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        {options.map((option) => (
          <button
            aria-pressed={option.selected}
            className={[
              'rounded-2xl border px-3.5 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60',
              option.selected
                ? 'border-indigo-300 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/70',
            ].join(' ')}
            disabled={disabled}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {option.label}
                </p>
                <p className={[
                  'mt-1 text-[11px] leading-4',
                  option.selected
                    ? 'text-indigo-100'
                    : 'text-slate-500',
                ].join(' ')}>
                  {option.purpose}
                </p>
              </div>

              {option.selected && (
                <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
                  {option.official ? 'Activo · Oficial' : 'Activo · Provisional'}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                {formatForecastCurrency(option.portfolioRevenue, true)}
              </span>
              <span>
                {formatForecastPercentage(option.targetAttainment)} objetivo
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
