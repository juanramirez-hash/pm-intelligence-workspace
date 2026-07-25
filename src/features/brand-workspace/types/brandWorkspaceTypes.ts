import type {
  BrandIntelligenceItem,
  BrandLifecycleStatus,
  BrandTrendStatus,
} from '../../../core/analytics/brands'

export type BrandLifecycleFilter =
  | BrandLifecycleStatus
  | 'all'

export type BrandTrendFilter =
  | BrandTrendStatus
  | 'all'

export type BrandWorkspaceSortField =
  | 'brandName'
  | 'revenue'
  | 'grossProfit'
  | 'margin'
  | 'revenueVariation'
  | 'revenueVariationPercentage'
  | 'revenueParticipation'
  | 'customers'
  | 'products'

export type BrandWorkspaceSortDirection =
  | 'asc'
  | 'desc'

export interface BrandWorkspaceFilters {
  search: string

  lifecycle:
    BrandLifecycleFilter

  trend:
    BrandTrendFilter

  requiresAttention:
    boolean
}

export interface BrandWorkspaceUiState {
  filters:
    BrandWorkspaceFilters

  selectedBrandId:
    string | null

  sortField:
    BrandWorkspaceSortField

  sortDirection:
    BrandWorkspaceSortDirection
}

export interface BrandWorkspaceModel {
  summaryAvailable: boolean

  brands:
    BrandIntelligenceItem[]

  filteredBrands:
    BrandIntelligenceItem[]

  selectedBrand:
    BrandIntelligenceItem | null

  filters:
    BrandWorkspaceFilters

  sortField:
    BrandWorkspaceSortField

  sortDirection:
    BrandWorkspaceSortDirection
}