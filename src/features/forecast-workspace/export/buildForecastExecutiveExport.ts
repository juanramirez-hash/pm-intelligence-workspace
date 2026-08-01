import type {
  ForecastConfidenceLevel,
  ForecastCoverageStatus,
  ForecastInventoryPriority,
  ForecastScenarioId,
  ForecastTargetStatus,
} from '../../../core/business/forecast'

import type {
  ForecastExecutiveSummary,
} from '../engine/buildForecastExecutiveSummary'

import type {
  ForecastWorkspaceBrandRow,
  ForecastWorkspaceModel,
  ForecastWorkspacePriorityItem,
} from '../types/forecastWorkspaceTypes'

export type ForecastExportCell =
  | string
  | number
  | boolean
  | null

export interface ForecastExportSheet {
  name: string
  rows: ForecastExportCell[][]
  columnWidths?: number[]
  autoFilter?: boolean
  columnFormats?: Record<number, string>
}

export interface ForecastExecutiveExportPayload {
  fileName: string
  sheets: ForecastExportSheet[]
}

export interface ForecastExecutiveExportInput {
  workspace: ForecastWorkspaceModel
  summary: ForecastExecutiveSummary
}

const scenarioLabels: Record<ForecastScenarioId, string> = {
  conservative: 'Conservador',
  expected: 'Esperado',
  accelerated: 'Acelerado',
}

const confidenceLabels: Record<ForecastConfidenceLevel, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const priorityLabels: Record<ForecastInventoryPriority, string> = {
  critical: 'Critica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  none: 'Sin prioridad',
}

const coverageLabels: Record<ForecastCoverageStatus, string> = {
  unavailable: 'Sin fuente',
  'no-demand': 'Sin demanda',
  stockout: 'Agotado',
  shortage: 'Faltante al cierre',
  low: 'Cobertura baja',
  balanced: 'Balanceado',
  excess: 'Exceso',
}

const targetStatusLabels: Record<ForecastTargetStatus, string> = {
  unavailable: 'Sin objetivo',
  behind: 'Debajo del objetivo',
  'on-track': 'En ritmo',
  ahead: 'Por encima',
  achieved: 'Objetivo alcanzado',
}

const currencyFormat = '$#,##0;[Red]($#,##0);-'
const percentageFormat = '0.0%;[Red](0.0%);-'
const numberFormat = '#,##0.0;[Red](#,##0.0);-'
const integerFormat = '#,##0;[Red](#,##0);-'

function sanitizeFilePart(
  value: string,
): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function confidenceLabel(
  level: ForecastConfidenceLevel | null,
): string {
  return level === null
    ? 'Sin confianza'
    : confidenceLabels[level]
}

