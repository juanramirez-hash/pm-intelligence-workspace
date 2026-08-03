import type {
  PriceCorridorCell,
  PriceCorridorResult,
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

function feasibilityLabel(
  cell: PriceCorridorCell,
): string {
  switch (cell.feasibility) {
    case 'fully_feasible': return 'Factible'
    case 'partially_feasible': return 'Parcial'
    case 'not_feasible': return 'No factible'
    case 'invalid': return 'No calculable'
  }
}

function costBasisLabel(
  result: PriceCorridorResult,
): string {
  return result.input.costBasis === 'reference_landed_cost'
    ? 'Costo aterrizado explícito'
    : 'Costo de compra convertido'
}

function summaryRows(
  result: PriceCorridorResult,
  generatedAt: Date,
): PricingBatchExportCell[][] {
  return [
    ['PM Intelligence Workspace'],
    ['Pricing Laboratory · Price Corridor, Maximum Discount & Margin Floor Simulation'],
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
    ['Base de costo', costBasisLabel(result)],
    ['Productos', result.summary.productCount],
    ['Escenarios', result.summary.scenarioCount],
    ['Niveles comerciales', result.summary.tierCount],
    ['Factores candidatos', result.summary.factorCount],
    [],
    ['Resultado crítico'],
    ['Escenario crítico', result.criticalScenarioLabel],
    ['Factor mínimo global', result.summary.globalMaximumRequiredFactor],
    ['Descuento máximo global soportado', result.summary.globalMinimumSupportedDiscountRate],
    ['Menor distancia de seguridad', result.summary.globalMinimumSafetyAmount],
    ['Factores factibles en todo', result.summary.fullyFeasibleFactorCount],
    ['Resultados debajo del piso', result.summary.belowFloorProductCount],
    ['Resultados exactamente en piso', result.summary.atFloorProductCount],
    [],
    ['Interpretación'],
    ['El precio de lista candidato permanece fijo durante cada escenario de estrés.'],
    ['El piso gobernante es el mayor entre el piso por margen y el piso por GP cuando ambos existen.'],
    ['El semáforo usa únicamente la relación matemática contra el piso; no contiene buffers ocultos.'],
    ['Los resultados no aprueban descuentos ni modifican precios reales.'],
    ['Notas', result.input.notes ?? null],
  ]
}

function productCorridorRows(
  result: PriceCorridorResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Escenario',
      'Factor',
      'Nivel',
      'Producto',
      'SKU',
      'Cantidad',
      'Costo referencia',
      'Costo stress',
      'Δ costo',
      'Precio lista candidato',
      'Precio neto candidato',
      'Piso por margen',
      'Piso por GP',
      'Precio piso gobernante',
      'Descuento máximo soportado',
      'Ancho corredor',
      'Ancho corredor vs piso',
      'Distancia de seguridad',
      'Seguridad vs piso',
      'Factor mínimo requerido',
      'Δ factor',
      'GP unitario',
      'Margen',
      'Exposición',
      'Cumple piso',
    ],
    ...result.cells.flatMap((cell) => cell.products.map((product) => [
      cell.scenarioLabel,
      cell.commonListFactor,
      cell.tierLabel,
      product.product.model ?? product.product.id,
      product.product.sku,
      product.quantity,
      product.referenceUnitCost,
      product.stressedUnitCost,
      product.costDelta,
      product.candidateListPrice,
      product.candidateNetPrice,
      product.floorFromGrossMargin,
      product.floorFromGrossProfit,
      product.priceFloor,
      product.maximumDiscountRate,
      product.corridorWidth,
      product.corridorWidthRate,
      product.safetyAmount,
      product.safetyRateOnFloor,
      product.requiredListFactor,
      product.factorGap,
      product.grossProfit,
      product.grossMargin,
      product.exposure,
      product.meetsFloor,
    ])),
  ]
}

