import type { HTMLAttributes, ReactNode } from 'react'

export interface KpiInsightProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

export function KpiInsight({ children, className = '', ...props }: KpiInsightProps) {
  return (
    <p
      data-atlas-component="kpi-insight"
      className={['text-xs leading-5 text-slate-600', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </p>
  )
}