function summaryRows(
  input: ForecastExecutiveExportInput,
  generatedAt: Date,
): ForecastExportCell[][] {
  const { workspace, summary } = input

  return [
    ['PM Intelligence Workspace'],
    ['Forecast Workspace · Reporte ejecutivo'],
    ['Periodo', workspace.period.currentPeriodId ?? 'Sin periodo'],
    ['Escenario activo', summary.scenarioLabel],
    ['Corte de ventas', workspace.period.dataCutoff ?? 'Sin corte'],
    ['Corte de inventario', workspace.period.snapshotDate ?? 'Sin corte'],
    ['Generado', generatedAt.toISOString()],
    ['Filtros', summary.filterContext],
    [],
    ['Resumen ejecutivo'],
    [summary.overview],
    [],
    ['Perspectiva ejecutiva'],
    [summary.outlook],
    [],
    ['Metrica', 'Valor', 'Contexto'],
    [
      'Venta actual',
      workspace.portfolio.actual.revenue,
      'Venta acumulada al corte',
    ],
    [
      'Cierre proyectado',
      workspace.portfolio.projected.revenue,
      summary.scenarioLabel,
    ],
    [
      'Gross Profit proyectado',
      workspace.portfolio.projected.grossProfit,
      workspace.methodology.baseline,
    ],
    [
      'Margen proyectado',
      workspace.portfolio.projectedGrossMargin,
      workspace.methodology.baseline,
    ],
    [
      'Objetivo mensual',
      workspace.portfolio.targetRevenue,
      workspace.period.currentPeriodId,
    ],
    [
      'Cumplimiento esperado',
      workspace.portfolio.targetAttainment,
      targetStatusLabels[workspace.portfolio.targetStatus],
    ],
    [
      'Brecha contra objetivo',
      workspace.portfolio.revenueGap,
      'Venta adicional requerida',
    ],
    [
      'Venta diaria requerida',
      workspace.portfolio.requiredDailyRevenue,
      `${workspace.period.remainingWorkingDays ?? 0} dias laborales restantes`,
    ],
    [
      'Confianza Forecast',
      workspace.portfolio.confidenceScore === null
        ? null
        : workspace.portfolio.confidenceScore / 100,
      confidenceLabel(workspace.portfolio.confidenceLevel),
    ],
    [
      'Demanda proyectada',
      workspace.inventory.expectedDemandUnits,
      'Unidades del escenario activo',
    ],
    [
      'Disponible',
      workspace.inventory.availableUnits,
      'Unidades disponibles',
    ],
    [
      'Entradas agregadas',
      workspace.inventory.inboundUnits,
      'In Transit + On Order',
    ],
    [
      'Productos criticos',
      workspace.inventory.criticalItems,
      'Intervencion prioritaria',
    ],
    [],
    ['Hallazgo', 'Valor', 'Detalle', 'Tono'],
    ...summary.findings.map((finding) => [
      finding.label,
      finding.value,
      finding.detail,
      finding.tone,
    ]),
    [],
    ['Comparacion de escenarios'],
    [
      'Escenario',
      'Seleccionado',
      'Venta proyectada',
      'Gross Profit',
      'Cantidad',
      'Margen',
      'Cumplimiento',
      'Proposito',
    ],
    ...workspace.scenarios.map((scenario) => [
      scenario.label,
      scenario.selected ? 'Si' : 'No',
      scenario.portfolioRevenue,
      scenario.portfolioGrossProfit,
      scenario.portfolioQuantity,
      scenario.portfolioGrossMargin,
      scenario.targetAttainment,
      scenario.purpose,
    ]),
  ]
}

function brandRows(
  rows: readonly ForecastWorkspaceBrandRow[],
): ForecastExportCell[][] {
  return [
    [
      'Marca ID',
      'Marca',
      'Venta actual',
      'Venta proyectada',
      'GP proyectado',
      'Cantidad proyectada',
      'Margen proyectado',
      'Objetivo',
      'Cumplimiento',
      'Brecha',
      'Estado objetivo',
      'Confianza',
      'Score confianza',
      'Productos analizados',
      'Criticos',
      'Prioridad alta',
      'Agotados',
      'Faltantes',
      'Cobertura baja',
      'Exceso',
      'Sin demanda',
      'Cobertura promedio meses',
      'Risk score',
      'Ruta',
    ],
    ...rows.map((row) => [
      row.brandId,
      row.label,
      row.actual.revenue,
      row.projected.revenue,
      row.projected.grossProfit,
      row.projected.quantity,
      row.projectedGrossMargin,
      row.targetRevenue,
      row.targetAttainment,
      row.revenueGap,
      targetStatusLabels[row.targetStatus],
      confidenceLabels[row.confidenceLevel],
      row.confidenceScore / 100,
      row.productsAnalyzed,
      row.criticalProducts,
      row.highPriorityProducts,
      row.stockoutProducts,
      row.shortageProducts,
      row.lowCoverageProducts,
      row.excessProducts,
      row.noDemandProducts,
      row.averageAvailableCoverageMonths,
      row.riskScore,
      row.navigation.href,
    ]),
  ]
}

