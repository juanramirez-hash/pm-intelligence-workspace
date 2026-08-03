import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Database,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react'

import {
  mapDatasetHealth,
} from './adapters/datasetHealthAdapter'

import type {
  DatasetHealthStatus,
} from './adapters/datasetHealthAdapter'

import {
  ExecutiveAttentionCenter,
} from './components/ExecutiveAttentionCenter'

import {
  ExecutiveSalesPerformance,
} from './components/ExecutiveSalesPerformance'

import {
  ExecutiveDomainReadinessPanel,
} from './components/ExecutiveDomainReadinessPanel'

import {
  useExecutiveWorkspace,
} from './hooks/useExecutiveWorkspace'

import {
  ExecutiveBrandOverview,
} from './components/ExecutiveBrandOverview'

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return 'Sin sincronizaciones'
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
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

function DatasetStatusIcon({
  status,
}: {
  status: DatasetHealthStatus
}) {
  if (status === 'ready') {
    return (
      <CheckCircle2
        className="text-emerald-600"
        size={15}
        strokeWidth={2.2}
      />
    )
  }

  if (status === 'warning') {
    return (
      <AlertTriangle
        className="text-amber-600"
        size={15}
        strokeWidth={2.2}
      />
    )
  }

  return (
    <CircleDashed
      className="text-slate-400"
      size={15}
      strokeWidth={2.2}
    />
  )
}

function getDatasetStatusClasses(
  status: DatasetHealthStatus,
) {
  if (status === 'ready') {
    return {
      card:
        'border-emerald-200 bg-emerald-50/40 before:bg-emerald-500',

      icon:
        'bg-emerald-100 text-emerald-700',

      badge:
        'bg-emerald-100 text-emerald-700',
    }
  }

  if (status === 'warning') {
    return {
      card:
        'border-amber-200 bg-amber-50/40 before:bg-amber-500',

      icon:
        'bg-amber-100 text-amber-700',

      badge:
        'bg-amber-100 text-amber-700',
    }
  }

  return {
    card:
      'border-slate-200 bg-white before:bg-slate-300',

    icon:
      'bg-slate-100 text-slate-500',

    badge:
      'bg-slate-100 text-slate-500',
  }
}

export function ExecutiveWorkspacePage() {
  const executive =
    useExecutiveWorkspace()

  const datasets =
    mapDatasetHealth(
      executive.datasets,
    )

  const {
    readyDatasets,
    totalDatasets,
    coveragePercentage,
    systemReady,
    importStatus,
    lastImportedAt,
  } = executive.health

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <TrendingUp size={14} />

            Inteligencia ejecutiva
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Executive Workspace
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Estado comercial, tendencias,
            prioridades y acciones
            recomendadas para la toma de
            decisiones.
          </p>
        </div>

        <div
          className={[
            'inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm',

            systemReady
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700',
          ].join(' ')}
        >
          {systemReady ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertTriangle size={17} />
          )}

          {getImportStatusLabel(
            importStatus,
          )}
        </div>
      </section>

      <ExecutiveSalesPerformance
        revenue={
          executive.metrics?.revenue ??
          null
        }
      />

      {executive.domains && (
        <ExecutiveDomainReadinessPanel
          domains={executive.domains}
          health={executive.health}
        />
      )}

      <ExecutiveAttentionCenter
        customers={
          executive.customers
        }
        brands={
          executive.brands
        }
      />

      <ExecutiveBrandOverview
         brands={
            executive.brands
        }
      />

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Tendencias
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Evolución y concentración de
            ventas
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <div className="max-w-md px-6 text-center">
              <TrendingUp
                className="mx-auto text-slate-300"
                size={38}
              />

              <h3 className="mt-4 text-base font-semibold text-slate-800">
                Ventas por mes
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Esta área mostrará la
                tendencia mensual cuando
                conectemos el Business Model
                al Workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">


          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <div className="text-center">
                <Users
                  className="mx-auto text-slate-300"
                  size={34}
                />

                <h3 className="mt-4 font-semibold text-slate-800">
                  Top 10 clientes
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Ranking de clientes por
                  venta acumulada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Estado de información
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Disponibilidad y salud de los
              datos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Estado de sincronización,
              cobertura y disponibilidad de
              las fuentes del Workspace.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            <Database size={14} />

            {readyDatasets} fuentes
            operativas
          </div>
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
                    lastImportedAt,
                  )}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Fecha de la última carga
              registrada en el Data Center.
            </p>
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
                    {readyDatasets} de{' '}
                    {totalDatasets}{' '}
                    datasets
                  </p>
                </div>
              </div>

              <span className="text-2xl font-semibold text-slate-950">
                {coveragePercentage}%
              </span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{
                  width:
                    `${coveragePercentage}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Porcentaje de fuentes
              disponibles para análisis.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={[
                  'flex size-10 items-center justify-center rounded-xl',

                  systemReady
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
                    importStatus,
                  )}
                </p>
              </div>
            </div>

            <div
              className={[
                'mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',

                systemReady
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700',
              ].join(' ')}
            >
              {systemReady ? (
                <CheckCircle2
                  size={14}
                />
              ) : (
                <AlertTriangle
                  size={14}
                />
              )}

              {systemReady
                ? 'Operación disponible'
                : 'Pendiente de información'}
            </div>
          </article>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {datasets.map(
            (dataset) => {
              const Icon =
                dataset.icon

              const classes =
                getDatasetStatusClasses(
                  dataset.status,
                )

              return (
                <article
                  key={dataset.id}
                  className={[
                    'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition before:absolute before:inset-y-0 before:left-0 before:w-1 hover:-translate-y-0.5 hover:shadow-md',

                    classes.card,
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={[
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',

                        classes.icon,
                      ].join(' ')}
                    >
                      <Icon
                        size={20}
                        strokeWidth={2}
                      />
                    </div>

                    <div
                      className={[
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',

                        classes.badge,
                      ].join(' ')}
                    >
                      <DatasetStatusIcon
                        status={
                          dataset.status
                        }
                      />

                      {
                        dataset.statusLabel
                      }
                    </div>
                  </div>

                  <h3 className="mt-5 text-base font-semibold text-slate-950">
                    {dataset.name}
                  </h3>

                  <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">
                    {
                      dataset.description
                    }
                  </p>

                  <div className="mt-4 border-t border-slate-200/80 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Última actualización
                    </p>

                    <p className="mt-1 text-xs font-medium leading-5 text-slate-700">
                      {
                        dataset.updatedAt
                      }
                    </p>
                  </div>
                </article>
              )
            },
          )}
        </div>
      </section>
    </div>
  )
}