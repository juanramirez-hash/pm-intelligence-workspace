import {
  useState,
} from 'react'

import {
  BadgeDollarSign,
  BarChart3,
  Building2,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Home,
  LoaderCircle,
  Package,
  Printer,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  Users,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  useAuth,
} from '../../auth/useAuth'

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
  SalesCommercialOpportunityPanel,
  SalesDetailTable,
  SalesExecutiveSummaryPanel,
  SalesPerformancePanel,
  SalesRankingPanel,
  SalesReconciliationPanel,
  SalesSegmentationFilterPanel,
  SalesTrendPanel,
  SalesVarianceContributionPanel,
  SalesWorkspaceFilterBar,
} from '../components'

import {
  exportSalesWorkspaceWorkbook,
} from '../export'

import {
  useSalesWorkspace,
} from '../hooks'

import type {
  SalesCommercialOpportunity,
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

type OpportunityActionStatus =
  | 'creating'
  | 'created'
  | 'existing'
  | 'error'

interface OpportunityActionState {
  status: OpportunityActionStatus
  message: string | null
}

interface CreateActionResponse {
  ok?: boolean
  created?: boolean
  actionId?: number
  error?: string
}

function getActionHorizon(
  priority: SalesCommercialOpportunity['priority'],
): 'immediate' | 'short' | 'medium' {
  switch (priority) {
    case 'critical':
      return 'immediate'
    case 'high':
    case 'medium':
      return 'short'
    case 'low':
      return 'medium'
  }
}

export function SalesWorkspacePage() {
  const [isExporting, setIsExporting] =
    useState(false)

  const [exportStatus, setExportStatus] =
    useState<string | null>(null)

  const [
    opportunityActionStates,
    setOpportunityActionStates,
  ] =
    useState<
      Record<
        string,
        OpportunityActionState
      >
    >({})

  const { user } =
    useAuth()

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

  const handlePrint = () => {
    window.print()
  }

  const handleExport = async () => {
    if (!workspace.available || isExporting) {
      return
    }

    setIsExporting(true)
    setExportStatus(null)

    try {
      const fileName =
        await exportSalesWorkspaceWorkbook(
          workspace,
        )

      setExportStatus(
        `Exportación generada: ${fileName}`,
      )
    } catch {
      setExportStatus(
        'No fue posible generar el archivo ejecutivo.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  const clearSegmentation = () => {
    workspace.actions.clearDimension('brand')
    workspace.actions.clearDimension('customer')
    workspace.actions.clearDimension('product')
    workspace.actions.clearDimension('location')
    workspace.actions.clearDimension('salesRepresentative')
    workspace.actions.clearDimension('search')
  }

  const getOpportunityBrandId = (
    opportunity: SalesCommercialOpportunity,
  ): string | null => {
    if (
      opportunity.entityType === 'brand' &&
      opportunity.entityId
    ) {
      return opportunity.entityId
    }

    if (
      opportunity.entityType === 'customer' ||
      opportunity.entityType === 'product'
    ) {
      const selectedBrandIds =
        workspace.filters.brandIds ?? []

      if (selectedBrandIds.length === 1) {
        return selectedBrandIds[0]
      }
    }

    return null
  }

  const getOpportunityActionAvailability = (
    opportunity: SalesCommercialOpportunity,
  ) => {
    if (
      opportunity.entityType === 'workspace'
    ) {
      return {
        enabled: false,
        reason:
          'Esta oportunidad no tiene una entidad compatible con Centro de Acciones.',
      }
    }

    if (!opportunity.entityId) {
      return {
        enabled: false,
        reason:
          'La oportunidad no tiene un identificador de entidad.',
      }
    }

    if (
      opportunity.entityType === 'brand'
    ) {
      return {
        enabled: true,
        reason: null,
      }
    }

    const selectedBrandIds =
      workspace.filters.brandIds ?? []

    if (selectedBrandIds.length !== 1) {
      return {
        enabled: false,
        reason:
          'Selecciona una sola marca en Sales Workspace para convertir esta oportunidad en acción.',
      }
    }

    return {
      enabled: true,
      reason: null,
    }
  }

  const getOpportunityActionKey = (
    opportunity: SalesCommercialOpportunity,
  ): string => {
    const periodId =
      workspace.filters.periodId ??
      current?.periodId ??
      'sin-periodo'

    const brandId =
      getOpportunityBrandId(
        opportunity,
      ) ?? 'sin-marca'

    return [
      periodId,
      brandId,
      opportunity.id,
    ].join('::')
  }

  const getOpportunityActionState = (
    opportunity: SalesCommercialOpportunity,
  ) =>
    opportunityActionStates[
      getOpportunityActionKey(
        opportunity,
      )
    ]

  const handleCreateOpportunityAction =
    async (
      opportunity: SalesCommercialOpportunity,
    ) => {
      if (!user.writeAccess) {
        return
      }

      const availability =
        getOpportunityActionAvailability(
          opportunity,
        )

      if (!availability.enabled) {
        return
      }

      if (
        opportunity.entityType ===
          'workspace' ||
        !opportunity.entityId
      ) {
        return
      }

      const periodId =
        workspace.filters.periodId ??
        current?.periodId ??
        null

      const brandId =
        getOpportunityBrandId(
          opportunity,
        )

      if (!periodId || !brandId) {
        return
      }

      const actionKey =
        getOpportunityActionKey(
          opportunity,
        )

      if (
        opportunityActionStates[
          actionKey
        ]?.status === 'creating'
      ) {
        return
      }

      setOpportunityActionStates(
        (currentStates) => ({
          ...currentStates,
          [actionKey]: {
            status: 'creating',
            message:
              'Registrando acción...',
          },
        }),
      )

      try {
        const response =
          await fetch(
            '/api/actions',
            {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                brandId,
                periodId,
                origin: 'rule',
                originRuleCode:
                  opportunity.id,
                originEntityType:
                  opportunity.entityType,
                originEntityId:
                  opportunity.entityId,
                title:
                  opportunity.title,
                description:
                  `${opportunity.description}\n\nAcción recomendada: ${opportunity.recommendedAction}`,
                horizon:
                  getActionHorizon(
                    opportunity.priority,
                  ),
                priority:
                  opportunity.priority,
                metricKind: 'none',
                baselineValue: null,
                targetValue: null,
                evidence: {
                  source:
                    'sales-workspace',
                  opportunityId:
                    opportunity.id,
                  opportunityType:
                    opportunity.type,
                  entityLabel:
                    opportunity.entityLabel,
                  recommendedAction:
                    opportunity.recommendedAction,
                  impact:
                    opportunity.impact,
                  score:
                    opportunity.score,
                  confidence:
                    opportunity.confidence,
                  effort:
                    opportunity.effort,
                  currentRevenue:
                    opportunity.currentRevenue,
                  comparisonRevenue:
                    opportunity.comparisonRevenue,
                  variance:
                    opportunity.variance,
                  variancePercentage:
                    opportunity.variancePercentage,
                  dailyRevenueRequired:
                    opportunity.dailyRevenueRequired,
                  indicators:
                    opportunity.evidence,
                  filters: {
                    brandIds:
                      workspace.filters.brandIds ??
                      [],
                    customerIds:
                      workspace.filters.customerIds ??
                      [],
                    productIds:
                      workspace.filters.productIds ??
                      [],
                    locationIds:
                      workspace.filters.locationIds ??
                      [],
                    salesRepresentativeIds:
                      workspace.filters.salesRepresentativeIds ??
                      [],
                    searchTerm:
                      workspace.filters.searchTerm ??
                      null,
                  },
                },
              }),
            },
          )

        const result =
          await response
            .json()
            .catch(
              () =>
                null,
            ) as
            | CreateActionResponse
            | null

        if (
          !response.ok ||
          !result?.ok
        ) {
          throw new Error(
            result?.error ??
              'No fue posible crear la acción.',
          )
        }

        setOpportunityActionStates(
          (currentStates) => ({
            ...currentStates,
            [actionKey]: {
              status:
                result.created === false
                  ? 'existing'
                  : 'created',
              message:
                result.created === false
                  ? 'La acción ya estaba abierta; la señal fue reconfirmada en su historial.'
                  : 'Acción creada y disponible en Centro de Acciones.',
            },
          }),
        )
      } catch (error) {
        setOpportunityActionStates(
          (currentStates) => ({
            ...currentStates,
            [actionKey]: {
              status: 'error',
              message:
                error instanceof Error
                  ? error.message
                  : 'No fue posible crear la acción.',
            },
          }),
        )
      }
    }

  const openOpportunitySegment = (
    opportunity: SalesCommercialOpportunity,
  ) => {
    if (!opportunity.entityId) {
      return
    }

    switch (opportunity.entityType) {
      case 'brand':
        workspace.actions.setDimensionValues(
          'brand',
          [opportunity.entityId],
        )
        break
      case 'customer':
        workspace.actions.setDimensionValues(
          'customer',
          [opportunity.entityId],
        )
        break
      case 'product':
        workspace.actions.setDimensionValues(
          'product',
          [opportunity.entityId],
        )
        break
      case 'workspace':
        break
    }
  }

  return (
    <ExecutiveShell
      beforeContent={
        <div data-print-hidden="true">
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
        </div>
      }
      header={
        <ExecutiveHero
          actions={
            <div data-print-hidden="true">
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

                <ShellActionsGroup label="Salida ejecutiva">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                    onClick={handlePrint}
                    type="button"
                  >
                    <Printer size={16} />
                    Imprimir / PDF
                  </button>

                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!workspace.available || isExporting}
                    onClick={() => {
                      void handleExport()
                    }}
                    type="button"
                  >
                    {isExporting ? (
                      <LoaderCircle
                        className="animate-spin"
                        size={16}
                      />
                    ) : (
                      <Download size={16} />
                    )}
                    {isExporting
                      ? 'Exportando...'
                      : 'Exportar Excel'}
                  </button>
                </ShellActionsGroup>
              </ShellActions>
            </div>
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
              label: 'Clientes activos',
              value: current?.customerCount ?? 0,
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
      <div
        className="space-y-6"
        data-print-hidden="true"
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

        <SalesSegmentationFilterPanel
          activeFilters={workspace.activeFilters}
          filters={workspace.filters}
          onClearDimension={workspace.actions.clearDimension}
          onDimensionChange={workspace.actions.setDimensionValues}
          onReset={clearSegmentation}
          onSearchTermChange={workspace.actions.setSearchTerm}
          options={workspace.filterOptions}
        />

        {exportStatus && (
          <p
            aria-live="polite"
            className="text-right text-xs font-medium text-slate-500"
          >
            {exportStatus}
          </p>
        )}
      </div>

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
          icon={<Users size={19} />}
          insight="Clientes únicos con actividad de venta en el corte seleccionado."
          source="Business Repository"
          title="Clientes activos"
          tone="neutral"
          trend={getTrend(
            workspace.comparison.customerCountVariation ?? null,
            workspace.comparison.label,
          )}
          value={formatSalesInteger(
            current?.customerCount ?? 0,
          )}
        />
      </KPIGrid>

      <SalesExecutiveSummaryPanel
        summary={workspace.executiveSummary}
      />

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
            Sales Performance Analytics
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Objetivo, ritmo laboral y Forecast esperado
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Consolida las cuotas mensuales por marca, separa el cierre por ritmo actual del Forecast Project-Aware y mide el avance contra los días laborables transcurridos al corte de ventas.
          </p>
        </div>

        <div className="space-y-6">
          <SalesPerformancePanel
            performance={workspace.performance}
          />

          {workspace.performance.available && (
            <SalesBrandPerformanceTable
              items={workspace.brandPerformance}
            />
          )}
        </div>
      </section>

      <SalesVarianceContributionPanel
        analysis={workspace.varianceContribution}
      />

      <SalesCommercialOpportunityPanel
        getActionState={
          getOpportunityActionState
        }
        getCreateActionAvailability={
          getOpportunityActionAvailability
        }
        onCreateAction={
          user.writeAccess
            ? (opportunity) => {
                void handleCreateOpportunityAction(
                  opportunity,
                )
              }
            : undefined
        }
        onSelect={openOpportunitySegment}
        summary={workspace.commercialOpportunities}
      />

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
            onSelect={(id) =>
              workspace.actions.setDimensionValues(
                'brand',
                [id],
              )
            }
            selectedId={workspace.filters.brandIds?.[0] ?? null}
            subtitle="Top 5 por venta. Selecciona una marca para profundizar."
            title="Marcas"
          />

          <SalesRankingPanel
            icon={Users}
            items={workspace.topCustomers}
            onSelect={(id) =>
              workspace.actions.setDimensionValues(
                'customer',
                [id],
              )
            }
            selectedId={workspace.filters.customerIds?.[0] ?? null}
            subtitle="Top 5 por venta. Selecciona un cliente para profundizar."
            title="Clientes"
          />

          <SalesRankingPanel
            icon={Package}
            items={workspace.topProducts}
            onSelect={(id) =>
              workspace.actions.setDimensionValues(
                'product',
                [id],
              )
            }
            selectedId={workspace.filters.productIds?.[0] ?? null}
            subtitle="Top 5 por venta. Selecciona un producto para profundizar."
            title="Productos"
          />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Detalle transaccional agregado
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Drill-down del segmento seleccionado
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Presenta combinaciones exactas construidas por Business Repository, sin exponer filas normalizadas ni colecciones internas al Workspace.
          </p>
        </div>

        <SalesDetailTable
          items={workspace.detailRows}
          sourceRows={workspace.detailSourceRows}
          totalRows={workspace.detailTotalRows}
        />
      </section>
    </ExecutiveShell>
  )
}