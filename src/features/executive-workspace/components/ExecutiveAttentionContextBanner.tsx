import {
  ArrowLeft,
  Filter,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import type {
  ExecutivePeriodSelection,
} from '../types/executiveWorkspaceTypes'

interface ExecutiveAttentionContextBannerProps {
  basePath: string
  entityLabel: string
  resultCount: number
  selection:
    ExecutivePeriodSelection
}

function formatNumber(
  value: number,
): string {
  return value.toLocaleString('es-MX')
}

export function ExecutiveAttentionContextBanner({
  basePath,
  entityLabel,
  resultCount,
  selection,
}: ExecutiveAttentionContextBannerProps) {
  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
            <Filter size={18} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
              Filtro del Executive Workspace
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {formatNumber(resultCount)} {entityLabel} requieren atención
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {selection.currentLabel} vs. {selection.comparisonLabel}. Sólo se muestran entidades en caída, inactivas o perdidas para este corte.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
            to="/"
          >
            <ArrowLeft size={15} />
            Volver al Executive
          </Link>

          <Link
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            to={basePath}
          >
            Ver directorio completo
          </Link>
        </div>
      </div>
    </section>
  )
}
