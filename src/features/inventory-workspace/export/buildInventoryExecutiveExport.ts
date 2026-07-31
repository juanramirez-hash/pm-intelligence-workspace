import type {
  InventoryAnalyticsReport,
  InventoryOpportunitySignal,
  InventoryRiskSignal,
  InventoryStockStatus,
} from '../../../core/business/analytics/inventory'

import {
  buildInventoryCatalogSummary,
} from '../engine/inventoryCatalogEnrichment'

import type {
  InventoryWorkspacePosition,
} from '../engine/inventoryCatalogEnrichment'

import type {
  InventoryExecutiveSummary,
} from '../engine/inventoryExecutiveSummary'

import type {
  InventoryWorkspaceFilters,
} from '../engine/inventoryWorkspaceModel'

export type InventoryExportCell =
  | string
  | number
  | boolean
  | null

export interface InventoryExportSheet {
  name: string
  rows: InventoryExportCell[][]
  columnWidths?: number[]
  autoFilter?: boolean
}

export interface InventoryExecutiveExportPayload {
  fileName: string
  sheets: InventoryExportSheet[]
}

export interface InventoryExecutiveExportInput {
  analytics: InventoryAnalyticsReport
  positions: readonly InventoryWorkspacePosition[]
  risks: readonly InventoryRiskSignal[]
  opportunities: readonly InventoryOpportunitySignal[]
  filters: InventoryWorkspaceFilters
  summary: InventoryExecutiveSummary
}

const stockStatusLabels: Record<InventoryStockStatus, string> = {
  available: 'Disponible',
  out_of_stock: 'Agotado',
  negative_stock: 'Inventario negativo',
  overcommitted: 'Sobrecomprometido',
  inbound_only: 'Solo entradas pendientes',
  no_available_stock: 'Sin disponibilidad',
}

const priorityLabels = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const riskTypeLabels = {
  negative_stock: 'Inventario negativo',
  out_of_stock: 'Producto agotado',
  overcommitted: 'Sobrecomprometido',
  no_available_stock: 'Sin disponibilidad',
  unresolved_product: 'Producto sin conciliar',
  value_concentration: 'Concentración de valor',
}

const opportunityTypeLabels = {
  transfer_candidate: 'Transferencia interna',
  purchase_review: 'Revisión de compra',
  inbound_recovery: 'Seguimiento de entrada',
  commitment_release: 'Liberación de compromisos',
}

const replacementFilterLabels = {
  all: 'Todos',
  with_superseded: 'Con Superseded',
  with_direct_substitute: 'Con sustituto directo',
  both: 'Con ambos reemplazos',
  without_replacement: 'Sin reemplazo',
}

const replacementStatusLabels = {
  both: 'Superseded y sustituto directo',
  superseded_only: 'Solo Superseded',
  direct_substitute_only: 'Solo sustituto directo',
  none: 'Sin reemplazo',
}

function sanitizeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function summaryRows(
  input: InventoryExecutiveExportInput,
  generatedAt: Date,
): InventoryExportCell[][] {
  const { analytics, positions, summary } = input
  const totals = analytics.totals
  const catalog = buildInventoryCatalogSummary(positions)

  return [
    ['PM Intelligence Workspace'],
    ['Inventory Workspace · Reporte ejecutivo'],
    ['Corte', analytics.snapshotDate ?? 'Sin fecha de corte'],
    ['Generado', generatedAt.toISOString()],
    ['Contexto', summary.filterContext],
    [],
    ['Resumen ejecutivo'],
    [summary.overview],
    [],
    ['Perspectiva operativa'],
    [summary.outlook],
    [],
    ['Métrica', 'Valor'],
    ['Valor de inventario', totals.inventoryValue],
    ['Posiciones', totals.positions],
    ['Productos', totals.products],
    ['Ubicaciones', totals.locations],
    ['Existencia física', totals.onHand],
    ['Disponible', totals.available],
    ['Comprometido', totals.committed],
    ['En tránsito', totals.inTransit],
    ['En orden de compra', totals.onOrder],
    ['Entradas pendientes', totals.inboundUnits],
    ['Tasa de disponibilidad', totals.availableRate],
    ['Tasa de compromiso', totals.committedRate],
    ['Productos sin conciliar', totals.unresolvedProducts],
    ['Productos clasificados A-E', catalog.classifiedProducts],
    ['Productos sin categoría de valor', catalog.unclassifiedProducts],
    ['Productos con Superseded', catalog.productsWithSuperseded],
    ['Productos con sustituto directo', catalog.productsWithDirectSubstitute],
    ['Superseded sin sustituto directo', catalog.supersededWithoutDirectSubstitute],
    ['Valor de inventario Superseded', catalog.supersededInventoryValue],
    ['Existencia física Superseded', catalog.supersededOnHand],
    ['Disponible Superseded', catalog.supersededAvailable],
    [],
    ['Estado', 'Posiciones', 'Productos', 'Valor', 'Participación'],
    ...analytics.stockStatus.map((status) => [
      stockStatusLabels[status.status],
      status.positions,
      status.products,
      status.inventoryValue,
      status.valueShare,
    ]),
    [],
    ['Hallazgo', 'Valor', 'Detalle', 'Tono'],
    ...summary.findings.map((finding) => [
      finding.label,
      finding.value,
      finding.detail,
      finding.tone,
    ]),
  ]
}

function locationRows(
  analytics: InventoryAnalyticsReport,
): InventoryExportCell[][] {
  return [
    [
      'Ubicación',
      'Posiciones',
      'Productos',
      'Existencia',
      'Disponible',
      'Comprometido',
      'En tránsito',
      'En orden',
      'Entradas pendientes',
      'Valor inventario',
      'Participación',
      'Tasa disponibilidad',
    ],
    ...analytics.byLocation.map((group) => [
      group.label,
      group.positions,
      group.products,
      group.onHand,
      group.available,
      group.committed,
      group.inTransit,
      group.onOrder,
      group.inTransit + group.onOrder,
      group.inventoryValue,
      group.valueShare,
      group.availableRate,
    ]),
  ]
}

function positionRows(
  positions: readonly InventoryWorkspacePosition[],
): InventoryExportCell[][] {
  return [
    [
      'Corte',
      'Producto ID',
      'Producto',
      'Código',
      'Modelo',
      'Marca',
      'Ubicación',
      'Estado identidad',
      'Categoría de valor',
      'Superseded By',
      'Disponible Superseded',
      'Sustituto directo',
      'Disponible sustituto directo',
      'Estado de sustitución',
      'Existencia',
      'Disponible',
      'Comprometido',
      'En tránsito',
      'En orden',
      'Entradas pendientes',
      'Costo unitario',
      'Valor inventario',
      'Moneda',
      'Filas origen',
    ],
    ...positions.map((position) => [
      position.snapshotDate,
      position.productId,
      position.productName,
      position.productCode,
      position.model,
      position.brandId,
      position.locationId,
      position.identityStatus === 'current_master'
        ? 'Conciliado'
        : 'Sin conciliar',
      position.commercialStatus,
      position.supersededBy,
      position.supersededByAvailable,
      position.directSubstitute,
      position.directSubstituteAvailable,
      replacementStatusLabels[position.replacementStatus],
      position.onHand,
      position.available,
      position.committed,
      position.inTransit,
      position.onOrder,
      position.inTransit + position.onOrder,
      position.unitCost,
      position.inventoryValue,
      position.currency,
      position.sourceRows,
    ]),
  ]
}

interface SubstitutionProductRow {
  productId: string | null
  productName: string
  productCode: string | null
  model: string | null
  brandId: string | null
  commercialStatus: string | null
  supersededBy: string | null
  supersededByAvailable: number | null
  directSubstitute: string | null
  directSubstituteAvailable: number | null
  replacementStatus: InventoryWorkspacePosition['replacementStatus']
  positions: number
  locations: Set<string>
  onHand: number
  available: number
  inventoryValue: number
}

