import type {
  ForecastWorkspaceInventorySummary,
} from '../types/forecastWorkspaceTypes'

import {
  formatForecastInteger,
} from '../utils/forecastWorkspaceFormatters'

export interface ForecastCoveragePanelProps {
  inventory: ForecastWorkspaceInventorySummary
}

const coverageItems = [
  {
    key: 'stockout',
    label: 'Agotados',
    detail: 'Demanda positiva sin disponibilidad',
    bar: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700',
  },
  {
    key: 'shortage',
    label: 'Faltante al cierre',
    detail: 'Disponible insuficiente para cerrar el periodo',
    bar: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-700',
  },
  {
    key: 'low',
    label: 'Cobertura baja',
    detail: 'Menos de un mes de demanda proyectada',
    bar: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700',
  },
  {
    key: 'balanced',
    label: 'Balanceados',
    detail: 'Entre uno y tres meses de cobertura',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  {
    key: 'excess',
    label: 'Exceso',
    detail: 'Tres meses o más de cobertura',
    bar: 'bg-violet-500',
    badge: 'bg-violet-50 text-violet-700',
  },
  {
    key: 'noDemand',
    label: 'Sin demanda',
    detail: 'Inventario sin consumo mensual proyectado',
    bar: 'bg-slate-500',
    badge: 'bg-slate-100 text-slate-700',
  },
  {
    key: 'unavailable',
    label: 'Sin fuente',
    detail: 'No existe información suficiente de inventario',
    bar: 'bg-slate-300',
    badge: 'bg-slate-50 text-slate-500',
  },
] as const

export function ForecastCoveragePanel({
  inventory,
}: ForecastCoveragePanelProps) {
  const denominator = Math.max(1, inventory.filteredProducts)

  return (
    <div
      className="space-y-3"
      data-forecast-component="coverage-panel"
    >
      {coverageItems.map((item) => {
        const count = inventory.coverage[item.key]
        const percentage = Math.min(100, (count / denominator) * 100)

        return (
          <article
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5"
            key={item.key}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                  {item.detail}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.badge}`}>
                {formatForecastInteger(count)}
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className={`h-full rounded-full ${item.bar}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </article>
        )
      })}
    </div>
  )
}
