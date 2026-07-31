import type {
  ForecastGranularity,
  ForecastMetric,
  ForecastScenarioId,
} from './forecastContracts'

export type ForecastProjectionGranularity =
  Exclude<ForecastGranularity, 'customer'>

export type ForecastProjectionStatus =
  | 'unavailable'
  | 'partial'
  | 'ready'

export type ForecastPeriodStatus =
  | 'unknown'
  | 'not-started'
  | 'in-progress'
  | 'closed'

export type ForecastMethodId =
  | 'run-rate'
  | 'historical-average'
  | 'recent-trend'
  | 'seasonal-reference'

export type ForecastConfidenceLevel =
  | 'low'
  | 'medium'
  | 'high'

export type ForecastTargetStatus =
  | 'unavailable'
  | 'behind'
  | 'on-track'
  | 'ahead'
  | 'achieved'

export interface ForecastMetricValues {
  revenue: number
  grossProfit: number
  quantity: number
}

export interface ForecastTimingProfile {
  periodStatus: ForecastPeriodStatus
  totalWorkingDays: number | null
  elapsedWorkingDays: number | null
  remainingWorkingDays: number | null
  progress: number | null
}

export interface ForecastHistoricalBaseline {
  periodIds: string[]
  lookbackPeriodIds: string[]
  average: ForecastMetricValues | null
  recentTrendRate: number | null
  seasonalReferencePeriodId: string | null
  seasonalReference: ForecastMetricValues | null
  revenueCoefficientOfVariation: number | null
}

export interface ForecastMethodProjection {
  id: ForecastMethodId
  label: string
  available: boolean
  baseWeight: number
  normalizedWeight: number
  values: ForecastMetricValues | null
  explanation: string
}

export interface ForecastScenarioProjection {
  id: ForecastScenarioId
  label: string
  factor: number
  spread: number
  values: ForecastMetricValues
  grossMargin: number | null
  targetAttainment: number | null
}

export interface ForecastTargetContext {
  revenue: number | null
  expectedAttainment: number | null
  revenueGap: number | null
  requiredDailyRevenue: number | null
  status: ForecastTargetStatus
}

export interface ForecastConfidenceProfile {
  score: number
  level: ForecastConfidenceLevel
  signals: string[]
  limitations: string[]
}

export interface ForecastBaselineProjection {
  id: string
  methodologyVersion: 'baseline-v1'
  status: ForecastProjectionStatus
  granularity: ForecastProjectionGranularity
  entityId: string | null
  entityLabel: string
  currentPeriodId: string
  dataCutoff: string | null
  metrics: ForecastMetric[]
  actual: ForecastMetricValues
  timing: ForecastTimingProfile
  historical: ForecastHistoricalBaseline
  methods: ForecastMethodProjection[]
  expected: ForecastMetricValues
  expectedGrossMargin: number | null
  scenarios: ForecastScenarioProjection[]
  target: ForecastTargetContext
  confidence: ForecastConfidenceProfile
  explainability: string[]
}
