import type {
  SalesContributionItem,
  SalesWorkspaceViewModel,
} from '../types'

export type SalesExportCell =
  | string
  | number
  | boolean
  | null

export interface SalesExportSheet {
  name: string
  rows: SalesExportCell[][]
  columnWidths?: number[]
}

export interface SalesExecutiveExportPayload {
  fileName: string
  sheets: SalesExportSheet[]
}

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

function metricRows(
  workspace: SalesWorkspaceViewModel,
): SalesExportCell[][] {
  const current = workspace.current

  return [
    ['Métrica', 'Valor actual', 'Objetivo', 'Cumplimiento', 'Variación comparable'],
    [
      'Venta',
      current?.revenue ?? 0,
      workspace.performance.revenue.target,
      workspace.performance.revenue.attainment,
      workspace.comparison.revenueVariation,
    ],
    [
      'Gross Profit',
      current?.grossProfit ?? 0,
      workspace.performance.grossProfit.target,
      workspace.performance.grossProfit.attainment,
      workspace.comparison.grossProfitVariation,
    ],
    [
      'Margen bruto',
      current?.grossMargin ?? 0,
      workspace.performance.grossMargin.target,
      workspace.performance.grossMargin.attainment,
      workspace.comparison.marginPointVariation,
    ],
    [
      'Cantidad',
      current?.quantity ?? 0,
      null,
      null,
      workspace.comparison.quantityVariation,
    ],
    [
      'Documentos',
      current?.documents ?? 0,
      null,
      null,
      null,
    ],
    [
      'Clientes activos',
      current?.customerCount ?? 0,
      null,
      null,
      null,
    ],
    [
      'Productos activos',
      current?.productCount ?? 0,
      null,
      null,
      null,
    ],
  ]
}

function summaryRows(
  workspace: SalesWorkspaceViewModel,
  generatedAt: Date,
): SalesExportCell[][] {
  const summary =
    workspace.executiveSummary

  return [
    ['PM Intelligence Workspace'],
    ['Sales Workspace · Reporte ejecutivo'],
    ['Periodo', workspace.selectedPeriodLabel],
    ['Periodo comparable', workspace.comparison.previousPeriodLabel],
    ['Generado', generatedAt.toISOString()],
    ['Contexto', summary.filterContext],
    [],
    ['Resumen ejecutivo'],
    [summary.overview],
    [],
    ['Proyección y perspectiva'],
    [summary.outlook],
    [],
    ['Hallazgo', 'Valor', 'Detalle', 'Tono'],
    ...summary.findings.map(
      (finding) => [
        finding.label,
        finding.value,
        finding.detail,
        finding.tone,
      ],
    ),
  ]
}

function brandPerformanceRows(
  workspace: SalesWorkspaceViewModel,
): SalesExportCell[][] {
  return [
    [
      'Marca',
      'Venta actual',
      'Objetivo',
      'Cumplimiento %',
      'Esperado al corte',
      'Brecha contra ritmo',
      'Proyección',
      'Cumplimiento proyectado %',
      'Margen actual %',
      'Margen objetivo %',
      'Variación margen pp',
      'Estado',
    ],
    ...workspace.brandPerformance.map(
      (item) => [
        item.brandName,
        item.actualRevenue,
        item.targetRevenue,
        item.attainment,
        item.expectedToDate,
        item.varianceToPlan,
        item.projectedRevenue,
        item.projectedAttainment,
        item.currentGrossMargin,
        item.targetGrossMargin,
        item.marginVariancePoints,
        item.status,
      ],
    ),
  ]
}

function opportunityRows(
  workspace: SalesWorkspaceViewModel,
): SalesExportCell[][] {
  return [
    [
      'Prioridad',
      'Tipo',
      'Entidad',
      'Título',
      'Descripción',
      'Acción recomendada',
      'Impacto estimado',
      'Score',
      'Confianza',
      'Esfuerzo',
      'Venta diaria requerida',
    ],
    ...workspace.commercialOpportunities.opportunities.map(
      (item) => [
        item.priority,
        item.type,
        item.entityLabel,
        item.title,
        item.description,
        item.recommendedAction,
        item.impact,
        item.score,
        item.confidence,
        item.effort,
        item.dailyRevenueRequired,
      ],
    ),
  ]
}

function contributionRows(
  dimension: string,
  direction: string,
  items: SalesContributionItem[],
): SalesExportCell[][] {
  return items.map(
    (item) => [
      dimension,
      direction,
      item.label,
      item.currentRevenue,
      item.comparisonRevenue,
      item.revenueVariation,
      item.revenueVariationPercentage,
      item.grossProfitVariation,
      item.quantityVariation,
      item.documentsVariation,
      item.currentParticipation,
      item.comparisonParticipation,
      item.mixVariationPoints,
      item.movementShare,
    ],
  )
}

