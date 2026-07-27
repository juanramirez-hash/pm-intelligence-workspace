import type { HTMLAttributes, ReactNode } from 'react'

export type ExecutivePanelTone = 'neutral' | 'positive' | 'attention' | 'critical' | 'intelligence'

export interface ExecutivePanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  count?: ReactNode
  tone?: ExecutivePanelTone
  children: ReactNode
  footer?: ReactNode
}

const tones: Record<ExecutivePanelTone, { icon: string; count: string; accent: string }> = {
  neutral: { icon: 'bg-slate-100 text-slate-700', count: 'bg-slate-100 text-slate-700', accent: 'bg-slate-300' },
  positive: { icon: 'bg-emerald-50 text-emerald-700', count: 'bg-emerald-50 text-emerald-700', accent: 'bg-emerald-400' },
  attention: { icon: 'bg-amber-50 text-amber-700', count: 'bg-amber-50 text-amber-700', accent: 'bg-amber-400' },
  critical: { icon: 'bg-rose-50 text-rose-700', count: 'bg-rose-50 text-rose-700', accent: 'bg-rose-400' },
  intelligence: { icon: 'bg-violet-50 text-violet-700', count: 'bg-violet-50 text-violet-700', accent: 'bg-violet-400' },
}

export function ExecutivePanel({ title, subtitle, icon, count, tone = 'neutral', children, footer, className = '', ...props }: ExecutivePanelProps) {
  const style = tones[tone]

  return (
    <section
      data-atlas-component="executive-panel"
      data-tone={tone}
      className={[
        'group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none sm:p-6',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <div aria-hidden="true" className={['absolute inset-x-0 top-0 h-1', style.accent].join(' ')} />
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {icon && <div className={['flex size-10 shrink-0 items-center justify-center rounded-xl', style.icon].join(' ')}>{icon}</div>}
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-slate-950">{title}</h2>
            {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {count !== undefined && <span className={['shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', style.count].join(' ')}>{count}</span>}
      </header>
      <div className="mt-5">{children}</div>
      {footer && <footer className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">{footer}</footer>}
    </section>
  )
}
