import type { LucideIcon } from 'lucide-react'

interface RankingItemProps {
  position: number

  title: string

  subtitle?: string

  value: string

  icon?: LucideIcon

  valueColor?: string
}

export function RankingItem({
  position,
  title,
  subtitle,
  value,
  icon: Icon,
  valueColor = 'text-slate-950',
}: RankingItemProps) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex size-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-500 shadow-sm">
          {position}
        </div>

        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-500">
            <Icon size={16} />
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-slate-900">
            {title}
          </h3>

          {subtitle && (
            <p className="text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div
        className={[
          'text-sm font-semibold',
          valueColor,
        ].join(' ')}
      >
        {value}
      </div>
    </article>
  )
}