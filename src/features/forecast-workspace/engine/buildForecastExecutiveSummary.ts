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
  const values = [
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
  ]

  return values.join(' | ')
}

function buildOutlook(
  workspace: ForecastWorkspaceModel,
): string {
  const status = workspace.portfolio.targetStatus
  const critical = workspace.inventory.criticalItems
  const shortage =
    workspace.inventory.coverage.stockout +
    workspace.inventory.coverage.shortage

  if (status === 'unavailable') {
    return 'El escenario conserva la proyeccion comercial, pero no puede evaluar cumplimiento porque no existe un objetivo mensual disponible.'
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

  return {
    scenarioLabel: selectedScenario,
    filterContext: filterContext(workspace.filters),
    overview: workspace.available
      ? `El escenario ${selectedScenario} proyecta un cierre de ${formatCurrency(workspace.portfolio.projected.revenue)}, con cumplimiento esperado de ${formatPercentage(workspace.portfolio.targetAttainment)} ${targetText}. El modelo analiza ${formatNumber(workspace.inventory.filteredProducts)} productos y mantiene una confianza ${workspace.portfolio.confidenceLevel ?? 'sin clasificar'} de ${formatPercentage(workspace.portfolio.confidenceScore === null ? null : workspace.portfolio.confidenceScore / 100)}.`
      : workspace.unavailableReason ??
        'Forecast Workspace no dispone de informacion suficiente para generar una lectura ejecutiva.',
    outlook: buildOutlook(workspace),
    findings: [
      {
        label: 'Cierre proyectado',
        value: formatCurrency(workspace.portfolio.projected.revenue),
        detail: `${formatPercentage(workspace.portfolio.targetAttainment)} de cumplimiento esperado en escenario ${selectedScenario}.`,
        tone: workspace.portfolio.targetStatus === 'behind'
          ? 'critical'
          : workspace.portfolio.targetStatus === 'unavailable'
            ? 'neutral'
            : 'positive',
      },
      {
        label: 'Brecha comercial',
        value: formatCurrency(workspace.portfolio.revenueGap),
        detail: workspace.portfolio.revenueGap === 0
          ? 'El escenario no presenta brecha pendiente contra objetivo.'
          : `Ritmo diario requerido: ${formatCurrency(workspace.portfolio.requiredDailyRevenue)}.`,
        tone: workspace.portfolio.revenueGap === 0
          ? 'positive'
          : 'warning',
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
        label: 'Balance despues de demanda',
        value: `${formatNumber(workspace.inventory.projectedSupplyAfterDemand)} uds.`,
        detail: `Incluye ${formatNumber(workspace.inventory.inboundUnits)} unidades agregadas en In Transit y On Order.`,
        tone: workspace.inventory.projectedSupplyAfterDemand > 0
          ? 'positive'
          : 'warning',
      },
      {
        label: 'Sustitucion de catalogo',
        value: `${formatNumber(workspace.inventory.replacementRecoveries)} recuperaciones`,
        detail: `${formatNumber(workspace.inventory.supersededInventoryProducts)} productos Superseded conservan inventario dentro del corte.`,
        tone: workspace.inventory.replacementRecoveries > 0
          ? 'positive'
          : 'neutral',
      },
    ],
  }
}
