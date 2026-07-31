import type {
  ForecastConfidenceLevel,
  ForecastCoverageStatus,
  ForecastInventoryPriority,
  ForecastInventoryReportStatus,
  ForecastInventorySignalCategory,
  ForecastInventorySignalType,
  ForecastMetricValues,
  ForecastScenarioId,
  ForecastTargetStatus,
} from '../../../core/business/forecast'

export type ForecastWorkspaceStatus =
  | 'unavailable'
  | 'partial'
  | 'ready'

export type ForecastWorkspacePriorityFilter =
  | ForecastInventoryPriority
  | 'all'

export type ForecastWorkspaceCoverageFilter =
  | ForecastCoverageStatus
  | 'all'

export type ForecastWorkspaceConfidenceFilter =
  | ForecastConfidenceLevel
  | 'all'

export interface ForecastWorkspaceFilters {
  search: string
  brandId: string
  coverage: ForecastWorkspaceCoverageFilter
  priority: ForecastWorkspacePriorityFilter
  confidence: ForecastWorkspaceConfidenceFilter
}

export interface ForecastWorkspaceRequest {
  scenarioId: ForecastScenarioId
  filters: ForecastWorkspaceFilters
  rankingLimit: number
}

export interface ForecastWorkspaceScenarioOption {
  id: ForecastScenarioId
  label: string
  purpose: string
  selected: boolean
  portfolioRevenue: number | null
  portfolioGrossProfit: number | null
  portfolioQuantity: number | null
  portfolioGrossMargin: number | null
  targetAttainment: number | null
}

export interface ForecastWorkspaceNavigationTarget {
  entityType: 'brand' | 'product'
  entityId: string
  label: string
  href: string
}

export interface ForecastWorkspacePeriodContext {
  currentPeriodId: string | null
  dataCutoff: string | null
  snapshotDate: string | null
  periodStatus: string | null
  totalWorkingDays: number | null
  elapsedWorkingDays: number | null
  remainingWorkingDays: number | null
  progress: number | null
}

export interface ForecastWorkspacePortfolioSummary {
  available: boolean
  actual: ForecastMetricValues
  projected: ForecastMetricValues
  projectedGrossMargin: number | null
  targetRevenue: number | null
  targetAttainment: number | null
  revenueGap: number | null
  requiredDailyRevenue: number | null
  targetStatus: ForecastTargetStatus
  confidenceScore: number | null
  confidenceLevel: ForecastConfidenceLevel | null
  explainability: string[]
  limitations: string[]
}

export interface ForecastWorkspaceCoverageBreakdown {
  unavailable: number
  noDemand: number
  stockout: number
  shortage: number
  low: number
  balanced: number
  excess: number
}

export interface ForecastWorkspaceInventorySummary {
  reportStatus: ForecastInventoryReportStatus
  productsAnalyzed: number
  filteredProducts: number
  productsWithProjectedDemand: number
  productsWithoutProjectedDemand: number
  criticalItems: number
  highPriorityItems: number
  availableUnits: number
  inboundUnits: number
  inventoryValue: number
  expectedDemandUnits: number
  remainingDemandUnits: number
  projectedAvailableAfterDemand: number
  projectedSupplyAfterDemand: number
  supersededInventoryProducts: number
  replacementRecoveries: number
  affectedInventoryValue: number
  coverage: ForecastWorkspaceCoverageBreakdown
}

export interface ForecastWorkspaceBrandRow {
  brandId: string
  label: string
  actual: ForecastMetricValues
  projected: ForecastMetricValues
  projectedGrossMargin: number | null
  targetRevenue: number | null
  targetAttainment: number | null
  revenueGap: number | null
  targetStatus: ForecastTargetStatus
  confidenceScore: number
  confidenceLevel: ForecastConfidenceLevel
  productsAnalyzed: number
  criticalProducts: number
  highPriorityProducts: number
  stockoutProducts: number
  shortageProducts: number
  lowCoverageProducts: number
  excessProducts: number
  noDemandProducts: number
  averageAvailableCoverageMonths: number | null
  riskScore: number
  navigation: ForecastWorkspaceNavigationTarget
}

export interface ForecastWorkspacePriorityItem {
  id: string
  category: ForecastInventorySignalCategory
  signalType: ForecastInventorySignalType
  priority: Exclude<ForecastInventoryPriority, 'none'>
  score: number
  title: string
  rationale: string
  recommendedAction: string
  productId: string
  productName: string
  model: string | null
  brandId: string | null
  confidenceLevel: ForecastConfidenceLevel | null
  expectedDemandUnits: number | null
  remainingDemandUnits: number | null
  availableUnits: number
  inboundUnits: number
  availableCoverageMonths: number | null
  supplyCoverageMonths: number | null
  inventoryValue: number
  isSuperseded: boolean
  navigation: ForecastWorkspaceNavigationTarget
  replacementNavigation: ForecastWorkspaceNavigationTarget | null
}

export interface ForecastWorkspaceFilterOptions {
  brands: Array<{
    id: string
    label: string
  }>
  coverage: ForecastCoverageStatus[]
  priorities: ForecastInventoryPriority[]
  confidenceLevels: ForecastConfidenceLevel[]
}

export interface ForecastWorkspaceModel {
  available: boolean
  status: ForecastWorkspaceStatus
  unavailableReason: string | null
  generatedAt: string | null
  methodology: {
    baseline: string
    inventory: string
  }
  scenarioId: ForecastScenarioId
  scenarios: ForecastWorkspaceScenarioOption[]
  filters: ForecastWorkspaceFilters
  filterOptions: ForecastWorkspaceFilterOptions
  period: ForecastWorkspacePeriodContext
  portfolio: ForecastWorkspacePortfolioSummary
  inventory: ForecastWorkspaceInventorySummary
  brands: ForecastWorkspaceBrandRow[]
  riskRanking: ForecastWorkspacePriorityItem[]
  opportunityRanking: ForecastWorkspacePriorityItem[]
  explainability: string[]
  limitations: string[]
}

export const DEFAULT_FORECAST_WORKSPACE_FILTERS:
  ForecastWorkspaceFilters = {
    search: '',
    brandId: 'all',
    coverage: 'all',
    priority: 'all',
    confidence: 'all',
  }

export const DEFAULT_FORECAST_WORKSPACE_REQUEST:
  ForecastWorkspaceRequest = {
    scenarioId: 'expected',
    filters: DEFAULT_FORECAST_WORKSPACE_FILTERS,
    rankingLimit: 10,
  }