function matrixRows(
  result: PriceCorridorResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Orden',
      'Escenario',
      'Δ costo',
      'Tipo cambio',
      'Factor',
      'Nivel',
      'Descuento',
      'Piso margen',
      'Piso GP',
      'Factor mínimo',
      'Δ factor',
      'Descuento máximo soportado',
      'Ancho mínimo corredor',
      'Seguridad mínima',
      'Seguridad mínima vs piso',
      'Factibilidad',
      'Unidades',
      'Cobertura volumen',
      'Costo referencia',
      'Costo stress',
      'Venta',
      'Piso total',
      'GP',
      'Margen',
      'Producto limitante',
    ],
    ...result.cells.map((cell) => [
      cell.order,
      cell.scenarioLabel,
      cell.costChangeRate,
      cell.exchangeRate,
      cell.commonListFactor,
      cell.tierLabel,
      cell.discountRate,
      cell.minimumGrossMargin,
      cell.minimumGrossProfit,
      cell.minimumRequiredFactor,
      cell.factorGapToMinimum,
      cell.supportedMaximumDiscountRate,
      cell.minimumCorridorWidth,
      cell.minimumSafetyAmount,
      cell.minimumSafetyRateOnFloor,
      feasibilityLabel(cell),
      cell.totalUnits,
      cell.volumeCoverageRate,
      cell.referenceCostTotal,
      cell.stressedCostTotal,
      cell.totalSellingPrice,
      cell.totalPriceFloor,
      cell.totalGrossProfit,
      cell.grossMargin,
      cell.limitingProductLabel,
    ]),
  ]
}

function floorRows(
  result: PriceCorridorResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Nivel',
      'Descuento evaluado',
      'Margen mínimo',
      'GP unitario mínimo',
      'Notas',
    ],
    ...result.input.tiers.map((tier) => [
      tier.label,
      tier.discountRate,
      tier.minimumGrossMargin,
      tier.minimumGrossProfit,
      tier.notes ?? null,
    ]),
    [],
    [
      'Escenario',
      'Factor',
      'Nivel',
      'Producto',
      'Precio piso',
      'Precio lista',
      'Precio neto',
      'Descuento máximo',
      'Descuento evaluado',
      'Distancia al límite',
      'Factor requerido',
      'Exposición',
    ],
    ...result.cells.flatMap((cell) => cell.products.map((product) => [
      cell.scenarioLabel,
      cell.commonListFactor,
      cell.tierLabel,
      product.product.model ?? product.product.id,
      product.priceFloor,
      product.candidateListPrice,
      product.candidateNetPrice,
      product.maximumDiscountRate,
      cell.discountRate,
      product.maximumDiscountRate - cell.discountRate,
      product.requiredListFactor,
      product.exposure,
    ])),
  ]
}

function summaryComparisonRows(
  result: PriceCorridorResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Tipo',
      'Escenario / Factor',
      'Δ costo',
      'TC',
      'Celdas',
      'Factibles',
      'Parciales',
      'No factibles',
      'Cobertura mínima',
      'Factor máximo requerido',
      'Descuento máximo mínimo',
      'Seguridad mínima',
      'Margen mínimo',
      'GP total mínimo',
      'Nivel crítico',
      'Producto crítico',
      'Factible en todo',
    ],
    ...result.scenarioSummaries.map((summary) => [
      'Escenario',
      summary.scenarioLabel,
      summary.costChangeRate,
      summary.exchangeRate,
      summary.cellCount,
      summary.fullyFeasibleCellCount,
      summary.partiallyFeasibleCellCount,
      summary.notFeasibleCellCount,
      null,
      summary.maximumRequiredFactor,
      summary.minimumSupportedMaximumDiscountRate,
      summary.minimumSafetyAmount,
      summary.minimumGrossMargin,
      summary.minimumTotalGrossProfit,
      summary.criticalTierLabel,
      summary.criticalProductLabel,
      null,
    ]),
    ...result.factorSummaries.map((summary) => [
      'Factor',
      summary.commonListFactor,
      null,
      null,
      summary.cellCount,
      summary.fullyFeasibleCellCount,
      summary.partiallyFeasibleCellCount,
      summary.notFeasibleCellCount,
      summary.minimumVolumeCoverageRate,
      null,
      summary.minimumSupportedMaximumDiscountRate,
      summary.minimumSafetyAmount,
      summary.minimumGrossMargin,
      null,
      null,
      null,
      summary.fullyFeasibleAcrossAllScenariosAndTiers,
    ]),
  ]
}

