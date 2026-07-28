export type SalesComparisonMode =
  | 'previous-period'
  | 'previous-year'

export type SalesPerformanceStatus =
  | 'not-evaluable'
  | 'behind-plan'
  | 'on-plan'
  | 'ahead-of-plan'
  | 'achieved'

export type SalesWorkspaceFilterDimension =
  | 'brand'
  | 'customer'
  | 'product'
  | 'location'
  | 'salesRepresentative'

export interface SalesWorkspaceFilters {
  periodId: string | null
  comparisonMode: SalesComparisonMode
  brandIds?: string[]
  customerIds?: string[]
  productIds?: string[]
  locationIds?: string[]
  salesRepresentativeIds?: string[]
  searchTerm?: string
}

export interface SalesWorkspacePeriodOption {
  id: string
  label: string
  year: number
  month: number
}

export interface SalesWorkspaceFilterOption {
  id: string
  label: string
  revenue: number
}

export interface SalesWorkspaceFilterOptions {
  brands: SalesWorkspaceFilterOption[]
  customers: SalesWorkspaceFilterOption[]
  products: SalesWorkspaceFilterOption[]
  locations: SalesWorkspaceFilterOption[]
  salesRepresentatives: SalesWorkspaceFilterOption[]
}

export interface SalesWorkspaceActiveFilter {
  dimension: SalesWorkspaceFilterDimension | 'search'
  id: string
  label: string
}

export interface SalesWorkspaceSnapshot {
  periodId: string
  periodLabel: string
  revenue: number
  grossProfit: number
  grossMargin: number
  quantity: number
  documents: number
  customerCount: number
  brandCount: number
  productCount: number
}

export interface SalesWorkspaceComparison {
  mode: SalesComparisonMode
  label: string
  previousPeriodId: string | null
  previousPeriodLabel: string | null
  revenueVariation: number | null
  grossProfitVariation: number | null
  quantityVariation: number | null
  marginPointVariation: number | null
}

export interface SalesWorkspaceTrendItem {
  periodId: string
  periodLabel: string
  revenue: number
  grossProfit: number
  grossMargin: number
}

export interface SalesWorkspaceRankingItem {
  id: string
  label: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
  participation: number
}

export interface SalesWorkspaceReconciliation {
  totalRows: number
  matchedRows: number
  ambiguousRows: number
  unmatchedRows: number
  matchRate: number
}

export interface SalesWorkspaceTargetMetric {
  actual: number
  target: number | null
  variance: number | null
  attainment: number | null
}

export interface SalesWorkspacePace {
  status: SalesPerformanceStatus
  dataCutoff: string | null
  workingDays: number | null
  elapsedWorkingDays: number | null
  remainingWorkingDays: number | null
  currentDailyRevenue: number | null
  requiredDailyRevenue: number | null
  expectedToDate: number | null
  varianceToPlan: number | null
  attainmentToPlan: number | null
  projectedPeriodEnd: number | null
  projectedAttainment: number | null
}

export interface SalesWorkspaceTargetCoverage {
  targetedBrands: number
  activeBrands: number
  coveredActiveBrands: number
  activeBrandsWithoutTarget: number
  coveragePercentage: number
}

export interface SalesWorkspacePerformance {
  available: boolean
  unavailableReason?: string | null
  revenue: SalesWorkspaceTargetMetric
  grossProfit: SalesWorkspaceTargetMetric
  grossMargin: SalesWorkspaceTargetMetric
  pace: SalesWorkspacePace
  coverage: SalesWorkspaceTargetCoverage
}

export interface SalesWorkspaceBrandPerformanceItem {
  brandId: string
  brandName: string
  actualRevenue: number
  targetRevenue: number | null
  attainment: number | null
  expectedToDate: number | null
  varianceToPlan: number | null
  projectedRevenue: number | null
  projectedAttainment: number | null
  currentGrossMargin: number
  targetGrossMargin: number | null
  marginVariancePoints: number | null
  status: SalesPerformanceStatus
}

export interface SalesWorkspaceDetailRow {
  id: string
  periodId: string
  brandId: string
  brandLabel: string
  customerId: string | null
  customerLabel: string
  productId: string | null
  productLabel: string
  locationId: string | null
  locationLabel: string
  salesRepresentativeId: string | null
  salesRepresentativeLabel: string
  revenue: number
  grossProfit: number
  grossMargin: number
  quantity: number
  documents: number
  rowCount: number
}


export type SalesCommercialOpportunityType =
  | 'target-gap'
  | 'customer-recovery'
  | 'customer-growth'
  | 'product-growth'
  | 'margin-protection'

export type SalesCommercialOpportunityPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export type SalesCommercialOpportunityEntityType =
  | 'workspace'
  | 'brand'
  | 'customer'
  | 'product'

export interface SalesCommercialOpportunityEvidence {
  label: string
  value: string
}

export interface SalesCommercialOpportunity {
  id: string
  type: SalesCommercialOpportunityType
  priority: SalesCommercialOpportunityPriority
  entityType: SalesCommercialOpportunityEntityType
  entityId: string | null
  entityLabel: string
  title: string
  description: string
  recommendedAction: string
  impact: number
  score: number
  confidence: number
  effort: number
  currentRevenue: number
  comparisonRevenue: number | null
  variance: number | null
  variancePercentage: number | null
  dailyRevenueRequired: number | null
  evidence: SalesCommercialOpportunityEvidence[]
}

export interface SalesCommercialOpportunitySummary {
  available: boolean
  unavailableReason: string | null
  totalImpact: number
  totalCount: number
  criticalCount: number
  highCount: number
  requiredDailyRevenue: number | null
  opportunities: SalesCommercialOpportunity[]
}

export interface SalesWorkspaceViewModel {
  available: boolean
  periodOptions: SalesWorkspacePeriodOption[]
  selectedPeriodId: string | null
  selectedPeriodLabel: string
  current: SalesWorkspaceSnapshot | null
  comparison: SalesWorkspaceComparison
  performance: SalesWorkspacePerformance
  brandPerformance: SalesWorkspaceBrandPerformanceItem[]
  commercialOpportunities: SalesCommercialOpportunitySummary
  trend: SalesWorkspaceTrendItem[]
  topBrands: SalesWorkspaceRankingItem[]
  topCustomers: SalesWorkspaceRankingItem[]
  topProducts: SalesWorkspaceRankingItem[]
  reconciliation: SalesWorkspaceReconciliation
  filterOptions: SalesWorkspaceFilterOptions
  activeFilters: SalesWorkspaceActiveFilter[]
  hasActiveSegmentationFilters: boolean
  detailRows: SalesWorkspaceDetailRow[]
  detailTotalRows: number
  detailSourceRows: number
}
