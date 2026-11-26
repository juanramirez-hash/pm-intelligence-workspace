// MD-003: frame of every "Mi día" block: title, source line, warnings and
// the loading, empty and error states of that block only.

import type {
  ReactNode,
} from 'react'

import {
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

import {
  formatInteger,
} from '../format/myDayFormat'

export type MyDayBlockStatus = 'loading' | 'error' | 'empty' | 'ready'

interface MyDayBlockProps {
  title: string
  subtitle?: string
  // Source and date line, e.g. "Inventario al 24 nov 2026 · al corte".
  sourceLine?: string | null
  note?: string
  warnings?: Array<string | null | undefined>
  status: MyDayBlockStatus
  errorMessage?: string | null
  emptyMessage?: string | null
  onRetry?: () => void
  // Shown in every state below the warnings (for example, tabs).
  toolbar?: ReactNode
  footer?: ReactNode
  className?: string
  children?: ReactNode
}

export function MyDayBlock({
  title,
  subtitle,
  sourceLine,
  note,
  warnings = [],
  status,
  errorMessage,
  emptyMessage,
  onRetry,
  toolbar,
  footer,
  className = '',
  children,
}: MyDayBlockProps) {
  const visibleWarnings = warnings.filter((warning): warning is string => Boolean(warning))

  return (
    <section
      data-my-day-block={title}
      className={`flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-950">
            {title}
          </h2>

          {subtitle ? (
            <p className="text-sm font-medium text-slate-600">
              {subtitle}
            </p>
          ) : null}
        </div>

        {sourceLine ? (
          <p className="text-xs text-slate-500">
            {sourceLine}
          </p>
        ) : null}

        {note ? (
          <p className="text-xs text-slate-500">
            {note}
          </p>
        ) : null}
      </header>

      {visibleWarnings.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {visibleWarnings.map((warning) => (
            <li
              key={warning}
              data-my-day-warning="true"
              className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {toolbar ? (
        <div className="mt-4">
          {toolbar}
        </div>
      ) : null}

      <div className="mt-4 min-w-0 flex-1">
        {status === 'loading' ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Cargando…
          </p>
        ) : null}

        {status === 'error' ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-rose-700">
              {errorMessage ?? 'No se pudo cargar esta sección.'}
            </p>

            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw aria-hidden="true" size={12} />
                Reintentar
              </button>
            ) : null}
          </div>
        ) : null}

        {status === 'empty' ? (
          <p className="py-6 text-center text-sm text-slate-500">
            {emptyMessage ?? 'Sin datos para mostrar.'}
          </p>
        ) : null}

        {status === 'ready' ? children : null}
      </div>

      {footer && status !== 'loading' ? (
        <footer className="mt-4 border-t border-slate-100 pt-3 text-sm">
          {footer}
        </footer>
      ) : null}
    </section>
  )
}

/** Horizontal scroll on narrow screens. */
export function MyDayTable({
  children,
  minWidth = 'min-w-[640px]',
}: {
  children: ReactNode
  minWidth?: string
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className={`w-full ${minWidth} border-collapse text-left text-sm`}>
        {children}
      </table>
    </div>
  )
}

export const TH = 'whitespace-nowrap border-b border-slate-200 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500'
export const TD = 'whitespace-nowrap border-b border-slate-100 px-2 py-2 align-top text-slate-700'
export const TD_NUMBER = `${TD} text-right tabular-nums`

export function Pager({
  offset,
  limit,
  total,
  hasMore,
  onChange,
}: {
  offset: number
  limit: number
  total?: number | null
  hasMore: boolean
  onChange: (offset: number) => void
}) {
  const from = offset + 1
  const to = offset + limit

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
      <span>
        {typeof total === 'number'
          ? `${formatInteger(from)}–${formatInteger(Math.min(to, total))} de ${formatInteger(total)}`
          : `Desde ${formatInteger(from)}`}
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={offset === 0}
          onClick={() => onChange(Math.max(offset - limit, 0))}
          className="rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>

        <button
          type="button"
          disabled={!hasMore}
          onClick={() => onChange(offset + limit)}
          className="rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
