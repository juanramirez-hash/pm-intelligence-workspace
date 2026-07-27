import type { HTMLAttributes, ReactNode } from 'react'
import type { KpiStatus } from './KpiStatusBadge'
import type { KpiTrendProps } from './KpiTrend'

import { KpiFooter } from './KpiFooter'
import { KpiInsight } from './KpiInsight'
import { KpiSparkline } from './KpiSparkline'
import { KpiStatusBadge } from './KpiStatusBadge'
import { KpiTrend } from './KpiTrend'

export type IntelligentKpiTone = KpiStatus

export interface IntelligentKpiCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  title: ReactNode
  value: ReactNode
  icon?: ReactNode
  status?: { label: string; tone: KpiStatus }
  trend?: Omit<KpiTrendProps, 'className'>
  insight?: ReactNode
  history?: readonly number[]
  historyLabel?: string
  source?: ReactNode
  context?: ReactNode
  tone?: IntelligentKpiTone
}

const toneStyles: Record<IntelligentKpiTone, {
  card: string
  icon: string
  accent: string
  sparkline: string
}> = {
  neutral: {
    card: 'border-slate-200 bg-white',
    icon: 'bg-slate-100 text-slate-700',
    accent: 'bg-slate-400',
    sparkline: 'text-slate-500',
  },
  intelligence: {
    card: 'border-violet-200/90 bg-gradient-to-br from-white to-violet-50/70',
    icon: 'bg-violet-100 text-violet-700',
    accent: 'bg-violet-500',
    sparkline: 'text-violet-500',
  },
  positive: {
    card: 'border-emerald-200/90 bg-gradient-to-br from-white to-emerald-50/70',
    icon: 'bg-emerald-100 text-emerald-700',
    accent: 'bg-emerald-500',
    sparkline: 'text-emerald-500',
  },
  attention: {
    card: 'border-amber-200/90 bg-gradient-to-br from-white to-amber-50/70',
    icon: 'bg-amber-100 text-amber-800',
    accent: 'bg-amber-500',
    sparkline: 'text-amber-500',
  },
  critical: {
    card: 'border-rose-200/90 bg-gradient-to-br from-white to-rose-50/70',
    icon: 'bg-rose-100 text-rose-700',
    accent: 'bg-rose-500',
    sparkline: 'text-rose-500',
  },
}

export function IntelligentKpiCard({
  title,
  value,
  icon,
  status,
  trend,
  insight,
  history,
  historyLabel,
  source,
  context,
  tone = 'neutral',
  className = '',
  ...props
}: IntelligentKpiCardProps) {
  const styles = toneStyles[tone]

  return (
    <article
      data-atlas-component="intelligent-kpi-card"
      data-tone={tone}
      className={[
        'relative flex min-h-52 flex-col overflow-hidden rounded-3xl border p-4.5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-violet-200 motion-reduce:transform-none motion-reduce:transition-none sm:p-5',
        styles.card,
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <div aria-hidden="true" className={['absolute inset-x-0 top-0 h-1', styles.accent].join(' ')} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </div>
        </div>

        {icon && (
          <div className={['flex size-10 shrink-0 items-center justify-center rounded-2xl', styles.icon].join(' ')}>
            {icon}
          </div>
        )}
      </div>

      {(status || trend) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {status && <KpiStatusBadge label={status.label} status={status.tone} />}
          {trend && <KpiTrend {...trend} />}
        </div>
      )}

      {history && history.length > 0 && (
        <div className={['mt-3.5 rounded-2xl bg-white/55 px-3 py-2', styles.sparkline].join(' ')}>
          <KpiSparkline label={historyLabel} values={history} />
        </div>
      )}

      {insight && <KpiInsight className="mt-4">{insight}</KpiInsight>}

      <KpiFooter context={context} source={source} />
    </article>
  )
}
