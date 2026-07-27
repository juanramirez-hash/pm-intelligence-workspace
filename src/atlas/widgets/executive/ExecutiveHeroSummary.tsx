import type { HTMLAttributes, ReactNode } from 'react'

export interface ExecutiveHeroSummaryItem {
  label: string
  value: ReactNode
  tone?: 'default' | 'positive' | 'attention' | 'critical'
}
export interface ExecutiveHeroSummaryProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  title?: string
  items: readonly ExecutiveHeroSummaryItem[]
}

const valueToneClasses = {
  default: 'text-slate-950',
  positive: 'text-emerald-700',
  attention: 'text-amber-700',
  critical: 'text-rose-700',
} as const

export function ExecutiveHeroSummary({ title = 'Estado del negocio', items, className = '', ...props }: ExecutiveHeroSummaryProps) {
  return (
    <aside
      data-atlas-component="executive-hero-summary"
      className={[
        'rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <dl className="mt-3 divide-y divide-slate-200/70">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0" key={item.label}>
            <dt className="text-xs text-slate-600">{item.label}</dt>
            <dd className={['text-right text-xs font-semibold', valueToneClasses[item.tone ?? 'default']].join(' ')}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
