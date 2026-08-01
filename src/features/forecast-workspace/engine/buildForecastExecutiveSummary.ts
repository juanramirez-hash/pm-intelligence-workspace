import type {
  ForecastScenarioId,
  ForecastTargetStatus,
} from '../../../core/business/forecast'

import type {
  ForecastWorkspaceFilters,
  ForecastWorkspaceModel,
} from '../types/forecastWorkspaceTypes'

export type ForecastExecutiveFindingTone =
  | 'positive'
  | 'warning'
  | 'critical'
  | 'neutral'

export interface ForecastExecutiveFinding {
  label: string
  value: string
  detail: string
  tone: ForecastExecutiveFindingTone
}

export interface ForecastExecutiveSummary {
  scenarioLabel: string
  filterContext: string
  overview: string
  outlook: string
  findings: ForecastExecutiveFinding[]
}

function formatCurrency(
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Sin dato'
  }

  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function formatNumber(
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Sin dato'
  }

  return value.toLocaleString('es-MX', {
    maximumFractionDigits: 1,
  })
}

function formatPercentage(
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Sin dato'
  }

  return value.toLocaleString('es-MX', {
    style: 'percent',
    maximumFractionDigits: 1,
  })
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

function targetStatusText(
  status: ForecastTargetStatus,
): string {
  if (status === 'achieved') {
    return 'objetivo alcanzado'
  }

  if (status === 'ahead') {
    return 'por encima del objetivo'
  }

  if (status === 'on-track') {
    return 'en ritmo de cumplimiento del objetivo'
  }

  if (status === 'behind') {
    return 'por debajo del objetivo'
  }

  return 'sin objetivo disponible'
}

function filterContext(
  filters: ForecastWorkspaceFilters,
): string {
  return [
    filters.search
      ? `Busqueda: ${filters.search}`
      : 'Busqueda: todas',
    filters.brandId === 'all'
      ? 'Marca: todas'
      : `Marca: ${filters.brandId}`,
    filters.coverage === 'all'
      ? 'Cobertura: todos los estados'
      : `Cobertura: ${filters.coverage}`,
    filters.priority === 'all'
      ? 'Prioridad: todas'
      : `Prioridad: ${filters.priority}`,
    filters.confidence === 'all'
      ? 'Confianza: todos los niveles'
      : `Confianza: ${filters.confidence}`,
  ].join(' | ')
}

function buildOutlook(
  workspace: ForecastWorkspaceModel,
): string {
  if (!workspace.officialAvailable) {
    return `El Forecast Project-Aware permanece provisional. Existen ${formatNumber(workspace.projectPipeline.quality.blockingIssues)} incidencias bloqueantes que deben resolverse antes de utilizar el cierre como resultado oficial.`
  }

  const status = workspace.portfolio.targetStatus
  const critical = workspace.inventory.criticalItems
  const shortage =
    workspace.inventory.coverage.stockout +
    workspace.inventory.coverage.shortage

  if (status === 'unavailable') {
    return 'El escenario conserva la proyeccion Project-Aware, pero no puede evaluar cumplimiento porque no existe un objetivo mensual disponible.'
  }

  if (status === 'behind') {
    return `El cierre permanece por debajo del objetivo. Se requiere atender una brecha de ${formatCurrency(workspace.portfolio.revenueGap)} y priorizar ${formatNumber(critical)} productos criticos, incluidos ${formatNumber(shortage)} con agotamiento o faltante al cierre.`
  }

  if (critical > 0) {
    return `El cierre se encuentra ${targetStatusText(status)}, aunque persisten ${formatNumber(critical)} productos criticos que pueden limitar la ejecucion comercial del escenario.`
  }

  return `El cierre se encuentra ${targetStatusText(status)} y no registra productos con prioridad critica dentro de los filtros activos.`
}

