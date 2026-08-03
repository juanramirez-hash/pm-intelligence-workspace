import type {
  PriceDesignObjective,
  PricePortfolioMixCell,
  PricePortfolioMixResult,
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
  cell: PricePortfolioMixCell,
): string {
  switch (cell.feasibility) {
    case 'fully_feasible':
      return 'Factible en todos los productos activos'
    case 'partially_feasible':
      return 'Factibilidad parcial'
    case 'not_feasible':
      return 'No factible'
    case 'invalid':
      return 'No calculable'
  }
}

function summaryRows(
  result: PricePortfolioMixResult,
  generatedAt: Date,
): PricingBatchExportCell[][] {
  return [
    ['PM Intelligence Workspace'],
    ['Pricing Laboratory · Volume-Weighted Pricing & Portfolio Mix Simulation'],
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
    ['Productos disponibles', result.summary.productCount],
    ['Productos activos en alguna mezcla', result.summary.activeProductCount],
    ['Mezclas', result.summary.mixCount],
    ['Factores', result.summary.factorCount],
    ['Descuentos', result.summary.discountCount],
    ['Combinaciones calculadas', result.summary.cellCount],
    ['Unidades asumidas entre todas las mezclas', result.summary.totalAssumedUnitsAcrossMixes],
    [],
    ['Factibilidad'],
    ['Objetivo explícito', objectiveDescription(result.input.objective)],
    ['Celdas plenamente factibles', result.summary.fullyFeasibleCellCount],
    ['Celdas parcialmente factibles', result.summary.partiallyFeasibleCellCount],
    ['Celdas no factibles', result.summary.notFeasibleCellCount],
    ['Resultados producto debajo del objetivo', result.summary.belowObjectiveProductCount],
    ['Factores factibles en todas las mezclas y descuentos', result.summary.fullyFeasibleFactorCount],
    [],
    ['Interpretación'],
    ['Las cantidades son supuestos temporales. No crean Forecast, presupuesto, demanda, inventario o compromiso de compra.'],
    ['El margen consolidado es GP total dividido entre venta total ponderada; no es el promedio simple de márgenes unitarios.'],
    ['El reporte no recomienda, aprueba ni publica una mezcla, factor, descuento o precio.'],
    ['Notas', result.input.notes ?? null],
  ]
}

function matrixRows(
  result: PricePortfolioMixResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Orden',
      'Mezcla',
      'Factor común',
      'Descuento',
      'Factibilidad',
      'Unidades asumidas',
      'Productos activos',
      'Productos calculables',
      'Productos que cumplen',
      'Productos debajo objetivo',
      'Cobertura por volumen',
      'Costo ponderado',
      'Lista ponderada',
      'Venta ponderada',
      'GP ponderado',
      'Margen consolidado',
      'Factor neto ponderado',
      'Precio promedio por unidad',
      'Margen mínimo producto',
      'Margen máximo producto',
      'Mayor impacto venta',
      'Participación venta',
      'Mayor impacto GP',
      'Participación GP',
    ],
    ...result.cells.map((cell) => [
      cell.order,
      cell.mixLabel,
      cell.commonListFactor,
      cell.discountRate,
      feasibilityLabel(cell),
      cell.totalUnits,
      cell.activeProductCount,
      cell.calculableProductCount,
      cell.meetsObjectiveProductCount,
      cell.belowObjectiveProductCount,
      cell.volumeCoverageRate,
      cell.totalCost,
      cell.totalListPrice,
      cell.totalSellingPrice,
      cell.totalGrossProfit,
      cell.grossMargin,
      cell.weightedNetFactor,
      cell.averageSellingPrice,
      cell.minimumGrossMargin,
      cell.maximumGrossMargin,
      cell.topSalesProductLabel,
      cell.topSalesShare,
      cell.topGrossProfitProductLabel,
      cell.topGrossProfitShare,
    ]),
  ]
}

