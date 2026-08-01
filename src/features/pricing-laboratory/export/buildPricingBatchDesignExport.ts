import type {
  PriceBatchDesignResult,
  PriceBatchDesignRow,
  PriceDesignObjective,
} from '../../../core/business/pricing'

export type PricingBatchExportCell =
  | string
  | number
  | boolean
  | null

export interface PricingBatchExportSheet {
  name: string
  rows: PricingBatchExportCell[][]
  columnWidths?: number[]
  autoFilter?: boolean
  columnFormats?: Record<number, string>
}

export interface PricingBatchDesignExportPayload {
  fileName: string
  sheets: PricingBatchExportSheet[]
}

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

function strategyLabel(
  result: PriceBatchDesignResult,
): string {
  switch (result.input.commonFactor.strategy) {
    case 'protect_all':
      return 'Proteger todos · mayor factor requerido'
    case 'average_required':
      return 'Promedio simple de factores requeridos'
    case 'explicit':
      return 'Factor común capturado explícitamente'
  }
}

function complianceLabel(
  row: PriceBatchDesignRow,
): string {
  switch (row.compliance) {
    case 'meets_objective':
      return 'Cumple objetivo'
    case 'below_objective':
      return 'Debajo del objetivo'
    case 'invalid':
      return 'No calculable'
  }
}

function summaryRows(
  result: PriceBatchDesignResult,
  generatedAt: Date,
): PricingBatchExportCell[][] {
  return [
    ['PM Intelligence Workspace'],
    ['Pricing Laboratory · New Product & Brand Batch Pricing Matrix'],
    ['Aviso obligatorio', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    ['Generado', generatedAt.toISOString()],
    ['Metodología', result.methodology],
    ['Modo', result.executionMode],
    ['Estado', result.status],
    [],
    ['Identidad del lote'],
    ['Marca provisional', result.input.brandName ?? 'Sin marca'],
    ['Moneda', result.input.currency],
    ['Productos', result.summary.productCount],
    ['Descuentos', result.summary.discountCount],
    ['Filas de matriz', result.summary.matrixRowCount],
    [],
    ['Criterio común'],
    ['Objetivo', objectiveDescription(result.input.objective)],
    ['Estrategia de factor', strategyLabel(result)],
    ['Factor común de lista', result.commonListFactor],
    ['Cumplen objetivo', result.summary.meetsObjectiveCount],
    ['Debajo del objetivo', result.summary.belowObjectiveCount],
    ['Filas inválidas', result.summary.invalidRowCount],
    [],
    ['Interpretación'],
    ['Los totales agregados consideran una unidad de cada producto. No representan proyección de volumen, recomendación, aprobación ni instrucción para publicar precios.'],
    ['Notas', result.input.notes ?? null],
  ]
}

function matrixRows(
  result: PriceBatchDesignResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Orden',
      'Modelo',
      'SKU',
      'Costo',
      'Descuento',
      'Factor individual requerido',
      'Factor común',
      'Δ factor común - requerido',
      'Precio lista con factor común',
      'Venta neta',
      'Factor neto',
      'GP unitario',
      'Margen',
      'Cumplimiento',
      'Estado cálculo',
      'Notas',
    ],
    ...result.rows.map((row) => {
      const metrics = row.commonFactorDesign?.metrics

      return [
        row.order,
        row.product.model ?? row.product.id,
        row.product.sku,
        row.product.cost,
        row.discountRate,
        row.requiredListFactor,
        row.commonListFactor,
        row.factorDelta,
        metrics?.listPrice ?? null,
        metrics?.sellingPrice ?? null,
        metrics?.sellingPriceFactor ?? null,
        metrics?.grossProfit ?? null,
        metrics?.grossMargin ?? null,
        complianceLabel(row),
        row.commonFactorDesign?.status ?? 'invalid',
        row.product.notes ?? result.input.notes ?? null,
      ]
    }),
  ]
}

function discountSummaryRows(
  result: PriceBatchDesignResult,
): PricingBatchExportCell[][] {
  return [
    [
      'Descuento',
      'Productos',
      'Calculables',
      'Debajo objetivo',
      'Costo agregado',
      'Lista agregada',
      'Venta neta agregada',
      'GP agregado',
      'Margen agregado',
    ],
    ...result.discountSummaries.map((summary) => [
      summary.discountRate,
      summary.productCount,
      summary.calculableCount,
      summary.belowObjectiveCount,
      summary.totalCost,
      summary.totalListPrice,
      summary.totalSellingPrice,
      summary.totalGrossProfit,
      summary.grossMargin,
    ]),
  ]
}

