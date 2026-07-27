import type { HTMLAttributes, ReactNode } from 'react'
import type { ExecutiveHealthScoreProps } from './ExecutiveHealthScore'
import type { ExecutiveHeroMetricProps } from './ExecutiveHeroMetric'
import type { ExecutiveHeroSummaryItem } from './ExecutiveHeroSummary'
import type { WorkspaceThemeName } from '../../theme'

import { getWorkspaceTheme } from '../../theme'
import { ExecutiveHealthScore } from './ExecutiveHealthScore'
import { ExecutiveHeroMetric } from './ExecutiveHeroMetric'
import { ExecutiveHeroSummary } from './ExecutiveHeroSummary'

export interface ExecutiveHeroProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  status?: ReactNode
  metadata?: ReactNode
  actions?: ReactNode
  score: ExecutiveHealthScoreProps
  metrics: readonly ExecutiveHeroMetricProps[]
  summaryItems: readonly ExecutiveHeroSummaryItem[]
  theme?: WorkspaceThemeName
}

export function ExecutiveHero({
  eyebrow,
  title,
  description,
  icon,
  status,
  metadata,
  actions,
  score,
  metrics,
  summaryItems,
  theme = 'brand',
  className = '',
  ...props
}: ExecutiveHeroProps) {
  const workspaceTheme = getWorkspaceTheme(theme)

  return (
    <section
      data-atlas-component="executive-hero"
      data-workspace-theme={theme}
      className={[
        'relative overflow-hidden rounded-[1.75rem] border p-5 shadow-sm sm:p-6 lg:p-7',
        workspaceTheme.hero,
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <div aria-hidden="true" className={['pointer-events-none absolute -right-20 -top-24 size-64 rounded-full blur-3xl', workspaceTheme.glowPrimary].join(' ')} />
      <div aria-hidden="true" className={['pointer-events-none absolute -bottom-28 left-1/3 size-56 rounded-full blur-3xl', workspaceTheme.glowSecondary].join(' ')} />

      <div className="relative">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            {icon && (
              <div className={['flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm', workspaceTheme.icon].join(' ')}>
                {icon}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">{eyebrow}</p>}
                {status}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-[2rem]">{title}</h1>
              {description && <div className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 sm:text-[0.9375rem]">{description}</div>}
              {metadata && <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">{metadata}</div>}
            </div>
          </div>

          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_260px]">
          <ExecutiveHealthScore {...score} />
          <div className="grid content-start gap-3 sm:grid-cols-2">
            {metrics.map((metric) => <ExecutiveHeroMetric {...metric} key={metric.label} />)}
          </div>
          <ExecutiveHeroSummary items={summaryItems} />
        </div>
      </div>
    </section>
  )
}
