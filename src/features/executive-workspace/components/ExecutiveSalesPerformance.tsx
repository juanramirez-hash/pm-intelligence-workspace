import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import type { SalesComparisonMetric } from '../analytics/executiveSalesAnalytics'
import { useExecutiveDashboard } from '../hooks/useExecutiveDashboard'

type PerformanceLevel =
  | 'excellent'
  | 'good'
  | 'stable'
  | 'attention'
  | 'critical'
  | 'unavailable'

interface PerformanceStatus {
  level: PerformanceLevel
  label: string
  description: string
  badgeClasses: string
  valueClasses: string
  iconClasses: string
  barClasses: string
  cardClasses: string
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
  if (value === null) {
    return '—'
  }

  return currencyFormatter.format(value)
}

function formatCompactCurrency(
  value: number | null,
): string {
  if (value === null) {
    return '—'
  }

  return compactCurrencyFormatter.format(
    value,
  )
}

function formatVariation(
  value: number | null,
): string {
  if (value === null) {
    return 'Sin comparación'
  }

  const prefix =
    value > 0 ? '+' : ''

  return `${prefix}${percentageFormatter.format(value)}%`
}

function getPerformanceStatus(
  value: number | null,
): PerformanceStatus {
  if (value === null) {
    return {
      level: 'unavailable',
      label: 'Sin comparación',
      description:
        'No existe un periodo comparable disponible.',
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

  if (value > 10) {
    return {
      level: 'excellent',
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
    }
  }

  if (value >= 3) {
    return {
      level: 'good',
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
    }
  }

  if (value > -3) {
    return {
      level: 'stable',
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
    }
  }

  if (value >= -10) {
    return {
      level: 'attention',
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
    }
  }

  return {
    level: 'critical',
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
  }
}

function getIntensityPercentage(
  value: number | null,
): number {
  if (value === null) {
    return 0
  }

  const absoluteValue = Math.abs(value)

  return Math.min(
    Math.max(absoluteValue * 2.5, 8),
    100,
  )
}

function VariationIcon({
  value,
  size = 22,
}: {
  value: number | null
  size?: number
}) {
  if (value === null || value === 0) {
    return (
      <Minus
        size={size}
        strokeWidth={2.2}
      />
    )
  }

  if (value > 0) {
    return (
      <ArrowUpRight
        size={size}
        strokeWidth={2.2}
      />
    )
  }

  return (
    <ArrowDownRight
      size={size}
      strokeWidth={2.2}
    />
  )
}

interface ComparisonCardProps {
  title: string
  shortTitle: string
  badge: string
  metric: SalesComparisonMetric
  description: string
}

function ComparisonCard({
  title,
  shortTitle,
  badge,
  metric,
  description,
}: ComparisonCardProps) {
  const status =
    getPerformanceStatus(
      metric.variationPercentage,
    )

  const intensity =
    getIntensityPercentage(
      metric.variationPercentage,
    )

  return (
    <article
      className={[
        'group relative overflow-hidden rounded-3xl border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg',
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
            'flex size-12 shrink-0 items-center justify-center rounded-2xl',
            status.iconClasses,
          ].join(' ')}
        >
          <VariationIcon
            value={
              metric.variationPercentage
            }
          />
        </div>

        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-500 shadow-sm backdrop-blur">
          {badge}
        </span>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {shortTitle}
        </p>

        <h3 className="mt-1 text-sm font-semibold text-slate-700">
          {title}
        </h3>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span
          className={
            status.valueClasses
          }
        >
          <VariationIcon
            value={
              metric.variationPercentage
            }
            size={28}
          />
        </span>

        <p
          className={[
            'text-3xl font-semibold tracking-tight',
            status.valueClasses,
          ].join(' ')}
        >
          {formatVariation(
            metric.variationPercentage,
          )}
        </p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold',
              status.badgeClasses,
            ].join(' ')}
          >
            <span
              className={[
                'size-1.5 rounded-full',
                status.barClasses,
              ].join(' ')}
            />

            {status.label}
          </span>

          <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
            Intensidad
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className={[
              'h-full rounded-full transition-all duration-700',
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
          {description}
        </p>

        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          {status.description}
        </p>
      </div>
    </article>
  )
}

export function ExecutiveSalesPerformance() {
  const {
    salesAnalytics,
    normalizedSalesCount,
  } = useExecutiveDashboard()

  const monthDescription =
    salesAnalytics.hasData &&
    salesAnalytics.latestPeriodLabel &&
    salesAnalytics.previousMonthLabel
      ? `${salesAnalytics.latestPeriodLabel} vs. ${salesAnalytics.previousMonthLabel}`
      : 'Último mes contra mes anterior.'

  const quarterDescription =
    salesAnalytics.hasData &&
    salesAnalytics.currentQuarterLabel &&
    salesAnalytics.previousQuarterLabel
      ? `${salesAnalytics.currentQuarterLabel} vs. ${salesAnalytics.previousQuarterLabel}`
      : 'Periodo comparable contra trimestre anterior.'

  const yearDescription =
    salesAnalytics.hasData &&
    salesAnalytics.latestPeriodLabel &&
    salesAnalytics.previousYear
      ? `${salesAnalytics.latestPeriodLabel} vs. el mismo mes de ${salesAnalytics.previousYear}`
      : 'Mismo mes contra el año anterior.'

  const monthStatus =
    getPerformanceStatus(
      salesAnalytics.monthComparison
        .variationPercentage,
    )

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Rendimiento comercial
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Desempeño del periodo actual
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Venta del último mes disponible y comparativos comerciales.
          </p>
        </div>

        {salesAnalytics.hasData ? (
          <div
            className={[
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
              monthStatus.badgeClasses,
            ].join(' ')}
          >
            <span
              className={[
                'size-2 rounded-full',
                monthStatus.barClasses,
              ].join(' ')}
            />

            Estado mensual: {monthStatus.label}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 text-white shadow-xl shadow-blue-100/60 sm:col-span-2 xl:col-span-2">
          <div className="absolute -right-16 -top-16 size-52 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-16 left-20 size-44 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex h-full min-h-72 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-blue-200 backdrop-blur">
                <CalendarDays
                  size={27}
                  strokeWidth={2}
                />
              </div>

              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 backdrop-blur">
                Último mes
              </span>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                Venta del mes
              </p>

              <p className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                {formatCompactCurrency(
                  salesAnalytics.currentMonthSales,
                )}
              </p>

              <p className="mt-2 text-sm font-medium text-slate-300">
                {formatCurrency(
                  salesAnalytics.currentMonthSales,
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
                      {salesAnalytics.latestPeriodLabel ??
                        'Sin datos disponibles'}
                    </p>
                  </div>

                  {salesAnalytics.hasData ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      {salesAnalytics.monthComparison
                        .variationPercentage !==
                      null ? (
                        <>
                          {salesAnalytics.monthComparison
                            .variationPercentage >=
                          0 ? (
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
                            {
                              monthStatus.description
                            }
                          </span>
                        </>
                      ) : (
                        <span>
                          Último periodo disponible
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </article>

        <ComparisonCard
          title="Mes contra mes"
          shortTitle="Variación mensual"
          badge="M vs M"
          metric={
            salesAnalytics.monthComparison
          }
          description={monthDescription}
        />

        <ComparisonCard
          title="Trimestre contra trimestre"
          shortTitle="Variación trimestral"
          badge="Q vs Q"
          metric={
            salesAnalytics.quarterComparison
          }
          description={quarterDescription}
        />

        <ComparisonCard
          title="Año contra año"
          shortTitle="Variación anual"
          badge="Y vs Y"
          metric={
            salesAnalytics.yearComparison
          }
          description={yearDescription}
        />
      </div>

      {normalizedSalesCount > 0 ? (
        <div className="mt-4 flex justify-end">
          <p className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-400 shadow-sm">
            Calculado con{' '}
            <span className="font-semibold text-slate-600">
              {normalizedSalesCount.toLocaleString(
                'es-MX',
              )}
            </span>{' '}
            registros normalizados
          </p>
        </div>
      ) : null}
    </section>
  )
}