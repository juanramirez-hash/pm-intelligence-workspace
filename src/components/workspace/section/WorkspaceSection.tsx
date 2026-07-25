import type {
  LucideIcon,
} from 'lucide-react'

import type {
  PropsWithChildren,
  ReactNode,
} from 'react'

export type WorkspaceSectionTone =
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'

interface WorkspaceSectionProps
  extends PropsWithChildren {
  title: string

  subtitle?: string

  icon?: LucideIcon

  tone?: WorkspaceSectionTone

  actions?: ReactNode

  className?: string

  contentClassName?: string
}

const toneStyles:
  Record<
    WorkspaceSectionTone,
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

export function WorkspaceSection({
  title,
  subtitle,
  icon: Icon,
  tone = 'slate',
  actions,
  className = '',
  contentClassName = 'mt-5',
  children,
}: WorkspaceSectionProps) {
  return (
    <section
      className={[
        'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm',
        className,
      ].join(' ')}
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={[
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                toneStyles[tone],
              ].join(' ')}
            >
              <Icon size={19} />
            </div>
          )}

          <div>
            <h2 className="font-semibold text-slate-950">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="shrink-0">
            {actions}
          </div>
        )}
      </header>

      <div className={contentClassName}>
        {children}
      </div>
    </section>
  )
}