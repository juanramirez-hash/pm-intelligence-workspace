import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListTodo,
  RefreshCcw,
  Target,
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AtlasCard,
} from '../../../atlas/components/AtlasCard'

import {
  PageHeader,
} from '../../../atlas/layout/PageHeader'

type ActionStatus =
  | 'open'
  | 'in_progress'
  | 'blocked'
  | 'done'
  | 'cancelled'
  | 'auto_resolved'

type ActionHorizon =
  | 'immediate'
  | 'short'
  | 'medium'

type ActionPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

interface ActionRow {
  id: number
  brand_id: string
  brand_key: string
  period_id: string
  title: string
  description: string | null
  horizon: ActionHorizon
  priority: ActionPriority
  status: ActionStatus
  due_date: string
  owner_user_id: number
  owner_name: string
  owner_email: string | null
  metric_kind:
    | 'revenue'
    | 'gross_profit'
    | 'gross_margin'
    | 'units'
    | 'none'
  baseline_value: string | number | null
  target_value: string | number | null
  result_value: string | number | null
  origin: 'rule' | 'manual' | 'f2f'
  origin_rule_code: string | null
  origin_entity_type:
    | 'customer'
    | 'product'
    | 'brand'
    | 'project'
    | null
  origin_entity_id: string | null
  evidence: Record<string, unknown>
  created_at: string
  updated_at: string
  closed_at: string | null
  days_overdue: number
  days_remaining: number
  is_overdue: boolean
  horizon_rank: number
  priority_rank: number
  comment_count: string | number
}

interface ActionSummary {
  total: string | number
  overdue: string | number
  immediate_open: string | number
}

interface ActionsResponse {
  ok: boolean
  rows: ActionRow[]
  summary: ActionSummary
  limit: number
  offset: number
}

interface ScorecardRow {
  owner_user_id: number
  owner_name: string
  owner_email: string | null
  period_id: string
  total_actions: string | number
  completed: string | number
  cancelled: string | number
  auto_resolved: string | number
  still_open: string | number
  overdue: string | number
  completed_on_time: string | number
  completion_rate: string | number | null
  avg_days_to_close: string | number | null
  revenue_committed: string | number | null
  revenue_realized: string | number | null
  immediate_actions: string | number
  short_term_actions: string | number
  medium_term_actions: string | number
}

interface ScorecardResponse {
  ok: boolean
  rows: ScorecardRow[]
}

function currentPeriod(): string {
  const now = new Date()

  return [
    now.getFullYear(),
    String(
      now.getMonth() + 1,
    ).padStart(2, '0'),
  ].join('-')
}

function numericValue(
  value: string | number | null | undefined,
): number {
  const parsed = Number(value ?? 0)

  return Number.isFinite(parsed)
    ? parsed
    : 0
}

function formatCurrency(
  value: string | number | null | undefined,
): string {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    },
  ).format(
    numericValue(value),
  )
}

function formatPercent(
  value: string | number | null | undefined,
): string {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'percent',
      maximumFractionDigits: 1,
    },
  ).format(
    numericValue(value),
  )
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return '—'
  }

  const date =
    new Date(`${value}T12:00:00`)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'medium',
    },
  ).format(date)
}

function statusLabel(
  status: ActionStatus,
): string {
  const labels:
    Record<ActionStatus, string> = {
      open: 'Abierta',
      in_progress: 'En progreso',
      blocked: 'Bloqueada',
      done: 'Completada',
      cancelled: 'Cancelada',
      auto_resolved:
        'Resuelta automáticamente',
    }

  return labels[status]
}

function horizonLabel(
  horizon: ActionHorizon,
): string {
  const labels:
    Record<ActionHorizon, string> = {
      immediate: 'Inmediata',
      short: 'Corto plazo',
      medium: 'Mediano plazo',
    }

  return labels[horizon]
}

function priorityLabel(
  priority: ActionPriority,
): string {
  const labels:
    Record<ActionPriority, string> = {
      critical: 'Crítica',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
    }

  return labels[priority]
}

function statusClass(
  status: ActionStatus,
): string {
  if (status === 'done') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (status === 'blocked') {
    return 'bg-red-50 text-red-700'
  }

  if (
    status === 'cancelled' ||
    status === 'auto_resolved'
  ) {
    return 'bg-slate-100 text-slate-600'
  }

  if (status === 'in_progress') {
    return 'bg-blue-50 text-blue-700'
  }

  return 'bg-amber-50 text-amber-700'
}

