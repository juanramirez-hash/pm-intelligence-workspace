import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'

export type KpiTrendDirection = 'up' | 'down' | 'stable'
export type KpiTrendSentiment = 'positive' | 'negative' | 'neutral'

export interface KpiTrendProps extends HTMLAttributes<HTMLDivElement> {
  direction: KpiTrendDirection
  value: ReactNode
  label?: ReactNode
  sentiment?: KpiTrendSentiment
}

const sentimentClasses: Record<KpiTrendSentiment, string> = {
  positive: 'text-emerald-700',
  negative: 'text-rose-700',
  neutral: 'text-slate-600',
}

const icons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  stable: ArrowRight,
} as const

export function KpiTrend({
  direction,
  value,
  label,
  sentiment = 'neutral',
  className = '',
  ...props
}: KpiTrendProps) {
  const Icon = icons[direction]

  return (
    <div
      data-atlas-component="kpi-trend"
      data-direction={direction}
      className={['flex flex-wrap items-center gap-x-2 gap-y-1', className].filter(Boolean).join(' ')}
      {...props}
    >
      <span className={['inline-flex items-center gap-1 text-sm font-semibold', sentimentClasses[sentiment]].join(' ')}>
        <Icon aria-hidden="true" size={15} />
        {value}
      </span>
      {label && <span className="text-xs text-slate-500">{label}</span>}
    </div>
  )
}
