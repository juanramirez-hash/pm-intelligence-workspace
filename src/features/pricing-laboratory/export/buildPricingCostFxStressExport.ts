import type {
  PriceCostFxStressCell,
  PriceCostFxStressResult,
  PriceTierObjective,
} from '../../../core/business/pricing'

import type {
  PricingBatchDesignExportPayload,
  PricingBatchExportCell,
} from './buildPricingBatchDesignExport'

const moneyFormat = '#,##0.00;[Red](#,##0.00);-'
const percentageFormat = '0.0%;[Red](0.0%);-'
const factorFormat = '0.0000x'
const quantityFormat = '#,##0.0000'

function sanitizeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function objectiveDescription(
  objective: PriceTierObjective,
): string {
  switch (objective.type) {
    case 'minimum_gross_margin':
      return `Margen mínimo ${(objective.grossMargin * 100).toLocaleString('es-MX')}%`
    case 'minimum_gross_profit':
      return `GP unitario mínimo ${objective.grossProfit}`
  }
}

function feasibilityLabel(
  cell: PriceCostFxStressCell,
): string {
  switch (cell.feasibility) {
    case 'fully_feasible':
      return 'Factible'
    case 'partially_feasible':
      return 'Parcial'
    case 'not_feasible':
      return 'No factible'
    case 'invalid':
      return 'No calculable'
  }
}

function summaryRows(
  result: PriceCostFxStressResult,
  generatedAt: Date,
): PricingBatchExportCell[][] {
  return [
    ['PM Intelligence Workspace'],
    ['Pricing Laboratory · Cost & Exchange Rate Sensitivity Stress Test'],
    ['Aviso obligatorio', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    ['Generado', generatedAt.toISOString()],
    ['Metodología', result.methodology],
    ['Modo', result.executionMode],
    ['Estado', result.status],
    [],
    ['Identidad'],
    ['Matriz de origen', result.input.sourceBatchId],
    ['Marca provisional', result.input.brandName ?? 'Sin marca'],
    ['Moneda del costo', result.input.sourceCostCurrency],
    ['Moneda de reporte', result.input.reportingCurrency],
    ['Tipo de cambio de referencia', result.input.referenceExchangeRate],
    ['Productos activos', result.summary.productCount],
    ['Escenarios de estrés', result.summary.scenarioCount],
    ['Niveles comerciales', result.summary.tierCount],
    ['Factores candidatos', result.summary.factorCount],
    ['Combinaciones', result.summary.cellCount],
    [],
    ['Resultado crítico'],
    ['Escenario crítico', result.criticalScenarioLabel],
    ['Factor máximo requerido', result.summary.globalMaximumRequiredFactor],
    ['Celdas plenamente factibles', result.summary.fullyFeasibleCellCount],
    ['Resultados producto debajo del objetivo', result.summary.belowObjectiveProductCount],
    [],
    ['Interpretación'],
    ['Los tipos de cambio y las variaciones de costo fueron capturados explícitamente. No se consultó ninguna tasa en vivo.'],
    ['Los resultados no actualizan costos, monedas, factores o precios reales.'],
    ['Notas', result.input.notes ?? null],
  ]
}

function matrixRows(
  result: PriceCostFxStressResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Orden',
      'Escenario',
      'Variación costo',
      'Tipo cambio escenario',
      'TC referencia',
      'Factor',
      'Nivel',
      'Descuento',
      'Objetivo',
      'Factor mínimo requerido',
      'Δ factor',
      'Factibilidad',
      'Unidades',
      'Cobertura volumen',
      'Costo base convertido',
      'Costo estresado',
      'Impacto costo',
      'Venta',
      'GP',
      'Margen',
      'Factor neto ponderado',
      'Producto limitante',
    ],
    ...result.cells.map((cell) => [
      cell.order,
      cell.scenarioLabel,
      cell.costChangeRate,
      cell.exchangeRate,
      cell.referenceExchangeRate,
      cell.commonListFactor,
      cell.tierLabel,
      cell.discountRate,
      objectiveDescription(cell.objective),
      cell.minimumRequiredFactor,
      cell.factorGapToMinimum,
      feasibilityLabel(cell),
      cell.totalUnits,
      cell.volumeCoverageRate,
      cell.convertedBaseCostTotal,
      cell.stressedCostTotal,
      cell.costImpact,
      cell.totalSellingPrice,
      cell.totalGrossProfit,
      cell.grossMargin,
      cell.weightedNetFactor,
      cell.limitingProductLabel,
    ]),
  ]
}

