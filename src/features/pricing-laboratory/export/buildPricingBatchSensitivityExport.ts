import type {
  PriceBatchSensitivityCell,
  PriceBatchSensitivityResult,
  PriceDesignObjective,
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
  objective: PriceDesignObjective,
): string {
  switch (objective.type) {
    case 'target_gross_margin':
      return `Margen objetivo ${(objective.grossMargin * 100).toLocaleString('es-MX')}%`
    case 'target_gross_profit':
      return `GP unitario objetivo ${objective.grossProfit}`
    case 'target_selling_price':
      return `Precio neto objetivo ${objective.sellingPrice}`
    case 'list_price_factor':
      return `Factor de lista objetivo ${objective.factor}x`
    case 'selling_price_factor':
      return `Factor neto objetivo ${objective.factor}x`
    case 'list_price':
      return `Precio de lista objetivo ${objective.listPrice}`
  }
}

function feasibilityLabel(
  cell: PriceBatchSensitivityCell,
): string {
  switch (cell.feasibility) {
    case 'fully_feasible':
      return 'Cumple en todos los productos'
    case 'partially_feasible':
      return 'Cumplimiento parcial'
    case 'not_feasible':
      return 'No cumple'
    case 'invalid':
      return 'No calculable'
  }
}

function bandLabel(
  cell: PriceBatchSensitivityCell,
): string {
  switch (cell.band) {
    case 'below_minimum':
      return 'Debajo del mínimo matemático'
    case 'minimum_threshold':
      return 'En el mínimo matemático'
    case 'above_minimum':
      return 'Arriba del mínimo matemático'
    case 'unavailable':
      return 'Mínimo no disponible'
  }
}

function summaryRows(
  result: PriceBatchSensitivityResult,
  generatedAt: Date,
): PricingBatchExportCell[][] {
  return [
    ['PM Intelligence Workspace'],
    ['Pricing Laboratory · Batch Pricing Sensitivity & Common Factor Feasibility'],
    ['Aviso obligatorio', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    ['Generado', generatedAt.toISOString()],
    ['Metodología', result.methodology],
    ['Modo', result.executionMode],
    ['Estado', result.status],
    [],
    ['Identidad'],
    ['Matriz de origen', result.input.sourceBatchId],
    ['Marca provisional', result.input.brandName ?? 'Sin marca'],
    ['Moneda', result.input.currency],
    ['Productos', result.summary.productCount],
    ['Descuentos', result.summary.discountCount],
    ['Factores evaluados', result.summary.factorCount],
    ['Combinaciones Factor × Descuento', result.summary.cellCount],
    [],
    ['Factibilidad'],
    ['Objetivo explícito', objectiveDescription(result.input.objective)],
    ['Factor mínimo global matemático', result.globalMinimumFactor],
    ['Factores factibles en todos los descuentos', result.summary.fullyFeasibleFactorCount],
    ['Celdas totalmente factibles', result.summary.fullyFeasibleCellCount],
    ['Celdas parcialmente factibles', result.summary.partiallyFeasibleCellCount],
    ['Celdas no factibles', result.summary.notFeasibleCellCount],
    ['Incumplimientos producto × combinación', result.summary.belowObjectiveCount],
    ['Cobertura máxima', result.summary.maximumCoverageRate],
    ['Cobertura mínima', result.summary.minimumCoverageRate],
    [],
    ['Interpretación'],
    ['El factor mínimo es un umbral matemático derivado del objetivo explícito. No constituye recomendación, aprobación ni instrucción de publicación.'],
    ['Los agregados consideran una unidad de cada producto y no representan volumen, Forecast o presupuesto.'],
    ['Notas', result.input.notes ?? null],
  ]
}

function matrixRows(
  result: PriceBatchSensitivityResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Orden',
      'Factor común',
      'Descuento',
      'Factor mínimo requerido',
      'Δ factor vs mínimo',
      'Banda',
      'Factibilidad',
      'Productos',
      'Calculables',
      'Cumplen',
      'Debajo objetivo',
      'Cobertura',
      'Costo agregado',
      'Lista agregada',
      'Venta neta agregada',
      'GP agregado',
      'Margen agregado',
      'Margen mínimo producto',
      'Margen máximo producto',
    ],
    ...result.cells.map((cell) => [
      cell.order,
      cell.commonListFactor,
      cell.discountRate,
      cell.minimumRequiredFactor,
      cell.factorGapToMinimum,
      bandLabel(cell),
      feasibilityLabel(cell),
      cell.productCount,
      cell.calculableCount,
      cell.meetsObjectiveCount,
      cell.belowObjectiveCount,
      cell.coverageRate,
      cell.totalCost,
      cell.totalListPrice,
      cell.totalSellingPrice,
      cell.totalGrossProfit,
      cell.grossMargin,
      cell.minimumGrossMargin,
      cell.maximumGrossMargin,
    ]),
  ]
}

function minimumRows(
  result: PriceBatchSensitivityResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Descuento',
      'Factor mínimo matemático',
      'Producto limitante',
      'ID producto limitante',
      'Productos calculables',
    ],
    ...result.discountMinimums.map((minimum) => [
      minimum.discountRate,
      minimum.minimumRequiredFactor,
      minimum.limitingProductLabel,
      minimum.limitingProductId,
      minimum.calculableProductCount,
    ]),
    [],
    ['Factor mínimo global', result.globalMinimumFactor],
    ['Nota', 'El mínimo es matemático y no representa un factor recomendado o aprobado.'],
  ]
}

