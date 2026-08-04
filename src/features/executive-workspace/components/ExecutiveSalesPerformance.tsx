import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Gauge,
  Minus,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import type {
  ExecutiveComparisonMetric,
  ExecutiveSalesPeriodPerformance,
} from '../types/executiveWorkspaceTypes'

type PerformanceLevel =
  | 'excellent'
  | 'good'
  | 'stable'
  | 'attention'
  | 'critical'
  | 'unavailable'

interface PerformanceStatus {
  label: string
  description: string
  badgeClasses: string
  valueClasses: string
  iconClasses: string
  barClasses: string
  cardClasses: string
}

interface ExecutiveSalesPerformanceProps {
  performance:
    ExecutiveSalesPeriodPerformance

  periodBadge: string
}

const currencyFormatter =
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })

const compactCurrencyFormatter =
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })

const percentageFormatter =
  new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

function formatCurrency(
  value: number | null,
): string {
  return value === null
    ? '—'
    : currencyFormatter.format(value)
}

function formatCompactCurrency(
  value: number | null,
): string {
  return value === null
    ? '—'
    : compactCurrencyFormatter.format(
        value,
      )
}

function formatPercentage(
  value: number | null,
): string {
  if (value === null) {
    return 'Sin comparación'
  }

  const prefix = value > 0 ? '+' : ''

  return `${prefix}${percentageFormatter.format(value)}%`
}

function getPerformanceStatus(
  value: number | null,
): PerformanceStatus {
  if (value === null) {
    return {
      label: 'Sin comparación',
      description:
        'No existe una ventana comparable completa.',
      badgeClasses:
        'border-slate-200 bg-slate-100 text-slate-600',
      valueClasses: 'text-slate-500',
      iconClasses:
        'bg-slate-100 text-slate-500',
      barClasses: 'bg-slate-300',
      cardClasses:
        'border-slate-200 bg-white',
    }
  }

  let level: PerformanceLevel

  if (value > 10) {
    level = 'excellent'
  } else if (value >= 3) {
    level = 'good'
  } else if (value > -3) {
    level = 'stable'
  } else if (value >= -10) {
    level = 'attention'
  } else {
    level = 'critical'
  }

  const statuses:
    Record<
      Exclude<PerformanceLevel, 'unavailable'>,
      PerformanceStatus
    > = {
      excellent: {
        label: 'Excelente',
        description:
          'Crecimiento sobresaliente frente al periodo comparable.',
        badgeClasses:
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        valueClasses: 'text-emerald-600',
        iconClasses:
          'bg-emerald-100 text-emerald-700',
        barClasses: 'bg-emerald-500',
        cardClasses:
          'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50',
      },
      good: {
        label: 'Buen desempeño',
        description:
          'Crecimiento positivo frente al periodo comparable.',
        badgeClasses:
          'border-blue-200 bg-blue-50 text-blue-700',
        valueClasses: 'text-blue-600',
        iconClasses:
          'bg-blue-100 text-blue-700',
        barClasses: 'bg-blue-500',
        cardClasses:
          'border-blue-200 bg-gradient-to-br from-white to-blue-50/50',
      },
      stable: {
        label: 'Estable',
        description:
          'Comportamiento sin una variación relevante.',
        badgeClasses:
          'border-amber-200 bg-amber-50 text-amber-700',
        valueClasses: 'text-amber-600',
        iconClasses:
          'bg-amber-100 text-amber-700',
        barClasses: 'bg-amber-400',
        cardClasses:
          'border-amber-200 bg-gradient-to-br from-white to-amber-50/40',
      },
      attention: {
        label: 'Atención',
        description:
          'Caída moderada que requiere seguimiento comercial.',
        badgeClasses:
          'border-orange-200 bg-orange-50 text-orange-700',
        valueClasses: 'text-orange-600',
        iconClasses:
          'bg-orange-100 text-orange-700',
        barClasses: 'bg-orange-500',
        cardClasses:
          'border-orange-200 bg-gradient-to-br from-white to-orange-50/50',
      },
      critical: {
        label: 'Crítico',
        description:
          'Caída relevante que requiere análisis y acciones correctivas.',
        badgeClasses:
          'border-rose-200 bg-rose-50 text-rose-700',
        valueClasses: 'text-rose-600',
        iconClasses:
          'bg-rose-100 text-rose-700',
        barClasses: 'bg-rose-500',
        cardClasses:
          'border-rose-200 bg-gradient-to-br from-white to-rose-50/50',
      },
    }

  return statuses[level]
}