function substitutionRows(
  positions: readonly InventoryWorkspacePosition[],
): InventoryExportCell[][] {
  const products = new Map<string, SubstitutionProductRow>()

  for (const position of positions) {
    if (!position.supersededBy && !position.directSubstitute) {
      continue
    }

    const key = position.productId ?? position.productName
    const current = products.get(key) ?? {
      productId: position.productId,
      productName: position.productName,
      productCode: position.productCode,
      model: position.model,
      brandId: position.brandId,
      commercialStatus: position.commercialStatus,
      supersededBy: position.supersededBy,
      supersededByAvailable: position.supersededByAvailable,
      directSubstitute: position.directSubstitute,
      directSubstituteAvailable: position.directSubstituteAvailable,
      replacementStatus: position.replacementStatus,
      positions: 0,
      locations: new Set<string>(),
      onHand: 0,
      available: 0,
      inventoryValue: 0,
    }

    current.positions += 1
    current.locations.add(position.locationId)
    current.onHand += position.onHand
    current.available += position.available
    current.inventoryValue += position.inventoryValue
    products.set(key, current)
  }

  const rows = [...products.values()].sort(
    (left, right) =>
      right.inventoryValue - left.inventoryValue ||
      left.productName.localeCompare(right.productName),
  )

  return [
    [
      'Producto ID',
      'Producto',
      'Código',
      'Modelo',
      'Marca',
      'Categoría de valor',
      'Superseded By',
      'Disponible Superseded',
      'Sustituto directo',
      'Disponible sustituto directo',
      'Estado de sustitución',
      'Posiciones',
      'Ubicaciones',
      'Existencia',
      'Disponible',
      'Valor inventario',
    ],
    ...rows.map((product) => [
      product.productId,
      product.productName,
      product.productCode,
      product.model,
      product.brandId,
      product.commercialStatus,
      product.supersededBy,
      product.supersededByAvailable,
      product.directSubstitute,
      product.directSubstituteAvailable,
      replacementStatusLabels[product.replacementStatus],
      product.positions,
      [...product.locations].sort().join(' / '),
      product.onHand,
      product.available,
      product.inventoryValue,
    ]),
  ]
}

function riskRows(
  risks: readonly InventoryRiskSignal[],
): InventoryExportCell[][] {
  return [
    [
      'Prioridad',
      'Score',
      'Tipo',
      'Producto ID',
      'Producto',
      'Marca',
      'Ubicación',
      'Título',
      'Racional',
      'Existencia',
      'Disponible',
      'Comprometido',
      'Entradas',
      'Valor inventario',
      'Participación',
    ],
    ...risks.map((risk) => [
      priorityLabels[risk.priority],
      risk.score,
      riskTypeLabels[risk.type],
      risk.productId,
      risk.productName,
      risk.brandId,
      risk.locationId,
      risk.title,
      risk.rationale,
      risk.evidence.onHand,
      risk.evidence.available,
      risk.evidence.committed,
      risk.evidence.inbound,
      risk.evidence.inventoryValue,
      risk.evidence.valueShare,
    ]),
  ]
}

function opportunityRows(
  opportunities: readonly InventoryOpportunitySignal[],
): InventoryExportCell[][] {
  return [
    [
      'Prioridad',
      'Score',
      'Tipo',
      'Producto ID',
      'Producto',
      'Marca',
      'Origen',
      'Destino',
      'Título',
      'Racional',
      'Faltante',
      'Excedente',
      'Unidades sugeridas',
      'Entradas',
      'Valor inventario',
    ],
    ...opportunities.map((opportunity) => [
      priorityLabels[opportunity.priority],
      opportunity.score,
      opportunityTypeLabels[opportunity.type],
      opportunity.productId,
      opportunity.productName,
      opportunity.brandId,
      opportunity.sourceLocationId,
      opportunity.targetLocationId,
      opportunity.title,
      opportunity.rationale,
      opportunity.evidence.shortageUnits,
      opportunity.evidence.surplusUnits,
      opportunity.evidence.suggestedUnits,
      opportunity.evidence.inboundUnits,
      opportunity.evidence.inventoryValue,
    ]),
  ]
}

