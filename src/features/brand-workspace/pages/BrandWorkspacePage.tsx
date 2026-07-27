import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDashed,
  Database,
  Home,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import type {
  BrandIntelligenceItem,
} from '../../../core/analytics/brands'

import {
  useBrandWorkspace,
} from '../hooks/useBrandWorkspace'

import {
  WorkspaceSection,
} from '../../../components/workspace/section'

import {
  ExecutiveBreadcrumbs,
  ExecutiveShell,
  KPIGrid,
  ShellActions,
  ShellActionsGroup,
} from '../../../atlas/shell'

import {
  BrandTable,
} from '../components'

import {
  ExecutiveHero,
} from '../../../atlas/widgets/executive'

import {
  defineKpiRegistry,
  IntelligentKpiCard,
} from '../../../atlas/widgets/kpi'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import {
  ExecutiveBriefCard,
} from '../../../atlas/widgets/executiveBrief'

import {
  useNavigate,
} from 'react-router-dom'

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
    <article className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px hover:border-slate-200 hover:bg-white motion-reduce:transform-none motion-reduce:transition-none">
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
  const navigate =
    useNavigate()

  const workspace =
    useBrandWorkspace()

  const summary =
    workspace.summary

  const workspaceIsAvailable =
    workspace.summaryAvailable

  const periodLabel = summary
    ? `${summary.currentPeriodStart} — ${summary.currentPeriodEnd}`
    : 'Sin periodo disponible'

  return (
    <ExecutiveShell
      beforeContent={
        <ExecutiveBreadcrumbs
          items={[
            {
              label: 'Inicio',
              href: '/',
              icon: <Home size={14} />,
            },
            {
              label: 'Brand Intelligence',
            },
          ]}
        />
      }
      header={
        <ExecutiveHero
          actions={
            <ShellActions ariaLabel="Acciones de Brand Intelligence">
              <ShellActionsGroup label="Gestión del workspace">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                  onClick={workspace.actions.resetFilters}
                  type="button"
                >
                  <RotateCcw size={16} />
                  Limpiar filtros
                </button>

                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                  onClick={() => navigate('/data-center')}
                  type="button"
                >
                  <Database size={16} />
                  Importar datos
                </button>
              </ShellActionsGroup>
            </ShellActions>
          }
          description="Analiza desempeño, crecimiento, rentabilidad, concentración y prioridades comerciales por marca."
          eyebrow="Brand Intelligence"
          icon={<Building2 size={22} />}
          metadata={<span>Periodo actual: {periodLabel}</span>}
          metrics={[
            {
              label: 'Venta del periodo',
              value: formatCurrency(summary?.currentPeriodRevenue ?? 0),
              helper: `Periodo anterior: ${formatCurrency(summary?.previousPeriodRevenue ?? 0)}`,
              icon: <BarChart3 size={17} />,
              tone: 'intelligence',
            },
            {
              label: 'Variación de venta',
              value: formatPercentage(summary?.revenueVariationPercentage ?? null),
              helper: `${formatCurrency(summary?.revenueVariation ?? 0)} contra el periodo anterior`,
              icon: <RefreshCcw size={17} />,
              tone: (summary?.revenueVariationPercentage ?? 0) >= 0
                ? 'positive'
                : 'critical',
            },
            {
              label: 'Marcas analizadas',
              value: summary?.totalBrands ?? 0,
              helper: `${summary?.activeBrands ?? 0} activas`,
              icon: <Building2 size={17} />,
              tone: 'default',
            },
            {
              label: 'Requieren atención',
              value: summary?.brandsRequiringAttention ?? 0,
              helper: `${summary?.decliningBrands ?? 0} con tendencia decreciente`,
              icon: <AlertTriangle size={17} />,
              tone: 'attention',
            },
          ]}
          score={{
            score: null,
            label: 'Pendiente de modelo',
            tone: 'neutral',
          }}
          status={
            <span
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                workspaceIsAvailable
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600',
              ].join(' ')}
            >
              {workspaceIsAvailable && <CheckCircle2 size={13} />}
              {workspaceIsAvailable ? 'Datos disponibles' : 'Sin datos'}
            </span>
          }
          summaryItems={[
            {
              label: 'Estado',
              value: workspaceIsAvailable ? 'Datos actualizados' : 'Pendiente de importación',
              tone: workspaceIsAvailable ? 'positive' : 'attention',
            },
            {
              label: 'Periodo',
              value: periodLabel,
            },
            {
              label: 'Repositorio',
              value: 'Business Repository',
            },
            {
              label: 'Cobertura',
              value: `${summary?.activeBrands ?? 0} marcas activas`,
            },
            {
              label: 'En crecimiento',
              value: summary?.growingBrands ?? 0,
              tone: 'positive',
            },
            {
              label: 'En descenso',
              value: summary?.decliningBrands ?? 0,
              tone: 'critical',
            },
          ]}
          theme="brand"
          title="Centro de Inteligencia de Marcas"
        />
      }
      width="wide"
    >
      {workspace.executiveBrief && (
        <ExecutiveBriefCard
          brief={workspace.executiveBrief}
          className="mb-6"
        />
      )}

      <KPIGrid columns={4} gap="compact">
        {defineKpiRegistry([
          {
            id: 'new-brands',
            title: 'Nuevas',
            value: summary?.newBrands ?? 0,
            icon: <Sparkles size={18} />,
            tone: 'intelligence',
            status: {
              label: 'Adquisición',
              tone: 'intelligence',
            },
            insight: 'Marcas con actividad registrada por primera vez en el periodo analizado.',
            source: 'Business Repository',
            context: periodLabel,
          },
          {
            id: 'recovered-brands',
            title: 'Recuperadas',
            value: summary?.recoveredBrands ?? 0,
            icon: <RefreshCcw size={18} />,
            tone: 'positive',
            status: {
              label: 'Reactivación',
              tone: 'positive',
            },
            insight: 'Marcas que retomaron actividad comercial después de un periodo sin venta.',
            source: 'Business Repository',
            context: periodLabel,
          },
          {
            id: 'growing-brands',
            title: 'En crecimiento',
            value: summary?.growingBrands ?? 0,
            icon: <TrendingUp size={18} />,
            tone: 'positive',
            status: {
              label: 'Favorable',
              tone: 'positive',
            },
            insight: 'Marcas con variación positiva frente al periodo comparable anterior.',
            source: 'Business Repository',
            context: periodLabel,
          },
          {
            id: 'declining-brands',
            title: 'En descenso',
            value: summary?.decliningBrands ?? 0,
            icon: <TrendingDown size={18} />,
            tone: 'critical',
            status: {
              label: 'Seguimiento',
              tone: 'critical',
            },
            insight: 'Marcas con variación negativa que requieren diagnóstico y seguimiento comercial.',
            source: 'Business Repository',
            context: periodLabel,
          },
        ]).map(({ id, ...kpi }) => (
          <IntelligentKpiCard
            {...kpi}
            key={id}
          />
        ))}
      </KPIGrid>

      {summary ? (
        <KPIGrid columns={3} gap="spacious" className="mt-6">
          <ExecutivePanel
            count={summary.topGrowingBrands.length}
            icon={<ArrowUpRight size={19} />}
            subtitle="Variación positiva contra el periodo anterior"
            title="Marcas con mayor crecimiento"
            tone="positive"
          >
            <div className="space-y-3">
              {summary.topGrowingBrands.slice(0, 5).map((brand, index) => (
                <BrandRankingItem brand={brand} key={brand.brandId} position={index + 1} />
              ))}
              {summary.topGrowingBrands.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No existen marcas con crecimiento para este periodo.
                </p>
              )}
            </div>
          </ExecutivePanel>

          <ExecutivePanel
            count={summary.topDecliningBrands.length}
            icon={<ArrowDownRight size={19} />}
            subtitle="Principales variaciones negativas"
            title="Marcas con mayor descenso"
            tone="critical"
          >
            <div className="space-y-3">
              {summary.topDecliningBrands.slice(0, 5).map((brand, index) => (
                <BrandRankingItem brand={brand} key={brand.brandId} position={index + 1} />
              ))}
              {summary.topDecliningBrands.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No existen marcas con descenso para este periodo.
                </p>
              )}
            </div>
          </ExecutivePanel>

          <ExecutivePanel
            count={summary.attentionBrands.length}
            icon={<AlertTriangle size={19} />}
            subtitle="Marcas que requieren seguimiento"
            title="Atención comercial"
            tone="attention"
          >
            <div className="space-y-3">
              {summary.attentionBrands.slice(0, 5).map((brand, index) => (
                <article
                  className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 transition-colors duration-200 hover:border-amber-200 hover:bg-amber-50 motion-reduce:transition-none"
                  key={brand.brandId}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-amber-700 shadow-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{brand.brandName}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {brand.attentionReason ?? 'Requiere revisión comercial.'}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              {summary.attentionBrands.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No existen alertas comerciales para este periodo.
                </p>
              )}
            </div>
          </ExecutivePanel>
        </KPIGrid>
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
 onSelectBrand={(
  brandId,
) => {
  workspace.actions
    .setSelectedBrandId(
      brandId,
    )

  navigate(
    `/brands/${encodeURIComponent(
      brandId,
    )}`,
  )
}}
      selectedBrandId={
        workspace.selectedBrandId
      }
    />
  </WorkspaceSection>
)}
    </ExecutiveShell>
  )
}