import type { HTMLAttributes } from 'react'

export type KpiStatus =
  | 'neutral'
  | 'intelligence'
  | 'positive'
  | 'attention'
  | 'critical'

export interface KpiStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: KpiStatus
  label: string
}

const statusClasses: Record<KpiStatus, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  intelligence: 'bg-violet-100 text-violet-700',
  positive: 'bg-emerald-100 text-emerald-700',
  attention: 'bg-amber-100 text-amber-800',
  critical: 'bg-rose-100 text-rose-700',
}

export function KpiStatusBadge({ status, label, className = '', ...props }: KpiStatusBadgeProps) {
  return (
    <span
      data-atlas-component="kpi-status-badge"
      data-status={status}
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none',
        statusClasses[status],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {label}
    </span>
  )
}
