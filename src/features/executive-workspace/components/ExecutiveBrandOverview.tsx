import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleDashed,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import type {
  BrandIntelligenceItem,
  BrandIntelligenceSummary,
  BrandLifecycleStatus,
  BrandTrendStatus,
} from '../../../core/analytics/brands'

import {
  BrandVariationValue,
} from '../../workspaces/shared/brand/components/BrandVariationValue'

import {
  formatBrandCurrency,
  formatBrandInteger,
  formatBrandPercentage,
} from '../../workspaces/shared/brand/utils/brandFormatters'

interface ExecutiveBrandOverviewProps {
  brands:
    BrandIntelligenceSummary | null

  currentPeriodLabel?: string

  comparisonPeriodLabel?: string
}

function getLifecycleLabel(
  status: BrandLifecycleStatus,
): string {
  const labels:
    Record<
      BrandLifecycleStatus,
      string
    > = {
      active: 'Activa',
      new: 'Nueva',
      recovered: 'Recuperada',
      inactive: 'Inactiva',
      lost: 'Perdida',
    }

  return labels[status]
}

function getLifecycleClasses(
  status: BrandLifecycleStatus,
): string {
  const classes:
    Record<
      BrandLifecycleStatus,
      string
    > = {
      active:
        'border-emerald-200 bg-emerald-50 text-emerald-700',

      new:
        'border-blue-200 bg-blue-50 text-blue-700',

      recovered:
        'border-violet-200 bg-violet-50 text-violet-700',

      inactive:
        'border-slate-200 bg-slate-100 text-slate-600',

      lost:
        'border-rose-200 bg-rose-50 text-rose-700',
    }

  return classes[status]
}

function getTrendLabel(
  status: BrandTrendStatus,
): string {
  const labels:
    Record<
      BrandTrendStatus,
      string
    > = {
      growing: 'Creciendo',
      declining: 'En caída',
      stable: 'Estable',
      without_comparison:
        'Sin comparación',
    }

  return labels[status]
}

function getTrendClasses(
  status: BrandTrendStatus,
): string {
  const classes:
    Record<
      BrandTrendStatus,
      string
    > = {
      growing:
        'text-emerald-700',

      declining:
        'text-rose-700',

      stable:
        'text-slate-600',

      without_comparison:
        'text-amber-700',
    }

  return classes[status]
}

function BrandRankingCard({
  title,
  description,
  brands,
  emptyMessage,
}: {
  title: string
  description: string
  brands: BrandIntelligenceItem[]
  emptyMessage: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-semibold text-slate-950">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {brands.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
          <CircleDashed
            className="mx-auto text-slate-300"
            size={25}
          />

          <p className="mt-2 text-sm text-slate-500">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {brands
            .slice(
              0,
              5,
            )
            .map(
              (
                brand,
                index,
              ) => (
                <div
                  key={brand.brandId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {brand.brandName}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatBrandCurrency(
                          brand.currentPeriod
                            .revenue,
                        )}
                      </p>
                    </div>
                  </div>

                  <BrandVariationValue
                    value={
                      brand
                        .revenueVariationPercentage
                    }
                  />
                </div>
              ),
            )}
        </div>
      )}
    </article>
  )
}

