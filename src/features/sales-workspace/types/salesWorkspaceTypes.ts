import type {
  ForecastConfidenceLevel,
  ProjectAwareForecastStatus,
} from '../../../core/business/forecast'

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

export interface SalesWorkspaceForecast {
  available: boolean
  officialAvailable: boolean
  status: ProjectAwareForecastStatus
  periodId: string | null
  dataCutoff: string | null
  expectedRevenue: number | null
  expectedGrossProfit: number | null
  expectedAttainment: number | null
  confidenceScore: number | null
  confidenceLevel: ForecastConfidenceLevel | null
  unavailableReason: string | null
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
  forecast: SalesWorkspaceForecast
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

export type SalesVarianceDimension =
  | 'brand'
  | 'customer'
  | 'product'

export type SalesContributionDirection =
  | 'positive'
  | 'negative'
  | 'stable'

export interface SalesVarianceMetric {
  current: number
  comparison: number
  absoluteVariation: number
  percentageVariation: number | null
}

export interface SalesMarginVarianceMetric {
  current: number
  comparison: number
  pointVariation: number
}

export interface SalesContributionItem {
  id: string
  label: string
  currentRevenue: number
  comparisonRevenue: number
  revenueVariation: number
  revenueVariationPercentage: number | null
  currentGrossProfit: number
  comparisonGrossProfit: number
  grossProfitVariation: number
  currentQuantity: number
  comparisonQuantity: number
  quantityVariation: number
  currentDocuments: number
  comparisonDocuments: number
  documentsVariation: number
  currentParticipation: number
  comparisonParticipation: number
  mixVariationPoints: number
  movementShare: number
  direction: SalesContributionDirection
}

export interface SalesContributionBreakdown {
  dimension: SalesVarianceDimension
  positiveContribution: number
  negativeContribution: number
  stableCount: number
  positive: SalesContributionItem[]
  negative: SalesContributionItem[]
}

export type SalesCustomerMovementStatus =
  | 'new'
  | 'recovered'
  | 'growing'
  | 'declining'
  | 'lost'
  | 'stable'

export interface SalesCustomerMovementItem {
  id: string
  label: string
  status: SalesCustomerMovementStatus
  currentRevenue: number
  comparisonRevenue: number
  historicalRevenue: number
  revenueVariation: number
  revenueVariationPercentage: number | null
}

export interface SalesCustomerMovementSummary {
  newCount: number
  recoveredCount: number
  growingCount: number
  decliningCount: number
  lostCount: number
  stableCount: number
  newRevenue: number
  recoveredRevenue: number
  lostRevenue: number
  decliningRevenue: number
  items: SalesCustomerMovementItem[]
}

export interface SalesVarianceContributionAnalysis {
  available: boolean
  unavailableReason: string | null
  comparisonPeriodId: string | null
  comparisonLabel: string
  revenue: SalesVarianceMetric
  grossProfit: SalesVarianceMetric
  quantity: SalesVarianceMetric
  documents: SalesVarianceMetric
  grossMargin: SalesMarginVarianceMetric
  netRevenueVariation: number
  positiveRevenueContribution: number
  negativeRevenueContribution: number
  brands: SalesContributionBreakdown
  customers: SalesContributionBreakdown
  products: SalesContributionBreakdown
  customerMovements: SalesCustomerMovementSummary
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

export type SalesExecutiveFindingTone =
  | 'positive'
  | 'attention'
  | 'critical'
  | 'neutral'

export interface SalesExecutiveFinding {
  id: string
  label: string
  value: string
  detail: string
  tone: SalesExecutiveFindingTone
}

export interface SalesExecutiveSummary {
  available: boolean
  title: string
  overview: string
  outlook: string
  filterContext: string
  findings: SalesExecutiveFinding[]
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
  varianceContribution: SalesVarianceContributionAnalysis
  executiveSummary: SalesExecutiveSummary
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