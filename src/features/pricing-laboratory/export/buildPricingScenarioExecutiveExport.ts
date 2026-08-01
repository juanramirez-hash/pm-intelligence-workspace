import type {
  PriceEngineeringGuardrail,
  PriceEngineeringScenarioBasis,
} from '../../../core/business/pricing'

import type {
  PricingScenarioExecutiveComparisonModel,
  PricingScenarioExecutiveComparisonRow,
} from '../types'

export type PricingScenarioExportCell =
  | string
  | number
  | boolean
  | null

export interface PricingScenarioExportSheet {
  name: string
  rows: PricingScenarioExportCell[][]
  columnWidths?: number[]
  autoFilter?: boolean
  columnFormats?: Record<number, string>
}

export interface PricingScenarioExecutiveExportPayload {
  fileName: string
  sheets: PricingScenarioExportSheet[]
}

const moneyFormat = '#,##0.00;[Red](#,##0.00);-'
const percentageFormat = '0.0%;[Red](0.0%);-'
const percentagePointsFormat = '0.0%;[Red](0.0%);-'
const factorFormat = '0.000x'

function sanitizeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function scenarioStatusLabel(
  status: PricingScenarioExecutiveComparisonRow['evaluationStatus'],
): string {
  switch (status) {
    case 'valid':
      return 'Válido'
    case 'warning':
      return 'Advertencia'
    case 'blocked':
      return 'Bloqueado'
    case 'invalid':
      return 'Inválido'
  }
}

function scenarioOriginLabel(
  origin: PricingScenarioExecutiveComparisonRow['origin'],
): string {
  return origin === 'template'
    ? 'Temporal de sesión'
    : 'Almacenado · solo lectura'
}

function basisDescription(
  basis: PriceEngineeringScenarioBasis,
): string {
  switch (basis.type) {
    case 'selling_price':
      return `Precio de venta: ${basis.sellingPrice}`
    case 'discount_rate':
      return `Descuento sobre lista: ${basis.discountRate}`
    case 'target_gross_margin':
      return `Margen objetivo: ${basis.grossMargin}`
    case 'target_gross_profit':
      return `GP unitario objetivo: ${basis.grossProfit}`
    case 'selling_price_factor':
      return `Factor sobre costo: ${basis.factor}`
    case 'additional_discount':
      return `Descuento adicional: ${basis.discountRate} sobre ${basis.applyTo}`
  }
}

function basisValue(
  basis: PriceEngineeringScenarioBasis,
): number {
  switch (basis.type) {
    case 'selling_price':
      return basis.sellingPrice
    case 'discount_rate':
      return basis.discountRate
    case 'target_gross_margin':
      return basis.grossMargin
    case 'target_gross_profit':
      return basis.grossProfit
    case 'selling_price_factor':
      return basis.factor
    case 'additional_discount':
      return basis.discountRate
  }
}

function guardrailLabel(
  guardrail: PriceEngineeringGuardrail,
): string {
  switch (guardrail.type) {
    case 'minimum_gross_margin':
      return 'Margen mínimo'
    case 'minimum_gross_profit':
      return 'GP mínimo'
    case 'minimum_selling_price':
      return 'Precio mínimo'
    case 'maximum_selling_price':
      return 'Precio máximo'
    case 'maximum_discount_rate':
      return 'Descuento máximo'
  }
}

