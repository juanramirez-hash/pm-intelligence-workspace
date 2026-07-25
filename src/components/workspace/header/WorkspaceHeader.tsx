import type {
  LucideIcon,
} from 'lucide-react'

import type {
  ReactNode,
} from 'react'

export type WorkspaceHeaderTone =
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'

interface WorkspaceHeaderProps {
  eyebrow: string

  title: string

  description: string

  icon: LucideIcon

  connected: boolean

  connectedLabel?: string

  disconnectedLabel?: string

  tone?: WorkspaceHeaderTone

  metadata?: ReactNode

  actions?: ReactNode

  className?: string
}

const toneStyles:
  Record<
    WorkspaceHeaderTone,
    string
  > = {
    violet:
      'text-violet-600',

    blue:
      'text-blue-600',

    emerald:
      'text-emerald-600',

    amber:
      'text-amber-600',

    rose:
      'text-rose-600',

    slate:
      'text-slate-600',
  }

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  connected,
  connectedLabel =
    'Workspace conectado',
  disconnectedLabel =
    'Workspace no disponible',
  tone = 'violet',
  metadata,
  actions,
  className = '',
}: WorkspaceHeaderProps) {
  return (
    <header
      className={[
        'rounded-3xl border border-slate-200 bg-white p-7 shadow-sm',
        className,
      ].join(' ')}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div
            className={[
              'flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]',
              toneStyles[tone],
            ].join(' ')}
          >
            <Icon size={15} />

            {eyebrow}
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            {description}
          </p>

          {metadata && (
            <div className="mt-3">
              {metadata}
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <div
            className={[
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',

              connected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-100 text-slate-500',
            ].join(' ')}
          >
            <span
              className={[
                'size-2 rounded-full',

                connected
                  ? 'bg-emerald-500'
                  : 'bg-slate-400',
              ].join(' ')}
            />

            {connected
              ? connectedLabel
              : disconnectedLabel}
          </div>

          {actions}
        </div>
      </div>
    </header>
  )
}