import type {
  LucideIcon,
} from 'lucide-react'

export type KpiCardTone =
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'

interface KpiCardProps {
  title: string
  value: string | number

  subtitle?: string

  icon: LucideIcon

  tone?: KpiCardTone

  valueClassName?: string
}

const toneStyles:
  Record<
    KpiCardTone,
    string
  > = {
    violet:
      'bg-violet-50 text-violet-600',

    blue:
      'bg-blue-50 text-blue-600',

    emerald:
      'bg-emerald-50 text-emerald-600',

    amber:
      'bg-amber-50 text-amber-600',

    rose:
      'bg-rose-50 text-rose-600',

    slate:
      'bg-slate-100 text-slate-600',
  }

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'slate',
  valueClassName =
    'text-slate-950',
}: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={[
          'flex size-10 items-center justify-center rounded-xl',
          toneStyles[tone],
        ].join(' ')}
      >
        <Icon size={19} />
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p
        className={[
          'mt-2 text-2xl font-semibold',
          valueClassName,
        ].join(' ')}
      >
        {value}
      </p>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </article>
  )
}