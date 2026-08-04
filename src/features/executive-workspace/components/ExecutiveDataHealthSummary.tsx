import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import type {
  ExecutiveWorkspaceHealth,
} from '../types/executiveWorkspaceTypes'

interface ExecutiveDataHealthSummaryProps {
  health:
    ExecutiveWorkspaceHealth
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return 'Sin sincronizaciones'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date)
}

function getImportStatusLabel(
  importStatus: string,
): string {
  switch (importStatus) {
    case 'completed':
      return 'Sistema listo para análisis'

    case 'processing':
      return 'Procesando información'

    case 'validating':
      return 'Validando información'

    case 'error':
      return 'Requiere atención'

    default:
      return 'Esperando información'
  }
}

export function ExecutiveDataHealthSummary({
  health,
}: ExecutiveDataHealthSummaryProps) {
  return (
    <section
      data-executive-component="data-health-summary"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Control de información
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Salud general de la plataforma
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Resumen ejecutivo; el detalle de cada fuente se administra en Data Center.
          </p>
        </div>

        <Link
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
          to="/data-center"
        >
          Abrir Data Center

          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 size={19} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Última sincronización
              </p>

              <p className="mt-1 text-base font-semibold text-slate-950">
                {formatDateTime(
                  health.lastImportedAt,
                )}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Database size={19} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Cobertura de datos
                </p>

                <p className="mt-1 text-base font-semibold text-slate-950">
                  {health.readyDatasets} de {health.totalDatasets} fuentes
                </p>
              </div>
            </div>

            <span className="text-2xl font-semibold text-slate-950">
              {health.coveragePercentage}%
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${health.coveragePercentage}%`,
              }}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={[
                'flex size-10 items-center justify-center rounded-xl',
                health.systemReady
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600',
              ].join(' ')}
            >
              <RefreshCw size={19} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Estado general
              </p>

              <p className="mt-1 text-base font-semibold text-slate-950">
                {getImportStatusLabel(
                  health.importStatus,
                )}
              </p>
            </div>
          </div>

          <div
            className={[
              'mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
              health.systemReady
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700',
            ].join(' ')}
          >
            {health.systemReady ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertTriangle size={14} />
            )}

            {health.systemReady
              ? 'Operación disponible'
              : 'Pendiente de información'}
          </div>
        </article>
      </div>
    </section>
  )
}
