import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from 'lucide-react'
import { AtlasCard } from '../components/AtlasCard'

type HealthTrend = 'up' | 'down' | 'stable'
type HealthStatus = 'healthy' | 'warning' | 'critical'

type BusinessHealthCardProps = {
  score: number
  label?: string
  status?: HealthStatus
  trend?: HealthTrend
  change?: string
  description?: string
}

const statusStyles: Record<
  HealthStatus,
  {
    label: string
    accent: string
    background: string
    progress: string
  }
> = {
  healthy: {
    label: 'Saludable',
    accent: 'text-emerald-600',
    background: 'bg-emerald-50',
    progress: 'bg-emerald-500',
  },
  warning: {
    label: 'Requiere atención',
    accent: 'text-amber-600',
    background: 'bg-amber-50',
    progress: 'bg-amber-500',
  },
  critical: {
    label: 'Crítico',
    accent: 'text-red-600',
    background: 'bg-red-50',
    progress: 'bg-red-500',
  },
}

const trendConfig: Record<
  HealthTrend,
  {
    icon: typeof ArrowUpRight
    className: string
  }
> = {
  up: {
    icon: ArrowUpRight,
    className: 'text-emerald-600',
  },
  down: {
    icon: ArrowDownRight,
    className: 'text-red-600',
  },
  stable: {
    icon: Minus,
    className: 'text-slate-500',
  },
}

export function BusinessHealthCard({
  score,
  label = 'Business Health',
  status = 'healthy',
  trend = 'stable',
  change = 'Sin cambios',
  description = 'El desempeño general del portafolio se mantiene dentro de los parámetros esperados.',
}: BusinessHealthCardProps) {
  const safeScore = Math.min(Math.max(score, 0), 100)
  const styles = statusStyles[status]
  const TrendIcon = trendConfig[trend].icon

  return (
    <AtlasCard className="p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <div
            className={[
              'flex size-11 items-center justify-center rounded-2xl',
              styles.background,
              styles.accent,
            ].join(' ')}
          >
            <Activity size={22} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {label}
            </p>

            <p className={`mt-1 text-sm font-semibold ${styles.accent}`}>
              {styles.label}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-4xl font-bold tracking-tight text-slate-950">
            {safeScore}
            <span className="ml-1 text-base font-medium text-slate-400">
              /100
            </span>
          </p>

          <div
            className={[
              'mt-2 inline-flex items-center justify-end gap-1 text-sm font-semibold',
              trendConfig[trend].className,
            ].join(' ')}
          >
            <TrendIcon size={16} />
            {change}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${styles.progress}`}
            style={{ width: `${safeScore}%` }}
          />
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </AtlasCard>
  )
}