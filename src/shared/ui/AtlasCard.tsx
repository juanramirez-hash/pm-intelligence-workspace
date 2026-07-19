import type { ReactNode } from 'react'

type AtlasCardProps = {
  children: ReactNode
  className?: string
}

export function AtlasCard({
  children,
  className = '',
}: AtlasCardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  )
}