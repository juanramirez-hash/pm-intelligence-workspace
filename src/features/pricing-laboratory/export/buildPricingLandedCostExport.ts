import type {
  PriceLandedCostCell,
  PriceLandedCostComponentCalculation,
  PriceLandedCostResult,
  PriceTierObjective,
} from '../../../core/business/pricing'

import type {
  PricingBatchDesignExportPayload,
  PricingBatchExportCell,
} from './buildPricingBatchDesignExport'

const moneyFormat = '#,##0.00;[Red](#,##0.00);-'
const percentageFormat = '0.0%;[Red](0.0%);-'
const factorFormat = '0.0000x'

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

function calculationDescription(
  calculation: PriceLandedCostComponentCalculation,
): string {
  switch (calculation.type) {
    case 'percentage_of_purchase_cost':
      return `${(calculation.rate * 100).toLocaleString('es-MX')}% sobre costo de compra`
    case 'percentage_of_current_subtotal':
      return `${(calculation.rate * 100).toLocaleString('es-MX')}% sobre subtotal acumulado`
    case 'fixed_per_unit':
      return `${calculation.amount} por unidad`
    case 'fixed_total_by_quantity':
      return `${calculation.amount} total distribuido por cantidad`
    case 'fixed_total_by_purchase_cost':
      return `${calculation.amount} total distribuido por valor de compra`
  }
}

function feasibilityLabel(
  cell: PriceLandedCostCell,
): string {
  switch (cell.feasibility) {
    case 'fully_feasible': return 'Factible'
    case 'partially_feasible': return 'Parcial'
    case 'not_feasible': return 'No factible'
    case 'invalid': return 'No calculable'
  }
}

function summaryRows(
  result: PriceLandedCostResult,
  generatedAt: Date,
): PricingBatchExportCell[][] {
  return [
    ['PM Intelligence Workspace'],
    ['Pricing Laboratory · Landed Cost & Price Waterfall Simulation'],
    ['Aviso obligatorio', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    ['Generado', generatedAt.toISOString()],
    ['Metodología', result.methodology],
    ['Modo', result.executionMode],
    ['Estado', result.status],
    [],
    ['Identidad'],
    ['Marca provisional', result.input.brandName ?? 'Sin marca'],
    ['Moneda del costo', result.input.sourceCostCurrency],
    ['Moneda de reporte', result.input.reportingCurrency],
    ['Tipo de cambio de referencia', result.input.referenceExchangeRate],
    ['Base del precio de lista', result.input.listPriceBasis],
    ['Productos activos', result.summary.productCount],
    ['Componentes', result.summary.componentCount],
    ['Escenarios', result.summary.scenarioCount],
    ['Niveles comerciales', result.summary.tierCount],
    ['Factores candidatos', result.summary.factorCount],
    [],
    ['Resultado crítico'],
    ['Escenario crítico', result.criticalScenarioLabel],
    ['Factor máximo requerido', result.summary.globalMaximumRequiredFactor],
    ['Mayor uplift de landed cost', result.summary.maximumLandedCostUpliftRate],
    ['Factores plenamente factibles', result.summary.fullyFeasibleFactorCount],
    ['Resultados producto debajo del objetivo', result.summary.belowObjectiveProductCount],
    [],
    ['Interpretación'],
    ['Los componentes se aplicaron en el orden capturado. Los porcentajes sobre subtotal usan el subtotal acumulado de cada producto.'],
    ['El precio de lista candidato permanece fijo durante los escenarios de estrés.'],
    ['Los resultados no registran costos ni actualizan precios reales.'],
    ['Notas', result.input.notes ?? null],
  ]
}

function componentRows(
  result: PriceLandedCostResult,
): PricingBatchExportCell[][] {
  const definitions: PricingBatchExportCell[][] = [
    [
      'Orden',
      'Componente',
      'Categoría',
      'Dirección',
      'Cálculo',
      'Alcance de productos',
      'Notas',
    ],
    ...result.input.components.map((component, index) => [
      index + 1,
      component.label,
      component.category,
      component.direction,
      calculationDescription(component.calculation),
      component.productIds?.join(', ') ?? 'Todos',
      component.notes ?? null,
    ]),
    [],
    [
      'Escenario',
      'Factor',
      'Nivel',
      'Componente',
      'Impacto costo total',
      'Impacto GP',
      'Impacto margen',
      'Participación landed cost',
    ],
  ]
  const impacts = result.cells.flatMap((cell) =>
    cell.componentSummaries.map((component) => [
      cell.scenarioLabel,
      cell.commonListFactor,
      cell.tierLabel,
      component.componentLabel,
      component.totalImpact,
      component.grossProfitImpact,
      component.grossMarginImpact,
      component.shareOfLandedCost,
    ]),
  )

  return [...definitions, ...impacts]
}

function matrixRows(
  result: PriceLandedCostResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Orden',
      'Escenario',
      'Δ costo compra',
      'Tipo cambio',
      'Δ componentes',
      'Factor',
      'Nivel',
      'Descuento',
      'Objetivo',
      'Base lista',
      'Factor mínimo requerido',
      'Δ factor',
      'Factibilidad',
      'Unidades',
      'Cobertura volumen',
      'Compra referencia',
      'Compra stress',
      'Landed referencia',
      'Landed stress',
      'Impacto landed',
      'Uplift landed',
      'Venta',
      'GP',
      'Margen',
      'Factor neto sobre landed',
      'Producto limitante',
    ],
    ...result.cells.map((cell) => [
      cell.order,
      cell.scenarioLabel,
      cell.purchaseCostChangeRate,
      cell.exchangeRate,
      cell.componentChangeRate,
      cell.commonListFactor,
      cell.tierLabel,
      cell.discountRate,
      objectiveDescription(cell.objective),
      cell.listPriceBasis,
      cell.minimumRequiredFactor,
      cell.factorGapToMinimum,
      feasibilityLabel(cell),
      cell.totalUnits,
      cell.volumeCoverageRate,
      cell.referencePurchaseCostTotal,
      cell.stressedPurchaseCostTotal,
      cell.referenceLandedCostTotal,
      cell.landedCostTotal,
      cell.landedCostImpact,
      cell.landedCostUpliftRate,
      cell.totalSellingPrice,
      cell.totalGrossProfit,
      cell.grossMargin,
      cell.weightedNetFactorOnLandedCost,
      cell.limitingProductLabel,
    ]),
  ]
}