function productRows(
  result: PricePortfolioMixResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Mezcla',
      'Factor común',
      'Descuento',
      'Producto',
      'SKU',
      'Cantidad',
      'Costo unitario',
      'Precio lista unitario',
      'Precio neto unitario',
      'GP unitario',
      'Margen unitario',
      'Factor requerido',
      'Δ factor',
      'Cumple objetivo',
      'Costo total',
      'Lista total',
      'Venta total',
      'GP total',
      'Participación venta',
      'Participación GP',
    ],
    ...result.cells.flatMap((cell) => cell.products
      .filter((product) => product.quantity > 0)
      .map((product) => [
        cell.mixLabel,
        cell.commonListFactor,
        cell.discountRate,
        product.product.model ?? product.product.id,
        product.product.sku,
        product.quantity,
        product.metrics?.cost ?? product.product.cost,
        product.metrics?.listPrice ?? null,
        product.metrics?.sellingPrice ?? null,
        product.metrics?.grossProfit ?? null,
        product.metrics?.grossMargin ?? null,
        product.requiredListFactor,
        product.factorGap,
        product.meetsObjective,
        product.totalCost,
        product.totalListPrice,
        product.totalSellingPrice,
        product.totalGrossProfit,
        product.salesShare,
        product.grossProfitShare,
      ])),
  ]
}

function mixSummaryRows(
  result: PricePortfolioMixResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Mezcla',
      'Unidades asumidas',
      'Productos activos',
      'Combinaciones',
      'Factibles',
      'Parciales',
      'No factibles',
      'Inválidas',
      'Margen mínimo',
      'Margen máximo',
      'GP mínimo',
      'GP máximo',
    ],
    ...result.mixSummaries.map((summary) => [
      summary.mixLabel,
      summary.totalUnits,
      summary.activeProductCount,
      summary.cellCount,
      summary.fullyFeasibleCellCount,
      summary.partiallyFeasibleCellCount,
      summary.notFeasibleCellCount,
      summary.invalidCellCount,
      summary.minimumGrossMargin,
      summary.maximumGrossMargin,
      summary.minimumTotalGrossProfit,
      summary.maximumTotalGrossProfit,
    ]),
  ]
}

function factorSummaryRows(
  result: PricePortfolioMixResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Factor común',
      'Combinaciones',
      'Factibles',
      'Parciales',
      'No factibles',
      'Inválidas',
      'Cobertura mínima por volumen',
      'Cobertura promedio por volumen',
      'Margen mínimo',
      'Margen máximo',
      'Factible en todas las mezclas y descuentos',
    ],
    ...result.factorSummaries.map((summary) => [
      summary.commonListFactor,
      summary.cellCount,
      summary.fullyFeasibleCellCount,
      summary.partiallyFeasibleCellCount,
      summary.notFeasibleCellCount,
      summary.invalidCellCount,
      summary.minimumVolumeCoverageRate,
      summary.averageVolumeCoverageRate,
      summary.minimumGrossMargin,
      summary.maximumGrossMargin,
      summary.fullyFeasibleAcrossAllMixesAndDiscounts,
    ]),
  ]
}

