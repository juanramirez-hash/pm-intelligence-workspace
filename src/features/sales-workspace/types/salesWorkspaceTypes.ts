export type SalesComparisonMode =
  | 'previous-period'
  | 'previous-year'

export type SalesPerformanceStatus =
  | 'not-evaluable'
  | 'behind-plan'
  | 'on-plan'
  | 'ahead-of-plan'
  | 'achieved'

export interface SalesWorkspaceFilters {
  periodId: string | null
  comparisonMode: SalesComparisonMode
}

export interface SalesWorkspacePeriodOption {
  id: string
  label: string
  year: number
  month: number
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

export interface SalesWorkspaceViewModel {
  available: boolean
  periodOptions: SalesWorkspacePeriodOption[]
  selectedPeriodId: string | null
  selectedPeriodLabel: string
  current: SalesWorkspaceSnapshot | null
  comparison: SalesWorkspaceComparison
  performance: SalesWorkspacePerformance
  brandPerformance: SalesWorkspaceBrandPerformanceItem[]
  trend: SalesWorkspaceTrendItem[]
  topBrands: SalesWorkspaceRankingItem[]
  topCustomers: SalesWorkspaceRankingItem[]
  topProducts: SalesWorkspaceRankingItem[]
  reconciliation: SalesWorkspaceReconciliation
}
