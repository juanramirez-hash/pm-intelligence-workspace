import type {
  ReactNode,
} from 'react'

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CircleDashed,
  PackageSearch,
  RefreshCw,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import type {
  ExecutiveAttentionSummary,
  ExecutiveEntityAttentionSummary,
  ExecutivePeriodSelection,
} from '../types/executiveWorkspaceTypes'

import {
  buildExecutiveAttentionRoute,
} from '../navigation/executiveAttentionNavigation'

interface ExecutiveAttentionCenterProps {
  attention:
    ExecutiveAttentionSummary

  selection:
    ExecutivePeriodSelection
}

type AttentionTone =
  | 'amber'
  | 'emerald'
  | 'slate'

type MetricTone =
  | 'emerald'
  | 'rose'
  | 'blue'
  | 'violet'

interface AttentionMetric {
  label: string
  value: number
  icon: ReactNode
  tone: MetricTone
  wide?: boolean
}

interface AttentionCardProps {
  ariaLabel: string
  to: string
  title: string
  icon: ReactNode
  summary:
    ExecutiveEntityAttentionSummary
  description: string
  tone: AttentionTone
  metrics: readonly AttentionMetric[]
  selectionLabel: string
  comparisonLabel: string
}

function formatNumber(
  value: number,
): string {
  return value.toLocaleString('es-MX')
}

const CARD_TONE_CLASSES = {
  amber: {
    border: 'border-amber-200',
    icon: 'bg-amber-50 text-amber-600',
    badge: 'bg-amber-50 text-amber-700',
    hover: 'group-hover:text-amber-600',
  },
  emerald: {
    border: 'border-emerald-200',
    icon: 'bg-emerald-50 text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
    hover: 'group-hover:text-emerald-600',
  },
  slate: {
    border: 'border-slate-200',
    icon: 'bg-slate-100 text-slate-500',
    badge: 'bg-slate-100 text-slate-500',
    hover: 'group-hover:text-blue-600',
  },
} as const

const METRIC_TONE_CLASSES = {
  emerald: {
    container: 'bg-emerald-50/70',
    text: 'text-emerald-700',
  },
  rose: {
    container: 'bg-rose-50/70',
    text: 'text-rose-700',
  },
  blue: {
    container: 'bg-blue-50/70',
    text: 'text-blue-700',
  },
  violet: {
    container: 'bg-violet-50/70',
    text: 'text-violet-700',
  },
} as const

function AttentionCard({
  ariaLabel,
  to,
  title,
  icon,
  summary,
  description,
  tone,
  metrics,
  selectionLabel,
  comparisonLabel,
}: AttentionCardProps) {
  const classes =
    CARD_TONE_CLASSES[tone]

  const hasData =
    summary.totalAnalyzed > 0

  return (
    <Link
      aria-label={ariaLabel}
      className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      to={to}
    >
      <article
        className={[
          'group h-full rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
          classes.border,
        ].join(' ')}
      >
        <div className="flex items-start justify-between">
          <div
            className={[
              'flex size-11 items-center justify-center rounded-xl',
              classes.icon,
            ].join(' ')}
          >
            {icon}
          </div>

          <ArrowRight
            className={[
              'text-slate-300 transition group-hover:translate-x-1',
              classes.hover,
            ].join(' ')}
            size={19}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          {hasData ? (
            <span
              className={[
                'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                classes.badge,
              ].join(' ')}
            >
              Análisis activo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              <CircleDashed size={12} />

              Sin datos
            </span>
          )}
        </div>

        <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          {hasData
            ? formatNumber(
                summary.entitiesRequiringAttention,
              )
            : 'Pendiente'}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {hasData
            ? description
            : 'Esperando información mensual comparable'}
        </p>

        {hasData && (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-slate-500">
                Universo analizado
              </span>

              <span className="font-semibold text-slate-950">
                {formatNumber(
                  summary.totalAnalyzed,
                )}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              {selectionLabel} vs. {comparisonLabel}
            </p>
          </div>
        )}

        {hasData && (
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
            {metrics.map(
              (metric) => {
                const metricClasses =
                  METRIC_TONE_CLASSES[
                    metric.tone
                  ]

                return (
                  <div
                    className={[
                      'rounded-xl p-3',
                      metricClasses.container,
                      metric.wide
                        ? 'col-span-2'
                        : '',
                    ].join(' ')}
                    key={metric.label}
                  >
                    <div
                      className={[
                        'flex items-center gap-1.5 text-xs font-medium',
                        metricClasses.text,
                        metric.wide
                          ? 'justify-between'
                          : '',
                      ].join(' ')}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {metric.icon}

                        {metric.label}
                      </span>

                      {metric.wide && (
                        <span className="text-lg font-semibold text-slate-950">
                          {formatNumber(
                            metric.value,
                          )}
                        </span>
                      )}
                    </div>

                    {!metric.wide && (
                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {formatNumber(
                          metric.value,
                        )}
                      </p>
                    )}
                  </div>
                )
              },
            )}
          </div>
        )}
      </article>
    </Link>
  )
}

