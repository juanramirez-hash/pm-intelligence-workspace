import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  Home,
  Package,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  Users,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router-dom'

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
  IntelligentKpiCard,
} from '../../../atlas/widgets/kpi'

import {
  SalesBrandPerformanceTable,
  SalesPerformancePanel,
  SalesRankingPanel,
  SalesReconciliationPanel,
  SalesTrendPanel,
  SalesWorkspaceFilterBar,
} from '../components'

import {
  useSalesWorkspace,
} from '../hooks'

import type {
  SalesWorkspaceComparison,
} from '../types'

import {
  formatSalesCurrency,
  formatSalesInteger,
  formatSalesPercentage,
} from '../utils'

function getTrend(
  value: number | null,
  label: string,
) {
  if (value === null) {
    return undefined
  }

  return {
    direction:
      value > 0
        ? 'up' as const
        : value < 0
          ? 'down' as const
          : 'stable' as const,
    sentiment:
      value > 0
        ? 'positive' as const
        : value < 0
          ? 'negative' as const
          : 'neutral' as const,
    value:
      formatSalesPercentage(
        value,
        {
          signed: true,
        },
      ),
    label,
  }
}

function getComparisonContext(
  comparison: SalesWorkspaceComparison,
): string {
  return comparison.previousPeriodLabel
    ? `vs. ${comparison.previousPeriodLabel}`
    : 'Sin periodo comparable'
}

function getScoreTone(
  score: number,
) {
  if (score >= 90) {
    return 'healthy' as const
  }

  if (score >= 70) {
    return 'attention' as const
  }

  return 'critical' as const
}

