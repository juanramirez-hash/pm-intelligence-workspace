import type {
  InventoryAnalyticsReport,
  InventoryOpportunitySignal,
  InventoryRiskSignal,
} from '../../../core/business/analytics/inventory'

import {
  buildInventoryCatalogSummary,
} from './inventoryCatalogEnrichment'

import type {
  InventoryWorkspacePosition,
} from './inventoryCatalogEnrichment'

import type {
  InventoryWorkspaceFilters,
} from './inventoryWorkspaceModel'

import type {
  CostVisibility,
} from '../../auth/brandAccess'

import {
  costTotalLabel,
  formatCostTotal,
} from '../../auth/costPresentation'

export type InventoryExecutiveFindingTone =
  | 'positive'
  | 'warning'
  | 'critical'
  | 'neutral'

export interface InventoryExecutiveFinding {
  label: string
  value: string
  detail: string
  tone: InventoryExecutiveFindingTone
}

export interface InventoryExecutiveSummary {
  title: string
  overview: string
  outlook: string
  filterContext: string
  findings: InventoryExecutiveFinding[]
}

export interface InventoryExecutiveSummaryInput {
  analytics: InventoryAnalyticsReport
  positions: readonly InventoryWorkspacePosition[]
  risks: readonly InventoryRiskSignal[]
  opportunities: readonly InventoryOpportunitySignal[]
  filters: InventoryWorkspaceFilters
  // Defaults to every cost visible (SEC-003C).
  costVisibility?: CostVisibility
}

const replacementFilterLabels = {
  all: 'Todos',
  with_superseded: 'Con Superseded',
  with_direct_substitute: 'Con sustituto directo',
  both: 'Con ambos reemplazos',
  without_replacement: 'Sin reemplazo',
}

function formatCurrency(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function formatNumber(value: number): string {
  return value.toLocaleString('es-MX', {
    maximumFractionDigits: 1,
  })
}

function formatPercentage(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'percent',
    maximumFractionDigits: 1,
  })
}

function buildFilterContext(
  filters: InventoryWorkspaceFilters,
): string {
  const parts: string[] = []

  if (filters.search.trim()) {
    parts.push(`Búsqueda: ${filters.search.trim()}`)
  }

  if (filters.brandId !== 'all') {
    parts.push(`Marca: ${filters.brandId}`)
  }

  if (filters.locationId !== 'all') {
    parts.push(`Ubicación: ${filters.locationId}`)
  }

  if (filters.priority !== 'all') {
    parts.push(`Prioridad: ${filters.priority}`)
  }

  if (filters.commercialStatus !== 'all') {
    parts.push(
      filters.commercialStatus === 'unclassified'
        ? 'Categoría de valor: Sin clasificación'
        : `Categoría de valor: ${filters.commercialStatus}`,
    )
  }

  if (filters.replacement !== 'all') {
    parts.push(
      `Sustitución: ${replacementFilterLabels[filters.replacement]}`,
    )
  }

  return parts.length > 0
    ? parts.join(' · ')
    : 'Vista consolidada del último corte.'
}

function findingTone(
  condition: boolean,
  positiveWhenFalse = false,
): InventoryExecutiveFindingTone {
  if (condition) {
    return 'critical'
  }

  return positiveWhenFalse ? 'positive' : 'neutral'
}

// NULL when the amount cannot be shown; assigned users read "de tus marcas".
function describeCostAmount(
  value: number | null,
  visibility: CostVisibility,
): string | null {
  if (visibility.mode === 'none' || value === null) {
    return null
  }

  return visibility.mode === 'assigned'
    ? `${formatCurrency(value)} de tus marcas`
    : formatCurrency(value)
}

