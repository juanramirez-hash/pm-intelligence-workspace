import type {
  ReactNode,
} from 'react'

interface WorkspaceToolbarProps {
  children: ReactNode

  actions?: ReactNode

  footer?: ReactNode

  className?: string

  contentClassName?: string
}

export function WorkspaceToolbar({
  children,
  actions,
  footer,
  className = '',
  contentClassName = '',
}: WorkspaceToolbarProps) {
  return (
    <section
      className={[
        'rounded-2xl border border-slate-200 bg-white shadow-sm',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between',
          contentClassName,
        ].join(' ')}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {children}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {footer && (
        <div className="border-t border-slate-100 px-5 py-3">
          {footer}
        </div>
      )}
    </section>
  )
}