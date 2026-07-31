import type {
  BusinessInventoryPosition,
} from '../../../core/business/entities/inventoryPosition'

import type {
  ProductCommercialStatus,
} from '../../../core/business/entities/product'

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

import {
  findInventoryCatalogEntry,
} from './inventoryCatalogEnrichment'

import type {
  InventoryCatalogEntry,
  InventoryCatalogLookup,
  InventoryWorkspacePosition,
} from './inventoryCatalogEnrichment'

export type InventoryWorkspaceDimension =
  | 'brand'
  | 'location'
  | 'product'

export type InventoryCommercialStatusFilter =
  | ProductCommercialStatus
  | 'unclassified'
  | 'all'

export type InventoryReplacementFilter =
  | 'with_superseded'
  | 'with_direct_substitute'
  | 'both'
  | 'without_replacement'
  | 'all'

export interface InventoryWorkspaceFilters {
  search: string
  brandId: string
  locationId: string
  stockStatus: InventoryStockStatus | 'all'
  priority: InventoryActionPriority | 'all'
  commercialStatus: InventoryCommercialStatusFilter
  replacement: InventoryReplacementFilter
}

export interface InventoryWorkspaceModel {
  available: boolean
  analytics: InventoryAnalyticsReport | null
  riskOpportunity: InventoryRiskOpportunityReport | null
  latestPositions: InventoryWorkspacePosition[]
  brands: string[]
  locations: string[]
  commercialStatuses: ProductCommercialStatus[]
}

export const DEFAULT_INVENTORY_WORKSPACE_FILTERS:
  InventoryWorkspaceFilters = {
    search: '',
    brandId: 'all',
    locationId: 'all',
    stockStatus: 'all',
    priority: 'all',
    commercialStatus: 'all',
    replacement: 'all',
  }

export function matchesInventorySearch(
  value: string,
  search: string,
): boolean {
  const normalizedSearch = search.trim().toLocaleUpperCase('es-MX')

  return normalizedSearch.length === 0 ||
    value.toLocaleUpperCase('es-MX').includes(normalizedSearch)
}

function matchesCommercialStatus(
  entry: InventoryCatalogEntry | undefined,
  filter: InventoryCommercialStatusFilter,
): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'unclassified') {
    return !entry?.commercialStatus
  }

  return entry?.commercialStatus === filter
}

function matchesReplacement(
  entry: InventoryCatalogEntry | undefined,
  filter: InventoryReplacementFilter,
): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'with_superseded') {
    return Boolean(entry?.supersededBy)
  }

  if (filter === 'with_direct_substitute') {
    return Boolean(entry?.directSubstitute)
  }

  if (filter === 'both') {
    return Boolean(
      entry?.supersededBy && entry.directSubstitute,
    )
  }

  return !entry?.supersededBy && !entry?.directSubstitute
}

function matchesCatalogFilters(
  entry: InventoryCatalogEntry | undefined,
  filters: InventoryWorkspaceFilters,
): boolean {
  return matchesCommercialStatus(
    entry,
    filters.commercialStatus,
  ) && matchesReplacement(entry, filters.replacement)
}

function catalogSearchValue(
  entry: InventoryCatalogEntry | undefined,
): string {
  if (!entry) {
    return ''
  }

  return [
    entry.commercialStatus ?? '',
    entry.supersededBy ?? '',
    entry.directSubstitute ?? '',
    entry.replacementStatus,
  ].join(' ')
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
  catalogLookup: InventoryCatalogLookup = new Map(),
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

    const catalog = findInventoryCatalogEntry(
      catalogLookup,
      risk.productId,
      risk.productName,
    )

    if (!matchesCatalogFilters(catalog, filters)) {
      return false
    }

    return matchesInventorySearch(
      `${risk.productName} ${risk.brandId ?? ''} ${risk.locationId ?? ''} ${risk.title} ${risk.rationale} ${catalogSearchValue(catalog)}`,
      filters.search,
    )
  })
}

export function filterInventoryOpportunities(
  opportunities: readonly InventoryOpportunitySignal[],
  filters: InventoryWorkspaceFilters,
  catalogLookup: InventoryCatalogLookup = new Map(),
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

    const catalog = findInventoryCatalogEntry(
      catalogLookup,
      opportunity.productId,
      opportunity.productName,
    )

    if (!matchesCatalogFilters(catalog, filters)) {
      return false
    }

    return matchesInventorySearch(
      `${opportunity.productName} ${opportunity.brandId ?? ''} ${opportunity.sourceLocationId ?? ''} ${opportunity.targetLocationId ?? ''} ${opportunity.title} ${opportunity.rationale} ${catalogSearchValue(catalog)}`,
      filters.search,
    )
  })
}

export function filterInventoryPositions(
  positions: readonly InventoryWorkspacePosition[],
  filters: InventoryWorkspaceFilters,
): InventoryWorkspacePosition[] {
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

    if (!matchesCatalogFilters(position, filters)) {
      return false
    }

    return matchesInventorySearch(
      [
        position.productName,
        position.productCode ?? '',
        position.model ?? '',
        position.brandId ?? '',
        position.locationId,
        position.commercialStatus ?? '',
        position.supersededBy ?? '',
        position.directSubstitute ?? '',
      ].join(' '),
      filters.search,
    )
  })
}
