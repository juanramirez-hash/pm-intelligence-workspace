import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  Clock3,
} from 'lucide-react'
import { AtlasCard } from '../components/AtlasCard'
import { StatusBadge } from '../components/StatusBadge'
import { SectionHeader } from '../layout/SectionHeader'

type AlertSeverity = 'critical' | 'high' | 'medium'

export type CriticalAlert = {
  id: string
  brand: string
  category: string
  title: string
  detail: string
  impact: string
  priorityScore: number
  severity: AlertSeverity
  dueLabel?: string
}

type CriticalAlertsCardProps = {
  alerts: CriticalAlert[]
  onReview?: (alert: CriticalAlert) => void
}

const severityConfig: Record<
  AlertSeverity,
  {
    badgeTone: 'danger' | 'warning' | 'neutral'
    label: string
    iconClassName: string
    borderClassName: string
  }
> = {
  critical: {
    badgeTone: 'danger',
    label: 'Crítico',
    iconClassName: 'bg-red-50 text-red-600',
    borderClassName: 'border-red-100',
  },
  high: {
    badgeTone: 'warning',
    label: 'Alto',
    iconClassName: 'bg-amber-50 text-amber-600',
    borderClassName: 'border-amber-100',
  },
  medium: {
    badgeTone: 'neutral',
    label: 'Medio',
    iconClassName: 'bg-slate-100 text-slate-600',
    borderClassName: 'border-slate-200',
  },
}

export function CriticalAlertsCard({
  alerts,
  onReview,
}: CriticalAlertsCardProps) {
  const sortedAlerts = [...alerts].sort(
    (a, b) => b.priorityScore - a.priorityScore,
  )

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Alertas críticas"
        description="Ordenadas automáticamente por impacto y urgencia."
        action={
          <StatusBadge tone="danger">
            {sortedAlerts.length} activas
          </StatusBadge>
        }
      />

      <div className="mt-6 space-y-4">
        {sortedAlerts.map((alert) => {
          const config = severityConfig[alert.severity]

          return (
            <article
              key={alert.id}
              className={[
                'rounded-2xl border p-5',
                config.borderClassName,
              ].join(' ')}
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div
                    className={[
                      'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                      config.iconClassName,
                    ].join(' ')}
                  >
                    <AlertTriangle size={21} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">
                        {alert.brand}
                      </p>

                      <StatusBadge tone={config.badgeTone}>
                        {config.label}
                      </StatusBadge>

                      <span className="text-xs font-medium text-slate-400">
                        {alert.category}
                      </span>
                    </div>

                    <h4 className="mt-2 text-base font-semibold text-slate-900">
                      {alert.title}
                    </h4>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {alert.detail}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:w-[430px]">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <CircleDollarSign size={15} />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Impacto
                      </span>
                    </div>

                    <p className="mt-2 font-semibold text-slate-950">
                      {alert.impact}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Priority Score
                    </p>

                    <p className="mt-2 font-semibold text-slate-950">
                      {alert.priorityScore}
                      <span className="text-sm font-medium text-slate-400">
                        /100
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock3 size={15} />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Atención
                      </span>
                    </div>

                    <p className="mt-2 font-semibold text-slate-950">
                      {alert.dueLabel ?? 'Hoy'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onReview?.(alert)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Revisar
                  <ArrowRight size={16} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </AtlasCard>
  )
}