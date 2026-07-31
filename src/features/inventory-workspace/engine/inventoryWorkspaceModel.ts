import type {
  BusinessInventoryPosition,
} from '../../../core/business/entities/inventoryPosition'

import {
  buildInventoryAnalytics,
} from '../../../core/business/analytics/inventory'

import type {
  InventoryActionPriority,
  InventoryAnalyticsGroup,
  InventoryAnalyticsReport,
  InventoryOpportunitySignal,
  InventoryRiskOpportunityReport,
  InventoryRiskSignal,
  InventoryStockStatus,
} from '../../../core/business/analytics/inventory'

export type InventoryWorkspaceDimension =
  | 'brand'
  | 'location'
  | 'product'

export interface InventoryWorkspaceFilters {
  search: string
  brandId: string
  locationId: string
  stockStatus: InventoryStockStatus | 'all'
  priority: InventoryActionPriority | 'all'
}

export interface InventoryWorkspaceModel {
  available: boolean
  analytics: InventoryAnalyticsReport | null
  riskOpportunity: InventoryRiskOpportunityReport | null
  latestPositions: BusinessInventoryPosition[]
  brands: string[]
  locations: string[]
}

export const DEFAULT_INVENTORY_WORKSPACE_FILTERS:
  InventoryWorkspaceFilters = {
    search: '',
    brandId: 'all',
    locationId: 'all',
    stockStatus: 'all',
    priority: 'all',
  }

export function matchesInventorySearch(
  value: string,
  search: string,
): boolean {
  const normalizedSearch = search.trim().toLocaleUpperCase('es-MX')

  return normalizedSearch.length === 0 ||
    value.toLocaleUpperCase('es-MX').includes(normalizedSearch)
}

export function buildInventoryWorkspaceGroups(
  positions: readonly BusinessInventoryPosition[],
  dimension: InventoryWorkspaceDimension,
): InventoryAnalyticsGroup[] {
  if (positions.length === 0) {
    return []
  }

  const snapshotDate = positions[0]?.snapshotDate ?? null
  const analytics = buildInventoryAnalytics(positions, snapshotDate)

  if (dimension === 'brand') {
    return analytics.byBrand
  }

  if (dimension === 'location') {
    return analytics.byLocation
  }

  return analytics.byProduct
}

export function filterInventoryGroups(
  groups: readonly InventoryAnalyticsGroup[],
  search: string,
): InventoryAnalyticsGroup[] {
  return groups.filter((group) =>
    matchesInventorySearch(`${group.label} ${group.key}`, search),
  )
}

export function filterInventoryRisks(
  risks: readonly InventoryRiskSignal[],
  filters: InventoryWorkspaceFilters,
): InventoryRiskSignal[] {
  return risks.filter((risk) => {
    if (filters.brandId !== 'all' && risk.brandId !== filters.brandId) {
      return false
    }

    if (
      filters.locationId !== 'all' &&
      risk.locationId !== filters.locationId
    ) {
      return false
    }

    if (filters.priority !== 'all' && risk.priority !== filters.priority) {
      return false
    }

    return matchesInventorySearch(
      `${risk.productName} ${risk.brandId ?? ''} ${risk.locationId ?? ''} ${risk.title} ${risk.rationale}`,
      filters.search,
    )
  })
}

export function filterInventoryOpportunities(
  opportunities: readonly InventoryOpportunitySignal[],
  filters: InventoryWorkspaceFilters,
): InventoryOpportunitySignal[] {
  return opportunities.filter((opportunity) => {
    if (
      filters.brandId !== 'all' &&
      opportunity.brandId !== filters.brandId
    ) {
      return false
    }

    if (
      filters.locationId !== 'all' &&
      opportunity.sourceLocationId !== filters.locationId &&
      opportunity.targetLocationId !== filters.locationId
    ) {
      return false
    }

    if (
      filters.priority !== 'all' &&
      opportunity.priority !== filters.priority
    ) {
      return false
    }

    return matchesInventorySearch(
      `${opportunity.productName} ${opportunity.brandId ?? ''} ${opportunity.sourceLocationId ?? ''} ${opportunity.targetLocationId ?? ''} ${opportunity.title} ${opportunity.rationale}`,
      filters.search,
    )
  })
}

export function filterInventoryPositions(
  positions: readonly BusinessInventoryPosition[],
  filters: InventoryWorkspaceFilters,
): BusinessInventoryPosition[] {
  return positions.filter((position) => {
    if (
      filters.brandId !== 'all' &&
      position.brandId !== filters.brandId
    ) {
      return false
    }

    if (
      filters.locationId !== 'all' &&
      position.locationId !== filters.locationId
    ) {
      return false
    }

    return matchesInventorySearch(
      [
        position.productName,
        position.productCode ?? '',
        position.model ?? '',
        position.brandId ?? '',
        position.locationId,
      ].join(' '),
      filters.search,
    )
  })
}