function summaryRows(
  comparison: PricingScenarioExecutiveComparisonModel,
  generatedAt: Date,
): PricingScenarioExportCell[][] {
  const source = comparison.source

  return [
    ['PM Intelligence Workspace'],
    ['Pricing Laboratory · Comparación ejecutiva de escenarios'],
    ['Aviso obligatorio', comparison.disclaimer],
    ['Generado', generatedAt.toISOString()],
    ['Metodología', comparison.methodology],
    ['Modo de ejecución', comparison.executionMode],
    ['Estado de comparación', comparison.status],
    [],
    ['Fuente de precio'],
    ['Producto', source?.productName ?? 'Sin fuente'],
    ['Modelo', source?.model ?? 'Sin modelo'],
    ['SKU', source?.sku ?? 'Sin SKU'],
    ['Marca', source?.brandName ?? 'Sin marca'],
    ['Moneda', source?.currency ?? 'Sin moneda'],
    ['Fecha efectiva', source?.effectiveDate ?? 'Sin fecha efectiva'],
    ['Origen', source?.source ?? 'Sin origen'],
    ['Referencia', source?.sourceReference ?? 'Sin referencia'],
    [],
    ['Métrica vigente', 'Valor'],
    ['Costo', source?.metrics.cost ?? null],
    ['Precio de lista', source?.metrics.listPrice ?? null],
    ['Precio de venta', source?.metrics.sellingPrice ?? null],
    ['Descuento', source?.metrics.discountRate ?? null],
    ['GP unitario', source?.metrics.grossProfit ?? null],
    ['Margen', source?.metrics.grossMargin ?? null],
    ['Factor de lista', source?.metrics.listPriceFactor ?? null],
    ['Factor de venta', source?.metrics.sellingPriceFactor ?? null],
    ['Banda de margen', source?.metrics.marginBand ?? 'Sin banda'],
    [],
    ['Resumen de selección', 'Valor'],
    ['Escenarios solicitados', comparison.summary.requestedRows],
    ['Escenarios incluidos', comparison.summary.selectedRows],
    ['Válidos', comparison.summary.validRows],
    ['Con advertencia', comparison.summary.warningRows],
    ['Bloqueados', comparison.summary.blockedRows],
    ['Selecciones inválidas', comparison.summary.invalidSelections],
    ['Con guardrails', comparison.summary.rowsWithGuardrails],
    ['Con señales', comparison.summary.rowsWithSignals],
    [],
    ['Interpretación'],
    ['La inclusión en este reporte es una selección documental del usuario. No representa recomendación, aprobación ni instrucción para modificar un precio.'],
  ]
}

function comparisonRows(
  comparison: PricingScenarioExecutiveComparisonModel,
): PricingScenarioExportCell[][] {
  const source = comparison.source

  return [
    [
      'Orden',
      'Escenario',
      'Origen',
      'Pricing Group',
      'Estado',
      'Base',
      'Precio vigente',
      'Precio escenario',
      'Δ precio',
      'Δ precio %',
      'Descuento vigente',
      'Descuento escenario',
      'Δ descuento pp',
      'GP vigente',
      'GP escenario',
      'Δ GP',
      'Δ GP %',
      'Margen vigente',
      'Margen escenario',
      'Δ margen pp',
      'Costo',
      'Precio de lista',
      'Factor de venta',
      'Guardrails',
      'Señales',
      'Referencia',
      'Notas',
    ],
    ...comparison.rows.map((row) => [
      row.order,
      row.name,
      scenarioOriginLabel(row.origin),
      row.pricingGroupId,
      scenarioStatusLabel(row.evaluationStatus),
      basisDescription(row.basis),
      source?.metrics.sellingPrice ?? null,
      row.metrics.sellingPrice,
      row.delta.sellingPrice,
      row.delta.sellingPriceRate,
      source?.metrics.discountRate ?? null,
      row.metrics.discountRate,
      row.delta.discountRate,
      source?.metrics.grossProfit ?? null,
      row.metrics.grossProfit,
      row.delta.grossProfit,
      row.delta.grossProfitRate,
      source?.metrics.grossMargin ?? null,
      row.metrics.grossMargin,
      row.delta.grossMargin,
      row.metrics.cost,
      row.metrics.listPrice,
      row.metrics.sellingPriceFactor,
      row.guardrailSummary.total,
      row.signalSummary.total,
      row.sourceReference,
      row.notes,
    ]),
  ]
}

function guardrailAndSignalRows(
  comparison: PricingScenarioExecutiveComparisonModel,
): PricingScenarioExportCell[][] {
  const rows: PricingScenarioExportCell[][] = [[
    'Escenario',
    'Tipo de registro',
    'Código / Regla',
    'Severidad',
    'Umbral',
    'Valor actual',
    'Mensaje',
  ]]

  comparison.rows.forEach((row) => {
    row.guardrails.forEach((guardrail) => {
      rows.push([
        row.name,
        'Guardrail',
        guardrailLabel(guardrail),
        guardrail.severity === 'blocking' ? 'Bloqueante' : 'Advertencia',
        guardrail.threshold,
        null,
        'Restricción explícita capturada para este escenario.',
      ])
    })

    row.signals.forEach((signal) => {
      rows.push([
        row.name,
        'Señal',
        signal.code,
        signal.severity,
        signal.threshold,
        signal.actual,
        signal.message,
      ])
    })
  })

  if (rows.length === 1) {
    rows.push([
      'Sin registros',
      null,
      null,
      null,
      null,
      null,
      'Los escenarios seleccionados no contienen guardrails ni señales.',
    ])
  }

  return rows
}