export function SalesWorkspacePage() {
  const navigate =
    useNavigate()

  const workspace =
    useSalesWorkspace()

  const current =
    workspace.current

  const comparisonContext =
    getComparisonContext(
      workspace.comparison,
    )

  const reconciliationAvailable =
    workspace.reconciliation.totalRows > 0

  const reconciliationScore =
    reconciliationAvailable
      ? workspace.reconciliation.matchRate
      : null

  const averageDocumentValue =
    current &&
    current.documents > 0
      ? current.revenue /
        current.documents
      : 0

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
              label: 'Sales Workspace',
            },
          ]}
        />
      }
      header={
        <ExecutiveHero
          actions={
            <ShellActions ariaLabel="Acciones de Sales Workspace">
              <ShellActionsGroup label="Gestión del workspace">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                  onClick={
                    workspace.actions.resetFilters
                  }
                  type="button"
                >
                  <RotateCcw size={16} />
                  Limpiar filtros
                </button>

                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  onClick={() =>
                    navigate('/data-center')
                  }
                  type="button"
                >
                  <Database size={16} />
                  Importar datos
                </button>
              </ShellActionsGroup>
            </ShellActions>
          }
          description="Concentra el desempeño comercial mensual, sus variaciones y los principales impulsores por marca, cliente y producto."
          eyebrow="Sales Intelligence"
          icon={<BadgeDollarSign size={22} />}
          metadata={
            <>
              <span>
                Periodo: {workspace.selectedPeriodLabel}
              </span>

              <span>
                Fuente: Business Repository
              </span>
            </>
          }
          metrics={[
            {
              label: 'Venta del periodo',
              value: formatSalesCurrency(
                current?.revenue ?? 0,
              ),
              helper: comparisonContext,
              icon: <BarChart3 size={17} />,
              tone: 'intelligence',
            },
            {
              label: 'Gross Profit',
              value: formatSalesCurrency(
                current?.grossProfit ?? 0,
              ),
              helper:
                current
                  ? `Margen ${formatSalesPercentage(current.grossMargin)}`
                  : 'Sin datos',
              icon: <BadgeDollarSign size={17} />,
              tone:
                (current?.grossMargin ?? 0) >= 25
                  ? 'positive'
                  : 'attention',
            },
            {
              label: 'Documentos',
              value: formatSalesInteger(
                current?.documents ?? 0,
              ),
              helper: `Ticket promedio ${formatSalesCurrency(averageDocumentValue)}`,
              icon: <ReceiptText size={17} />,
              tone: 'default',
            },
            {
              label: 'Clientes activos',
              value: formatSalesInteger(
                current?.customerCount ?? 0,
              ),
              helper: `${formatSalesInteger(current?.productCount ?? 0)} productos vendidos`,
              icon: <Users size={17} />,
              tone: 'default',
            },
          ]}
          score={{
            score: reconciliationScore,
            label:
              reconciliationAvailable
                ? `${formatSalesPercentage(reconciliationScore)} conciliado`
                : 'Product Master pendiente',
            caption: 'Calidad de conciliación',
            tone:
              reconciliationScore === null
                ? 'neutral'
                : getScoreTone(
                    reconciliationScore,
                  ),
          }}
          status={
            <span
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                workspace.available
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600',
              ].join(' ')}
            >
              {workspace.available && (
                <CheckCircle2 size={13} />
              )}

              {workspace.available
                ? 'Datos disponibles'
                : 'Sin datos'}
            </span>
          }
          summaryItems={[
            {
              label: 'Comparación',
              value: workspace.comparison.label,
            },
            {
              label: 'Periodo base',
              value:
                workspace.comparison.previousPeriodLabel ??
                'No disponible',
            },
            {
              label: 'Marcas activas',
              value: current?.brandCount ?? 0,
            },
            {
              label: 'Productos activos',
              value: current?.productCount ?? 0,
            },
            {
              label: 'Última carga',
              value:
                workspace.health.lastImportedAt ??
                'Sin registro',
            },
            {
              label: 'Estado',
              value: workspace.available
                ? 'Operativo'
                : 'Pendiente de importación',
              tone: workspace.available
                ? 'positive'
                : 'attention',
            },
          ]}
          theme="sales"
          title="Centro de Inteligencia de Ventas"
        />
      }
      width="wide"
    >
      <SalesWorkspaceFilterBar
        comparisonMode={
          workspace.filters.comparisonMode
        }
        effectivePeriodLabel={
          workspace.selectedPeriodLabel
        }
        filterPeriodId={
          workspace.filters.periodId
        }
        onComparisonModeChange={
          workspace.actions.setComparisonMode
        }
        onPeriodChange={
          workspace.actions.setPeriodId
        }
        onReset={
          workspace.actions.resetFilters
        }
        periodOptions={
          workspace.periodOptions
        }
      />

      <KPIGrid columns={4} gap="compact">
        <IntelligentKpiCard
          context={comparisonContext}
          icon={<ShoppingCart size={19} />}
          insight="Valor total facturado en el corte comercial seleccionado."
          source="Business Repository"
          title="Venta"
          tone="intelligence"
          trend={getTrend(
            workspace.comparison.revenueVariation,
            workspace.comparison.label,
          )}
          value={formatSalesCurrency(
            current?.revenue ?? 0,
          )}
        />

        <IntelligentKpiCard
          context={comparisonContext}
          icon={<BadgeDollarSign size={19} />}
          insight="Utilidad bruta generada antes de gastos operativos."
          source="Business Repository"
          title="Gross Profit"
          tone="positive"
          trend={getTrend(
            workspace.comparison.grossProfitVariation,
            workspace.comparison.label,
          )}
          value={formatSalesCurrency(
            current?.grossProfit ?? 0,
          )}
        />

        <IntelligentKpiCard
          context={comparisonContext}
          icon={<FileText size={19} />}
          insight="Margen bruto sobre la venta del periodo."
          source="Business Repository"
          title="Margen"
          tone={
            (current?.grossMargin ?? 0) >= 25
              ? 'positive'
              : 'attention'
          }
          trend={
            workspace.comparison.marginPointVariation === null
              ? undefined
              : {
                  direction:
                    workspace.comparison.marginPointVariation > 0
                      ? 'up'
                      : workspace.comparison.marginPointVariation < 0
                        ? 'down'
                        : 'stable',
                  sentiment:
                    workspace.comparison.marginPointVariation > 0
                      ? 'positive'
                      : workspace.comparison.marginPointVariation < 0
                        ? 'negative'
                        : 'neutral',
                  value: formatSalesPercentage(
                    workspace.comparison.marginPointVariation,
                    {
                      signed: true,
                      suffix: ' pp',
                    },
                  ),
                  label: workspace.comparison.label,
                }
          }
          value={formatSalesPercentage(
            current?.grossMargin ?? 0,
          )}
        />

        <IntelligentKpiCard
          context={comparisonContext}
          icon={<Boxes size={19} />}
          insight="Unidades comerciales registradas en el periodo."
          source="Business Repository"
          title="Cantidad"
          tone="neutral"
          trend={getTrend(
            workspace.comparison.quantityVariation,
            workspace.comparison.label,
          )}
          value={formatSalesInteger(
            current?.quantity ?? 0,
          )}
        />
      </KPIGrid>

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
            Sales Performance Analytics
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Objetivo, ritmo laboral y proyección de cierre
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Consolida las cuotas mensuales por marca y mide el avance contra los días laborables transcurridos al corte de ventas.
          </p>
        </div>

        <div className="space-y-6">
          <SalesPerformancePanel
            performance={workspace.performance}
          />

          <SalesBrandPerformanceTable
            items={workspace.brandPerformance}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.8fr)]">
        <SalesTrendPanel
          trend={workspace.trend}
        />

        <SalesReconciliationPanel
          reconciliation={
            workspace.reconciliation
          }
        />
      </div>

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Impulsores comerciales
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Principales contribuyentes del periodo
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Rankings calculados sobre el mismo corte seleccionado en los filtros globales.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <SalesRankingPanel
            icon={Building2}
            items={workspace.topBrands}
            subtitle="Top 5 por venta del periodo."
            title="Marcas"
          />

          <SalesRankingPanel
            icon={Users}
            items={workspace.topCustomers}
            subtitle="Top 5 por venta del periodo."
            title="Clientes"
          />

          <SalesRankingPanel
            icon={Package}
            items={workspace.topProducts}
            subtitle="Top 5 por venta del periodo."
            title="Productos"
          />
        </div>
      </section>
    </ExecutiveShell>
  )
}
