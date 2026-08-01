import type {
  PriceTierLadderCell,
  PriceTierLadderResult,
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

function feasibilityLabel(
  cell: PriceTierLadderCell,
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
  cell: PriceTierLadderCell,
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
  result: PriceTierLadderResult,
  generatedAt: Date,
): PricingBatchExportCell[][] {
  return [
    ['PM Intelligence Workspace'],
    ['Pricing Laboratory · Multi-Tier Margin Architecture & Discount Ladder'],
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
    ['Niveles comerciales', result.summary.tierCount],
    ['Factores candidatos', result.summary.factorCount],
    [],
    ['Arquitectura matemática'],
    ['Factor mínimo global', result.globalMinimumFactor],
    ['Nivel limitante', result.limitingTierLabel],
    ['Producto limitante', result.limitingProductLabel],
    ['Factores factibles en todos los niveles', result.summary.fullyFeasibleFactorCount],
    ['Incumplimientos producto × nivel × factor', result.summary.belowObjectiveCount],
    [],
    ['Interpretación'],
    ['Los factores mínimos son umbrales matemáticos derivados de descuentos y objetivos explícitos. No constituyen recomendación, aprobación ni instrucción de publicación.'],
    ['Los agregados consideran una unidad de cada producto y no representan mezcla, volumen, presupuesto o Forecast.'],
    ['Notas', result.input.notes ?? null],
  ]
}

function ladderRows(
  result: PriceTierLadderResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Orden',
      'Nivel comercial',
      'Descuento',
      'Tipo de objetivo',
      'Valor objetivo',
      'Factor mínimo matemático',
      'Producto limitante',
      'ID producto limitante',
      'Productos calculables',
      'Notas',
    ],
    ...result.tierMinimums.map((minimum) => {
      const tier = result.input.tiers.find(
        (item) => item.id === minimum.tierId,
      )
      const objectiveValue = minimum.objective.type === 'minimum_gross_margin'
        ? minimum.objective.grossMargin
        : minimum.objective.grossProfit

      return [
        minimum.tierOrder,
        minimum.tierLabel,
        minimum.discountRate,
        objectiveDescription(minimum.objective),
        objectiveValue,
        minimum.minimumRequiredFactor,
        minimum.limitingProductLabel,
        minimum.limitingProductId,
        minimum.calculableProductCount,
        tier?.notes ?? null,
      ]
    }),
    [],
    ['Factor mínimo global', result.globalMinimumFactor],
    ['Nivel limitante', result.limitingTierLabel],
    ['Producto limitante', result.limitingProductLabel],
  ]
}

function matrixRows(
  result: PriceTierLadderResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Orden',
      'Factor común',
      'Nivel comercial',
      'Descuento',
      'Objetivo',
      'Factor mínimo nivel',
      'Δ factor vs mínimo',
      'Banda',
      'Factibilidad',
      'Productos',
      'Cumplen',
      'Debajo objetivo',
      'Cobertura',
      'Costo agregado',
      'Lista agregada',
      'Venta agregada',
      'GP agregado',
      'Margen agregado',
      'Margen mínimo producto',
      'Margen máximo producto',
    ],
    ...result.cells.map((cell) => [
      cell.order,
      cell.commonListFactor,
      cell.tierLabel,
      cell.discountRate,
      objectiveDescription(cell.objective),
      cell.minimumRequiredFactor,
      cell.factorGapToMinimum,
      bandLabel(cell),
      feasibilityLabel(cell),
      cell.productCount,
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

function productRows(
  result: PriceTierLadderResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Factor común',
      'Nivel comercial',
      'Descuento',
      'Objetivo',
      'Modelo',
      'SKU',
      'Costo',
      'Factor requerido',
      'Δ factor',
      'Precio lista',
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
      cell.tierLabel,
      cell.discountRate,
      objectiveDescription(cell.objective),
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
      product.tier.notes ?? product.product.notes ?? result.input.notes ?? null,
    ])),
  ]
}