function metadataRows(
  result: PriceCorridorResult,
): PricingBatchExportCell[][] {
  return [
    ['Campo', 'Valor'],
    ['Metodología', result.methodology],
    ['Modo de ejecución', result.executionMode],
    ['Muta precio de catálogo', result.isolation.mutatesCatalogPrice],
    ['Muta costo fuente', result.isolation.mutatesSourceCost],
    ['Persiste corredor', result.isolation.persistsCorridor],
    ['Consulta tipo de cambio en vivo', result.isolation.fetchesLiveExchangeRate],
    ['Aprueba descuento', result.isolation.approvesDiscount],
    ['Escribe Business Repository', result.isolation.writesBusinessRepository],
    ['Escribe otros Workspaces', result.isolation.writesOtherWorkspaces],
    ['Aviso', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    [],
    ['Escenarios'],
    ['Escenario', 'Δ costo', 'Tipo de cambio', 'Notas'],
    ...result.input.scenarios.map((scenario) => [
      scenario.label,
      scenario.costChangeRate,
      scenario.exchangeRate,
      scenario.notes ?? null,
    ]),
    [],
    ['Explicabilidad'],
    ...result.explainability.map((message) => [message]),
    [],
    ['Incidencias'],
    ['Código', 'Severidad', 'Escenario', 'Nivel', 'Producto', 'Factor', 'Mensaje'],
    ...result.issues.map((item) => [
      item.code,
      item.severity,
      item.scenarioId,
      item.tierId,
      item.productId,
      item.commonListFactor,
      item.message,
    ]),
  ]
}

export function buildPricingCorridorExport(
  result: PriceCorridorResult,
  generatedAt = new Date(),
): PricingBatchDesignExportPayload {
  if (!result.available) {
    throw new Error('Pricing corridor result is not available for export.')
  }

  const brand = sanitizeFilePart(
    result.input.brandName ?? 'NUEVA-MARCA',
  ) || 'NUEVA-MARCA'
  const currency = sanitizeFilePart(
    result.input.reportingCurrency,
  ) || 'MONEDA'
  const date = generatedAt.toISOString().slice(0, 10)

  return {
    fileName: `PM-Intelligence-Pricing-Corridor-${brand}-${currency}-${date}.xlsx`,
    sheets: [
      {
        name: 'Resumen Ejecutivo',
        rows: summaryRows(result, generatedAt),
        columnWidths: [42, 92],
        columnFormats: {
          1: factorFormat,
        },
      },
      {
        name: 'Corredores Producto',
        rows: productCorridorRows(result),
        columnWidths: [24, 12, 22, 24, 18, 12, 18, 18, 16, 20, 20, 18, 18, 20, 20, 18, 18, 20, 18, 20, 14, 18, 15, 16, 14],
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
          13: moneyFormat,
          14: percentageFormat,
          15: moneyFormat,
          16: percentageFormat,
          17: moneyFormat,
          18: percentageFormat,
          19: factorFormat,
          20: factorFormat,
          21: moneyFormat,
          22: percentageFormat,
        },
      },
      {
        name: 'Matriz Corredor',
        rows: matrixRows(result),
        columnWidths: [8, 24, 14, 14, 12, 22, 14, 14, 16, 18, 14, 22, 18, 18, 18, 16, 12, 16, 18, 18, 18, 18, 18, 15, 24],
        autoFilter: true,
        columnFormats: {
          2: percentageFormat,
          4: factorFormat,
          6: percentageFormat,
          7: percentageFormat,
          8: moneyFormat,
          9: factorFormat,
          10: factorFormat,
          11: percentageFormat,
          12: moneyFormat,
          13: moneyFormat,
          14: percentageFormat,
          17: percentageFormat,
          18: moneyFormat,
          19: moneyFormat,
          20: moneyFormat,
          21: moneyFormat,
          22: moneyFormat,
          23: percentageFormat,
        },
      },
      {
        name: 'Pisos y Descuentos',
        rows: floorRows(result),
        columnWidths: [24, 18, 18, 18, 30, 18, 18, 18, 18, 18, 18, 16],
        autoFilter: true,
        columnFormats: {
          1: percentageFormat,
          2: percentageFormat,
          3: moneyFormat,
          4: moneyFormat,
          5: moneyFormat,
          6: percentageFormat,
          7: percentageFormat,
          8: percentageFormat,
          9: factorFormat,
        },
      },
      {
        name: 'Resumen Escenario Factor',
        rows: summaryComparisonRows(result),
        columnWidths: [14, 28, 14, 14, 12, 12, 12, 14, 16, 20, 22, 18, 16, 18, 24, 24, 18],
        autoFilter: true,
        columnFormats: {
          2: percentageFormat,
          8: percentageFormat,
          9: factorFormat,
          10: percentageFormat,
          11: moneyFormat,
          12: percentageFormat,
          13: moneyFormat,
        },
      },
      {
        name: 'Metadatos',
        rows: metadataRows(result),
        columnWidths: [42, 18, 18, 18, 18, 20, 92],
      },
    ],
  }
}