function productRows(
  result: PriceCostFxStressResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Escenario',
      'Factor',
      'Nivel',
      'Producto',
      'SKU',
      'Cantidad',
      'Costo base origen',
      'Costo ajustado origen',
      'Costo base convertido',
      'Costo estresado unitario',
      'Factor requerido',
      'Δ factor',
      'Precio lista',
      'Precio neto',
      'GP unitario',
      'Margen unitario',
      'Cumple',
      'Costo total estresado',
      'Venta total',
      'GP total',
    ],
    ...result.cells.flatMap((cell) => cell.products.map((product) => [
      cell.scenarioLabel,
      cell.commonListFactor,
      cell.tierLabel,
      product.product.model ?? product.product.id,
      product.product.sku,
      product.quantity,
      product.baseCostInSourceCurrency,
      product.adjustedCostInSourceCurrency,
      product.convertedBaseCost,
      product.stressedUnitCost,
      product.requiredListFactor,
      product.factorGap,
      product.metrics?.listPrice ?? null,
      product.metrics?.sellingPrice ?? null,
      product.metrics?.grossProfit ?? null,
      product.metrics?.grossMargin ?? null,
      product.meetsObjective,
      product.stressedCostTotal,
      product.totalSellingPrice,
      product.totalGrossProfit,
    ])),
  ]
}

function scenarioRows(
  result: PriceCostFxStressResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Escenario',
      'Variación costo',
      'Tipo cambio',
      'Combinaciones',
      'Factibles',
      'Parciales',
      'No factibles',
      'Margen mínimo',
      'GP total mínimo',
      'Factor máximo requerido',
      'Nivel crítico',
      'Producto crítico',
    ],
    ...result.scenarioSummaries.map((summary) => [
      summary.scenarioLabel,
      summary.costChangeRate,
      summary.exchangeRate,
      summary.cellCount,
      summary.fullyFeasibleCellCount,
      summary.partiallyFeasibleCellCount,
      summary.notFeasibleCellCount,
      summary.minimumGrossMargin,
      summary.minimumTotalGrossProfit,
      summary.maximumRequiredFactor,
      summary.criticalTierLabel,
      summary.criticalProductLabel,
    ]),
  ]
}

function factorRows(
  result: PriceCostFxStressResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Factor',
      'Combinaciones',
      'Factibles',
      'Parciales',
      'No factibles',
      'Cobertura mínima',
      'Margen mínimo',
      'GP total mínimo',
      'Factible en todos los escenarios y niveles',
    ],
    ...result.factorSummaries.map((summary) => [
      summary.commonListFactor,
      summary.cellCount,
      summary.fullyFeasibleCellCount,
      summary.partiallyFeasibleCellCount,
      summary.notFeasibleCellCount,
      summary.minimumVolumeCoverageRate,
      summary.minimumGrossMargin,
      summary.minimumTotalGrossProfit,
      summary.fullyFeasibleAcrossAllScenariosAndTiers,
    ]),
  ]
}