function productRows(
  result: PriceLandedCostResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Escenario',
      'Factor',
      'Nivel',
      'Producto',
      'SKU',
      'Cantidad',
      'Costo origen',
      'Costo ajustado origen',
      'Compra referencia',
      'Compra stress',
      'Landed referencia',
      'Landed stress',
      'Δ landed',
      'Uplift landed',
      'Base precio lista',
      'Precio lista candidato',
      'Precio neto',
      'GP unitario',
      'Margen',
      'Factor requerido',
      'Cumple objetivo',
      'Costo landed total',
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
      product.referencePurchaseCost,
      product.stressedPurchaseCost,
      product.referenceLandedCost,
      product.landedCost,
      product.landedCostDelta,
      product.landedCostUpliftRate,
      product.listPriceBasisAmount,
      product.candidateListPrice,
      product.metrics?.sellingPrice ?? null,
      product.metrics?.grossProfit ?? null,
      product.metrics?.grossMargin ?? null,
      product.requiredListFactor,
      product.meetsObjective,
      product.landedCostTotal,
      product.totalSellingPrice,
      product.totalGrossProfit,
    ])),
  ]
}

function summaryComparisonRows(
  result: PriceLandedCostResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Tipo',
      'Escenario / Factor',
      'Δ costo',
      'TC',
      'Δ componentes',
      'Celdas',
      'Factibles',
      'Parciales',
      'No factibles',
      'Cobertura mínima',
      'Margen mínimo',
      'GP mínimo',
      'Factor máximo requerido',
      'Landed máximo',
      'Uplift máximo',
      'Nivel crítico',
      'Producto crítico',
      'Componente mayor impacto',
      'Factible en todo',
    ],
    ...result.scenarioSummaries.map((summary) => [
      'Escenario',
      summary.scenarioLabel,
      summary.purchaseCostChangeRate,
      summary.exchangeRate,
      summary.componentChangeRate,
      summary.cellCount,
      summary.fullyFeasibleCellCount,
      summary.partiallyFeasibleCellCount,
      summary.notFeasibleCellCount,
      null,
      summary.minimumGrossMargin,
      summary.minimumTotalGrossProfit,
      summary.maximumRequiredFactor,
      summary.maximumLandedCostTotal,
      summary.maximumLandedCostUpliftRate,
      summary.criticalTierLabel,
      summary.criticalProductLabel,
      summary.largestCostComponentLabel,
      null,
    ]),
    ...result.factorSummaries.map((summary) => [
      'Factor',
      summary.commonListFactor,
      null,
      null,
      null,
      summary.cellCount,
      summary.fullyFeasibleCellCount,
      summary.partiallyFeasibleCellCount,
      summary.notFeasibleCellCount,
      summary.minimumVolumeCoverageRate,
      summary.minimumGrossMargin,
      summary.minimumTotalGrossProfit,
      null,
      null,
      null,
      null,
      null,
      null,
      summary.fullyFeasibleAcrossAllScenariosAndTiers,
    ]),
  ]
}

