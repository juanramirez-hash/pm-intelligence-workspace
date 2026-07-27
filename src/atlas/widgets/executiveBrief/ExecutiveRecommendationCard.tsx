import {
  Target,
} from 'lucide-react'

import type {
  ExecutiveBriefItem,
} from '../../../core/business/executiveBrief'

import {
  ExecutiveConfidenceBadge,
} from './ExecutiveConfidenceBadge'

import {
  ExecutiveExplanation,
} from './ExecutiveExplanation'

interface ExecutiveRecommendationCardProps {
  recommendation: ExecutiveBriefItem
  featured?: boolean
}

export function ExecutiveRecommendationCard({
  recommendation,
  featured = false,
}: ExecutiveRecommendationCardProps) {
  return (
    <article
      className={[
        'rounded-3xl border p-5',
        featured
          ? 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 shadow-sm'
          : 'border-slate-200 bg-white',
      ].join(' ')}
      data-atlas-component="executive-recommendation-card"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
          <Target size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                {featured
                  ? 'Recomendación principal'
                  : 'Recomendación'}
              </p>

              <h3 className="mt-1 text-base font-semibold leading-6 text-slate-950">
                {recommendation.title}
              </h3>
            </div>

            <ExecutiveConfidenceBadge confidence={recommendation.confidence} />
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {recommendation.description}
          </p>

          <div className="mt-4">
            <ExecutiveExplanation explanation={recommendation.explanation} />
          </div>
        </div>
      </div>
    </article>
  )
}