function metadataRows(
  result: PriceCostFxStressResult,
): PricingBatchExportCell[][] {
  return [
    ['Campo', 'Valor'],
    ['Metodología', result.methodology],
    ['Modo de ejecución', result.executionMode],
    ['Muta precio de catálogo', result.isolation.mutatesCatalogPrice],
    ['Muta costo fuente', result.isolation.mutatesSourceCost],
    ['Persiste prueba', result.isolation.persistsStressTest],
    ['Consulta tipo de cambio en vivo', result.isolation.fetchesLiveExchangeRate],
    ['Tipo de cambio de referencia', result.input.referenceExchangeRate],
    ['Escribe Business Repository', result.isolation.writesBusinessRepository],
    ['Escribe otros Workspaces', result.isolation.writesOtherWorkspaces],
    ['Aviso', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    [],
    ['Escenarios explícitos'],
    ['Escenario', 'Variación costo', 'Tipo cambio', 'Notas'],
    ...result.input.scenarios.map((scenario) => [
      scenario.label,
      scenario.costChangeRate,
      scenario.exchangeRate,
      scenario.notes ?? null,
    ]),
    [],
    ['Niveles explícitos'],
    ['Nivel', 'Descuento', 'Objetivo', 'Notas'],
    ...result.input.tiers.map((tier) => [
      tier.label,
      tier.discountRate,
      objectiveDescription(tier.objective),
      tier.notes ?? null,
    ]),
    [],
    ['Explicabilidad'],
    ...result.explainability.map((message) => [message]),
    [],
    ['Incidencias'],
    ['Código', 'Severidad', 'Escenario', 'Nivel', 'Producto', 'Factor', 'Mensaje'],
    ...result.issues.map((issue) => [
      issue.code,
      issue.severity,
      issue.scenarioId,
      issue.tierId,
      issue.productId,
      issue.commonListFactor,
      issue.message,
    ]),
  ]
}

export function buildPricingCostFxStressExport(
  result: PriceCostFxStressResult,
  generatedAt = new Date(),
): PricingBatchDesignExportPayload {
  if (!result.available) {
    throw new Error('Pricing cost and FX stress result is not available for export.')
  }

  const brand = sanitizeFilePart(result.input.brandName ?? 'NUEVA-MARCA') || 'NUEVA-MARCA'
  const currency = sanitizeFilePart(result.input.reportingCurrency) || 'MONEDA'
  const date = generatedAt.toISOString().slice(0, 10)

  return {
    fileName: `PM-Intelligence-Pricing-Cost-FX-Stress-${brand}-${currency}-${date}.xlsx`,
    sheets: [
      {
        name: 'Resumen Ejecutivo',
        rows: summaryRows(result, generatedAt),
        columnWidths: [44, 92],
      },
      {
        name: 'Matriz Stress',
        rows: matrixRows(result),
        columnWidths: [8, 24, 14, 14, 14, 12, 22, 14, 24, 18, 14, 16, 14, 16, 18, 18, 18, 18, 18, 16, 18, 24],
        autoFilter: true,
        columnFormats: {
          2: percentageFormat,
          5: factorFormat,
          7: percentageFormat,
          9: factorFormat,
          10: factorFormat,
          12: quantityFormat,
          13: percentageFormat,
          14: moneyFormat,
          15: moneyFormat,
          16: moneyFormat,
          17: moneyFormat,
          18: moneyFormat,
          19: percentageFormat,
          20: factorFormat,
        },
      },
      {
        name: 'Detalle por Producto',
        rows: productRows(result),
        columnWidths: [22, 12, 20, 22, 16, 12, 18, 18, 18, 18, 16, 14, 18, 18, 18, 16, 12, 18, 18, 18],
        autoFilter: true,
      },
      {
        name: 'Resumen Escenarios',
        rows: scenarioRows(result),
        columnWidths: [24, 16, 16, 14, 12, 12, 14, 16, 18, 18, 22, 24],
        autoFilter: true,
      },
      {
        name: 'Resumen por Factor',
        rows: factorRows(result),
        columnWidths: [14, 16, 12, 12, 14, 18, 16, 18, 24],
        autoFilter: true,
      },
      {
        name: 'Metadatos',
        rows: metadataRows(result),
        columnWidths: [34, 30, 24, 24, 24, 20, 72],
      },
    ],
  }
}