function metadataRows(
  result: PricePortfolioMixResult,
): PricingBatchExportCell[][] {
  return [
    ['Campo', 'Valor'],
    ['Metodología', result.methodology],
    ['Modo de ejecución', result.executionMode],
    ['Muta precio de catálogo', result.isolation.mutatesCatalogPrice],
    ['Crea productos o marcas', result.isolation.createsProductsOrBrands],
    ['Persiste mezcla', result.isolation.persistsPortfolioMix],
    ['Escribe Forecast', result.isolation.writesForecast],
    ['Escribe Business Repository', result.isolation.writesBusinessRepository],
    ['Escribe otros Workspaces', result.isolation.writesOtherWorkspaces],
    ['Aviso', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    [],
    ['Mezclas y cantidades explícitas'],
    ['Mezcla', 'Producto', 'Cantidad', 'Notas'],
    ...result.input.mixes.flatMap((mix) => mix.quantities.map((quantity) => [
      mix.label,
      quantity.productId,
      quantity.quantity,
      mix.notes ?? null,
    ])),
    [],
    ['Explicabilidad'],
    ...result.explainability.map((message) => [message]),
    [],
    ['Incidencias'],
    ['Código', 'Severidad', 'Mezcla', 'Producto', 'Factor', 'Descuento', 'Mensaje'],
    ...result.issues.map((item) => [
      item.code,
      item.severity,
      item.mixId,
      item.productId,
      item.commonListFactor,
      item.discountRate,
      item.message,
    ]),
  ]
}

export function buildPricingPortfolioMixExport(
  result: PricePortfolioMixResult,
  generatedAt = new Date(),
): PricingBatchDesignExportPayload {
  if (!result.available) {
    throw new Error('Pricing portfolio mix is not available for export.')
  }

  const brand = sanitizeFilePart(
    result.input.brandName ?? 'NUEVA-MARCA',
  ) || 'NUEVA-MARCA'
  const currency = sanitizeFilePart(result.input.currency) || 'MONEDA'
  const date = generatedAt.toISOString().slice(0, 10)

  return {
    fileName: `PM-Intelligence-Pricing-Portfolio-Mix-${brand}-${currency}-${date}.xlsx`,
    sheets: [
      {
        name: 'Resumen Ejecutivo',
        rows: summaryRows(result, generatedAt),
        columnWidths: [44, 92],
        columnFormats: {
          1: quantityFormat,
        },
      },
      {
        name: 'Matriz Mezcla',
        rows: matrixRows(result),
        columnWidths: [8, 22, 14, 14, 24, 16, 16, 18, 18, 22, 18, 18, 18, 18, 18, 18, 18, 20, 18, 18, 22, 18, 22, 18],
        autoFilter: true,
        columnFormats: {
          2: factorFormat,
          3: percentageFormat,
          5: quantityFormat,
          10: percentageFormat,
          11: moneyFormat,
          12: moneyFormat,
          13: moneyFormat,
          14: moneyFormat,
          15: percentageFormat,
          16: factorFormat,
          17: moneyFormat,
          18: percentageFormat,
          19: percentageFormat,
          21: percentageFormat,
          23: percentageFormat,
        },
      },
      {
        name: 'Detalle por Producto',
        rows: productRows(result),
        columnWidths: [22, 14, 14, 24, 18, 14, 16, 18, 18, 16, 16, 18, 14, 16, 18, 18, 18, 18, 18, 18],
        autoFilter: true,
        columnFormats: {
          1: factorFormat,
          2: percentageFormat,
          5: quantityFormat,
          6: moneyFormat,
          7: moneyFormat,
          8: moneyFormat,
          9: moneyFormat,
          10: percentageFormat,
          11: factorFormat,
          12: factorFormat,
          14: moneyFormat,
          15: moneyFormat,
          16: moneyFormat,
          17: moneyFormat,
          18: percentageFormat,
          19: percentageFormat,
        },
      },
      {
        name: 'Resumen por Mezcla',
        rows: mixSummaryRows(result),
        columnWidths: [24, 18, 18, 16, 14, 14, 16, 14, 16, 16, 18, 18],
        autoFilter: true,
        columnFormats: {
          1: quantityFormat,
          8: percentageFormat,
          9: percentageFormat,
          10: moneyFormat,
          11: moneyFormat,
        },
      },
      {
        name: 'Resumen por Factor',
        rows: factorSummaryRows(result),
        columnWidths: [16, 16, 14, 14, 16, 14, 22, 24, 16, 16, 24],
        autoFilter: true,
        columnFormats: {
          0: factorFormat,
          6: percentageFormat,
          7: percentageFormat,
          8: percentageFormat,
          9: percentageFormat,
        },
      },
      {
        name: 'Metadatos',
        rows: metadataRows(result),
        columnWidths: [44, 20, 20, 18, 16, 16, 96],
      },
    ],
  }
}
