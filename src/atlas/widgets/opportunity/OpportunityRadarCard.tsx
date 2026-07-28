import {
  Radar,
  TrendingUp,
} from 'lucide-react'

import type {
  OpportunityRadar as OpportunityRadarModel,
} from '../../../core/business/opportunityRadar'

import {
  OpportunityCard,
} from './OpportunityCard'
import {
  OpportunityMatrix,
} from './OpportunityMatrix'

interface OpportunityRadarCardProps {
  radar: OpportunityRadarModel
  className?: string
  locale?: string
  currency?: string
  showMatrix?: boolean
  maximumVisible?: number
}

export function OpportunityRadarCard({
  radar,
  className = '',
  locale = 'es-MX',
  currency = 'MXN',
  showMatrix = true,
  maximumVisible = 6,
}: OpportunityRadarCardProps) {
  const visibleOpportunities = radar.opportunities.slice(0, maximumVisible)
  const totalImpact = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: Math.abs(radar.totalImpact) >= 1_000_000 ? 'compact' : 'standard',
  }).format(radar.totalImpact)

  return (
    <section
      aria-labelledby={`${radar.id}-title`}
      className={[
        'space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]',
        className,
      ].join(' ')}
      data-atlas-component="opportunity-radar-card"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
            <Radar size={21} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">
              Opportunity Radar
            </p>
            <h2
              className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
              id={`${radar.id}-title`}
            >
              Oportunidades prioritarias
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Prioridades comerciales ordenadas por impacto, urgencia y probabilidad.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Impacto total
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">{totalImpact}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-500">
              Críticas
            </p>
            <p className="mt-1 text-sm font-bold text-rose-700">{radar.criticalCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-500">
              Altas
            </p>
            <p className="mt-1 text-sm font-bold text-amber-700">{radar.highCount}</p>
          </div>
        </div>
      </header>

      {visibleOpportunities.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <TrendingUp className="mx-auto text-slate-400" size={26} />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            No hay oportunidades priorizadas para este periodo.
          </p>
        </div>
      ) : (
        <>
          {showMatrix && (
            <OpportunityMatrix opportunities={visibleOpportunities} />
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {visibleOpportunities.map((opportunity, index) => (
              <OpportunityCard
                currency={currency}
                featured={index === 0}
                key={opportunity.id}
                locale={locale}
                opportunity={opportunity}
                rank={index + 1}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