function varianceRows(
  workspace: SalesWorkspaceViewModel,
): SalesExportCell[][] {
  const analysis =
    workspace.varianceContribution

  return [
    [
      'Dimensión',
      'Dirección',
      'Entidad',
      'Venta actual',
      'Venta comparable',
      'Variación venta',
      'Variación venta %',
      'Variación GP',
      'Variación cantidad',
      'Variación documentos',
      'Participación actual %',
      'Participación comparable %',
      'Variación mezcla pp',
      'Peso del movimiento %',
    ],
    ...contributionRows(
      'Marca',
      'Positiva',
      analysis.brands.positive,
    ),
    ...contributionRows(
      'Marca',
      'Negativa',
      analysis.brands.negative,
    ),
    ...contributionRows(
      'Cliente',
      'Positiva',
      analysis.customers.positive,
    ),
    ...contributionRows(
      'Cliente',
      'Negativa',
      analysis.customers.negative,
    ),
    ...contributionRows(
      'Producto',
      'Positiva',
      analysis.products.positive,
    ),
    ...contributionRows(
      'Producto',
      'Negativa',
      analysis.products.negative,
    ),
  ]
}

function detailRows(
  workspace: SalesWorkspaceViewModel,
): SalesExportCell[][] {
  return [
    [
      'Periodo',
      'Marca',
      'Cliente ID',
      'Cliente',
      'Producto ID',
      'Producto',
      'Ubicación',
      'Vendedor',
      'Venta',
      'Gross Profit',
      'Margen %',
      'Cantidad',
      'Documentos',
      'Filas origen',
    ],
    ...workspace.detailRows.map(
      (item) => [
        item.periodId,
        item.brandLabel,
        item.customerId,
        item.customerLabel,
        item.productId,
        item.productLabel,
        item.locationLabel,
        item.salesRepresentativeLabel,
        item.revenue,
        item.grossProfit,
        item.grossMargin,
        item.quantity,
        item.documents,
        item.rowCount,
      ],
    ),
  ]
}

function reconciliationRows(
  workspace: SalesWorkspaceViewModel,
): SalesExportCell[][] {
  return [
    ['Métrica', 'Valor'],
    ['Filas evaluadas', workspace.reconciliation.totalRows],
    ['Filas conciliadas', workspace.reconciliation.matchedRows],
    ['Filas ambiguas', workspace.reconciliation.ambiguousRows],
    ['Filas sin correspondencia', workspace.reconciliation.unmatchedRows],
    ['Tasa de conciliación %', workspace.reconciliation.matchRate],
  ]
}

export function buildSalesExecutiveExport(
  workspace: SalesWorkspaceViewModel,
  generatedAt: Date = new Date(),
): SalesExecutiveExportPayload {
  const periodPart =
    sanitizeFilePart(
      workspace.selectedPeriodId ??
        workspace.selectedPeriodLabel,
    ) || 'sin-periodo'

  return {
    fileName:
      `PM-Intelligence-Sales-${periodPart}.xlsx`,
    sheets: [
      {
        name: 'Resumen ejecutivo',
        rows: summaryRows(
          workspace,
          generatedAt,
        ),
        columnWidths: [28, 24, 72, 18],
      },
      {
        name: 'KPIs',
        rows: metricRows(workspace),
        columnWidths: [28, 18, 18, 18, 22],
      },
      {
        name: 'Desempeño marcas',
        rows: brandPerformanceRows(workspace),
        columnWidths: [24, 16, 16, 18, 18, 20, 16, 24, 18, 18, 20, 18],
      },
      {
        name: 'Oportunidades',
        rows: opportunityRows(workspace),
        columnWidths: [14, 20, 24, 42, 58, 58, 18, 12, 12, 12, 22],
      },
      {
        name: 'Contribuciones',
        rows: varianceRows(workspace),
        columnWidths: [14, 14, 30, 16, 18, 16, 18, 16, 18, 20, 22, 26, 20, 22],
      },
      {
        name: 'Detalle',
        rows: detailRows(workspace),
        columnWidths: [12, 20, 16, 34, 16, 30, 18, 24, 16, 16, 14, 14, 14, 14],
      },
      {
        name: 'Conciliación',
        rows: reconciliationRows(workspace),
        columnWidths: [32, 18],
      },
    ],
  }
}
