import type {
  ReactNode,
} from 'react'

import {
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleGauge,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

import type {
  BusinessOpportunity,
  OpportunityType,
} from '../../../core/business/opportunityRadar'

import {
  ImpactBadge,
} from './ImpactBadge'
import {
  OpportunityConfidence,
} from './OpportunityConfidence'
import {
  OpportunityExplanation,
} from './OpportunityExplanation'
import {
  OpportunityScore,
} from './OpportunityScore'
import {
  PriorityBadge,
} from './PriorityBadge'
import {
  opportunityTypeClasses,
  opportunityTypeLabel,
} from './opportunityPresentation'

const typeIcon: Record<OpportunityType, ReactNode> = {
  recovery: <RefreshCw size={17} />,
  growth: <ChartNoAxesCombined size={17} />,
  coverage: <ShieldCheck size={17} />,
  portfolio: <CircleGauge size={17} />,
}

interface OpportunityCardProps {
  opportunity: BusinessOpportunity
  rank?: number
  locale?: string
  currency?: string
  featured?: boolean
}

export function OpportunityCard({
  opportunity,
  rank,
  locale,
  currency,
  featured = false,
}: OpportunityCardProps) {
  return (
    <article
      className={[
        'rounded-[24px] border bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        featured
          ? 'border-violet-200 ring-1 ring-violet-100'
          : 'border-slate-200',
      ].join(' ')}
      data-atlas-component="opportunity-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {rank !== undefined && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
              {rank}
            </span>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
                  opportunityTypeClasses[opportunity.type],
                ].join(' ')}
              >
                {typeIcon[opportunity.type]}
                {opportunityTypeLabel[opportunity.type]}
              </span>
              <PriorityBadge priority={opportunity.priority} />
            </div>

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {opportunity.entityName}
            </p>
            <h3 className="mt-1 text-lg font-bold leading-6 text-slate-950">
              {opportunity.title}
            </h3>
          </div>
        </div>

        <ArrowUpRight className="shrink-0 text-slate-400" size={18} />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {opportunity.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ImpactBadge
          currency={currency}
          impact={opportunity.impact}
          locale={locale}
        />
        <OpportunityConfidence confidence={opportunity.confidence} />
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
          Esfuerzo {opportunity.effort}/100
        </span>
      </div>

      <div className="mt-5">
        <OpportunityScore score={opportunity.score} />
      </div>

      <div className="mt-5">
        <OpportunityExplanation explanation={opportunity.explanation} />
      </div>
    </article>
  )
}