function priorityClass(
  priority: ActionPriority,
): string {
  if (priority === 'critical') {
    return 'bg-red-50 text-red-700'
  }

  if (priority === 'high') {
    return 'bg-orange-50 text-orange-700'
  }

  if (priority === 'low') {
    return 'bg-slate-100 text-slate-600'
  }

  return 'bg-amber-50 text-amber-700'
}

export function ActionsWorkspacePage() {
  const [
    period,
    setPeriod,
  ] =
    useState(
      currentPeriod(),
    )

  const [
    rows,
    setRows,
  ] =
    useState<ActionRow[]>([])

  const [
    summary,
    setSummary,
  ] =
    useState<ActionSummary>({
      total: 0,
      overdue: 0,
      immediate_open: 0,
    })

  const [
    scorecard,
    setScorecard,
  ] =
    useState<
      ScorecardRow[]
    >([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true)
          setError(null)

          const query =
            new URLSearchParams({
              period,
              limit: '100',
            })

          const [
            actionsResponse,
            scorecardResponse,
          ] =
            await Promise.all([
              fetch(
                `/api/actions?${query.toString()}`,
                {
                  credentials:
                    'include',
                },
              ),
              fetch(
                `/api/actions/scorecard?period=${encodeURIComponent(period)}`,
                {
                  credentials:
                    'include',
                },
              ),
            ])

          if (
            !actionsResponse.ok
          ) {
            throw new Error(
              `Actions respondió ${actionsResponse.status}`,
            )
          }

          if (
            !scorecardResponse.ok
          ) {
            throw new Error(
              `Scorecard respondió ${scorecardResponse.status}`,
            )
          }

          const actionsData =
            await actionsResponse.json() as ActionsResponse

          const scorecardData =
            await scorecardResponse.json() as ScorecardResponse

          if (
            !actionsData.ok ||
            !scorecardData.ok
          ) {
            throw new Error(
              'La API devolvió una respuesta inválida.',
            )
          }

          setRows(
            actionsData.rows ?? [],
          )

          setSummary(
            actionsData.summary ?? {
              total: 0,
              overdue: 0,
              immediate_open: 0,
            },
          )

          setScorecard(
            scorecardData.rows ?? [],
          )
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar el Centro de Acciones.',
          )
        } finally {
          setLoading(false)
        }
      },
      [period],
    )

  useEffect(() => {
    void loadData()
  }, [loadData])

  const scorecardTotals =
    useMemo(
      () =>
        scorecard.reduce(
          (
            totals,
            row,
          ) => ({
            completed:
              totals.completed +
              numericValue(
                row.completed,
              ),
            stillOpen:
              totals.stillOpen +
              numericValue(
                row.still_open,
              ),
            revenueCommitted:
              totals.revenueCommitted +
              numericValue(
                row.revenue_committed,
              ),
            revenueRealized:
              totals.revenueRealized +
              numericValue(
                row.revenue_realized,
              ),
          }),
          {
            completed: 0,
            stillOpen: 0,
            revenueCommitted: 0,
            revenueRealized: 0,
          },
        ),
      [scorecard],
    )

  const cards = [
    {
      label:
        'Acciones del periodo',
      value:
        numericValue(
          summary.total,
        ),
      icon: ListTodo,
    },
    {
      label:
        'Inmediatas abiertas',
      value:
        numericValue(
          summary.immediate_open,
        ),
      icon: Clock3,
    },
    {
      label:
        'Vencidas',
      value:
        numericValue(
          summary.overdue,
        ),
      icon: AlertTriangle,
    },
    {
      label:
        'Completadas',
      value:
        scorecardTotals.completed,
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Execution Management"
        title="Centro de Acciones"
        description="Seguimiento operativo de compromisos comerciales, responsables, prioridades, fechas límite y cumplimiento."
      />

      <AtlasCard className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label
              htmlFor="actions-period"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Periodo
            </label>

            <input
              id="actions-period"
              type="month"
              value={period}
              onChange={(
                event,
              ) =>
                setPeriod(
                  event.target
                    .value,
                )
              }
              className="mt-2 block rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              void loadData()
            }
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              size={17}
            />

            {loading
              ? 'Actualizando...'
              : 'Actualizar'}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
      </AtlasCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(
          ({
            label,
            value,
            icon: Icon,
          }) => (
            <AtlasCard
              key={label}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                    {value}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                  <Icon
                    size={20}
                  />
                </div>
              </div>
            </AtlasCard>
          ),
        )}
      </div>

      <AtlasCard className="overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <Target
              size={20}
              className="text-blue-700"
            />

            <div>
              <p className="text-lg font-semibold text-slate-900">
                Cola de acciones
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {rows.length}{' '}
                acciones visibles según tu alcance de marcas.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Cargando acciones...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No existen acciones para este periodo.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              El backend está disponible; todavía no se han registrado acciones.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Acción',
                    'Marca',
                    'Responsable',
                    'Horizonte',
                    'Prioridad',
                    'Estado',
                    'Vencimiento',
                    'Comentarios',
                  ].map(
                    (heading) => (
                      <th
                        key={
                          heading
                        }
                        className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map(
                  (action) => (
                    <tr
                      key={
                        action.id
                      }
                      className="hover:bg-slate-50"
                    >
                      <td className="min-w-72 px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            action.title
                          }
                        </p>

                        {action.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {
                              action.description
                            }
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                        {
                          action.brand_id
                        }
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">
                          {
                            action.owner_name
                          }
                        </p>

                        {action.owner_email && (
                          <p className="mt-1 text-xs text-slate-400">
                            {
                              action.owner_email
                            }
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {horizonLabel(
                          action.horizon,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                            priorityClass(
                              action.priority,
                            ),
                          ].join(
                            ' ',
                          )}
                        >
                          {priorityLabel(
                            action.priority,
                          )}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                            statusClass(
                              action.status,
                            ),
                          ].join(
                            ' ',
                          )}
                        >
                          {statusLabel(
                            action.status,
                          )}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <p
                          className={[
                            'text-sm font-medium',
                            action.is_overdue
                              ? 'text-red-700'
                              : 'text-slate-700',
                          ].join(
                            ' ',
                          )}
                        >
                          {formatDate(
                            action.due_date,
                          )}
                        </p>

                        {action.is_overdue && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            {
                              action.days_overdue
                            }{' '}
                            días vencida
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold text-slate-700">
                        {numericValue(
                          action.comment_count,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </AtlasCard>

      <AtlasCard className="overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <p className="text-lg font-semibold text-slate-900">
            Cumplimiento por responsable
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Scorecard mensual para seguimiento F2F.
          </p>
        </div>

        {scorecard.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No hay datos de cumplimiento para el periodo seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Responsable',
                    'Total',
                    'Completadas',
                    'Abiertas',
                    'Vencidas',
                    'Cumplimiento',
                    'Días cierre',
                    'Revenue comprometido',
                    'Revenue realizado',
                  ].map(
                    (heading) => (
                      <th
                        key={
                          heading
                        }
                        className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {scorecard.map(
                  (row) => (
                    <tr
                      key={`${row.owner_user_id}-${row.period_id}`}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            row.owner_name
                          }
                        </p>

                        {row.owner_email && (
                          <p className="mt-1 text-xs text-slate-400">
                            {
                              row.owner_email
                            }
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {numericValue(
                          row.total_actions,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-emerald-700">
                        {numericValue(
                          row.completed,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {numericValue(
                          row.still_open,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-red-700">
                        {numericValue(
                          row.overdue,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {formatPercent(
                          row.completion_rate,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {numericValue(
                          row.avg_days_to_close,
                        ).toFixed(1)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                        {formatCurrency(
                          row.revenue_committed,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(
                          row.revenue_realized,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </AtlasCard>

      {scorecard.length > 0 && (
        <AtlasCard className="p-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Completadas
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {
                  scorecardTotals.completed
                }
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Aún abiertas
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {
                  scorecardTotals.stillOpen
                }
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Revenue comprometido
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {formatCurrency(
                  scorecardTotals.revenueCommitted,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Revenue realizado
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {formatCurrency(
                  scorecardTotals.revenueRealized,
                )}
              </p>
            </div>
          </div>
        </AtlasCard>
      )}
    </div>
  )
}