import type { HTMLAttributes, ReactNode } from 'react'

export interface KpiFooterProps extends HTMLAttributes<HTMLDivElement> {
  source?: ReactNode
  context?: ReactNode
}

export function KpiFooter({ source, context, className = '', ...props }: KpiFooterProps) {
  if (!source && !context) return null

  return (
    <div
      data-atlas-component="kpi-footer"
      className={[
        'mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3 text-[11px] text-slate-500',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {context && <span>{context}</span>}
      {source && <span className="font-medium text-slate-600">{source}</span>}
    </div>
  )
}