function VariationIcon({
  value,
  size = 22,
}: {
  value: number | null
  size?: number
}) {
  if (value === null || value === 0) {
    return <Minus size={size} />
  }

  return value > 0
    ? <ArrowUpRight size={size} />
    : <ArrowDownRight size={size} />
}

function ComparisonCard({
  title,
  badge,
  metric,
  comparisonLabel,
}: {
  title: string
  badge: string
  metric: ExecutiveComparisonMetric
  comparisonLabel: string
}) {
  const status =
    getPerformanceStatus(
      metric.variationPercentage,
    )

  const intensity =
    metric.variationPercentage === null
      ? 0
      : Math.min(
          Math.max(
            Math.abs(
              metric.variationPercentage,
            ) * 2.5,
            8,
          ),
          100,
        )

  return (
    <article
      className={[
        'relative overflow-hidden rounded-3xl border p-6 shadow-sm',
        status.cardClasses,
      ].join(' ')}
    >
      <div
        className={[
          'absolute inset-x-0 top-0 h-1',
          status.barClasses,
        ].join(' ')}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            'flex size-12 items-center justify-center rounded-2xl',
            status.iconClasses,
          ].join(' ')}
        >
          <VariationIcon
            value={metric.variationPercentage}
          />
        </div>

        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-500">
          {badge}
        </span>
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        Variación comercial
      </p>

      <h3 className="mt-1 text-sm font-semibold text-slate-700">
        {title}
      </h3>

      <div className="mt-5 flex items-center gap-2">
        <span className={status.valueClasses}>
          <VariationIcon
            size={28}
            value={metric.variationPercentage}
          />
        </span>

        <p
          className={[
            'text-3xl font-semibold tracking-tight',
            status.valueClasses,
          ].join(' ')}
        >
          {formatPercentage(
            metric.variationPercentage,
          )}
        </p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={[
              'rounded-full border px-3 py-1 text-[11px] font-semibold',
              status.badgeClasses,
            ].join(' ')}
          >
            {status.label}
          </span>

          <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
            Intensidad
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className={[
              'h-full rounded-full',
              status.barClasses,
            ].join(' ')}
            style={{
              width: `${intensity}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200/80 pt-4">
        <p className="text-xs font-medium leading-5 text-slate-600">
          Contra {comparisonLabel}.
        </p>

        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          {status.description}
        </p>
      </div>
    </article>
  )
}

function MarginCard({
  performance,
}: {
  performance:
    ExecutiveSalesPeriodPerformance
}) {
  const margin =
    performance.grossMargin

  const tone =
    margin === null
      ? {
          classes:
            'border-slate-200 bg-white',
          icon:
            'bg-slate-100 text-slate-500',
          value: 'text-slate-500',
          badge:
            'border-slate-200 bg-slate-100 text-slate-600',
          label: 'Sin datos',
        }
      : margin >= 28
        ? {
            classes:
              'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50',
            icon:
              'bg-emerald-100 text-emerald-700',
            value: 'text-emerald-600',
            badge:
              'border-emerald-200 bg-emerald-50 text-emerald-700',
            label: 'Saludable',
          }
        : margin >= 22
          ? {
              classes:
                'border-amber-200 bg-gradient-to-br from-white to-amber-50/50',
              icon:
                'bg-amber-100 text-amber-700',
              value: 'text-amber-600',
              badge:
                'border-amber-200 bg-amber-50 text-amber-700',
              label: 'Vigilancia',
            }
          : {
              classes:
                'border-rose-200 bg-gradient-to-br from-white to-rose-50/50',
              icon:
                'bg-rose-100 text-rose-700',
              value: 'text-rose-600',
              badge:
                'border-rose-200 bg-rose-50 text-rose-700',
              label: 'Atención',
            }

  return (
    <article
      className={[
        'relative overflow-hidden rounded-3xl border p-6 shadow-sm',
        tone.classes,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            'flex size-12 items-center justify-center rounded-2xl',
            tone.icon,
          ].join(' ')}
        >
          <Gauge size={23} />
        </div>

        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-500">
          GP
        </span>
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        Rentabilidad
      </p>

      <h3 className="mt-1 text-sm font-semibold text-slate-700">
        Margen bruto del periodo
      </h3>

      <p
        className={[
          'mt-5 text-3xl font-semibold tracking-tight',
          tone.value,
        ].join(' ')}
      >
        {margin === null
          ? '—'
          : `${percentageFormatter.format(margin)}%`}
      </p>

      <span
        className={[
          'mt-5 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold',
          tone.badge,
        ].join(' ')}
      >
        {tone.label}
      </span>

      <div className="mt-5 border-t border-slate-200/80 pt-4">
        <p className="text-xs font-medium text-slate-600">
          GP: {formatCurrency(
            performance.currentGrossProfit,
          )}
        </p>

        <p className="mt-2 text-[11px] text-slate-400">
          Promedio mensual: {formatCurrency(
            performance.averageMonthlyRevenue,
          )}
        </p>
      </div>
    </article>
  )
}

export function ExecutiveSalesPerformance({
  performance,
  periodBadge,
}: ExecutiveSalesPerformanceProps) {
  const primaryStatus =
    getPerformanceStatus(
      performance.comparison
        .variationPercentage,
    )

  return (
    <section
      data-executive-component="sales-performance"
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Rendimiento comercial
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Desempeño del periodo seleccionado
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Venta, comparación equivalente y rentabilidad del corte activo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
            to="/sales"
          >
            Abrir Sales Workspace

            <ArrowRight size={14} />
          </Link>

          {performance.hasData && (
            <div
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                primaryStatus.badgeClasses,
              ].join(' ')}
            >
              <span
                className={[
                  'size-2 rounded-full',
                  primaryStatus.barClasses,
                ].join(' ')}
              />

              Estado: {primaryStatus.label}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 text-white shadow-xl shadow-blue-100/60 sm:col-span-2 xl:col-span-2">
          <div className="absolute -right-16 -top-16 size-52 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-16 left-20 size-44 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex h-full min-h-72 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-blue-200 backdrop-blur">
                <CalendarDays size={27} />
              </div>

              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 backdrop-blur">
                {periodBadge}
              </span>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                Venta del periodo
              </p>

              <p className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                {formatCompactCurrency(
                  performance.currentRevenue,
                )}
              </p>

              <p className="mt-2 text-sm font-medium text-slate-300">
                {formatCurrency(
                  performance.currentRevenue,
                )}
              </p>
            </div>

            <div className="mt-auto pt-8">
              <div className="border-t border-white/10 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Periodo analizado
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {performance.currentLabel}
                    </p>
                  </div>

                  {performance.comparison
                    .variationPercentage !==
                  null && (
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      {performance.comparison
                        .variationPercentage >= 0 ? (
                        <TrendingUp
                          className="text-emerald-400"
                          size={17}
                        />
                      ) : (
                        <TrendingDown
                          className="text-rose-400"
                          size={17}
                        />
                      )}

                      <span>
                        {formatPercentage(
                          performance.comparison
                            .variationPercentage,
                        )}{' '}
                        vs. periodo anterior
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>

        <ComparisonCard
          badge="P vs P"
          comparisonLabel={
            performance.comparisonLabel
          }
          metric={performance.comparison}
          title="Periodo contra periodo"
        />

        <ComparisonCard
          badge="Y vs Y"
          comparisonLabel={
            performance.priorYearLabel
          }
          metric={
            performance.priorYearComparison
          }
          title="Mismo corte contra año anterior"
        />

        <MarginCard
          performance={performance}
        />
      </div>

      <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">
        <WalletCards
          className="text-blue-600"
          size={15}
        />

        {performance.periodCount}{' '}
        {performance.periodCount === 1
          ? 'mes incluido'
          : 'meses incluidos'} en el cálculo activo.
      </div>
    </section>
  )
}