function metadataRows(
  result: PriceLandedCostResult,
): PricingBatchExportCell[][] {
  return [
    ['Campo', 'Valor'],
    ['Metodología', result.methodology],
    ['Modo de ejecución', result.executionMode],
    ['Muta precio de catálogo', result.isolation.mutatesCatalogPrice],
    ['Muta costo fuente', result.isolation.mutatesSourceCost],
    ['Persiste landed cost', result.isolation.persistsLandedCost],
    ['Consulta tipo de cambio en vivo', result.isolation.fetchesLiveExchangeRate],
    ['Escribe Business Repository', result.isolation.writesBusinessRepository],
    ['Escribe otros Workspaces', result.isolation.writesOtherWorkspaces],
    ['Aviso', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    [],
    ['Explicabilidad'],
    ...result.explainability.map((message) => [message]),
    [],
    ['Incidencias'],
    ['Código', 'Severidad', 'Escenario', 'Nivel', 'Producto', 'Componente', 'Factor', 'Mensaje'],
    ...result.issues.map((item) => [
      item.code,
      item.severity,
      item.scenarioId,
      item.tierId,
      item.productId,
      item.componentId,
      item.commonListFactor,
      item.message,
    ]),
  ]
}

export function buildPricingLandedCostExport(
  result: PriceLandedCostResult,
  generatedAt = new Date(),
): PricingBatchDesignExportPayload {
  if (!result.available) {
    throw new Error('Pricing landed-cost result is not available for export.')
  }

  const brand = sanitizeFilePart(
    result.input.brandName ?? 'NUEVA-MARCA',
  ) || 'NUEVA-MARCA'
  const currency = sanitizeFilePart(result.input.reportingCurrency) || 'MONEDA'
  const date = generatedAt.toISOString().slice(0, 10)

  return {
    fileName: `PM-Intelligence-Pricing-Landed-Cost-${brand}-${currency}-${date}.xlsx`,
    sheets: [
      {
        name: 'Resumen Ejecutivo',
        rows: summaryRows(result, generatedAt),
        columnWidths: [38, 90],
        columnFormats: {
          1: factorFormat,
        },
      },
      {
        name: 'Waterfall Componentes',
        rows: componentRows(result),
        columnWidths: [10, 24, 20, 14, 34, 28, 30, 18],
        autoFilter: true,
        columnFormats: {
          4: moneyFormat,
          5: moneyFormat,
          6: percentageFormat,
          7: percentageFormat,
        },
      },
      {
        name: 'Matriz Landed Cost',
        rows: matrixRows(result),
        columnWidths: [8, 25, 14, 14, 15, 12, 22, 13, 24, 22, 20, 14, 16, 12, 16, 18, 18, 18, 18, 18, 16, 18, 18, 15, 20, 24],
        autoFilter: true,
        columnFormats: {
          2: percentageFormat,
          4: percentageFormat,
          5: factorFormat,
          7: percentageFormat,
          10: factorFormat,
          11: factorFormat,
          14: percentageFormat,
          15: moneyFormat,
          16: moneyFormat,
          17: moneyFormat,
          18: moneyFormat,
          19: moneyFormat,
          20: percentageFormat,
          21: moneyFormat,
          22: moneyFormat,
          23: percentageFormat,
          24: factorFormat,
        },
      },
      {
        name: 'Detalle por Producto',
        rows: productRows(result),
        columnWidths: [24, 12, 22, 24, 18, 12, 16, 18, 18, 18, 18, 18, 16, 16, 18, 18, 18, 16, 14, 18, 16, 18, 18, 18],
        autoFilter: true,
        columnFormats: {
          1: factorFormat,
          6: moneyFormat,
          7: moneyFormat,
          8: moneyFormat,
          9: moneyFormat,
          10: moneyFormat,
          11: moneyFormat,
          12: moneyFormat,
          13: percentageFormat,
          14: moneyFormat,
          15: moneyFormat,
          16: moneyFormat,
          17: moneyFormat,
          18: percentageFormat,
          19: factorFormat,
          21: moneyFormat,
          22: moneyFormat,
          23: moneyFormat,
        },
      },
      {
        name: 'Resumen Escenario Factor',
        rows: summaryComparisonRows(result),
        columnWidths: [14, 28, 14, 14, 16, 12, 12, 12, 14, 16, 16, 18, 20, 18, 16, 24, 24, 26, 18],
        autoFilter: true,
        columnFormats: {
          2: percentageFormat,
          4: percentageFormat,
          9: percentageFormat,
          10: percentageFormat,
          11: moneyFormat,
          12: factorFormat,
          13: moneyFormat,
          14: percentageFormat,
        },
      },
      {
        name: 'Metadatos',
        rows: metadataRows(result),
        columnWidths: [42, 18, 18, 18, 18, 20, 18, 90],
      },
    ],
  }
}