export function ExecutiveBrandOverview({
  brands,
  currentPeriodLabel,
  comparisonPeriodLabel,
}: ExecutiveBrandOverviewProps) {
  if (!brands) {
    return (
      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Brand Intelligence
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Desempeño de marcas
          </h2>

          <Link
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-800"
            to="/brands"
          >
            Abrir Brand Workspace

            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <CircleDashed
            className="mx-auto text-slate-300"
            size={38}
          />

          <h3 className="mt-4 font-semibold text-slate-800">
            Sin información de marcas
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Importa información de ventas
            para generar el análisis.
          </p>
        </div>
      </section>
    )
  }

  const variationIsPositive =
    brands.revenueVariation >= 0

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Brand Intelligence
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Desempeño y concentración de
            marcas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Comparativo de{' '}
            {currentPeriodLabel ??
              brands.currentPeriodId}{' '}
            contra{' '}
            {comparisonPeriodLabel ??
              brands.previousPeriodId}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
            to="/brands"
          >
            Abrir Brand Workspace

            <ArrowRight size={14} />
          </Link>

          <div
            className={[
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',

              variationIsPositive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700',
            ].join(' ')}
          >
            {variationIsPositive ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}

            {formatBrandPercentage(
              brands
                .revenueVariationPercentage,
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Building2 size={19} />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Total
            </span>
          </div>

          <p className="mt-5 text-3xl font-semibold text-slate-950">
            {brands.totalBrands}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Marcas analizadas
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={19} />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Activas
            </span>
          </div>

          <p className="mt-5 text-3xl font-semibold text-slate-950">
            {brands.activeBrands}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Con actividad en ambos periodos
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Sparkles size={19} />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Altas
            </span>
          </div>

          <p className="mt-5 text-3xl font-semibold text-slate-950">
            {brands.newBrands +
              brands.recoveredBrands}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {brands.newBrands} nuevas ·{' '}
            {brands.recoveredBrands}{' '}
            recuperadas
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle size={19} />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Atención
            </span>
          </div>

          <p className="mt-5 text-3xl font-semibold text-slate-950">
            {
              brands
                .brandsRequiringAttention
            }
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Perdidas, inactivas o en caída
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Venta actual
          </p>

          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {formatBrandCurrency(
              brands.currentPeriodRevenue,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {currentPeriodLabel ??
              `Periodo ${brands.currentPeriodId}`}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Venta anterior
          </p>

          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {formatBrandCurrency(
              brands.previousPeriodRevenue,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {comparisonPeriodLabel ??
              `Periodo ${brands.previousPeriodId}`}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Variación
          </p>

          <p
            className={[
              'mt-3 text-2xl font-semibold',

              variationIsPositive
                ? 'text-emerald-700'
                : 'text-rose-700',
            ].join(' ')}
          >
            {formatBrandCurrency(
              brands.revenueVariation,
            )}
          </p>

          <div className="mt-1">
            <BrandVariationValue
              value={
                brands
                  .revenueVariationPercentage
              }
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tendencia
          </p>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-emerald-700">
                {brands.growingBrands}
              </p>

              <p className="text-xs text-slate-500">
                creciendo
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold text-rose-700">
                {brands.decliningBrands}
              </p>

              <p className="text-xs text-slate-500">
                en caída
              </p>
            </div>
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-950">
                Top 10 por venta
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Participación sobre la venta
                del periodo actual.
              </p>
            </div>

            <Building2
              className="text-violet-500"
              size={22}
            />
          </div>

          <div className="mt-5 space-y-3">
            {brands.topRevenueBrands.map(
              (
                brand,
                index,
              ) => (
                <div
                  key={brand.brandId}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {brand.brandName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatBrandPercentage(
                            brand
                              .revenueParticipation,
                          )}{' '}
                          de participación
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                      {formatBrandCurrency(
                        brand.currentPeriod
                          .revenue,
                      )}
                    </p>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width:
                          `${Math.min(
                            Math.max(
                              brand
                                .revenueParticipation *
                                100,
                              0,
                            ),
                            100,
                          )}%`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-950">
              Distribución de tendencia
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4">
                <ArrowUpRight
                  className="text-emerald-600"
                  size={20}
                />

                <p className="mt-3 text-2xl font-semibold text-emerald-700">
                  {brands.growingBrands}
                </p>

                <p className="mt-1 text-xs font-medium text-emerald-700">
                  En crecimiento
                </p>
              </div>

              <div className="rounded-xl bg-rose-50 p-4">
                <ArrowDownRight
                  className="text-rose-600"
                  size={20}
                />

                <p className="mt-3 text-2xl font-semibold text-rose-700">
                  {brands.decliningBrands}
                </p>

                <p className="mt-1 text-xs font-medium text-rose-700">
                  En caída
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <RefreshCw
                  className="text-slate-500"
                  size={20}
                />

                <p className="mt-3 text-2xl font-semibold text-slate-700">
                  {brands.stableBrands}
                </p>

                <p className="mt-1 text-xs font-medium text-slate-600">
                  Estables
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <CircleDashed
                  className="text-amber-600"
                  size={20}
                />

                <p className="mt-3 text-2xl font-semibold text-amber-700">
                  {
                    brands
                      .brandsWithoutComparison
                  }
                </p>

                <p className="mt-1 text-xs font-medium text-amber-700">
                  Sin comparación
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                <AlertTriangle
                  size={19}
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-950">
                  Marcas en atención
                </h3>

                <p className="text-sm text-slate-500">
                  {
                    brands
                      .brandsRequiringAttention
                  }{' '}
                  requieren revisión
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {brands.attentionBrands
                .slice(
                  0,
                  5,
                )
                .map(
                  (brand) => (
                    <div
                      key={brand.brandId}
                      className="rounded-xl border border-rose-100 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {brand.brandName}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {brand.attentionReason}
                          </p>
                        </div>

                        <BrandVariationValue
                          value={
                            brand
                              .revenueVariationPercentage
                          }
                        />
                      </div>
                    </div>
                  ),
                )}

              {brands.attentionBrands
                .length === 0 && (
                <p className="rounded-xl border border-dashed border-rose-200 bg-white p-4 text-center text-sm text-slate-500">
                  No existen marcas con
                  alertas en el periodo.
                </p>
              )}
            </div>
          </article>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BrandRankingCard
          title="Marcas con mayor crecimiento"
          description="Ordenadas por incremento absoluto de venta."
          brands={
            brands.topGrowingBrands
          }
          emptyMessage="No existen marcas en crecimiento."
        />

        <BrandRankingCard
          title="Marcas con mayor caída"
          description="Ordenadas por reducción absoluta de venta."
          brands={
            brands.topDecliningBrands
          }
          emptyMessage="No existen marcas en caída."
        />
      </div>

      <article className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-950">
              Detalle ejecutivo por marca
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Venta, rentabilidad,
              participación y comportamiento
              comercial.
            </p>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {brands.brands.length}{' '}
            marcas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">
                  Marca
                </th>

                <th className="px-4 py-4">
                  Estado
                </th>

                <th className="px-4 py-4">
                  Tendencia
                </th>

                <th className="px-4 py-4 text-right">
                  Venta
                </th>

                <th className="px-4 py-4 text-right">
                  Variación
                </th>

                <th className="px-4 py-4 text-right">
                  GP
                </th>

                <th className="px-4 py-4 text-right">
                  Margen
                </th>

                <th className="px-4 py-4 text-right">
                  Clientes
                </th>

                <th className="px-4 py-4 text-right">
                  Productos
                </th>

                <th className="px-4 py-4 text-right">
                  Participación
                </th>

                <th className="px-6 py-4">
                  Atención
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {[...brands.brands]
                .sort(
                  (
                    brandA,
                    brandB,
                  ) =>
                    brandB
                      .currentPeriod
                      .revenue -
                    brandA
                      .currentPeriod
                      .revenue,
                )
                .map(
                  (brand) => (
                    <tr
                      key={brand.brandId}
                      className="align-top transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {brand.brandName}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {brand.brandId}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={[
                            'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',

                            getLifecycleClasses(
                              brand.lifecycleStatus,
                            ),
                          ].join(' ')}
                        >
                          {getLifecycleLabel(
                            brand.lifecycleStatus,
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div
                          className={[
                            'inline-flex items-center gap-1.5 text-xs font-semibold',

                            getTrendClasses(
                              brand.trendStatus,
                            ),
                          ].join(' ')}
                        >
                          {brand.trendStatus ===
                            'growing' && (
                            <ArrowUpRight
                              size={14}
                            />
                          )}

                          {brand.trendStatus ===
                            'declining' && (
                            <ArrowDownRight
                              size={14}
                            />
                          )}

                          {brand.trendStatus ===
                            'stable' && (
                            <RefreshCw
                              size={13}
                            />
                          )}

                          {brand.trendStatus ===
                            'without_comparison' && (
                            <CircleDashed
                              size={13}
                            />
                          )}

                          {getTrendLabel(
                            brand.trendStatus,
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatBrandCurrency(
                            brand.currentPeriod
                              .revenue,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Anterior:{' '}
                          {formatBrandCurrency(
                            brand.previousPeriod
                              .revenue,
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <BrandVariationValue
                          value={
                            brand
                              .revenueVariationPercentage
                          }
                        />

                        <p className="mt-1 text-xs text-slate-400">
                          {formatBrandCurrency(
                            brand.revenueVariation,
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatBrandCurrency(
                            brand.currentPeriod
                              .grossProfit,
                          )}
                        </p>

                        <BrandVariationValue
                          value={
                            brand
                              .grossProfitVariationPercentage
                          }
                        />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatBrandPercentage(
                            brand.currentPeriod
                              .margin,
                          )}
                        </p>

                        <BrandVariationValue
                          value={
                            brand.marginVariation
                          }
                        />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatBrandInteger(
                            brand.currentPeriod
                              .customers,
                          )}
                        </p>

                        <p
                          className={[
                            'mt-1 text-xs font-medium',

                            brand.customerVariation >=
                            0
                              ? 'text-emerald-700'
                              : 'text-rose-700',
                          ].join(' ')}
                        >
                          {brand.customerVariation >=
                          0
                            ? '+'
                            : ''}
                          {
                            brand.customerVariation
                          }
                        </p>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatBrandInteger(
                            brand.currentPeriod
                              .products,
                          )}
                        </p>

                        <p
                          className={[
                            'mt-1 text-xs font-medium',

                            brand.productVariation >=
                            0
                              ? 'text-emerald-700'
                              : 'text-rose-700',
                          ].join(' ')}
                        >
                          {brand.productVariation >=
                          0
                            ? '+'
                            : ''}
                          {
                            brand.productVariation
                          }
                        </p>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatBrandPercentage(
                            brand
                              .revenueParticipation,
                          )}
                        </p>

                        <div className="ml-auto mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{
                              width:
                                `${Math.min(
                                  Math.max(
                                    brand
                                      .revenueParticipation *
                                      100,
                                    0,
                                  ),
                                  100,
                                )}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {brand.requiresAttention ? (
                          <div className="max-w-[240px]">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                              <AlertTriangle
                                size={13}
                              />

                              Revisar
                            </span>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {
                                brand.attentionReason
                              }
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2
                              size={14}
                            />

                            Sin alerta
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}