function metadataRows(
  input: InventoryExecutiveExportInput,
  generatedAt: Date,
): InventoryExportCell[][] {
  const { analytics, filters, positions, risks, opportunities } = input

  return [
    ['Campo', 'Valor'],
    ['Aplicación', 'PM Intelligence Workspace'],
    ['Módulo', 'Inventory Workspace'],
    ['Entrega', 'IW-006.1'],
    ['Esquema de exportación', '1.1'],
    ['Corte', analytics.snapshotDate ?? 'Sin fecha de corte'],
    ['Generado', generatedAt.toISOString()],
    ['Búsqueda', filters.search || 'Todas'],
    ['Marca', filters.brandId === 'all' ? 'Todas' : filters.brandId],
    [
      'Ubicación',
      filters.locationId === 'all'
        ? 'Todas'
        : filters.locationId,
    ],
    [
      'Prioridad',
      filters.priority === 'all'
        ? 'Todas'
        : priorityLabels[filters.priority],
    ],
    [
      'Categoría de valor',
      filters.commercialStatus === 'all'
        ? 'Todas'
        : filters.commercialStatus === 'unclassified'
          ? 'Sin clasificación'
          : filters.commercialStatus,
    ],
    [
      'Estado de sustitución',
      replacementFilterLabels[filters.replacement],
    ],
    ['Posiciones exportadas', positions.length],
    ['Riesgos exportados', risks.length],
    ['Oportunidades exportadas', opportunities.length],
  ]
}

export function buildInventoryExecutiveExport(
  input: InventoryExecutiveExportInput,
  generatedAt: Date = new Date(),
): InventoryExecutiveExportPayload {
  const snapshotPart = sanitizeFilePart(
    input.analytics.snapshotDate ?? 'corte-actual',
  ) || 'corte-actual'

  return {
    fileName: `PM-Intelligence-Inventory-${snapshotPart}.xlsx`,
    sheets: [
      {
        name: 'Resumen Ejecutivo',
        rows: summaryRows(input, generatedAt),
        columnWidths: [34, 24, 72, 18, 18],
      },
      {
        name: 'Inventario por Ubicación',
        rows: locationRows(input.analytics),
        columnWidths: [26, 14, 14, 16, 16, 16, 16, 16, 20, 20, 16, 20],
        autoFilter: true,
      },
      {
        name: 'Posiciones',
        rows: positionRows(input.positions),
        columnWidths: [14, 18, 34, 18, 24, 20, 22, 18, 18, 28, 20, 28, 24, 28, 14, 14, 16, 14, 14, 20, 16, 20, 12, 14],
        autoFilter: true,
      },
      {
        name: 'Sustituciones',
        rows: substitutionRows(input.positions),
        columnWidths: [18, 34, 18, 24, 20, 18, 28, 20, 28, 24, 28, 14, 32, 14, 14, 20],
        autoFilter: true,
      },
      {
        name: 'Riesgos',
        rows: riskRows(input.risks),
        columnWidths: [12, 10, 24, 18, 34, 18, 22, 34, 58, 14, 14, 16, 14, 20, 16],
        autoFilter: true,
      },
      {
        name: 'Oportunidades',
        rows: opportunityRows(input.opportunities),
        columnWidths: [12, 10, 24, 18, 34, 18, 22, 22, 36, 58, 14, 14, 18, 14, 20],
        autoFilter: true,
      },
      {
        name: 'Metadatos',
        rows: metadataRows(input, generatedAt),
        columnWidths: [30, 48],
      },
    ],
  }
}
