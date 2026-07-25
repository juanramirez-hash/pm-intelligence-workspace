import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CircleDashed,
  RefreshCcw,
} from 'lucide-react'

import type {
  BrandIntelligenceItem,
} from '../../../core/analytics/brands'

import {
  useBrandWorkspace,
} from '../hooks/useBrandWorkspace'

import {
  KpiCard,
} from '../../../components/business/kpi'

import {
  WorkspaceSection,
} from '../../../components/workspace/section'

import {
  WorkspaceHeader,
} from '../../../components/workspace/header'

import {
  WorkspaceGrid,
} from '../../../components/workspace/grid'

import {
  BrandTable,
} from '../components'

function formatCurrency(
  value: number,
) {
  return value.toLocaleString(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    },
  )
}

function formatPercentage(
  value: number | null,
) {
  if (value === null) {
    return 'Sin comparación'
  }

  return `${value >= 0 ? '+' : ''}${value.toLocaleString(
    'es-MX',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )}%`
}

function BrandRankingItem({
  brand,
  position,
}: {
  brand: BrandIntelligenceItem
  position: number
}) {
  const isGrowing =
    brand.revenueVariation > 0

  const isDeclining =
    brand.revenueVariation < 0

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-semibold text-slate-500 shadow-sm">
        {position}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {brand.brandName}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {formatCurrency(
            brand.currentPeriod.revenue,
          )}
        </p>
      </div>

      <div
        className={[
          'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',

          isGrowing
            ? 'bg-emerald-50 text-emerald-700'
            : isDeclining
              ? 'bg-rose-50 text-rose-700'
              : 'bg-slate-100 text-slate-600',
        ].join(' ')}
      >
        {isGrowing && (
          <ArrowUpRight size={14} />
        )}

        {isDeclining && (
          <ArrowDownRight size={14} />
        )}

        {formatPercentage(
          brand.revenueVariationPercentage,
        )}
      </div>
    </article>
  )
}

export function BrandWorkspacePage() {
  const workspace =
    useBrandWorkspace()

  const summary =
    workspace.summary

  const workspaceIsAvailable =
    workspace.summaryAvailable

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
<WorkspaceHeader
  connected={workspaceIsAvailable}
  description="Analiza desempeño, crecimiento, rentabilidad, concentración y prioridades comerciales por marca."
  eyebrow="Brand Intelligence"
  icon={Building2}
  metadata={
    summary ? (
      <p className="text-xs font-medium text-slate-400">
        Periodo actual:{' '}
        {summary.currentPeriodStart}
        {' — '}
        {summary.currentPeriodEnd}
      </p>
    ) : null
  }
  title="Centro de Inteligencia de Marcas"
  tone="violet"
/>

<WorkspaceGrid
    className="mt-6"
    columns={4}
>
  <KpiCard
    icon={Building2}
    subtitle={`${summary?.activeBrands ?? 0} activas`}
    title="Marcas analizadas"
    tone="violet"
    value={summary?.totalBrands ?? 0}
  />

  <KpiCard
    icon={BarChart3}
    subtitle={`Periodo anterior: ${formatCurrency(
      summary?.previousPeriodRevenue ??
        0,
    )}`}
    title="Venta del periodo"
    tone="blue"
    value={formatCurrency(
      summary?.currentPeriodRevenue ??
        0,
    )}
  />

  <KpiCard
    icon={RefreshCcw}
    subtitle={`${formatCurrency(
      summary?.revenueVariation ?? 0,
    )} contra periodo anterior`}
    title="Variación de venta"
    tone={
      (
        summary
          ?.revenueVariationPercentage ??
        0
      ) >= 0
        ? 'emerald'
        : 'rose'
    }
    value={formatPercentage(
      summary
        ?.revenueVariationPercentage ??
        null,
    )}
    valueClassName={
      (
        summary
          ?.revenueVariationPercentage ??
        0
      ) >= 0
        ? 'text-emerald-700'
        : 'text-rose-700'
    }
  />

  <KpiCard
    icon={AlertTriangle}
    subtitle={`${summary?.decliningBrands ?? 0} con tendencia decreciente`}
    title="Marcas con atención"
    tone="amber"
    value={
      summary
        ?.brandsRequiringAttention ??
      0
    }
  />
</WorkspaceGrid>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Nuevas
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-950">
              {summary?.newBrands ?? 0}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recuperadas
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-950">
              {summary?.recoveredBrands ?? 0}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              En crecimiento
            </p>

            <p className="mt-2 text-xl font-semibold text-emerald-700">
              {summary?.growingBrands ?? 0}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              En descenso
            </p>

            <p className="mt-2 text-xl font-semibold text-rose-700">
              {summary?.decliningBrands ?? 0}
            </p>
          </article>
        </section>

        {summary ? (
         <WorkspaceGrid
    className="mt-6"
    columns={3}
    gap={6}
>
<WorkspaceSection
  icon={ArrowUpRight}
  subtitle="Variación contra el periodo anterior"
  title="Marcas con mayor crecimiento"
  tone="emerald"
>
  <div className="space-y-3">
    {summary.topGrowingBrands
      .slice(0, 5)
      .map(
        (
          brand,
          index,
        ) => (
          <BrandRankingItem
            brand={brand}
            key={brand.brandId}
            position={index + 1}
          />
        ),
      )}

    {summary.topGrowingBrands
      .length === 0 && (
      <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
        No existen marcas con crecimiento
        para este periodo.
      </p>
    )}
  </div>
</WorkspaceSection>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <ArrowDownRight size={19} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Marcas con mayor descenso
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Principales variaciones negativas
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {summary.topDecliningBrands
                  .slice(0, 5)
                  .map(
                    (
                      brand,
                      index,
                    ) => (
                      <BrandRankingItem
                        brand={brand}
                        key={brand.brandId}
                        position={index + 1}
                      />
                    ),
                  )}

                {summary.topDecliningBrands
                  .length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                    No existen marcas con descenso
                    para este periodo.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={19} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Atención comercial
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Marcas que requieren seguimiento
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {summary.attentionBrands
                  .slice(0, 5)
                  .map(
                    (
                      brand,
                      index,
                    ) => (
                      <article
                        className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4"
                        key={brand.brandId}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-amber-700 shadow-sm">
                            {index + 1}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {brand.brandName}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {brand.attentionReason ??
                                'Requiere revisión comercial.'}
                            </p>
                          </div>
                        </div>
                      </article>
                    ),
                  )}

                {summary.attentionBrands
                  .length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                    No existen alertas comerciales
                    para este periodo.
                  </p>
                )}
              </div>
            </article>
        </WorkspaceGrid>
        ) : (
          <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <CircleDashed
              className="mx-auto text-slate-300"
              size={42}
            />

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Sin información de marcas
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Importa un archivo de ventas desde Data
              Center para generar los indicadores de
              Brand Intelligence.
            </p>
          </section>
        )}
        {summary && (
  <WorkspaceSection
    className="mt-6"
    icon={Building2}
    subtitle="Desempeño comercial y financiero de todas las marcas"
    title="Directorio de marcas"
    tone="violet"
  >
    <BrandTable
      brands={
        workspace.filteredBrands
      }
      onSelectBrand={
        workspace.actions
          .setSelectedBrandId
      }
      selectedBrandId={
        workspace.selectedBrandId
      }
    />
  </WorkspaceSection>
)}
      </div>
    </main>
  )
}