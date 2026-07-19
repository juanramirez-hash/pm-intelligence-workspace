import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
      <div>
        {eyebrow && (
          <p className="text-sm font-semibold text-blue-600">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  )
}