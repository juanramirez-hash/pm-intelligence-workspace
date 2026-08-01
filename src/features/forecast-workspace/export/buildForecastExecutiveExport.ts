import type {
  ForecastConfidenceLevel,
  ForecastCoverageStatus,
  ForecastInventoryPriority,
  ForecastScenarioId,
  ForecastTargetStatus,
  ProjectAwareForecastProjectContribution,
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

const contributionStatusLabels: Record<
  ProjectAwareForecastProjectContribution['contributionStatus'],
  string
> = {
  included: 'Incluido',
  upside: 'Upside potencial',
  blocked: 'Bloqueado',
  excluded: 'Excluido',
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
  const origin = workspace.portfolio.origin
  const pipeline = workspace.projectPipeline.summary
  const quality = workspace.projectPipeline.quality

  return [
    ['PM Intelligence Workspace'],
    ['Forecast Workspace · Project-Aware Executive Report'],
    ['Periodo', workspace.period.currentPeriodId ?? 'Sin periodo'],
    ['Escenario activo', summary.scenarioLabel],
    ['Disponibilidad oficial', workspace.officialAvailable ? 'Disponible' : 'Bloqueada'],
    ['Estado', workspace.status],
    ['Corte de ventas', workspace.projectPipeline.quality.salesDataCutoff ?? workspace.period.dataCutoff ?? 'Sin corte'],
    ['Corte de facturacion de proyectos', workspace.projectPipeline.quality.projectBillingDataCutoff ?? 'Sin corte'],
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
    ['Componente', 'Revenue MXN', 'GP MXN', 'Cantidad', 'Documentos / Proyectos', 'Contexto'],
    [
      'Venta total real',
      origin.actualTotal.revenue,
      origin.actualTotal.grossProfit,
      origin.actualTotal.quantity,
      origin.actualTotal.documents,
      'Ventas acumuladas al corte',
    ],
    [
      'Venta transaccional real',
      origin.actualTransactional.revenue,
      origin.actualTransactional.grossProfit,
      origin.actualTransactional.quantity,
      origin.actualTransactional.documents,
      'Venta total menos facturacion conciliada de proyectos',
    ],
    [
      'Facturacion real de proyectos',
      origin.actualProjectBilling.revenue,
      origin.actualProjectBilling.grossProfit,
      origin.actualProjectBilling.quantity,
      origin.actualProjectBilling.documents,
      'Revenue y GP oficiales recuperados desde Ventas',
    ],
    [
      'Forecast transaccional',
      origin.projectedTransactional.revenue,
      origin.projectedTransactional.grossProfit,
      origin.projectedTransactional.quantity,
      null,
      workspace.methodology.baseline,
    ],
    [
      'Pipeline maduro pendiente',
      origin.maturePipeline.revenue,
      origin.maturePipeline.grossProfit,
      null,
      pipeline.matureIncludedProjects,
      'Status 05–06 · Monto por cerrar convertido a MXN',
    ],
    [
      'Forecast combinado',
      origin.combined.revenue,
      origin.combined.grossProfit,
      origin.combined.quantity,
      null,
      workspace.methodology.projectAware,
    ],
    [
      'Upside potencial bruto',
      pipeline.potentialRevenueMxn,
      pipeline.potentialEstimatedGrossProfitMxn,
      null,
      pipeline.potentialAvailableProjects,
      'Status 03–04 · fuera del Forecast oficial',
    ],
    [
      'Upside potencial ponderado',
      pipeline.potentialWeightedRevenueMxn,
      null,
      null,
      pipeline.potentialAvailableProjects,
      'Probabilidad declarada en el reporte de proyectos',
    ],
    [],
    ['Metrica ejecutiva', 'Valor', 'Contexto'],
    ['Objetivo mensual', workspace.portfolio.targetRevenue, workspace.period.currentPeriodId],
    ['Cumplimiento esperado', workspace.portfolio.targetAttainment, targetStatusLabels[workspace.portfolio.targetStatus]],
    ['Brecha contra objetivo', workspace.portfolio.revenueGap, 'Venta adicional requerida'],
    ['Venta diaria requerida', workspace.portfolio.requiredDailyRevenue, `${workspace.period.remainingWorkingDays ?? 0} dias laborales restantes`],
    ['Margen combinado', workspace.portfolio.projectedGrossMargin, workspace.methodology.projectAware],
    ['Confianza Forecast', workspace.portfolio.confidenceScore === null ? null : workspace.portfolio.confidenceScore / 100, confidenceLabel(workspace.portfolio.confidenceLevel)],
    ['Cobertura conciliacion periodo actual', quality.reconciliationCoverage, quality.currentPeriodId ?? 'Sin periodo'],
    ['Cobertura conciliacion historica', quality.historicalReconciliationCoverage, 'Reduce confianza; no bloquea por si sola'],
    ['Pendientes por diferencia de corte', quality.pendingCutoffDocuments, `Ventas ${quality.salesDataCutoff ?? 'sin corte'} / Proyectos ${quality.projectBillingDataCutoff ?? 'sin corte'}`],
    ['Bloqueos materiales actuales', quality.blockingIssues, 'Forecast oficial no disponible si es mayor a cero'],
    ['Advertencias', quality.warnings, 'Requieren revision'],
    ['Tipos de cambio faltantes', quality.missingExchangeRates, 'USD a MXN por periodo'],
    ['Cobertura GP estimado', quality.grossProfitEstimateCoverage, 'Pipeline con referencia de margen'],
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
      'Oficial',
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
      scenario.official ? 'Si' : 'No',
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
      'Forecast oficial',
      'Venta total real',
      'Venta transaccional real',
      'Proyecto facturado real',
      'Forecast transaccional',
      'Pipeline maduro',
      'Forecast combinado',
      'GP combinado',
      'Margen combinado',
      'Pipeline potencial bruto',
      'Pipeline potencial ponderado',
      'Proyectos maduros',
      'Proyectos potenciales',
      'Objetivo',
      'Cumplimiento',
      'Brecha',
      'Estado objetivo',
      'Confianza',
      'Score confianza',
      'Productos analizados',
      'Criticos',
      'Agotados',
      'Faltantes',
      'Exceso',
      'Cobertura promedio meses',
      'Risk score',
      'Ruta',
    ],
    ...rows.map((row) => [
      row.brandId,
      row.label,
      row.officialAvailable,
      row.actual.revenue,
      row.actualTransactional.revenue,
      row.actualProjectBilling.revenue,
      row.projectedTransactional.revenue,
      row.maturePipeline.revenue,
      row.projected.revenue,
      row.projected.grossProfit,
      row.projectedGrossMargin,
      row.potentialPipelineRevenue,
      row.potentialWeightedPipelineRevenue,
      row.matureProjects,
      row.potentialProjects,
      row.targetRevenue,
      row.targetAttainment,
      row.revenueGap,
      targetStatusLabels[row.targetStatus],
      confidenceLabels[row.confidenceLevel],
      row.confidenceScore / 100,
      row.productsAnalyzed,
      row.criticalProducts,
      row.stockoutProducts,
      row.shortageProducts,
      row.excessProducts,
      row.averageAvailableCoverageMonths,
      row.riskScore,
      row.navigation.href,
    ]),
  ]
}