function productRows(
  result: PriceBatchDesignResult,
): PricingBatchExportCell[][] {
  return [
    ['Producto temporal', 'Modelo', 'SKU', 'Costo', 'Moneda', 'Notas'],
    ...result.input.products.map((product) => [
      product.id,
      product.model,
      product.sku,
      product.cost,
      result.input.currency,
      product.notes ?? null,
    ]),
    [],
    ['Descuentos explícitos'],
    ...result.input.discountRates.map((discountRate) => [discountRate]),
    [],
    ['Objetivo explícito', objectiveDescription(result.input.objective)],
    ['Estrategia de factor común', strategyLabel(result)],
    ['Factor explícito capturado', result.input.commonFactor.factor ?? null],
  ]
}

function metadataRows(
  result: PriceBatchDesignResult,
): PricingBatchExportCell[][] {
  return [
    ['Campo', 'Valor'],
    ['Metodología', result.methodology],
    ['Modo de ejecución', result.executionMode],
    ['Muta precio de catálogo', result.isolation.mutatesCatalogPrice],
    ['Crea productos o marcas', result.isolation.createsProductsOrBrands],
    ['Persiste lote', result.isolation.persistsBatch],
    ['Escribe Business Repository', result.isolation.writesBusinessRepository],
    ['Escribe otros Workspaces', result.isolation.writesOtherWorkspaces],
    ['Aviso', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
    [],
    ['Explicabilidad'],
    ...result.explainability.map((message) => [message]),
    [],
    ['Incidencias'],
    ['Código', 'Severidad', 'Producto', 'Descuento', 'Mensaje'],
    ...result.issues.map((item) => [
      item.code,
      item.severity,
      item.productId,
      item.discountRate,
      item.message,
    ]),
  ]
}

export function buildPricingBatchDesignExport(
  result: PriceBatchDesignResult,
  generatedAt = new Date(),
): PricingBatchDesignExportPayload {
  if (!result.available || result.commonListFactor === null) {
    throw new Error('Pricing batch design is not available for export.')
  }

  const brand = sanitizeFilePart(
    result.input.brandName ?? 'NUEVA-MARCA',
  ) || 'NUEVA-MARCA'
  const currency = sanitizeFilePart(result.input.currency) || 'MONEDA'
  const date = generatedAt.toISOString().slice(0, 10)

  return {
    fileName: `PM-Intelligence-Pricing-Batch-${brand}-${currency}-${date}.xlsx`,
    sheets: [
      {
        name: 'Resumen Ejecutivo',
        rows: summaryRows(result, generatedAt),
        columnWidths: [34, 85],
        columnFormats: {
          1: factorFormat,
        },
      },
      {
        name: 'Matriz de Pricing',
        rows: matrixRows(result),
        columnWidths: [8, 22, 18, 14, 13, 22, 15, 20, 22, 18, 14, 16, 13, 20, 16, 28],
        autoFilter: true,
        columnFormats: {
          3: moneyFormat,
          4: percentageFormat,
          5: factorFormat,
          6: factorFormat,
          7: factorFormat,
          8: moneyFormat,
          9: moneyFormat,
          10: factorFormat,
          11: moneyFormat,
          12: percentageFormat,
        },
      },
      {
        name: 'Resumen por Descuento',
        rows: discountSummaryRows(result),
        columnWidths: [14, 12, 14, 18, 18, 18, 22, 18, 18],
        autoFilter: true,
        columnFormats: {
          0: percentageFormat,
          4: moneyFormat,
          5: moneyFormat,
          6: moneyFormat,
          7: moneyFormat,
          8: percentageFormat,
        },
      },
      {
        name: 'Productos y Supuestos',
        rows: productRows(result),
        columnWidths: [24, 22, 18, 14, 12, 34],
        columnFormats: {
          3: moneyFormat,
        },
      },
      {
        name: 'Metadatos',
        rows: metadataRows(result),
        columnWidths: [38, 18, 20, 16, 90],
      },
    ],
  }
}