function factorSummaryRows(
  result: PriceTierLadderResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Factor común',
      'Niveles',
      'Totalmente factibles',
      'Parcialmente factibles',
      'No factibles',
      'Inválidos',
      'Incumplimientos',
      'Cobertura mínima',
      'Cobertura promedio',
      'Factible en toda la escalera',
    ],
    ...result.factorSummaries.map((summary) => [
      summary.commonListFactor,
      summary.tierCount,
      summary.fullyFeasibleTierCount,
      summary.partiallyFeasibleTierCount,
      summary.notFeasibleTierCount,
      summary.invalidTierCount,
      summary.belowObjectiveCount,
      summary.minimumCoverageRate,
      summary.averageCoverageRate,
      summary.fullyFeasibleAcrossAllTiers,
    ]),
  ]
}

function metadataRows(
  result: PriceTierLadderResult,
): PricingBatchExportCell[][] {
  return [
    ['Campo', 'Valor'],
    ['Metodología', result.methodology],
    ['Modo de ejecución', result.executionMode],
    ['Muta precio de catálogo', result.isolation.mutatesCatalogPrice],
    ['Crea productos o marcas', result.isolation.createsProductsOrBrands],
    ['Persiste escalera', result.isolation.persistsLadder],
    ['Escribe Business Repository', result.isolation.writesBusinessRepository],
    ['Escribe otros Workspaces', result.isolation.writesOtherWorkspaces],
    ['Aviso', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    [],
    ['Factores candidatos explícitos'],
    ...result.input.commonListFactors.map((factor) => [factor]),
    [],
    ['Explicabilidad'],
    ...result.explainability.map((message) => [message]),
    [],
    ['Incidencias'],
    ['Código', 'Severidad', 'Nivel', 'Producto', 'Factor', 'Mensaje'],
    ...result.issues.map((item) => [
      item.code,
      item.severity,
      item.tierId,
      item.productId,
      item.commonListFactor,
      item.message,
    ]),
  ]
}

export function buildPricingTierLadderExport(
  result: PriceTierLadderResult,
  generatedAt = new Date(),
): PricingBatchDesignExportPayload {
  if (!result.available || result.globalMinimumFactor === null) {
    throw new Error('Pricing tier ladder is not available for export.')
  }

  const brand = sanitizeFilePart(
    result.input.brandName ?? 'NUEVA-MARCA',
  ) || 'NUEVA-MARCA'
  const currency = sanitizeFilePart(result.input.currency) || 'MONEDA'
  const date = generatedAt.toISOString().slice(0, 10)

  return {
    fileName: `PM-Intelligence-Pricing-Discount-Ladder-${brand}-${currency}-${date}.xlsx`,
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
        name: 'Escalera Comercial',
        rows: ladderRows(result),
        columnWidths: [8, 24, 14, 28, 16, 22, 24, 22, 20, 34],
        autoFilter: true,
        columnFormats: {
          2: percentageFormat,
          4: percentageFormat,
          5: factorFormat,
        },
      },
      {
        name: 'Matriz Factor Nivel',
        rows: matrixRows(result),
        columnWidths: [8, 14, 24, 14, 28, 20, 18, 28, 24, 12, 12, 18, 14, 18, 18, 18, 18, 18, 20, 20],
        autoFilter: true,
        columnFormats: {
          1: factorFormat,
          3: percentageFormat,
          5: factorFormat,
          6: factorFormat,
          12: percentageFormat,
          13: moneyFormat,
          14: moneyFormat,
          15: moneyFormat,
          16: moneyFormat,
          17: percentageFormat,
          18: percentageFormat,
          19: percentageFormat,
        },
      },
      {
        name: 'Detalle por Producto',
        rows: productRows(result),
        columnWidths: [14, 24, 14, 28, 24, 18, 14, 18, 16, 18, 18, 14, 16, 14, 18, 16, 34],
        autoFilter: true,
        columnFormats: {
          0: factorFormat,
          2: percentageFormat,
          6: moneyFormat,
          7: factorFormat,
          8: factorFormat,
          9: moneyFormat,
          10: moneyFormat,
          11: factorFormat,
          12: moneyFormat,
          13: percentageFormat,
        },
      },
      {
        name: 'Resumen por Factor',
        rows: factorSummaryRows(result),
        columnWidths: [14, 12, 22, 22, 18, 14, 18, 18, 20, 28],
        autoFilter: true,
        columnFormats: {
          0: factorFormat,
          7: percentageFormat,
          8: percentageFormat,
        },
      },
      {
        name: 'Metadatos',
        rows: metadataRows(result),
        columnWidths: [42, 18, 20, 20, 18, 92],
      },
    ],
  }
}
