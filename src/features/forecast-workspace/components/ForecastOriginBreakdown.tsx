import {
  BadgeDollarSign,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'

import type {
  ForecastWorkspacePortfolioSummary,
  ForecastWorkspaceProjectPipeline,
} from '../types/forecastWorkspaceTypes'

import {
  formatForecastCurrency,
  formatForecastInteger,
  formatForecastPercentage,
} from '../utils/forecastWorkspaceFormatters'

export interface ForecastOriginBreakdownProps {
  portfolio: ForecastWorkspacePortfolioSummary
  projectPipeline: ForecastWorkspaceProjectPipeline
}

export function ForecastOriginBreakdown({
  portfolio,
  projectPipeline,
}: ForecastOriginBreakdownProps) {
  const origin = portfolio.origin
  const pipeline = projectPipeline.summary
  const projectShare = origin.actualTotal.revenue === 0
    ? null
    : origin.actualProjectBilling.revenue /
      origin.actualTotal.revenue

  const cards = [
    {
      label: 'Forecast transaccional',
      value: formatForecastCurrency(
        origin.projectedTransactional.revenue,
        true,
      ),
      detail: `Base estadística sobre ${formatForecastCurrency(origin.actualTransactional.revenue, true)} de venta transaccional real.`,
      icon: <TrendingUp size={18} />,
      className: 'border-indigo-100 bg-indigo-50/55 text-indigo-800',
    },
    {
      label: 'Proyectos facturados',
      value: formatForecastCurrency(
        origin.actualProjectBilling.revenue,
        true,
      ),
      detail: `${formatForecastInteger(origin.actualProjectBilling.documents)} documentos conciliados · ${formatForecastPercentage(projectShare)} de la venta real.`,
      icon: <CheckCircle2 size={18} />,
      className: 'border-emerald-100 bg-emerald-50/55 text-emerald-800',
    },
    {
      label: 'Pipeline maduro pendiente',
      value: formatForecastCurrency(
        origin.maturePipeline.revenue,
        true,
      ),
      detail: `${formatForecastInteger(pipeline.matureIncludedProjects)} proyectos 05–06 incluidos; ${formatForecastInteger(pipeline.matureBlockedProjects)} bloqueados.`,
      icon: <BadgeDollarSign size={18} />,
      className: 'border-amber-100 bg-amber-50/55 text-amber-900',
    },
    {
      label: 'Forecast combinado',
      value: formatForecastCurrency(
        origin.combined.revenue,
        true,
      ),
      detail: portfolio.officialAvailable
        ? 'Cierre oficial Project-Aware.'
        : 'Resultado provisional: existen bloqueos de calidad.',
      icon: <TrendingUp size={18} />,
      className: portfolio.officialAvailable
        ? 'border-violet-100 bg-violet-50/55 text-violet-800'
        : 'border-rose-100 bg-rose-50/55 text-rose-800',
    },
  ]

  return (
    <div
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      data-forecast-component="origin-breakdown"
    >
      {cards.map((card) => (
        <article
          className={`rounded-2xl border p-4 ${card.className}`}
          key={card.label}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em]">
              {card.label}
            </p>
            {card.icon}
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {card.value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            {card.detail}
          </p>
        </article>
      ))}
    </div>
  )
}
