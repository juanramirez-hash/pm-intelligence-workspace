import type { HTMLAttributes } from 'react'

export type ExecutiveHealthTone = 'healthy' | 'attention' | 'critical' | 'neutral'

export interface ExecutiveHealthScoreProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  score: number | null
  label?: string
  caption?: string
  tone?: ExecutiveHealthTone
}

const toneClasses: Record<ExecutiveHealthTone, { ring: string; value: string; badge: string }> = {
  healthy: { ring: 'border-emerald-300 bg-emerald-50/90', value: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
  attention: { ring: 'border-amber-300 bg-amber-50/90', value: 'text-amber-800', badge: 'bg-amber-100 text-amber-800' },
  critical: { ring: 'border-rose-300 bg-rose-50/90', value: 'text-rose-800', badge: 'bg-rose-100 text-rose-800' },
  neutral: { ring: 'border-slate-300 bg-white/80', value: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
}

export function ExecutiveHealthScore({
  score,
  label = score === null ? 'Modelo en preparación' : 'Disponible',
  caption = 'Business Score',
  tone = 'neutral',
  className = '',
  ...props
}: ExecutiveHealthScoreProps) {
  const styles = toneClasses[tone]
  const boundedScore = score === null ? null : Math.min(100, Math.max(0, Math.round(score)))

  return (
    <article
      data-atlas-component="executive-health-score"
      data-tone={tone}
      className={[
        'flex min-h-52 flex-col items-center justify-center rounded-3xl border border-white/70 bg-white/60 p-4 text-center shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-slate-500">{caption}</p>
      <div className={['mt-3 flex size-24 items-center justify-center rounded-full border-[8px] shadow-inner', styles.ring].join(' ')}>
        <span className={['text-3xl font-semibold tracking-tight', styles.value].join(' ')}>{boundedScore ?? '—'}</span>
      </div>
      <span className={['mt-3 rounded-full px-3 py-1 text-[0.6875rem] font-semibold', styles.badge].join(' ')}>{label}</span>
      {score === null && (
        <p className="mt-2 max-w-48 text-[0.6875rem] leading-4 text-slate-500">
          Disponible cuando Business Core publique el índice consolidado.
        </p>
      )}
    </article>
  )
}
