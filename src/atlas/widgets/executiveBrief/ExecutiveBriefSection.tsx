import type {
  ReactNode,
} from 'react'

interface ExecutiveBriefSectionProps {
  title: string
  description?: string
  count: number
  icon: ReactNode
  children: ReactNode
  className?: string
}

export function ExecutiveBriefSection({
  title,
  description,
  count,
  icon,
  children,
  className = '',
}: ExecutiveBriefSectionProps) {
  return (
    <section
      className={[
        'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm',
        className,
      ].join(' ')}
      data-atlas-component="executive-brief-section"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            {icon}
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-950">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {count}
        </span>
      </header>

      <div className="mt-4 space-y-3">
        {children}
      </div>
    </section>
  )
}
