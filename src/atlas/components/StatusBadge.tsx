import type { ReactNode } from 'react'

type StatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

type StatusBadgeProps = {
  children: ReactNode
  tone?: StatusTone
}

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1',
        'text-xs font-semibold',
        toneClasses[tone],
      ].join(' ')}
    >
      {children}
    </span>
  )
}