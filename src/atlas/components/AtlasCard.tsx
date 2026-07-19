import type { HTMLAttributes, ReactNode } from 'react'

type AtlasCardProps = {
  children: ReactNode
  className?: string
} & HTMLAttributes<HTMLElement>

export function AtlasCard({
  children,
  className = '',
  ...props
}: AtlasCardProps) {
  return (
    <section
      className={[
        'rounded-2xl border border-slate-200 bg-white shadow-sm',
        'transition-shadow duration-200 hover:shadow-md',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </section>
  )
}