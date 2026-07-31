import {
  ArrowUpRight,
  PackageSearch,
  Repeat2,
} from 'lucide-react'

import type {
  ForecastWorkspacePriorityItem,
} from '../types/forecastWorkspaceTypes'

import {
  formatForecastCoverage,
  formatForecastCurrency,
  formatForecastInteger,
} from '../utils/forecastWorkspaceFormatters'

export interface ForecastPriorityListProps {
  items: readonly ForecastWorkspacePriorityItem[]
  kind: 'risk' | 'opportunity'
}

const priorityStyles: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-700',
}

const priorityLabels: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export function ForecastPriorityList({
  items,
  kind,
}: ForecastPriorityListProps) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center"
        data-forecast-component={`${kind}-ranking`}
      >
        <p className="text-sm font-semibold text-slate-700">
          No hay {kind === 'risk' ? 'riesgos' : 'oportunidades'} con los filtros actuales.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          El ranking se actualiza al cambiar escenario o filtros.
        </p>
      </div>
    )
  }

  return (
    <div
      className="space-y-3"
      data-forecast-component={`${kind}-ranking`}
    >
      {items.map((item, index) => (
        <article
          className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
          key={item.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">
                    {item.productName}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityStyles[item.priority]}`}>
                    {priorityLabels[item.priority]}
                  </span>
                  {item.isSuperseded && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                      Superseded
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {[item.brandId, item.model, `Score ${item.score}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>

            <a
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              href={item.navigation.href}
            >
              <PackageSearch size={14} />
              Expediente
              <ArrowUpRight size={13} />
            </a>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
            <p className="text-sm font-semibold text-slate-900">
              {item.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {item.rationale}
            </p>
          </div>

          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-100 p-2.5">
              <p className="text-slate-500">Demanda restante</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatForecastInteger(item.remainingDemandUnits)} uds.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-2.5">
              <p className="text-slate-500">Disponible + entradas</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatForecastInteger(item.availableUnits)} + {formatForecastInteger(item.inboundUnits)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-2.5">
              <p className="text-slate-500">Cobertura disponible</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatForecastCoverage(item.availableCoverageMonths)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-2.5">
              <p className="text-slate-500">Valor de inventario</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatForecastCurrency(item.inventoryValue, true)}
              </p>
            </div>
          </div>

          <div className={[
            'mt-3 rounded-xl border p-3 text-xs leading-5',
            kind === 'risk'
              ? 'border-rose-100 bg-rose-50/70 text-rose-800'
              : 'border-emerald-100 bg-emerald-50/70 text-emerald-800',
          ].join(' ')}>
            <strong>Acción sugerida:</strong> {item.recommendedAction}
          </div>

          {item.replacementNavigation && (
            <a
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-violet-700 hover:text-violet-900"
              href={item.replacementNavigation.href}
            >
              <Repeat2 size={14} />
              Revisar sustituto: {item.replacementNavigation.label}
              <ArrowUpRight size={13} />
            </a>
          )}
        </article>
      ))}
    </div>
  )
}
