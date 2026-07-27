import type {
  ReactNode,
} from 'react'

import type {
  ExecutiveBriefItem as ExecutiveBriefItemModel,
  ExecutiveBriefSeverity,
} from '../../../core/business/executiveBrief'

import {
  ExecutiveConfidenceBadge,
} from './ExecutiveConfidenceBadge'

import {
  ExecutiveExplanation,
} from './ExecutiveExplanation'

const severityStyles: Record<
  ExecutiveBriefSeverity,
  string
> = {
  positive:
    'border-emerald-100 bg-emerald-50/65',
  neutral:
    'border-slate-200 bg-slate-50/70',
  attention:
    'border-amber-100 bg-amber-50/65',
  critical:
    'border-rose-100 bg-rose-50/65',
}

interface ExecutiveBriefItemProps {
  item: ExecutiveBriefItemModel
  icon?: ReactNode
  showExplanation?: boolean
}

export function ExecutiveBriefItem({
  item,
  icon,
  showExplanation = false,
}: ExecutiveBriefItemProps) {
  return (
    <article
      className={[
        'rounded-2xl border p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px hover:shadow-sm motion-reduce:transform-none motion-reduce:transition-none',
        severityStyles[item.severity],
      ].join(' ')}
      data-atlas-component="executive-brief-item"
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-5 text-slate-950">
              {item.title}
            </h4>

            <ExecutiveConfidenceBadge confidence={item.confidence} />
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.description}
          </p>

          {showExplanation && (
            <div className="mt-4">
              <ExecutiveExplanation explanation={item.explanation} />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