function factorSummaryRows(
  result: PriceBatchSensitivityResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Factor común',
      'Descuentos',
      'Totalmente factibles',
      'Parcialmente factibles',
      'No factibles',
      'Inválidos',
      'Incumplimientos',
      'Cobertura mínima',
      'Cobertura promedio',
      'Factible en todos los descuentos',
    ],
    ...result.factorSummaries.map((summary) => [
      summary.commonListFactor,
      summary.discountCount,
      summary.fullyFeasibleDiscountCount,
      summary.partiallyFeasibleDiscountCount,
      summary.notFeasibleDiscountCount,
      summary.invalidDiscountCount,
      summary.belowObjectiveCount,
      summary.minimumCoverageRate,
      summary.averageCoverageRate,
      summary.fullyFeasibleAcrossAllDiscounts,
    ]),
  ]
}

function productDetailRows(
  result: PriceBatchSensitivityResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Factor común',
      'Descuento',
      'Modelo',
      'SKU',
      'Costo',
      'Factor individual requerido',
      'Δ factor',
      'Lista',
      'Venta neta',
      'Factor neto',
      'GP unitario',
      'Margen',
      'Cumple objetivo',
      'Estado cálculo',
      'Notas',
    ],
    ...result.cells.flatMap((cell) => cell.products.map((product) => [
      cell.commonListFactor,
      cell.discountRate,
      product.product.model ?? product.product.id,
      product.product.sku,
      product.product.cost,
      product.requiredListFactor,
      product.factorGap,
      product.metrics?.listPrice ?? null,
      product.metrics?.sellingPrice ?? null,
      product.metrics?.sellingPriceFactor ?? null,
      product.metrics?.grossProfit ?? null,
      product.metrics?.grossMargin ?? null,
      product.meetsObjective,
      product.design.status,
      product.product.notes ?? result.input.notes ?? null,
    ])),
  ]
}

function metadataRows(
  result: PriceBatchSensitivityResult,
): PricingBatchExportCell[][] {
  return [
    ['Campo', 'Valor'],
    ['Metodología', result.methodology],
    ['Modo de ejecución', result.executionMode],
    ['Muta precio de catálogo', result.isolation.mutatesCatalogPrice],
    ['Crea productos o marcas', result.isolation.createsProductsOrBrands],
    ['Persiste sensibilidad', result.isolation.persistsSensitivity],
    ['Escribe Business Repository', result.isolation.writesBusinessRepository],
    ['Escribe otros Workspaces', result.isolation.writesOtherWorkspaces],
    ['Aviso', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    [],
    ['Factores explícitos'],
    ...result.input.commonListFactors.map((factor) => [factor]),
    [],
    ['Descuentos explícitos'],
    ...result.input.discountRates.map((discountRate) => [discountRate]),
    [],
    ['Explicabilidad'],
    ...result.explainability.map((message) => [message]),
    [],
    ['Incidencias'],
    ['Código', 'Severidad', 'Factor', 'Descuento', 'Producto', 'Mensaje'],
    ...result.issues.map((item) => [
      item.code,
      item.severity,
      item.commonListFactor,
      item.discountRate,
      item.productId,
      item.message,
    ]),
  ]
}

export function buildPricingBatchSensitivityExport(
  result: PriceBatchSensitivityResult,
  generatedAt = new Date(),
): PricingBatchDesignExportPayload {
  if (!result.available || result.globalMinimumFactor === null) {
    throw new Error('Pricing batch sensitivity is not available for export.')
  }

  const brand = sanitizeFilePart(
    result.input.brandName ?? 'NUEVA-MARCA',
  ) || 'NUEVA-MARCA'
  const currency = sanitizeFilePart(result.input.currency) || 'MONEDA'
  const date = generatedAt.toISOString().slice(0, 10)

  return {
    fileName: `PM-Intelligence-Pricing-Sensitivity-${brand}-${currency}-${date}.xlsx`,
    sheets: [
      {
        name: 'Resumen Ejecutivo',
        rows: summaryRows(result, generatedAt),
        columnWidths: [40, 92],
        columnFormats: {
          1: factorFormat,
        },
      },
      {
        name: 'Matriz Sensibilidad',
        rows: matrixRows(result),
        columnWidths: [8, 14, 13, 20, 18, 28, 24, 12, 12, 12, 18, 14, 18, 18, 22, 18, 18, 20, 20],
        autoFilter: true,
        columnFormats: {
          1: factorFormat,
          2: percentageFormat,
          3: factorFormat,
          4: factorFormat,
          11: percentageFormat,
          12: moneyFormat,
          13: moneyFormat,
          14: moneyFormat,
          15: moneyFormat,
          16: percentageFormat,
          17: percentageFormat,
          18: percentageFormat,
        },
      },
      {
        name: 'Mínimos por Descuento',
        rows: minimumRows(result),
        columnWidths: [16, 24, 28, 24, 22],
        autoFilter: true,
        columnFormats: {
          0: percentageFormat,
          1: factorFormat,
        },
      },
      {
        name: 'Resumen por Factor',
        rows: factorSummaryRows(result),
        columnWidths: [16, 14, 22, 24, 16, 12, 18, 18, 20, 28],
        autoFilter: true,
        columnFormats: {
          0: factorFormat,
          7: percentageFormat,
          8: percentageFormat,
        },
      },
      {
        name: 'Detalle por Producto',
        rows: productDetailRows(result),
        columnWidths: [15, 13, 24, 18, 14, 24, 16, 16, 18, 14, 16, 14, 18, 16, 28],
        autoFilter: true,
        columnFormats: {
          0: factorFormat,
          1: percentageFormat,
          4: moneyFormat,
          5: factorFormat,
          6: factorFormat,
          7: moneyFormat,
          8: moneyFormat,
          9: factorFormat,
          10: moneyFormat,
          11: percentageFormat,
        },
      },
      {
        name: 'Metadatos',
        rows: metadataRows(result),
        columnWidths: [42, 18, 18, 18, 22, 90],
      },
    ],
  }
}
