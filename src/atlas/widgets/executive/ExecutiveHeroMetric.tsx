import type { HTMLAttributes, ReactNode } from 'react'

export type ExecutiveHeroMetricTone = 'default' | 'positive' | 'attention' | 'critical' | 'intelligence'
export interface ExecutiveHeroMetricProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  label: string
  value: ReactNode
  helper?: ReactNode
  icon?: ReactNode
  tone?: ExecutiveHeroMetricTone
}

const toneClasses: Record<ExecutiveHeroMetricTone, string> = {
  default: 'border-white/60 bg-white/70 text-slate-950',
  positive: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-950',
  attention: 'border-amber-200/80 bg-amber-50/80 text-amber-950',
  critical: 'border-rose-200/80 bg-rose-50/80 text-rose-950',
  intelligence: 'border-violet-200/80 bg-violet-50/80 text-violet-950',
}

export function ExecutiveHeroMetric({ label, value, helper, icon, tone = 'default', className = '', ...props }: ExecutiveHeroMetricProps) {
  return (
    <article
      data-atlas-component="executive-hero-metric"
      data-tone={tone}
      className={[
        'rounded-2xl border p-3.5 shadow-sm backdrop-blur-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none',
        toneClasses[tone],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.11em] opacity-60">{label}</p>
          <div className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">{value}</div>
          {helper && <div className="mt-1 text-[0.6875rem] leading-4 opacity-65">{helper}</div>}
        </div>
        {icon && <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/75 shadow-sm">{icon}</div>}
      </div>
    </article>
  )
}