function projectRows(
  projects: readonly ProjectAwareForecastProjectContribution[],
): ForecastExportCell[][] {
  return [
    [
      'Proyecto ID',
      'Proyecto',
      'Marca principal',
      'Status codigo',
      'Status',
      'Etapa Forecast',
      'Tratamiento',
      'Fecha estimada facturacion',
      'Periodo',
      'Probabilidad cierre',
      'Moneda origen',
      'Monto por cerrar origen',
      'Tipo de cambio',
      'Monto convertido MXN',
      'Monto ponderado MXN',
      'Margen GP estimado',
      'GP estimado MXN',
      'Fuente margen',
      'Estado conversion',
      'Incidencias',
    ],
    ...projects.map((project) => [
      project.projectId,
      project.projectName,
      project.brandId,
      project.statusCode,
      project.statusLabel,
      project.forecastStage,
      contributionStatusLabels[project.contributionStatus],
      project.estimatedBillingDate,
      project.periodId,
      project.closingProbability,
      project.sourceCurrency,
      project.sourceAmount,
      project.exchangeRate,
      project.convertedAmountMxn,
      project.weightedAmountMxn,
      project.estimatedGrossMargin,
      project.estimatedGrossProfitMxn,
      project.marginSource,
      project.conversionStatus,
      project.issueCodes.join(' | '),
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
    ['Productos analizados', workspace.inventory.productsAnalyzed, 'Portafolio total'],
    ['Productos filtrados', workspace.inventory.filteredProducts, 'Filtros activos'],
    ['Productos con demanda', workspace.inventory.productsWithProjectedDemand, 'Escenario activo'],
    ['Productos sin demanda', workspace.inventory.productsWithoutProjectedDemand, 'Escenario activo'],
    ['Demanda proyectada', workspace.inventory.expectedDemandUnits, 'Unidades'],
    ['Demanda restante', workspace.inventory.remainingDemandUnits, 'Unidades'],
    ['Disponible', workspace.inventory.availableUnits, 'Unidades'],
    ['Entradas agregadas', workspace.inventory.inboundUnits, 'In Transit + On Order'],
    ['Disponible despues de demanda', workspace.inventory.projectedAvailableAfterDemand, 'Sin entradas futuras'],
    ['Suministro despues de demanda', workspace.inventory.projectedSupplyAfterDemand, 'Disponible + entradas'],
    ['Valor de inventario', workspace.inventory.inventoryValue, 'MXN'],
    ['Valor afectado', workspace.inventory.affectedInventoryValue, 'MXN'],
    ['Superseded con inventario', workspace.inventory.supersededInventoryProducts, 'Productos'],
    ['Recuperaciones por sustituto', workspace.inventory.replacementRecoveries, 'Productos'],
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
    ['Entrega', 'FW-010'],
    ['Esquema de exportacion', '2.0'],
    ['Periodo', workspace.period.currentPeriodId ?? 'Sin periodo'],
    ['Escenario', scenarioLabels[workspace.scenarioId]],
    ['Forecast oficial', workspace.officialAvailable ? 'Disponible' : 'Bloqueado'],
    ['Estado del Workspace', workspace.status],
    ['Generado', generatedAt.toISOString()],
    ['Corte de ventas', workspace.projectPipeline.quality.salesDataCutoff ?? workspace.period.dataCutoff ?? 'Sin corte'],
    ['Corte de facturacion de proyectos', workspace.projectPipeline.quality.projectBillingDataCutoff ?? 'Sin corte'],
    ['Corte de inventario', workspace.period.snapshotDate ?? 'Sin corte'],
    ['Baseline transaccional', workspace.methodology.baseline],
    ['Motor Project-Aware', workspace.methodology.projectAware],
    ['Inteligencia de inventario', workspace.methodology.inventory],
    ['Filtros', summary.filterContext],
    ['Marcas exportadas', workspace.brands.length],
    ['Proyectos exportados', workspace.projectPipeline.contributions.length],
    ['Riesgos exportados', workspace.riskRanking.length],
    ['Oportunidades exportadas', workspace.opportunityRanking.length],
    [],
    ['Fuentes y reglas'],
    ['Ventas', 'Business Repository y ventas normalizadas en MXN'],
    ['Facturacion de proyectos', 'Document Number conciliado contra Ventas; Amount se conserva como auditoria'],
    ['Proyectos', 'Monto por cerrar y Fecha estimada de facturacion'],
    ['Tipos de cambio', 'Tasa mensual USD a MXN cargada en Data Center; no existe valor oculto'],
    ['Pipeline maduro', 'Status 05 y 06 incluidos al 100% cuando superan controles de calidad'],
    ['Pipeline potencial', 'Status 03 y 04 visibles como upside; no suman al Forecast oficial'],
    ['Notas de credito', 'Conservan el signo reconocido en Ventas'],
    ['Documentos posteriores al corte', 'Quedan pendientes de la siguiente carga y no bloquean el Forecast actual'],
    ['Documentos anulados', 'Solo bloquean cuando conservan Revenue, GP o cantidad material en Ventas'],
    ['Excepciones historicas', 'Reducen confianza y permanecen auditables; no bloquean el cierre actual por si solas'],
    ['Inventario', 'La demanda por SKU no recibe cantidades del pipeline sin detalle de articulos'],
    ['Purchasing', 'Fuente futura opcional; no bloquea Forecast'],
    [],
    ['Incidencias de calidad'],
    ['Codigo', 'Severidad', 'Mensaje', 'Periodo', 'Proyecto', 'Documento', 'Marca'],
    ...workspace.projectPipeline.quality.issues.map((issue) => [
      issue.code,
      issue.severity,
      issue.message,
      issue.periodId,
      issue.projectId,
      issue.documentNumber,
      issue.brandId,
    ]),
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
        columnWidths: [34, 24, 24, 18, 24, 64, 18, 18, 54],
      },
      {
        name: 'Forecast por Marca',
        rows: brandRows(input.workspace.brands),
        columnWidths: [18, 26, 16, 18, 22, 22, 22, 20, 22, 18, 18, 22, 24, 18, 18, 18, 18, 18, 22, 14, 16, 18, 12, 12, 12, 12, 22, 14, 28],
        autoFilter: true,
        columnFormats: {
          3: currencyFormat,
          4: currencyFormat,
          5: currencyFormat,
          6: currencyFormat,
          7: currencyFormat,
          8: currencyFormat,
          9: currencyFormat,
          10: percentageFormat,
          11: currencyFormat,
          12: currencyFormat,
          13: integerFormat,
          14: integerFormat,
          15: currencyFormat,
          16: percentageFormat,
          17: currencyFormat,
          20: percentageFormat,
          21: integerFormat,
          22: integerFormat,
          23: integerFormat,
          24: integerFormat,
          25: integerFormat,
          26: numberFormat,
          27: integerFormat,
        },
      },
      {
        name: 'Pipeline de Proyectos',
        rows: projectRows(input.workspace.projectPipeline.contributions),
        columnWidths: [18, 42, 22, 14, 30, 18, 18, 22, 14, 20, 16, 22, 18, 22, 22, 20, 22, 30, 22, 60],
        autoFilter: true,
        columnFormats: {
          9: percentageFormat,
          11: numberFormat,
          12: numberFormat,
          13: currencyFormat,
          14: currencyFormat,
          15: percentageFormat,
          16: currencyFormat,
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
        columnWidths: [34, 100, 18, 18, 22, 22, 22],
      },
    ],
  }
}
