import type {
  ForecastConfidenceLevel,
} from './forecastProjectionContracts'

export type ForecastInventoryMethodologyVersion =
  'forecast-inventory-v1'

export type ForecastInventoryReportStatus =
  | 'unavailable'
  | 'partial'
  | 'ready'

export type ForecastCoverageStatus =
  | 'unavailable'
  | 'no-demand'
  | 'stockout'
  | 'shortage'
  | 'low'
  | 'balanced'
  | 'excess'

export type ForecastInventorySignalCategory =
  | 'risk'
  | 'opportunity'
  | 'context'

export type ForecastInventorySignalType =
  | 'stockout'
  | 'current-period-shortage'
  | 'low-coverage'
  | 'excess-stock'
  | 'no-projected-demand'
  | 'inbound-recovery'
  | 'superseded-inventory'
  | 'replacement-recovery'
  | 'unresolved-replacement'

export type ForecastInventoryPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'none'

export interface ForecastInventoryThresholds {
  lowCoverageMonths: number
  excessCoverageMonths: number
}

export interface ForecastDemandProfile {
  actualQuantity: number
  conservativeQuantity: number | null
  expectedQuantity: number | null
  acceleratedQuantity: number | null
  remainingExpectedQuantity: number | null
  expectedDailyQuantity: number | null
}

export interface ForecastInventoryProfile {
  sourceAvailable: boolean
  linked: boolean
  positions: number
  locations: number
  onHand: number
  available: number
  committed: number
  inTransit: number
  onOrder: number
  inbound: number
  inventoryValue: number
  availableAfterRemainingDemand: number | null
  supplyAfterRemainingDemand: number | null
}

export interface ForecastCoverageProfile {
  availableStatus: ForecastCoverageStatus
  supplyStatus: ForecastCoverageStatus
  availableMonths: number | null
  availableWorkingDays: number | null
  supplyMonths: number | null
  supplyWorkingDays: number | null
}

export interface ForecastCatalogContext {
  commercialStatus: string | null
  supersededBy: string | null
  directSubstitute: string | null
  isSuperseded: boolean
}

export interface ForecastReplacementContext {
  referenceType: 'direct-substitute' | 'superseded-by'
  reference: string
  resolved: boolean
  productId: string | null
  productName: string | null
  model: string | null
  available: number
  inTransit: number
  onOrder: number
  inbound: number
  locations: number
}

export interface ForecastInventorySignal {
  id: string
  type: ForecastInventorySignalType
  category: ForecastInventorySignalCategory
  priority: Exclude<ForecastInventoryPriority, 'none'>
  score: number
  title: string
  rationale: string
  evidence: Record<string, string | number | boolean | null>
}

export interface ForecastProductInventoryInsight {
  id: string
  methodologyVersion: ForecastInventoryMethodologyVersion
  status: ForecastInventoryReportStatus
  currentPeriodId: string
  dataCutoff: string | null
  snapshotDate: string | null
  productId: string
  productName: string
  model: string | null
  brandId: string | null
  baselineConfidence: ForecastConfidenceLevel | null
  demand: ForecastDemandProfile
  inventory: ForecastInventoryProfile
  coverage: ForecastCoverageProfile
  catalog: ForecastCatalogContext
  replacement: ForecastReplacementContext | null
  priority: ForecastInventoryPriority
  score: number
  recommendedAction: string
  signals: ForecastInventorySignal[]
  explainability: string[]
  limitations: string[]
}

export interface ForecastInventoryIntelligenceSummary {
  productsAnalyzed: number
  productsWithProjectedDemand: number
  productsWithoutProjectedDemand: number
  criticalItems: number
  highPriorityItems: number
  stockoutRisks: number
  currentPeriodShortages: number
  lowCoverageProducts: number
  excessStockProducts: number
  noProjectedDemandProducts: number
  supersededInventoryProducts: number
  inboundRecoveries: number
  replacementRecoveries: number
  affectedInventoryValue: number
}

export interface ForecastInventoryQualityProfile {
  productProjections: number
  inventoryProducts: number
  projectedProductsWithoutInventory: number
  inventoryProductsWithoutProjection: number
  unresolvedInventoryPositions: number
  notes: string[]
}

export interface ForecastInventoryIntelligenceReport {
  generatedAt: string
  methodologyVersion: ForecastInventoryMethodologyVersion
  status: ForecastInventoryReportStatus
  currentPeriodId: string | null
  dataCutoff: string | null
  snapshotDate: string | null
  thresholds: ForecastInventoryThresholds
  summary: ForecastInventoryIntelligenceSummary
  quality: ForecastInventoryQualityProfile
  items: ForecastProductInventoryInsight[]
}

export const FORECAST_INVENTORY_THRESHOLDS:
  Readonly<ForecastInventoryThresholds> = {
    lowCoverageMonths: 1,
    excessCoverageMonths: 3,
  }
