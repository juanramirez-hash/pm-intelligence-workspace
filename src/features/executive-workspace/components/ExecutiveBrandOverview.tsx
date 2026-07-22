import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleDashed,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

import type {
  BrandIntelligenceSummary,
} from '../../../core/analytics/brands'

interface ExecutiveBrandOverviewProps {
  brands:
    BrandIntelligenceSummary | null
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    },
  ).format(value)
}

function formatPercentage(
  value: number | null,
): string {
  if (value === null) {
    return 'Sin comparación'
  }

  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'percent',
      maximumFractionDigits: 1,
    },
  ).format(value)
}

export function ExecutiveBrandOverview({
  brands,
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
            Comparativo del periodo actual
            contra el mes anterior.
          </p>
        </div>

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

          {formatPercentage(
            brands
              .revenueVariationPercentage,
          )}
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
            Con venta en ambos periodos
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Sparkles size={19} />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Nuevas y recuperadas
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-950">
                Top 10 marcas
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Ranking por venta del periodo
                actual.
              </p>
            </div>

            <Building2
              className="text-violet-500"
              size={22}
            />
          </div>

          <div className="mt-5 space-y-3">
            {brands.topRevenueBrands.map(
              (brand, index) => (
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
                        {formatPercentage(
                          brand
                            .revenueParticipation,
                        )}{' '}
                        de participación
                      </p>
                    </div>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatCurrency(
                      brand.currentPeriod
                        .revenue,
                    )}
                  </p>
                </div>
              ),
            )}
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-950">
              Tendencia
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

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-950">
              Venta del periodo
            </h3>

            <p className="mt-4 text-2xl font-semibold text-slate-950">
              {formatCurrency(
                brands.currentPeriodRevenue,
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Periodo anterior:{' '}
              {formatCurrency(
                brands
                  .previousPeriodRevenue,
              )}
            </p>

            <div
              className={[
                'mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',

                variationIsPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700',
              ].join(' ')}
            >
              {variationIsPositive ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}

              {formatCurrency(
                brands.revenueVariation,
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}