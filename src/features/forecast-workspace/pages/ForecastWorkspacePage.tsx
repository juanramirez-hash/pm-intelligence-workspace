import {
  AlertTriangle,
  BadgeDollarSign,
  Boxes,
  CheckCircle2,
  CircleGauge,
  Crosshair,
  Database,
  FileSpreadsheet,
  Home,
  PackageCheck,
  PackageX,
  Printer,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import {
  Link,
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
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  ForecastScenarioId,
  ForecastTargetStatus,
} from '../../../core/business/forecast'

import {
  ForecastBrandTable,
  ForecastCoveragePanel,
  ForecastFilterBar,
  ForecastPriorityList,
  ForecastScenarioSelector,
} from '../components'

import {
  buildForecastExecutiveSummary,
} from '../engine/buildForecastExecutiveSummary'

import {
  buildForecastExecutiveExport,
  downloadForecastExecutiveExport,
} from '../export'

import {
  useForecastWorkspace,
} from '../hooks/useForecastWorkspace'

import {
  DEFAULT_FORECAST_WORKSPACE_FILTERS,
} from '../types/forecastWorkspaceTypes'

import type {
  ForecastWorkspaceFilters,
  ForecastWorkspaceStatus,
} from '../types/forecastWorkspaceTypes'

import {
  formatForecastCurrency,
  formatForecastDate,
  formatForecastInteger,
  formatForecastPercentage,
} from '../utils/forecastWorkspaceFormatters'

function confidenceLabel(
  level: 'low' | 'medium' | 'high' | null,
): string {
  if (level === 'high') {
    return 'Confianza alta'
  }

  if (level === 'medium') {
    return 'Confianza media'
  }

  if (level === 'low') {
    return 'Confianza baja'
  }

  return 'Sin confianza calculada'
}

function confidenceTone(
  level: 'low' | 'medium' | 'high' | null,
) {
  if (level === 'high') {
    return 'healthy' as const
  }

  if (level === 'medium') {
    return 'attention' as const
  }

  if (level === 'low') {
    return 'critical' as const
  }

  return 'neutral' as const
}

function targetTone(
  status: ForecastTargetStatus,
) {
  if (
    status === 'achieved' ||
    status === 'ahead' ||
    status === 'on-track'
  ) {
    return 'positive' as const
  }

  if (status === 'behind') {
    return 'critical' as const
  }

  return 'default' as const
}

function workspaceStatusPresentation(
  status: ForecastWorkspaceStatus,
) {
  if (status === 'ready') {
    return {
      label: 'Forecast Intelligence conectado',
      className: 'bg-emerald-100 text-emerald-700',
      icon: <CheckCircle2 size={13} />,
    }
  }

  if (status === 'partial') {
    return {
      label: 'Forecast disponible con limitaciones',
      className: 'bg-amber-100 text-amber-800',
      icon: <AlertTriangle size={13} />,
    }
  }

  return {
    label: 'Forecast no disponible',
    className: 'bg-rose-100 text-rose-700',
    icon: <PackageX size={13} />,
  }
}

function scenarioLabel(
  scenarioId: ForecastScenarioId,
): string {
  if (scenarioId === 'conservative') {
    return 'Conservador'
  }

  if (scenarioId === 'accelerated') {
    return 'Acelerado'
  }

  return 'Esperado'
}

function hasActiveFilters(
  filters: ForecastWorkspaceFilters,
): boolean {
  return (
    filters.search !== '' ||
    filters.brandId !== 'all' ||
    filters.coverage !== 'all' ||
    filters.priority !== 'all' ||
    filters.confidence !== 'all'
  )
}

export function ForecastWorkspacePage() {
  const [scenarioId, setScenarioId] =
    useState<ForecastScenarioId>('expected')
  const [filters, setFilters] =
    useState<ForecastWorkspaceFilters>({
      ...DEFAULT_FORECAST_WORKSPACE_FILTERS,
    })
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportFileName, setExportFileName] = useState<string | null>(null)

  const request = useMemo(
    () => ({
      scenarioId,
      filters,
      rankingLimit: Number.MAX_SAFE_INTEGER,
    }),
    [scenarioId, filters],
  )

  const workspace = useForecastWorkspace(request)
  const status = workspaceStatusPresentation(workspace.status)
  const filtersActive = hasActiveFilters(filters)
  const visibleRiskRanking = workspace.riskRanking.slice(0, 10)
  const visibleOpportunityRanking = workspace.opportunityRanking.slice(0, 10)

  const executiveSummary = useMemo(
    () => buildForecastExecutiveSummary(workspace),
    [workspace],
  )

  const resetFilters = () => {
    setFilters({
      ...DEFAULT_FORECAST_WORKSPACE_FILTERS,
    })
  }

  const handleExecutiveExport = async (): Promise<void> => {
    if (!workspace.available || isExporting) {
      return
    }

    setIsExporting(true)
    setExportError(null)
    setExportFileName(null)

    try {
      const payload = buildForecastExecutiveExport({
        workspace,
        summary: executiveSummary,
      })

      await downloadForecastExecutiveExport(payload)
      setExportFileName(payload.fileName)
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : 'No fue posible generar el archivo Excel.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <ExecutiveShell
      beforeContent={(
        <div data-print-hidden="true">
          <ExecutiveBreadcrumbs
            items={[
              {
                label: 'Inicio',
                href: '/',
                icon: <Home size={14} />,
              },
              {
                label: 'Forecast Workspace',
              },
            ]}
          />
        </div>
      )}
      header={(
        <ExecutiveHero
          actions={(
            <div data-print-hidden="true">
              <ShellActions ariaLabel="Acciones de Forecast Workspace">
                <ShellActionsGroup label="Gestión del workspace">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!filtersActive}
                    onClick={resetFilters}
                    type="button"
                  >
                    <RotateCcw size={16} />
                    Limpiar filtros
                  </button>

                  <Link
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    to="/data-center"
                  >
                    <Database size={16} />
                    Importar datos
                  </Link>
                </ShellActionsGroup>

                <ShellActionsGroup label="Salida ejecutiva">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!workspace.available || isExporting}
                    onClick={handleExecutiveExport}
                    type="button"
                  >
                    <FileSpreadsheet size={16} />
                    {isExporting ? 'Generando Excel...' : 'Exportar Excel'}
                  </button>

                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                    onClick={() => window.print()}
                    type="button"
                  >
                    <Printer size={16} />
                    Imprimir / PDF
                  </button>
                </ShellActionsGroup>
              </ShellActions>
            </div>
          )}
          description="Proyecta el cierre comercial y conecta demanda, objetivos, inventario, cobertura y sustituciones para priorizar decisiones del Product Manager."
          eyebrow="Forecast Decision Intelligence"
          icon={<Crosshair size={22} />}
          metadata={(
            <>
              <span>
                Periodo: {workspace.period.currentPeriodId ?? 'Sin periodo'}
              </span>
              <span>
                Corte de ventas: {formatForecastDate(workspace.period.dataCutoff)}
              </span>
              <span>
                Corte de inventario: {formatForecastDate(workspace.period.snapshotDate)}
              </span>
            </>
          )}
          metricFooter={workspace.scenarios.length > 0 ? (
            <ForecastScenarioSelector
              disabled={!workspace.available}
              onChange={setScenarioId}
              options={workspace.scenarios}
            />
          ) : undefined}
          metrics={[
            {
              label: 'Cierre proyectado',
              value: formatForecastCurrency(
                workspace.portfolio.projected.revenue,
                true,
              ),
              helper: `Escenario ${scenarioLabel(workspace.scenarioId).toLowerCase()}`,
              icon: <TrendingUp size={17} />,
              tone: 'intelligence',
            },
            {
              label: 'Cumplimiento esperado',
              value: formatForecastPercentage(
                workspace.portfolio.targetAttainment,
              ),
              helper: `Objetivo ${formatForecastCurrency(
                workspace.portfolio.targetRevenue,
                true,
              )}`,
              icon: <Target size={17} />,
              tone: targetTone(workspace.portfolio.targetStatus),
            },
            {
              label: 'Brecha contra objetivo',
              value: formatForecastCurrency(
                workspace.portfolio.revenueGap,
                true,
              ),
              helper: workspace.portfolio.revenueGap === 0
                ? 'Sin brecha pendiente'
                : 'Venta adicional requerida',
              icon: <CircleGauge size={17} />,
              tone: workspace.portfolio.revenueGap === 0
                ? 'positive'
                : 'attention',
            },
            {
              label: 'Margen proyectado',
              value: formatForecastPercentage(
                workspace.portfolio.projectedGrossMargin,
              ),
              helper: `GP ${formatForecastCurrency(
                workspace.portfolio.projected.grossProfit,
                true,
              )}`,
              icon: <BadgeDollarSign size={17} />,
              tone: 'positive',
            },
          ]}
          score={{
            score: workspace.portfolio.confidenceScore,
            label: confidenceLabel(workspace.portfolio.confidenceLevel),
            caption: 'Confianza Forecast',
            tone: confidenceTone(workspace.portfolio.confidenceLevel),
          }}
          status={(
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
              {status.icon}
              {status.label}
            </span>
          )}
          summaryItems={[
            {
              label: 'Venta acumulada',
              value: formatForecastCurrency(
                workspace.portfolio.actual.revenue,
                true,
              ),
            },
            {
              label: 'Objetivo mensual',
              value: formatForecastCurrency(
                workspace.portfolio.targetRevenue,
                true,
              ),
            },
            {
              label: 'Ritmo diario requerido',
              value: formatForecastCurrency(
                workspace.portfolio.requiredDailyRevenue,
                true,
              ),
            },
            {
              label: 'Días laborales',
              value: workspace.period.totalWorkingDays === null
                ? '—'
                : `${workspace.period.elapsedWorkingDays ?? 0}/${workspace.period.totalWorkingDays}`,
            },
            {
              label: 'Productos analizados',
              value: formatForecastInteger(
                workspace.inventory.filteredProducts,
              ),
            },
            {
              label: 'Prioridad crítica',
              value: formatForecastInteger(
                workspace.inventory.criticalItems,
              ),
              tone: workspace.inventory.criticalItems > 0
                ? 'critical'
                : 'positive',
            },
            {
              label: 'Metodología',
              value: workspace.methodology.baseline,
            },
          ]}
          theme="forecast"
          title="Centro de Inteligencia de Forecast"
        />
      )}
    >
      {!workspace.available ? (
        <ExecutivePanel
          icon={<Database size={19} />}
          subtitle="El contrato permanece estable, pero no existe información suficiente para generar una proyección."
          title="Forecast no disponible"
          tone="critical"
        >
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
            <p className="text-sm font-semibold text-rose-800">
              {workspace.unavailableReason ?? 'No existe información para construir Forecast Workspace.'}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {workspace.limitations.map((limitation) => (
                <li className="flex gap-2" key={limitation}>
                  <span aria-hidden="true">•</span>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
            <Link
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              to="/data-center"
            >
              <Database size={16} />
              Ir a Data Center
            </Link>
          </div>
        </ExecutivePanel>
      ) : (
        <>
          {(exportError || exportFileName) && (
            <div
              className={[
                'rounded-2xl border px-4 py-3 text-sm font-semibold',
                exportError
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800',
              ].join(' ')}
              data-print-hidden="true"
              role="status"
            >
              {exportError ?? `Excel generado: ${exportFileName}`}
            </div>
          )}

          <KPIGrid columns={6} gap="compact">
            <IntelligentKpiCard
              context={`Corte ${formatForecastDate(workspace.period.dataCutoff)}`}
              icon={<BadgeDollarSign size={19} />}
              insight="Venta acumulada registrada en el periodo actual."
              source="Business Repository"
              status={{
                label: 'Real acumulado',
                tone: 'neutral',
              }}
              title="Venta actual"
              tone="neutral"
              value={formatForecastCurrency(
                workspace.portfolio.actual.revenue,
                true,
              )}
            />

            <IntelligentKpiCard
              context={`Escenario ${scenarioLabel(workspace.scenarioId)}`}
              icon={<TrendingUp size={19} />}
              insight="Cierre mensual generado por Forecast Baseline Engine."
              source={workspace.methodology.baseline}
              status={{
                label: confidenceLabel(workspace.portfolio.confidenceLevel),
                tone: workspace.portfolio.confidenceLevel === 'high'
                  ? 'positive'
                  : workspace.portfolio.confidenceLevel === 'medium'
                    ? 'attention'
                    : 'critical',
              }}
              title="Venta proyectada"
              tone="intelligence"
              value={formatForecastCurrency(
                workspace.portfolio.projected.revenue,
                true,
              )}
            />

            <IntelligentKpiCard
              context={`Margen ${formatForecastPercentage(workspace.portfolio.projectedGrossMargin)}`}
              icon={<BadgeDollarSign size={19} />}
              insight="Gross Profit proyectado para el escenario activo."
              source={workspace.methodology.baseline}
              title="GP proyectado"
              tone="positive"
              value={formatForecastCurrency(
                workspace.portfolio.projected.grossProfit,
                true,
              )}
            />

            <IntelligentKpiCard
              context={`${formatForecastInteger(workspace.inventory.productsWithProjectedDemand)} productos con demanda`}
              icon={<PackageCheck size={19} />}
              insight="Unidades mensuales estimadas para los productos filtrados."
              source={workspace.methodology.inventory}
              title="Demanda proyectada"
              tone="intelligence"
              value={`${formatForecastInteger(workspace.inventory.expectedDemandUnits)} uds.`}
            />

            <IntelligentKpiCard
              context={`${formatForecastInteger(workspace.inventory.inboundUnits)} unidades en tránsito u orden`}
              icon={<Boxes size={19} />}
              insight="Disponibilidad actual antes de atender la demanda restante."
              source="Inventory Repository"
              title="Disponible"
              tone="neutral"
              value={`${formatForecastInteger(workspace.inventory.availableUnits)} uds.`}
            />

            <IntelligentKpiCard
              context={`${workspace.inventory.highPriorityItems} adicionales con prioridad alta`}
              icon={<ShieldAlert size={19} />}
              insight="Productos con intervención prioritaria según cobertura y señales de inventario."
              source={workspace.methodology.inventory}
              status={{
                label: workspace.inventory.criticalItems > 0
                  ? 'Requiere intervención'
                  : 'Sin críticos',
                tone: workspace.inventory.criticalItems > 0
                  ? 'critical'
                  : 'positive',
              }}
              title="Productos críticos"
              tone={workspace.inventory.criticalItems > 0
                ? 'critical'
                : 'positive'}
              value={formatForecastInteger(workspace.inventory.criticalItems)}
            />
          </KPIGrid>

          <div data-forecast-print-section="filters">
            <ExecutivePanel
              count={`${workspace.inventory.filteredProducts}/${workspace.inventory.productsAnalyzed}`}
              icon={<Crosshair size={19} />}
              subtitle="La selección modifica productos, cobertura y rankings; no altera el cierre consolidado del portafolio."
              title="Segmentación del Forecast"
              tone="intelligence"
            >
              <ForecastFilterBar
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                options={workspace.filterOptions}
              />
            </ExecutivePanel>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]" data-forecast-print-section="coverage">
            <ExecutivePanel
              count={workspace.inventory.filteredProducts}
              icon={<CircleGauge size={19} />}
              subtitle="Distribución de productos según disponibilidad y demanda del escenario activo."
              title="Mapa de cobertura"
              tone="attention"
            >
              <ForecastCoveragePanel inventory={workspace.inventory} />
            </ExecutivePanel>

            <ExecutivePanel
              icon={<Truck size={19} />}
              subtitle="Balance operativo entre demanda restante, inventario disponible y entradas agregadas."
              title="Balance de demanda y suministro"
              tone="neutral"
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    label: 'Demanda restante',
                    value: `${formatForecastInteger(workspace.inventory.remainingDemandUnits)} uds.`,
                    detail: 'Consumo pendiente para completar el escenario.',
                  },
                  {
                    label: 'Disponible después de demanda',
                    value: `${formatForecastInteger(workspace.inventory.projectedAvailableAfterDemand)} uds.`,
                    detail: 'Saldo sin considerar entradas futuras.',
                  },
                  {
                    label: 'Suministro después de demanda',
                    value: `${formatForecastInteger(workspace.inventory.projectedSupplyAfterDemand)} uds.`,
                    detail: 'Disponible más In Transit y On Order.',
                  },
                  {
                    label: 'Valor de inventario',
                    value: formatForecastCurrency(workspace.inventory.inventoryValue, true),
                    detail: 'Valor de los productos incluidos por filtros.',
                  },
                  {
                    label: 'Valor afectado',
                    value: formatForecastCurrency(workspace.inventory.affectedInventoryValue, true),
                    detail: 'Inventario con alguna prioridad activa.',
                  },
                  {
                    label: 'Superseded con inventario',
                    value: formatForecastInteger(workspace.inventory.supersededInventoryProducts),
                    detail: `${workspace.inventory.replacementRecoveries} recuperaciones mediante sustituto.`,
                  },
                ].map((item) => (
                  <article
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                    key={item.label}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.detail}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-xs leading-5 text-amber-900">
                Las entradas `In Transit` y `On Order` se consideran de forma agregada. No se muestran fechas de llegada hasta conectar Purchasing Visibility.
              </div>
            </ExecutivePanel>
          </div>

          <div data-forecast-print-section="brands">
            <ExecutivePanel
              count={workspace.brands.length}
              icon={<Target size={19} />}
              subtitle="Comparación de cierre, objetivo, confianza y riesgo de inventario por marca."
              title="Forecast ejecutivo por marca"
              tone="intelligence"
            >
              <ForecastBrandTable rows={workspace.brands} />
            </ExecutivePanel>
          </div>

          <div className="grid gap-6 xl:grid-cols-2" data-forecast-print-section="priorities">
            <ExecutivePanel
              count={visibleRiskRanking.length}
              icon={<ShieldAlert size={19} />}
              subtitle="Productos ordenados por score de señal y valor de inventario afectado."
              title="Prioridades de riesgo"
              tone="critical"
            >
              <ForecastPriorityList
                items={visibleRiskRanking}
                kind="risk"
              />
            </ExecutivePanel>

            <ExecutivePanel
              count={visibleOpportunityRanking.length}
              icon={<Sparkles size={19} />}
              subtitle="Recuperaciones, exceso gestionable y rutas de sustitución detectadas."
              title="Oportunidades de intervención"
              tone="positive"
            >
              <ForecastPriorityList
                items={visibleOpportunityRanking}
                kind="opportunity"
              />
            </ExecutivePanel>
          </div>

          <div className="grid gap-6 xl:grid-cols-2" data-forecast-print-section="methodology">
            <ExecutivePanel
              count={workspace.explainability.length}
              icon={<Sparkles size={19} />}
              subtitle="Razones publicadas por los motores oficiales del Business Core."
              title="Cómo se construye esta lectura"
              tone="intelligence"
            >
              <ol className="space-y-3">
                {workspace.explainability.map((message, index) => (
                  <li
                    className="flex gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-3.5 text-sm leading-6 text-slate-700"
                    key={message}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                      {index + 1}
                    </span>
                    <span>{message}</span>
                  </li>
                ))}
              </ol>
            </ExecutivePanel>

            <ExecutivePanel
              count={workspace.limitations.length}
              icon={<AlertTriangle size={19} />}
              subtitle={`Generado ${formatForecastDate(workspace.generatedAt)} · ${workspace.methodology.baseline} + ${workspace.methodology.inventory}`}
              title="Limitaciones y calidad de fuente"
              tone="attention"
            >
              <ul className="space-y-3">
                {workspace.limitations.map((message) => (
                  <li
                    className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 text-sm leading-6 text-slate-700"
                    key={message}
                  >
                    <AlertTriangle className="mt-1 shrink-0 text-amber-600" size={15} />
                    <span>{message}</span>
                  </li>
                ))}
              </ul>
            </ExecutivePanel>
          </div>

        </>
      )}
    </ExecutiveShell>
  )
}