function assumptionRows(
  comparison: PricingScenarioExecutiveComparisonModel,
): PricingScenarioExportCell[][] {
  const rows: PricingScenarioExportCell[][] = [[
    'Escenario',
    'Clave',
    'Origen',
    'Tipo de base',
    'Valor de base',
    'Aplicado sobre',
    'Pricing Group',
    'Referencia',
    'Notas',
    'Paso de explicación',
    'Explicación',
  ]]

  comparison.rows.forEach((row) => {
    const explanations = row.explainability.length > 0
      ? row.explainability
      : ['Sin explicación adicional.']

    explanations.forEach((explanation, index) => {
      rows.push([
        row.name,
        row.key,
        scenarioOriginLabel(row.origin),
        row.basis.type,
        basisValue(row.basis),
        row.basis.type === 'additional_discount'
          ? row.basis.applyTo
          : null,
        row.pricingGroupId,
        row.sourceReference,
        row.notes,
        index + 1,
        explanation,
      ])
    })
  })

  return rows
}

function metadataRows(
  comparison: PricingScenarioExecutiveComparisonModel,
  generatedAt: Date,
): PricingScenarioExportCell[][] {
  return [
    ['Campo', 'Valor'],
    ['Aplicación', 'PM Intelligence Workspace'],
    ['Módulo', 'Pricing Laboratory'],
    ['Entrega', 'PL-007'],
    ['Esquema de exportación', 'pricing-executive-comparison-v1'],
    ['Generado', generatedAt.toISOString()],
    ['Aviso', comparison.disclaimer],
    ['Muta precio fuente', comparison.isolation.mutatesSourcePrice],
    ['Persiste resultados', comparison.isolation.persistsScenarioResults],
    ['Escribe Business Repository', comparison.isolation.writesBusinessRepository],
    ['Escribe otros Workspaces', comparison.isolation.writesOtherWorkspaces],
    ['Selección automática de ganador', false],
    ['Publicación de precio', false],
    [],
    ['Limitación', 'Detalle'],
    ...comparison.limitations.map((limitation, index) => [
      `L-${index + 1}`,
      limitation,
    ]),
    [],
    ['Incidencia', 'Severidad', 'Escenario', 'Detalle'],
    ...comparison.issues.map((issue) => [
      issue.code,
      issue.severity,
      issue.scenarioKey,
      issue.message,
    ]),
  ]
}

export function buildPricingScenarioExecutiveExport(
  comparison: PricingScenarioExecutiveComparisonModel,
  generatedAt: Date = new Date(),
): PricingScenarioExecutiveExportPayload {
  const source = comparison.source
  const productPart = sanitizeFilePart(
    source?.model ?? source?.sku ?? source?.productName ?? 'sin-producto',
  ) || 'sin-producto'
  const currencyPart = sanitizeFilePart(source?.currency ?? 'sin-moneda') || 'sin-moneda'
  const datePart = generatedAt.toISOString().slice(0, 10)

  return {
    fileName: `PM-Intelligence-Pricing-Laboratory-${productPart}-${currencyPart}-${datePart}.xlsx`,
    sheets: [
      {
        name: 'Resumen Ejecutivo',
        rows: summaryRows(comparison, generatedAt),
        columnWidths: [34, 88],
      },
      {
        name: 'Comparación',
        rows: comparisonRows(comparison),
        columnWidths: [9, 30, 24, 18, 16, 38, 16, 18, 16, 14, 18, 20, 18, 16, 18, 16, 14, 18, 20, 16, 14, 18, 16, 12, 12, 26, 42],
        autoFilter: true,
        columnFormats: {
          6: moneyFormat,
          7: moneyFormat,
          8: moneyFormat,
          9: percentageFormat,
          10: percentageFormat,
          11: percentageFormat,
          12: percentagePointsFormat,
          13: moneyFormat,
          14: moneyFormat,
          15: moneyFormat,
          16: percentageFormat,
          17: percentageFormat,
          18: percentageFormat,
          19: percentagePointsFormat,
          20: moneyFormat,
          21: moneyFormat,
          22: factorFormat,
        },
      },
      {
        name: 'Guardrails y Señales',
        rows: guardrailAndSignalRows(comparison),
        columnWidths: [30, 18, 36, 16, 16, 16, 72],
        autoFilter: true,
      },
      {
        name: 'Supuestos y Trazabilidad',
        rows: assumptionRows(comparison),
        columnWidths: [30, 32, 24, 24, 16, 20, 18, 26, 40, 14, 88],
        autoFilter: true,
      },
      {
        name: 'Metadatos',
        rows: metadataRows(comparison, generatedAt),
        columnWidths: [38, 88, 32, 88],
      },
    ],
  }
}