export function ExecutiveAttentionCenter({
  attention,
  selection,
}: ExecutiveAttentionCenterProps) {
  const productTone:
    AttentionTone =
    attention.products.totalAnalyzed === 0
      ? 'slate'
      : attention.products
          .entitiesRequiringAttention > 0
        ? 'amber'
        : 'emerald'

  const brandTone:
    AttentionTone =
    attention.brands.totalAnalyzed === 0
      ? 'slate'
      : attention.brands
          .entitiesRequiringAttention > 0
        ? 'amber'
        : 'emerald'

  const customerTone:
    AttentionTone =
    attention.customers.totalAnalyzed === 0
      ? 'slate'
      : attention.customers
          .entitiesRequiringAttention > 0
        ? 'amber'
        : 'emerald'

  return (
    <section
      data-executive-component="attention-center"
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
          Centro de atención
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Prioridades que requieren revisión
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Productos, marcas y clientes evaluados exclusivamente dentro del periodo seleccionado.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AttentionCard
          ariaLabel="Abrir productos que requieren atención"
          comparisonLabel={
            selection.comparisonLabel
          }
          description="productos requieren atención"
          icon={<PackageSearch size={21} />}
          metrics={[
            {
              label: 'En crecimiento',
              value:
                attention.products
                  .growingEntities,
              icon: <ArrowUpRight size={14} />,
              tone: 'emerald',
            },
            {
              label: 'En caída',
              value:
                attention.products
                  .decliningEntities,
              icon: <ArrowDownRight size={14} />,
              tone: 'rose',
            },
            {
              label: 'Recuperados',
              value:
                attention.products
                  .recoveredEntities,
              icon: <RefreshCw size={14} />,
              tone: 'blue',
            },
            {
              label: 'Nuevos',
              value:
                attention.products
                  .newEntities,
              icon: <PackageSearch size={14} />,
              tone: 'violet',
            },
            {
              label: 'Inactivos o perdidos',
              value:
                attention.products
                  .inactiveOrLostEntities,
              icon: <AlertTriangle size={14} />,
              tone: 'rose',
              wide: true,
            },
          ]}
          selectionLabel={
            selection.currentLabel
          }
          summary={attention.products}
          title="Productos"
          to={buildExecutiveAttentionRoute(
            'products',
            selection,
          )}
          tone={productTone}
        />

        <AttentionCard
          ariaLabel="Abrir marcas que requieren atención"
          comparisonLabel={
            selection.comparisonLabel
          }
          description="marcas requieren atención"
          icon={<Building2 size={21} />}
          metrics={[
            {
              label: 'En crecimiento',
              value:
                attention.brands
                  .growingEntities,
              icon: <ArrowUpRight size={14} />,
              tone: 'emerald',
            },
            {
              label: 'En caída',
              value:
                attention.brands
                  .decliningEntities,
              icon: <ArrowDownRight size={14} />,
              tone: 'rose',
            },
            {
              label: 'Recuperadas',
              value:
                attention.brands
                  .recoveredEntities,
              icon: <RefreshCw size={14} />,
              tone: 'blue',
            },
            {
              label: 'Nuevas',
              value:
                attention.brands
                  .newEntities,
              icon: <Building2 size={14} />,
              tone: 'violet',
            },
            {
              label: 'Inactivas o perdidas',
              value:
                attention.brands
                  .inactiveOrLostEntities,
              icon: <AlertTriangle size={14} />,
              tone: 'rose',
              wide: true,
            },
          ]}
          selectionLabel={
            selection.currentLabel
          }
          summary={attention.brands}
          title="Marcas"
          to={buildExecutiveAttentionRoute(
            'brands',
            selection,
          )}
          tone={brandTone}
        />

        <AttentionCard
          ariaLabel="Abrir clientes que requieren atención"
          comparisonLabel={
            selection.comparisonLabel
          }
          description="clientes requieren atención"
          icon={<Users size={21} />}
          metrics={[
            {
              label: 'En crecimiento',
              value:
                attention.customers
                  .growingEntities,
              icon: <ArrowUpRight size={14} />,
              tone: 'emerald',
            },
            {
              label: 'En caída',
              value:
                attention.customers
                  .decliningEntities,
              icon: <ArrowDownRight size={14} />,
              tone: 'rose',
            },
            {
              label: 'Recuperados',
              value:
                attention.customers
                  .recoveredEntities,
              icon: <UserCheck size={14} />,
              tone: 'blue',
            },
            {
              label: 'Nuevos',
              value:
                attention.customers
                  .newEntities,
              icon: <UserPlus size={14} />,
              tone: 'violet',
            },
            {
              label: 'Inactivos o perdidos',
              value:
                attention.customers
                  .inactiveOrLostEntities,
              icon: <UserMinus size={14} />,
              tone: 'rose',
              wide: true,
            },
          ]}
          selectionLabel={
            selection.currentLabel
          }
          summary={attention.customers}
          title="Clientes"
          to={buildExecutiveAttentionRoute(
            'customers',
            selection,
          )}
          tone={customerTone}
        />
      </div>
    </section>
  )
}
