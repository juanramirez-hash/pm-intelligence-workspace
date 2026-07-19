import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from 'lucide-react'
import { AtlasCard } from './AtlasCard'

type MetricTrend = 'up' | 'down' | 'neutral'

type MetricCardProps = {
  label: string
  value: string
  change?: string
  trend?: MetricTrend
  icon: LucideIcon
}

const trendClasses: Record<MetricTrend, string> = {
  up: 'text-emerald-600',
  down: 'text-red-600',
  neutral: 'text-slate-500',
}

export function MetricCard({
  label,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
}: MetricCardProps) {
  const TrendIcon =
    trend === 'up'
      ? ArrowUpRight
      : trend === 'down'
        ? ArrowDownRight
        : Minus

  return (
    <AtlasCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={20} />
        </div>

        {change && (
          <span
            className={[
              'flex items-center gap-1 text-sm font-semibold',
              trendClasses[trend],
            ].join(' ')}
          >
            <TrendIcon size={16} />
            {change}
          </span>
        )}
      </div>

      <p className="mt-6 text-sm text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
    </AtlasCard>
  )
}