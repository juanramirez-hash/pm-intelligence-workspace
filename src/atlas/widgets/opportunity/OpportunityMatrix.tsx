import type {
  BusinessOpportunity,
} from '../../../core/business/opportunityRadar'

import {
  opportunityTypeClasses,
} from './opportunityPresentation'

interface OpportunityMatrixProps {
  opportunities: readonly BusinessOpportunity[]
}

function inferUrgency(opportunity: BusinessOpportunity): number {
  if (opportunity.priority === 'critical') return 90
  if (opportunity.priority === 'high') return 72
  if (opportunity.priority === 'medium') return 52
  return 30
}

function normalizeImpact(
  value: number,
  maximum: number,
): number {
  if (maximum <= 0) return 20
  return Math.max(8, Math.min(92, Math.abs(value) / maximum * 84 + 8))
}

function getHorizontalTooltipClasses(left: number): string {
  if (left >= 70) {
    return 'right-0'
  }

  if (left <= 30) {
    return 'left-0'
  }

  return 'left-1/2 -translate-x-1/2'
}

function getVerticalTooltipClasses(bottom: number): string {
  if (bottom <= 28) {
    return 'bottom-11'
  }

  return 'top-11'
}

export function OpportunityMatrix({
  opportunities,
}: OpportunityMatrixProps) {
  const maximumImpact = Math.max(
    0,
    ...opportunities.map((opportunity) => Math.abs(opportunity.impact)),
  )

  return (
    <div
      className="relative min-h-[320px] overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:25%_25%] p-6"
      data-atlas-component="opportunity-matrix"
    >
      <div className="absolute inset-x-1/2 top-0 bottom-0 w-px bg-slate-300" />
      <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-slate-300" />

      <span className="absolute left-4 top-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Mayor impacto
      </span>
      <span className="absolute bottom-3 right-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Mayor urgencia
      </span>

      {opportunities.slice(0, 8).map((opportunity, index) => {
        const left = inferUrgency(opportunity)
        const bottom = normalizeImpact(opportunity.impact, maximumImpact)
        const tooltipClasses = [
          getHorizontalTooltipClasses(left),
          getVerticalTooltipClasses(bottom),
        ].join(' ')

        return (
          <div
            className="absolute -translate-x-1/2 translate-y-1/2"
            key={opportunity.id}
            style={{
              left: `${left}%`,
              bottom: `${bottom}%`,
            }}
          >
            <div
              aria-label={`${opportunity.entityName}: ${opportunity.title}`}
              className={[
                'group relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-md ring-4 ring-white transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-violet-300 motion-reduce:transition-none',
                opportunityTypeClasses[opportunity.type],
              ].join(' ')}
              tabIndex={0}
            >
              {index + 1}
              <span
                className={[
                  'pointer-events-none absolute z-30 hidden w-52 max-w-[min(13rem,calc(100vw-3rem))] rounded-xl bg-slate-950 px-3 py-2 text-left text-[11px] font-medium leading-4 text-white shadow-xl group-hover:block group-focus-visible:block',
                  tooltipClasses,
                ].join(' ')}
                data-opportunity-tooltip-position={`${left >= 70 ? 'left' : left <= 30 ? 'right' : 'center'}-${bottom <= 28 ? 'top' : 'bottom'}`}
                role="tooltip"
              >
                <span className="block font-semibold text-white">
                  {opportunity.entityName}
                </span>
                <span className="mt-0.5 block text-slate-300">
                  {opportunity.title}
                </span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
