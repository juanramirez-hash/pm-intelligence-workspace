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
} from 'lucide-react'

import type {
  BrandIntelligenceItem,
} from '../../../core/analytics/brands'

import {
  useBrandWorkspace,
} from '../hooks/useBrandWorkspace'

import {
  ExecutiveBreadcrumbs,
  ExecutiveShell,
  KPIGrid,
  ShellActions,
  ShellActionsGroup,
} from '../../../atlas/shell'

import {
  ExecutiveHero,
} from '../../../atlas/widgets/executive'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import {
  SmartBrandDirectory,
} from '../../../atlas/widgets/brandDirectory'

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

  const percentage =
    value * 100

  return `${percentage >= 0 ? '+' : ''}${percentage.toLocaleString(
    'es-MX',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )}%`
}

function formatConcentration(
  value: number | null,
) {
  if (value === null) {
    return 'Sin concentración calculable'
  }

  return `${value.toLocaleString(
    'es-MX',
    {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    },
  )}%`
}

function BrandPriorityItem({
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

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>
            Venta {formatCurrency(
              brand.currentPeriod.revenue,
            )}
          </span>

          <span>
            Impacto {formatCurrency(
              brand.revenueVariation,
            )}
          </span>
        </div>
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

function PortfolioMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number | string
  tone?:
    | 'default'
    | 'positive'
    | 'critical'
    | 'attention'
    | 'intelligence'
}) {
  const toneClasses = {
    default:
      'border-slate-200 bg-slate-50 text-slate-900',
    positive:
      'border-emerald-100 bg-emerald-50 text-emerald-900',
    critical:
      'border-rose-100 bg-rose-50 text-rose-900',
    attention:
      'border-amber-100 bg-amber-50 text-amber-900',
    intelligence:
      'border-violet-100 bg-violet-50 text-violet-900',
  }

  return (
    <div
      className={[
        'rounded-xl border px-3 py-2.5',
        toneClasses[tone],
      ].join(' ')}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-60">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">
        {value}
      </p>
    </div>
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

  const activeBrandCoverage =
    summary &&
    summary.totalBrands > 0
      ? (
          summary.activeBrands /
          summary.totalBrands
        ) * 100
      : null

  const decliningGrossLoss =
    summary?.brands.reduce(
      (total, brand) =>
        brand.revenueVariation < 0
          ? total +
            Math.abs(
              brand.revenueVariation,
            )
          : total,
      0,
    ) ?? 0

  const topDecliningLoss =
    summary?.topDecliningBrands
      .slice(0, 5)
      .reduce(
        (total, brand) =>
          total +
          Math.abs(
            Math.min(
              brand.revenueVariation,
              0,
            ),
          ),
        0,
      ) ?? 0

  const decliningConcentration =
    decliningGrossLoss > 0
      ? (
          topDecliningLoss /
          decliningGrossLoss
        ) * 100
      : null

  const growingGrossGain =
    summary?.brands.reduce(
      (total, brand) =>
        brand.revenueVariation > 0
          ? total +
            brand.revenueVariation
          : total,
      0,
    ) ?? 0

  const topGrowingGain =
    summary?.topGrowingBrands
      .slice(0, 5)
      .reduce(
        (total, brand) =>
          total +
          Math.max(
            brand.revenueVariation,
            0,
          ),
        0,
      ) ?? 0

  const growingConcentration =
    growingGrossGain > 0
      ? (
          topGrowingGain /
          growingGrossGain
        ) * 100
      : null

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
          metadata={
            <span>
              Periodo actual: {periodLabel}
            </span>
          }
          metrics={[
            {
              label: 'Venta del periodo',
              value: formatCurrency(
                summary?.currentPeriodRevenue ??
                0,
              ),
              helper: `Periodo anterior: ${formatCurrency(
                summary?.previousPeriodRevenue ??
                0,
              )}`,
              icon: <BarChart3 size={17} />,
              tone: 'intelligence',
            },
            {
              label: 'Variación de venta',
              value: formatPercentage(
                summary?.revenueVariationPercentage ??
                null,
              ),
              helper: `${formatCurrency(
                summary?.revenueVariation ??
                0,
              )} contra el periodo anterior`,
              icon: <RefreshCcw size={17} />,
              tone:
                (
                  summary?.revenueVariationPercentage ??
                  0
                ) >= 0
                  ? 'positive'
                  : 'critical',
            },
            {
              label: 'Marcas analizadas',
              value:
                summary?.totalBrands ??
                0,
              helper: `${summary?.activeBrands ?? 0} activas`,
              icon: <Building2 size={17} />,
              tone: 'default',
            },
            {
              label: 'Requieren atención',
              value:
                summary?.brandsRequiringAttention ??
                0,
              helper: `${summary?.decliningBrands ?? 0} con tendencia decreciente`,
              icon: <AlertTriangle size={17} />,
              tone: 'attention',
            },
          ]}
          score={{
            score:
              activeBrandCoverage,
            label:
              summary &&
              summary.totalBrands > 0
                ? `${summary.activeBrands} de ${summary.totalBrands} activas`
                : 'Sin datos',
            caption:
              'Cobertura activa',
            emptyStateMessage:
              'Disponible cuando existan marcas analizadas en el periodo.',
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
              {workspaceIsAvailable && (
                <CheckCircle2 size={13} />
              )}

              {workspaceIsAvailable
                ? 'Datos disponibles'
                : 'Sin datos'}
            </span>
          }
          summaryItems={[
            {
              label: 'Estado',
              value:
                workspaceIsAvailable
                  ? 'Datos actualizados'
                  : 'Pendiente de importación',
              tone:
                workspaceIsAvailable
                  ? 'positive'
                  : 'attention',
            },
            {
              label: 'Periodo',
              value: periodLabel,
            },
            {
              label: 'Repositorio',
              value:
                'Business Repository',
            },
            {
              label: 'Cobertura',
              value: `${summary?.activeBrands ?? 0} marcas activas`,
            },
            {
              label: 'En crecimiento',
              value:
                summary?.growingBrands ??
                0,
              tone: 'positive',
            },
            {
              label: 'En descenso',
              value:
                summary?.decliningBrands ??
                0,
              tone: 'critical',
            },
          ]}
          theme="brand"
          title="Centro de Inteligencia de Marcas"
        />
      }
      width="wide"
    >
      {summary ? (
        <KPIGrid
          columns={3}
          gap="spacious"
        >
          <ExecutivePanel
            count={
              summary.decliningBrands
            }
            icon={
              <ArrowDownRight
                size={19}
              />
            }
            subtitle={`${formatCurrency(
              summary.revenueVariation,
            )} netos frente al periodo anterior`}
            title="Recuperación prioritaria"
            tone="critical"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <PortfolioMetric
                  label="En descenso"
                  tone="critical"
                  value={
                    summary.decliningBrands
                  }
                />

                <PortfolioMetric
                  label="Pérdida bruta"
                  tone="critical"
                  value={formatCurrency(
                    -decliningGrossLoss,
                  )}
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Mayor impacto negativo
                  </p>

                  {decliningConcentration !==
                    null && (
                    <span className="text-xs font-medium text-rose-600">
                      Top 5 explican{' '}
                      {formatConcentration(
                        decliningConcentration,
                      )}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {summary.topDecliningBrands
                    .slice(0, 5)
                    .map(
                      (
                        brand,
                        index,
                      ) => (
                        <BrandPriorityItem
                          brand={brand}
                          key={
                            brand.brandId
                          }
                          position={
                            index + 1
                          }
                        />
                      ),
                    )}

                  {summary
                    .topDecliningBrands
                    .length === 0 && (
                    <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                      No existen
                      marcas con
                      descenso para
                      este periodo.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
                  Prioridad
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Prioriza las marcas
                  con mayor pérdida
                  absoluta y revisa
                  clientes, productos,
                  disponibilidad y
                  precio antes de
                  ampliar portafolio.
                </p>
              </div>
            </div>
          </ExecutivePanel>

          <ExecutivePanel
            count={
              summary.growingBrands
            }
            icon={
              <ArrowUpRight
                size={19}
              />
            }
            subtitle="Marcas con tracción positiva frente al periodo comparable"
            title="Crecimiento a proteger"
            tone="positive"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <PortfolioMetric
                  label="En crecimiento"
                  tone="positive"
                  value={
                    summary.growingBrands
                  }
                />

                <PortfolioMetric
                  label="Crecimiento bruto"
                  tone="positive"
                  value={formatCurrency(
                    growingGrossGain,
                  )}
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Principales impulsores
                  </p>

                  {growingConcentration !==
                    null && (
                    <span className="text-xs font-medium text-emerald-600">
                      Top 5 concentran{' '}
                      {formatConcentration(
                        growingConcentration,
                      )}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {summary.topGrowingBrands
                    .slice(0, 5)
                    .map(
                      (
                        brand,
                        index,
                      ) => (
                        <BrandPriorityItem
                          brand={brand}
                          key={
                            brand.brandId
                          }
                          position={
                            index + 1
                          }
                        />
                      ),
                    )}

                  {summary
                    .topGrowingBrands
                    .length === 0 && (
                    <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                      No existen
                      marcas con
                      crecimiento para
                      este periodo.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Protección
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Protege inventario,
                  órdenes abiertas y
                  cobertura comercial
                  de las marcas que
                  sostienen el
                  crecimiento antes de
                  incrementar demanda.
                </p>
              </div>
            </div>
          </ExecutivePanel>

          <ExecutivePanel
            count={
              summary.brandsRequiringAttention
            }
            icon={
              <AlertTriangle
                size={19}
              />
            }
            subtitle="Cobertura y reactivación del portafolio"
            title="Cobertura comercial"
            tone="attention"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <PortfolioMetric
                  label="Inactivas"
                  tone="attention"
                  value={
                    summary.inactiveBrands
                  }
                />

                <PortfolioMetric
                  label="Perdidas"
                  tone="critical"
                  value={
                    summary.lostBrands
                  }
                />

                <PortfolioMetric
                  label="Recuperadas"
                  tone="positive"
                  value={
                    summary.recoveredBrands
                  }
                />

                <PortfolioMetric
                  label="Nuevas"
                  tone="intelligence"
                  value={
                    summary.newBrands
                  }
                />
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Prioridad de atención
                </p>

                <div className="space-y-3">
                  {summary.attentionBrands
                    .slice(0, 5)
                    .map(
                      (
                        brand,
                        index,
                      ) => (
                        <article
                          className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 transition-colors duration-200 hover:border-amber-200 hover:bg-amber-50 motion-reduce:transition-none"
                          key={
                            brand.brandId
                          }
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-amber-700 shadow-sm">
                              {index + 1}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {
                                  brand.brandName
                                }
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

                  {summary
                    .attentionBrands
                    .length === 0 && (
                    <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                      No existen
                      alertas
                      comerciales para
                      este periodo.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  Reactivación
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Prioriza las marcas
                  con historial
                  comercial reciente y
                  concentra seguimiento
                  en las oportunidades
                  recuperables antes de
                  ampliar cobertura.
                </p>
              </div>
            </div>
          </ExecutivePanel>
        </KPIGrid>
      ) : (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <CircleDashed
            className="mx-auto text-slate-300"
            size={42}
          />

          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Sin información de marcas
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Importa un archivo de
            ventas desde Data Center
            para generar los
            indicadores de Brand
            Intelligence.
          </p>
        </section>
      )}

      {summary && (
        <div className="mt-6">
          <SmartBrandDirectory
            brands={
              workspace.filteredBrands
            }
            filters={
              workspace.filters
            }
            onAttentionChange={
              workspace.actions
                .setRequiresAttention
            }
            onLifecycleChange={
              workspace.actions
                .setLifecycleFilter
            }
            onResetFilters={
              workspace.actions
                .resetFilters
            }
            onSearchChange={
              workspace.actions
                .setSearch
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
            onSortDirectionChange={
              workspace.actions
                .setSortDirection
            }
            onSortFieldChange={
              workspace.actions
                .setSortField
            }
            onTrendChange={
              workspace.actions
                .setTrendFilter
            }
            selectedBrandId={
              workspace.selectedBrandId
            }
            sortDirection={
              workspace.sortDirection
            }
            sortField={
              workspace.sortField
            }
            totalBrands={
              summary.totalBrands
            }
          />
        </div>
      )}
    </ExecutiveShell>
  )
}