import type {
  BusinessProjectForecastStage,
  BusinessProjectStatusCode,
} from '../entities/project'

import type {
  ForecastScenarioId,
} from './forecastContracts'

import type {
  ForecastBaselineProjection,
  ForecastConfidenceProfile,
  ForecastMetricValues,
  ForecastTargetContext,
} from './forecastProjectionContracts'

export type ProjectAwareForecastMethodologyVersion =
  'project-aware-v1'

export type ProjectAwareForecastStatus =
  | 'unavailable'
  | 'partial'
  | 'ready'
  | 'blocked'

export type ProjectAwareForecastGranularity =
  | 'portfolio'
  | 'brand'

export type ProjectAwareForecastIssueSeverity =
  | 'blocking'
  | 'warning'
  | 'information'

export type ProjectAwareForecastContributionStatus =
  | 'included'
  | 'upside'
  | 'excluded'
  | 'blocked'

export type ProjectAwareForecastConversionStatus =
  | 'converted'
  | 'same-currency'
  | 'missing-rate'
  | 'missing-currency'
  | 'invalid-amount'
  | 'not-required'

export type ProjectAwareForecastMarginSource =
  | 'historical-project-brand'
  | 'historical-project-portfolio'
  | 'historical-brand'
  | 'historical-portfolio'
  | 'unavailable'

export interface ProjectAwareForecastQualityIssue {
  code: string
  severity: ProjectAwareForecastIssueSeverity
  message: string
  periodId: string | null
  projectId: string | null
  documentNumber: string | null
  brandId: string | null
}

export interface ProjectAwareForecastQualityProfile {
  issues: ProjectAwareForecastQualityIssue[]
  blockingIssues: number
  warnings: number
  information: number
  reconciliationCoverage: number
  historicalReconciliationCoverage: number
  currentPeriodId: string | null
  pendingCutoffDocuments: number
  salesDataCutoff: string | null
  projectBillingDataCutoff: string | null
  matureProjectsEvaluated: number
  matureProjectsIncluded: number
  matureProjectsBlocked: number
  potentialProjectsEvaluated: number
  potentialProjectsAvailable: number
  missingExchangeRates: number
  grossProfitEstimateCoverage: number
}

export interface ProjectAwareForecastProjectContribution {
  id: string
  projectId: string
  projectName: string
  brandId: string | null
  statusCode: BusinessProjectStatusCode
  statusLabel: string
  forecastStage: BusinessProjectForecastStage
  contributionStatus: ProjectAwareForecastContributionStatus

  estimatedBillingDate: string | null
  periodId: string | null
  closingProbability: number | null

  sourceCurrency: string | null
  sourceAmount: number | null
  exchangeRate: number | null
  convertedAmountMxn: number | null
  weightedAmountMxn: number | null
  conversionStatus: ProjectAwareForecastConversionStatus

  estimatedGrossMargin: number | null
  estimatedGrossProfitMxn: number | null
  marginSource: ProjectAwareForecastMarginSource
  issueCodes: string[]
}

export interface ProjectAwareForecastComponentMetrics {
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
}

export interface ProjectAwareForecastPipelineSummary {
  matureProjects: number
  matureIncludedProjects: number
  matureBlockedProjects: number
  matureRevenueMxn: number
  matureEstimatedGrossProfitMxn: number

  potentialProjects: number
  potentialAvailableProjects: number
  potentialRevenueMxn: number
  potentialWeightedRevenueMxn: number
  potentialEstimatedGrossProfitMxn: number

  missingExchangeRates: number
  grossProfitEstimateCoverage: number
  quantityAvailable: false
}

export interface ProjectAwareForecastScenarioProjection {
  id: ForecastScenarioId
  label: string
  transactional: ForecastMetricValues
  projectBillingActual: ForecastMetricValues
  maturePipeline: ForecastMetricValues
  values: ForecastMetricValues
  grossMargin: number | null
  targetAttainment: number | null
  official: boolean
}

export interface ProjectAwareForecastProjection {
  id: string
  methodologyVersion: ProjectAwareForecastMethodologyVersion
  status: ProjectAwareForecastStatus
  officialAvailable: boolean
  granularity: ProjectAwareForecastGranularity
  entityId: string | null
  entityLabel: string
  currentPeriodId: string
  dataCutoff: string | null

  transactionalBaseline: ForecastBaselineProjection

  actualTotal: ProjectAwareForecastComponentMetrics
  actualTransactional: ProjectAwareForecastComponentMetrics
  actualProjectBilling: ProjectAwareForecastComponentMetrics
  pipeline: ProjectAwareForecastPipelineSummary

  expected: ForecastMetricValues
  expectedGrossMargin: number | null
  scenarios: ProjectAwareForecastScenarioProjection[]
  target: ForecastTargetContext
  confidence: ForecastConfidenceProfile
  quality: ProjectAwareForecastQualityProfile

  projectContributions: ProjectAwareForecastProjectContribution[]
  explainability: string[]
  limitations: string[]
}

export interface ProjectAwareForecastReport {
  generatedAt: string
  methodologyVersion: ProjectAwareForecastMethodologyVersion
  status: ProjectAwareForecastStatus
  officialAvailable: boolean
  currentPeriodId: string | null
  dataCutoff: string | null
  portfolio: ProjectAwareForecastProjection | null
  brands: ProjectAwareForecastProjection[]
  quality: ProjectAwareForecastQualityProfile
  explainability: string[]
  limitations: string[]
}