export function buildInventoryExecutiveSummary(
  input: InventoryExecutiveSummaryInput,
): InventoryExecutiveSummary {
  const {
    analytics,
    positions,
    risks,
    opportunities,
    filters,
    costVisibility = { mode: 'all' },
  } = input
  const totals = analytics.totals
  const catalog = buildInventoryCatalogSummary(positions)
  const prioritizedRisks = risks.filter(
    (risk) =>
      risk.priority === 'critical' || risk.priority === 'high',
  )
  const criticalRisks = risks.filter(
    (risk) => risk.priority === 'critical',
  )
  const highPriorityOpportunities = opportunities.filter(
    (opportunity) =>
      opportunity.priority === 'critical' ||
      opportunity.priority === 'high',
  )
  const snapshotLabel = analytics.snapshotDate ?? 'corte actual sin fecha'

  const inventoryValueText = describeCostAmount(
    totals.inventoryValue,
    costVisibility,
  )
  const supersededValueText = describeCostAmount(
    catalog.supersededInventoryValue,
    costVisibility,
  )

  const overviewParts = [
    inventoryValueText === null
      ? `El ${snapshotLabel} registra`
      : `El ${snapshotLabel} concentra ${inventoryValueText}`,
    inventoryValueText === null
      ? `${formatNumber(totals.positions)} posiciones,`
      : `en ${formatNumber(totals.positions)} posiciones,`,
    `${formatNumber(totals.products)} productos y`,
    `${formatNumber(totals.locations)} ubicaciones.`,
    `La disponibilidad representa ${formatPercentage(totals.availableRate)}`,
    `de la existencia física registrada.`,
  ]

  if (catalog.productsWithSuperseded > 0) {
    overviewParts.push(
      supersededValueText === null
        ? `${catalog.productsWithSuperseded} productos con inventario están marcados como Superseded.`
        : `${catalog.productsWithSuperseded} productos con inventario están marcados como Superseded y concentran ${supersededValueText}.`,
    )
  }

  let outlook: string

  if (prioritizedRisks.length > 0) {
    outlook = [
      `La atención inmediata se concentra en ${prioritizedRisks.length}`,
      `riesgos críticos o altos.`,
      `Existen ${opportunities.length} oportunidades operativas`,
      `para transferencia, compra, recuperación de entradas o liberación de compromisos.`,
    ].join(' ')
  } else if (opportunities.length > 0) {
    outlook = [
      'No se detectan riesgos críticos o altos con los filtros actuales.',
      `Se mantienen ${opportunities.length} oportunidades operativas`,
      'que conviene revisar para mejorar disponibilidad y cobertura.',
    ].join(' ')
  } else {
    outlook = [
      'No se detectan riesgos prioritarios ni oportunidades operativas',
      'con los filtros actuales.',
    ].join(' ')
  }

  if (catalog.supersededWithoutDirectSubstitute > 0) {
    outlook += ` ${catalog.supersededWithoutDirectSubstitute} productos Superseded no tienen sustituto directo registrado.`
  }

  return {
    title: `Resumen ejecutivo · ${snapshotLabel}`,
    overview: overviewParts.join(' '),
    outlook,
    filterContext: buildFilterContext(filters),
    findings: [
      {
        label: 'Disponibilidad',
        value: formatPercentage(totals.availableRate),
        detail: `${formatNumber(totals.available)} unidades disponibles de ${formatNumber(totals.onHand)} en existencia física.`,
        tone: totals.availableRate > 0 ? 'positive' : 'warning',
      },
      {
        label: 'Compromiso',
        value: formatPercentage(totals.committedRate),
        detail: `${formatNumber(totals.committed)} unidades comprometidas sobre la existencia física.`,
        tone: totals.committedRate > 1 ? 'critical' : 'neutral',
      },
      {
        label: 'Entradas pendientes',
        value: formatNumber(totals.inboundUnits),
        detail: `${formatNumber(totals.inTransit)} en tránsito y ${formatNumber(totals.onOrder)} en orden de compra.`,
        tone: totals.inboundUnits > 0 ? 'positive' : 'neutral',
      },
      {
        label: 'Riesgos prioritarios',
        value: formatNumber(prioritizedRisks.length),
        detail: `${criticalRisks.length} críticos y ${prioritizedRisks.length - criticalRisks.length} altos.`,
        tone: findingTone(prioritizedRisks.length > 0, true),
      },
      {
        label: 'Oportunidades prioritarias',
        value: formatNumber(highPriorityOpportunities.length),
        detail: `${opportunities.length} oportunidades totales después de filtros.`,
        tone: highPriorityOpportunities.length > 0 ? 'positive' : 'neutral',
      },
      {
        label: 'Productos sin conciliar',
        value: formatNumber(totals.unresolvedProducts),
        detail: 'Posiciones que no están vinculadas con el Product Master actual.',
        tone: findingTone(totals.unresolvedProducts > 0, true),
      },
      {
        label: costTotalLabel(
          'Inventario Superseded',
          'Inventario Superseded de tus marcas',
          costVisibility,
        ),
        value: formatCostTotal(
          catalog.supersededInventoryValue,
          costVisibility,
          formatCurrency,
        ),
        detail: `${catalog.productsWithSuperseded} productos · ${formatNumber(catalog.supersededOnHand)} unidades físicas · ${formatNumber(catalog.supersededAvailable)} disponibles.`,
        tone: catalog.productsWithSuperseded > 0 ? 'warning' : 'positive',
      },
      {
        label: 'Sustituto directo',
        value: formatNumber(catalog.productsWithDirectSubstitute),
        detail: `${catalog.productsWithBoth} productos tienen Superseded y sustituto directo; ${catalog.supersededWithoutDirectSubstitute} Superseded no tienen sustituto directo.`,
        tone: catalog.supersededWithoutDirectSubstitute > 0
          ? 'warning'
          : 'positive',
      },
      {
        label: 'Sin categoría de valor',
        value: formatNumber(catalog.unclassifiedProducts),
        detail: `${catalog.classifiedProducts} productos cuentan con clasificación A, B, C, D o E.`,
        tone: catalog.unclassifiedProducts > 0 ? 'warning' : 'positive',
      },
    ],
  }
}
