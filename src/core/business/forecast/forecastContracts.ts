export type ForecastFoundationStatus =
  | 'unavailable'
  | 'partial'
  | 'ready'

export type ForecastSourceStatus =
  | 'unavailable'
  | 'partial'
  | 'ready'
  | 'planned'

export type ForecastSourceRole =
  | 'required'
  | 'enrichment'
  | 'future'

export type ForecastSourceId =
  | 'sales-history'
  | 'commercial-targets'
  | 'working-days'
  | 'inventory'
  | 'product-master'
  | 'purchasing'

export type ForecastCapabilityId =
  | 'portfolio-outlook'
  | 'brand-outlook'
  | 'product-demand'
  | 'customer-demand'
  | 'target-pace'
  | 'inventory-coverage'
  | 'replacement-aware'
  | 'supply-aware'

export type ForecastGranularity =
  | 'portfolio'
  | 'brand'
  | 'product'
  | 'customer'

export type ForecastGranularityPriority =
  | 'primary'
  | 'secondary'

export type ForecastMetric =
  | 'revenue'
  | 'grossProfit'
  | 'quantity'

export type ForecastScenarioId =
  | 'conservative'
  | 'expected'
  | 'accelerated'

export type ForecastQualitySeverity =
  | 'blocking'
  | 'warning'
  | 'information'

export interface ForecastHistoryProfile {
  periodIds: string[]
  baselinePeriodIds: string[]
  currentPeriodId: string | null
  firstPeriodId: string | null
  lastPeriodId: string | null
  dataStart: string | null
  dataCutoff: string | null
  totalPeriods: number
  baselinePeriods: number
  minimumHistoryPeriods: number
  missingPeriodIds: string[]
  consecutive: boolean
}

export interface ForecastSourceProfile {
  id: ForecastSourceId
  label: string
  role: ForecastSourceRole
  status: ForecastSourceStatus
  summary: string
  facts: Record<string, string | number | boolean | null>
  notes: string[]
}

export interface ForecastCapabilityProfile {
  id: ForecastCapabilityId
  label: string
  status: ForecastSourceStatus
  summary: string
  dependencies: ForecastSourceId[]
}

export interface ForecastGranularityProfile {
  granularity: ForecastGranularity
  priority: ForecastGranularityPriority
  status: ForecastSourceStatus
  entityCount: number
  observationCount: number
  summary: string
}

export interface ForecastObservation {
  periodId: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
}

export interface ForecastSeries {
  id: string
  granularity: ForecastGranularity
  entityId: string | null
  entityLabel: string
  observations: ForecastObservation[]
}

export interface ForecastScenarioDefinition {
  id: ForecastScenarioId
  label: string
  purpose: string
  status: 'contract-only'
}

export interface ForecastQualityIssue {
  code: string
  severity: ForecastQualitySeverity
  message: string
}

export interface ForecastQualityProfile {
  issues: ForecastQualityIssue[]
  blockingIssues: number
  warnings: number
  information: number
  targetCoverage: number | null
  workingDaysCoverage: number | null
  productMasterCoverage: number | null
  inventoryIdentityCoverage: number | null
}

export interface ForecastDataFoundation {
  generatedAt: string
  status: ForecastFoundationStatus
  available: boolean
  currentPeriodId: string | null
  dataCutoff: string | null
  history: ForecastHistoryProfile
  sources: ForecastSourceProfile[]
  capabilities: ForecastCapabilityProfile[]
  granularities: ForecastGranularityProfile[]
  metrics: ForecastMetric[]
  scenarios: ForecastScenarioDefinition[]
  quality: ForecastQualityProfile
  constraints: string[]
}

export const FORECAST_METRICS: readonly ForecastMetric[] = [
  'revenue',
  'grossProfit',
  'quantity',
]

export const FORECAST_SCENARIOS: readonly ForecastScenarioDefinition[] = [
  {
    id: 'conservative',
    label: 'Conservador',
    purpose: 'Representar un cierre inferior al escenario esperado sin alterar los hechos base.',
    status: 'contract-only',
  },
  {
    id: 'expected',
    label: 'Esperado',
    purpose: 'Representar la proyección central que calculará el Forecast Engine.',
    status: 'contract-only',
  },
  {
    id: 'accelerated',
    label: 'Acelerado',
    purpose: 'Representar un cierre superior al escenario esperado bajo condiciones favorables.',
    status: 'contract-only',
  },
]
