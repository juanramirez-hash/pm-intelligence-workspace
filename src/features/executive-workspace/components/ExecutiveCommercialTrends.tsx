import {
  ArrowRight,
  BarChart3,
  CircleDashed,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import type {
  ExecutiveCommercialTrends as ExecutiveCommercialTrendsModel,
  ExecutiveRevenueTrendPoint,
} from '../types/executiveWorkspaceTypes'

interface ExecutiveCommercialTrendsProps {
  trends:
    ExecutiveCommercialTrendsModel

  selectionLabel: string
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
    maximumFractionDigits: 1,
  })

const percentageFormatter =
  new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

function formatMonth(
  point: ExecutiveRevenueTrendPoint,
): string {
  const date = new Date(
    Date.UTC(
      point.year,
      point.month - 1,
      1,
    ),
  )

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    },
  )
    .format(date)
    .replace('.', '')
}

function formatCurrency(
  value: number,
): string {
  return currencyFormatter.format(value)
}

function formatCompactCurrency(
  value: number,
): string {
  return compactCurrencyFormatter.format(
    value,
  )
}

function formatPercentage(
  value: number,
): string {
  return `${percentageFormatter.format(
    value,
  )}%`
}

function calculateVariation(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return null
  }

  return (
    (current - previous) /
    previous
  ) * 100
}

function RevenueTrendChart({
  points,
}: {
  points:
    ExecutiveRevenueTrendPoint[]
}) {
  const width = 960
  const height = 310
  const left = 52
  const right = 24
  const top = 24
  const bottom = 54

  const chartWidth =
    width - left - right

  const chartHeight =
    height - top - bottom

  const maxRevenue =
    Math.max(
      ...points.map(
        (point) => point.revenue,
      ),
      1,
    )

  const coordinates =
    points.map(
      (point, index) => {
        const x =
          points.length === 1
            ? left + chartWidth / 2
            : left +
              (
                index /
                (points.length - 1)
              ) *
                chartWidth

        const y =
          top +
          chartHeight -
          (
            point.revenue /
            maxRevenue
          ) *
            chartHeight

        return {
          point,
          x,
          y,
        }
      },
    )

  const polyline =
    coordinates
      .map(
        ({ x, y }) =>
          `${x},${y}`,
      )
      .join(' ')

  return (
    <svg
      aria-label="Tendencia mensual de ventas"
      className="h-auto w-full"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map(
        (ratio) => {
          const y =
            top +
            chartHeight -
            ratio * chartHeight

          return (
            <g key={ratio}>
              <line
                className="stroke-slate-200"
                strokeDasharray="4 6"
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
              />

              <text
                className="fill-slate-400 text-[11px]"
                textAnchor="end"
                x={left - 10}
                y={y + 4}
              >
                {formatCompactCurrency(
                  maxRevenue * ratio,
                )}
              </text>
            </g>
          )
        },
      )}

      <polyline
        className="fill-none stroke-blue-600"
        points={polyline}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />

      {coordinates.map(
        ({ point, x, y }) => (
          <g key={point.periodId}>
            <circle
              className="fill-white stroke-blue-600"
              cx={x}
              cy={y}
              r="6"
              strokeWidth="3"
            >
              <title>
                {formatMonth(point)}: {formatCurrency(point.revenue)}
              </title>
            </circle>

            <text
              className="fill-slate-500 text-[11px]"
              textAnchor="middle"
              x={x}
              y={height - 20}
            >
              {formatMonth(point)}
            </text>
          </g>
        ),
      )}
    </svg>
  )
}

export function ExecutiveCommercialTrends({
  trends,
  selectionLabel,
}: ExecutiveCommercialTrendsProps) {
  const latest =
    trends.monthlyRevenue.at(-1)

  const previous =
    trends.monthlyRevenue.at(-2)

  const latestVariation =
    latest && previous
      ? calculateVariation(
          latest.revenue,
          previous.revenue,
        )
      : null

  const variationIsPositive =
    latestVariation !== null &&
    latestVariation >= 0

  return (
    <section
      data-executive-component="commercial-trends"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Tendencias
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Evolución y concentración de ventas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Venta mensual real y concentración de clientes para {selectionLabel}.
          </p>
        </div>

        <Link
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
          to="/sales"
        >
          Abrir Sales Workspace

          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3
                  className="text-blue-600"
                  size={20}
                />

                <h3 className="font-semibold text-slate-950">
                  Venta mensual
                </h3>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Últimos {trends.periodCount} periodos disponibles.
              </p>
            </div>

            {latest && (
              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Último periodo
                </p>

                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {formatCompactCurrency(
                    latest.revenue,
                  )}
                </p>

                {latestVariation !== null && (
                  <p
                    className={[
                      'mt-1 inline-flex items-center gap-1 text-xs font-semibold',
                      variationIsPositive
                        ? 'text-emerald-700'
                        : 'text-rose-700',
                    ].join(' ')}
                  >
                    {variationIsPositive ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}

                    {latestVariation > 0
                      ? '+'
                      : ''}
                    {formatPercentage(
                      latestVariation,
                    )}
                    {' '}vs. periodo anterior
                  </p>
                )}
              </div>
            )}
          </div>

          {trends.monthlyRevenue.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <div className="min-w-[680px]">
                <RevenueTrendChart
                  points={
                    trends.monthlyRevenue
                  }
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div>
                <CircleDashed
                  className="mx-auto text-slate-300"
                  size={34}
                />

                <h4 className="mt-3 font-semibold text-slate-800">
                  Sin periodos de venta disponibles
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  Revisa la carga de ventas en el Data Center.
                </p>
              </div>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users
                  className="text-emerald-600"
                  size={20}
                />

                <h3 className="font-semibold text-slate-950">
                  Top 10 clientes
                </h3>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Participación dentro de {selectionLabel}.
              </p>
            </div>

            <Link
              className="text-xs font-semibold text-blue-700 hover:text-blue-800"
              to="/customers"
            >
              Ver todos
            </Link>
          </div>

          {trends.topCustomers.length > 0 ? (
            <div className="mt-5 space-y-3">
              {trends.topCustomers.map(
                (customer, index) => (
                  <Link
                    aria-label={`Abrir cliente ${customer.customerName}`}
                    className="group block rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/60"
                    key={customer.customerId}
                    to={`/customers/${encodeURIComponent(
                      customer.customerId,
                    )}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm">
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-800">
                            {customer.customerName}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {customer.customerId} · {customer.documents} documentos
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCompactCurrency(
                            customer.revenue,
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatPercentage(
                            customer.revenueShare * 100,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              customer.revenueShare * 100,
                              0,
                            ),
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <CircleDashed
                className="mx-auto text-slate-300"
                size={30}
              />

              <p className="mt-3 text-sm text-slate-500">
                No hay clientes disponibles para el ranking.
              </p>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