function priorityRows(
  items: readonly ForecastWorkspacePriorityItem[],
): ForecastExportCell[][] {
  return [
    [
      'Prioridad',
      'Score',
      'Tipo de senal',
      'Producto ID',
      'Producto',
      'Modelo',
      'Marca',
      'Confianza',
      'Demanda proyectada',
      'Demanda restante',
      'Disponible',
      'Entradas',
      'Cobertura disponible meses',
      'Cobertura con entradas meses',
      'Valor inventario',
      'Superseded',
      'Titulo',
      'Racional',
      'Accion recomendada',
      'Sustituto ID',
      'Sustituto',
      'Ruta producto',
      'Ruta sustituto',
    ],
    ...items.map((item) => [
      priorityLabels[item.priority],
      item.score,
      item.signalType,
      item.productId,
      item.productName,
      item.model,
      item.brandId,
      confidenceLabel(item.confidenceLevel),
      item.expectedDemandUnits,
      item.remainingDemandUnits,
      item.availableUnits,
      item.inboundUnits,
      item.availableCoverageMonths,
      item.supplyCoverageMonths,
      item.inventoryValue,
      item.isSuperseded,
      item.title,
      item.rationale,
      item.recommendedAction,
      item.replacementNavigation?.entityId ?? null,
      item.replacementNavigation?.label ?? null,
      item.navigation.href,
      item.replacementNavigation?.href ?? null,
    ]),
  ]
}

function coverageRows(
  workspace: ForecastWorkspaceModel,
): ForecastExportCell[][] {
  const coverage = workspace.inventory.coverage
  const total = workspace.inventory.filteredProducts
  const coverageItems: Array<[
    ForecastCoverageStatus,
    number,
  ]> = [
    ['stockout', coverage.stockout],
    ['shortage', coverage.shortage],
    ['low', coverage.low],
    ['balanced', coverage.balanced],
    ['excess', coverage.excess],
    ['no-demand', coverage.noDemand],
    ['unavailable', coverage.unavailable],
  ]

  return [
    ['Balance de demanda y suministro'],
    ['Metrica', 'Valor', 'Unidad / contexto'],
    [
      'Productos analizados',
      workspace.inventory.productsAnalyzed,
      'Portafolio total',
    ],
    [
      'Productos filtrados',
      workspace.inventory.filteredProducts,
      'Filtros activos',
    ],
    [
      'Productos con demanda',
      workspace.inventory.productsWithProjectedDemand,
      'Escenario activo',
    ],
    [
      'Productos sin demanda',
      workspace.inventory.productsWithoutProjectedDemand,
      'Escenario activo',
    ],
    [
      'Demanda proyectada',
      workspace.inventory.expectedDemandUnits,
      'Unidades',
    ],
    [
      'Demanda restante',
      workspace.inventory.remainingDemandUnits,
      'Unidades',
    ],
    [
      'Disponible',
      workspace.inventory.availableUnits,
      'Unidades',
    ],
    [
      'Entradas agregadas',
      workspace.inventory.inboundUnits,
      'In Transit + On Order',
    ],
    [
      'Disponible despues de demanda',
      workspace.inventory.projectedAvailableAfterDemand,
      'Sin entradas futuras',
    ],
    [
      'Suministro despues de demanda',
      workspace.inventory.projectedSupplyAfterDemand,
      'Disponible + entradas',
    ],
    [
      'Valor de inventario',
      workspace.inventory.inventoryValue,
      'MXN',
    ],
    [
      'Valor afectado',
      workspace.inventory.affectedInventoryValue,
      'MXN',
    ],
    [
      'Superseded con inventario',
      workspace.inventory.supersededInventoryProducts,
      'Productos',
    ],
    [
      'Recuperaciones por sustituto',
      workspace.inventory.replacementRecoveries,
      'Productos',
    ],
    [],
    ['Estado de cobertura', 'Productos', 'Participacion'],
    ...coverageItems.map(([status, count]) => [
      coverageLabels[status],
      count,
      total > 0 ? count / total : 0,
    ]),
  ]
}