export function buildForecastExecutiveSummary(
  workspace: ForecastWorkspaceModel,
): ForecastExecutiveSummary {
  const selectedScenario = scenarioLabel(workspace.scenarioId)
  const targetText = workspace.portfolio.targetRevenue === null
    ? 'sin objetivo mensual disponible'
    : `contra un objetivo de ${formatCurrency(workspace.portfolio.targetRevenue)}`
  const origin = workspace.portfolio.origin
  const pipeline = workspace.projectPipeline.summary

  return {
    scenarioLabel: selectedScenario,
    filterContext: filterContext(workspace.filters),
    overview: workspace.available
      ? `El escenario ${selectedScenario} proyecta un cierre Project-Aware de ${formatCurrency(workspace.portfolio.projected.revenue)}, compuesto por ${formatCurrency(origin.projectedTransactional.revenue)} de Forecast transaccional, ${formatCurrency(origin.actualProjectBilling.revenue)} de proyectos ya facturados y ${formatCurrency(origin.maturePipeline.revenue)} de pipeline maduro pendiente. El cumplimiento esperado es ${formatPercentage(workspace.portfolio.targetAttainment)} ${targetText}.`
      : workspace.unavailableReason ??
        'Forecast Workspace no dispone de informacion suficiente para generar una lectura ejecutiva.',
    outlook: buildOutlook(workspace),
    findings: [
      {
        label: 'Cierre Project-Aware',
        value: formatCurrency(workspace.portfolio.projected.revenue),
        detail: `${formatPercentage(workspace.portfolio.targetAttainment)} de cumplimiento esperado en escenario ${selectedScenario}.`,
        tone: !workspace.officialAvailable
          ? 'critical'
          : workspace.portfolio.targetStatus === 'behind'
            ? 'critical'
            : workspace.portfolio.targetStatus === 'unavailable'
              ? 'neutral'
              : 'positive',
      },
      {
        label: 'Forecast transaccional',
        value: formatCurrency(origin.projectedTransactional.revenue),
        detail: `Parte de ${formatCurrency(origin.actualTransactional.revenue)} de venta transaccional real, después de retirar facturación conciliada de proyectos.`,
        tone: 'neutral',
      },
      {
        label: 'Proyectos facturados',
        value: formatCurrency(origin.actualProjectBilling.revenue),
        detail: `${formatNumber(origin.actualProjectBilling.documents)} documentos conciliados con Revenue y GP oficiales de Ventas.`,
        tone: 'positive',
      },
      {
        label: 'Pipeline maduro',
        value: formatCurrency(pipeline.matureRevenueMxn),
        detail: `${formatNumber(pipeline.matureIncludedProjects)} proyectos 05–06 incluidos y ${formatNumber(pipeline.matureBlockedProjects)} bloqueados.`,
        tone: pipeline.matureBlockedProjects > 0
          ? 'warning'
          : 'positive',
      },
      {
        label: 'Upside potencial',
        value: formatCurrency(pipeline.potentialRevenueMxn),
        detail: `${formatCurrency(pipeline.potentialWeightedRevenueMxn)} ponderado por probabilidad; no se suma al Forecast oficial.`,
        tone: 'neutral',
      },
      {
        label: 'Riesgo de cobertura',
        value: `${formatNumber(workspace.inventory.criticalItems)} criticos`,
        detail: `${formatNumber(workspace.inventory.coverage.stockout)} agotados, ${formatNumber(workspace.inventory.coverage.shortage)} faltantes y ${formatNumber(workspace.inventory.coverage.low)} con cobertura baja.`,
        tone: workspace.inventory.criticalItems > 0
          ? 'critical'
          : 'positive',
      },
      {
        label: 'Calidad del Forecast',
        value: workspace.officialAvailable
          ? 'Oficial disponible'
          : 'Resultado provisional',
        detail: `${formatNumber(workspace.projectPipeline.quality.blockingIssues)} bloqueos actuales, ${formatNumber(workspace.projectPipeline.quality.pendingCutoffDocuments)} pendientes por corte, ${formatPercentage(workspace.projectPipeline.quality.reconciliationCoverage)} de cobertura actual y ${formatPercentage(workspace.projectPipeline.quality.historicalReconciliationCoverage)} histórica.`,
        tone: workspace.officialAvailable
          ? 'positive'
          : 'critical',
      },
    ],
  }
}