function methodologyRows(
  input: ForecastExecutiveExportInput,
  generatedAt: Date,
): ForecastExportCell[][] {
  const { workspace, summary } = input

  return [
    ['Campo', 'Valor'],
    ['Aplicacion', 'PM Intelligence Workspace'],
    ['Modulo', 'Forecast Workspace'],
    ['Entrega', 'FW-006'],
    ['Esquema de exportacion', '1.0'],
    ['Periodo', workspace.period.currentPeriodId ?? 'Sin periodo'],
    ['Escenario', scenarioLabels[workspace.scenarioId]],
    ['Estado del Workspace', workspace.status],
    ['Generado', generatedAt.toISOString()],
    ['Corte de ventas', workspace.period.dataCutoff ?? 'Sin corte'],
    ['Corte de inventario', workspace.period.snapshotDate ?? 'Sin corte'],
    ['Baseline', workspace.methodology.baseline],
    ['Inteligencia de inventario', workspace.methodology.inventory],
    ['Filtros', summary.filterContext],
    ['Marcas exportadas', workspace.brands.length],
    ['Riesgos exportados', workspace.riskRanking.length],
    ['Oportunidades exportadas', workspace.opportunityRanking.length],
    [],
    ['Fuentes y reglas'],
    ['Fuente comercial', 'Business Repository y ventas normalizadas'],
    ['Objetivos', 'Business Targets cuando estan disponibles'],
    ['Inventario', 'Inventory Repository y ultimo corte disponible'],
    ['Catalogo', 'Product Master para identidad, Superseded y sustitutos'],
    ['Purchasing', 'Fuente futura opcional; no bloquea Forecast'],
    ['Entradas', 'In Transit y On Order se agregan sin fecha prometida'],
    [],
    ['Explainability'],
    ...workspace.explainability.map((message, index) => [
      index + 1,
      message,
    ]),
    [],
    ['Limitaciones'],
    ...workspace.limitations.map((message, index) => [
      index + 1,
      message,
    ]),
  ]
}

export function buildForecastExecutiveExport(
  input: ForecastExecutiveExportInput,
  generatedAt: Date = new Date(),
): ForecastExecutiveExportPayload {
  const periodPart = sanitizeFilePart(
    input.workspace.period.currentPeriodId ?? 'sin-periodo',
  ) || 'sin-periodo'
  const scenarioPart = sanitizeFilePart(
    scenarioLabels[input.workspace.scenarioId],
  ) || 'escenario'

  return {
    fileName:
      `PM-Intelligence-Forecast-${periodPart}-${scenarioPart}.xlsx`,
    sheets: [
      {
        name: 'Resumen Ejecutivo',
        rows: summaryRows(input, generatedAt),
        columnWidths: [30, 24, 72, 18, 18, 18, 18, 54],
      },
      {
        name: 'Forecast por Marca',
        rows: brandRows(input.workspace.brands),
        columnWidths: [18, 26, 18, 20, 18, 18, 18, 18, 18, 18, 22, 14, 16, 18, 12, 16, 12, 12, 16, 12, 14, 22, 14, 28],
        autoFilter: true,
        columnFormats: {
          2: currencyFormat,
          3: currencyFormat,
          4: currencyFormat,
          5: numberFormat,
          6: percentageFormat,
          7: currencyFormat,
          8: percentageFormat,
          9: currencyFormat,
          12: percentageFormat,
          13: integerFormat,
          14: integerFormat,
          15: integerFormat,
          16: integerFormat,
          17: integerFormat,
          18: integerFormat,
          19: integerFormat,
          20: integerFormat,
          21: numberFormat,
          22: integerFormat,
        },
      },
      {
        name: 'Riesgos por Producto',
        rows: priorityRows(input.workspace.riskRanking),
        columnWidths: [14, 10, 26, 18, 34, 22, 20, 14, 20, 18, 14, 14, 24, 24, 20, 14, 32, 60, 60, 20, 30, 30, 30],
        autoFilter: true,
        columnFormats: {
          1: integerFormat,
          8: numberFormat,
          9: numberFormat,
          10: numberFormat,
          11: numberFormat,
          12: numberFormat,
          13: numberFormat,
          14: currencyFormat,
        },
      },
      {
        name: 'Oportunidades',
        rows: priorityRows(input.workspace.opportunityRanking),
        columnWidths: [14, 10, 26, 18, 34, 22, 20, 14, 20, 18, 14, 14, 24, 24, 20, 14, 32, 60, 60, 20, 30, 30, 30],
        autoFilter: true,
        columnFormats: {
          1: integerFormat,
          8: numberFormat,
          9: numberFormat,
          10: numberFormat,
          11: numberFormat,
          12: numberFormat,
          13: numberFormat,
          14: currencyFormat,
        },
      },
      {
        name: 'Cobertura y Balance',
        rows: coverageRows(input.workspace),
        columnWidths: [36, 22, 38],
      },
      {
        name: 'Metodologia y Fuentes',
        rows: methodologyRows(input, generatedAt),
        columnWidths: [34, 100],
      },
    ],
  }
}
