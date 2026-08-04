import type {
  CustomerIntelligenceSummary,
} from '../../../core/analytics/customers'

import type {
  BrandIntelligenceSummary,
} from '../../../core/analytics/brands'

import type {
  BusinessMetrics,
} from '../../../core/business/metrics'

import type {
  BusinessRepository,
} from '../../../core/business/repository'

import type {
  ExecutiveBrief,
} from '../../../core/business/executiveBrief'

import type {
  OpportunityRadar,
} from '../../../core/business/opportunityRadar'

import type {
  DatasetRegistryItem,
  DatasetType,
} from '../../../core/datasets/datasetTypes'

import type {
  BusinessInsight,
} from '../../../core/insights/insightTypes'

import type {
  DataCenterState,
} from '../../data-center/store/dataCenterStore'

import type {
  SalesDatasetSummary,
} from '../../data-center/types/reportTypes'

export interface ExecutiveRevenueTrendPoint {
  periodId: string

  year: number

  month: number

  revenue: number

  grossProfit: number

  grossMargin: number

  customerCount: number

  brandCount: number

  productCount: number
}

export interface ExecutiveCustomerConcentrationItem {
  customerId: string

  customerName: string

  revenue: number

  grossProfit: number

  grossMargin: number

  documents: number

  activePeriods: number

  revenueShare: number
}

export interface ExecutiveCommercialTrends {
  monthlyRevenue:
    ExecutiveRevenueTrendPoint[]

  topCustomers:
    ExecutiveCustomerConcentrationItem[]

  totalCustomerRevenue: number

  periodCount: number
}

export interface ExecutiveProductAttentionSummary {
  currentPeriodId: string

  previousPeriodId:
    string | null

  totalProducts: number

  activeProducts: number

  productsRequiringAttention: number

  growingProducts: number

  decliningProducts: number

  recoveredProducts: number

  newProducts: number

  inactiveOrLostProducts: number
}

export type ExecutivePeriodPreset =
  | 'month'
  | 'last_3_months'
  | 'last_6_months'
  | 'year_to_date'

export interface ExecutivePeriodOption {
  id: string

  year: number

  month: number

  label: string
}

export interface ExecutivePeriodSelection {
  preset: ExecutivePeriodPreset

  presetLabel: string

  anchorPeriodId: string | null

  availablePeriods:
    readonly ExecutivePeriodOption[]

  currentPeriodIds:
    readonly string[]

  comparisonPeriodIds:
    readonly string[]

  priorYearPeriodIds:
    readonly string[]

  currentLabel: string

  comparisonLabel: string

  priorYearLabel: string

  currentStartPeriodId:
    string | null

  currentEndPeriodId:
    string | null

  comparisonStartPeriodId:
    string | null

  comparisonEndPeriodId:
    string | null

  previousAnchorPeriodId:
    string | null

  nextAnchorPeriodId:
    string | null
}

export interface ExecutiveComparisonMetric {
  currentValue: number | null

  comparisonValue: number | null

  variationPercentage: number | null
}

export interface ExecutiveSalesPeriodPerformance {
  hasData: boolean

  currentRevenue: number | null

  currentGrossProfit: number | null

  grossMargin: number | null

  averageMonthlyRevenue: number | null

  periodCount: number

  currentLabel: string

  comparisonLabel: string

  priorYearLabel: string

  comparison:
    ExecutiveComparisonMetric

  priorYearComparison:
    ExecutiveComparisonMetric
}

export interface ExecutiveEntityAttentionIds {
  analyzed: readonly string[]

  active: readonly string[]

  requiringAttention: readonly string[]

  growing: readonly string[]

  declining: readonly string[]

  stable: readonly string[]

  recovered: readonly string[]

  new: readonly string[]

  inactiveOrLost: readonly string[]
}

export interface ExecutiveEntityAttentionSummary {
  totalAnalyzed: number

  activeEntities: number

  entitiesRequiringAttention: number

  growingEntities: number

  decliningEntities: number

  stableEntities: number

  recoveredEntities: number

  newEntities: number

  inactiveOrLostEntities: number

  entityIds?:
    ExecutiveEntityAttentionIds
}

export interface ExecutiveAttentionSummary {
  products:
    ExecutiveEntityAttentionSummary

  brands:
    ExecutiveEntityAttentionSummary

  customers:
    ExecutiveEntityAttentionSummary
}

export interface ExecutivePeriodView {
  selection:
    ExecutivePeriodSelection

  salesPerformance:
    ExecutiveSalesPeriodPerformance

  attention:
    ExecutiveAttentionSummary

  brands:
    BrandIntelligenceSummary | null

  commercialTrends:
    ExecutiveCommercialTrends
}

export type ExecutiveDomainId =
  | 'sales'
  | 'inventory'
  | 'forecast'
  | 'pricing'
  | 'purchasing'

export type ExecutiveDomainStatus =
  | 'ready'
  | 'partial'
  | 'not_available'
  | 'blocked'

export type ExecutiveDomainFreshnessStatus =
  | 'current'
  | 'stale'
  | 'unknown'

export interface ExecutiveDomainReadiness {
  id: ExecutiveDomainId

  label: string

  status: ExecutiveDomainStatus

  available: boolean

  requiredDatasets:
    readonly DatasetType[]

  activeDatasets:
    readonly DatasetType[]

  missingDatasets:
    readonly DatasetType[]

  lastUpdatedAt:
    string | null

  freshness:
    ExecutiveDomainFreshnessStatus

  issues:
    readonly string[]
}

export interface ExecutivePurchasingReadiness
  extends ExecutiveDomainReadiness {
  id: 'purchasing'

  purchaseOrdersAvailable: boolean

  purchaseRequestsAvailable: boolean

  inventoryAvailable: boolean

  productMasterAvailable: boolean

  forecastAvailable: boolean

  canActivateWorkspace: boolean

  limitations:
    readonly string[]
}

export interface ExecutiveDomainRegistry {
  sales: ExecutiveDomainReadiness

  inventory: ExecutiveDomainReadiness

  forecast: ExecutiveDomainReadiness

  pricing: ExecutiveDomainReadiness

  purchasing:
    ExecutivePurchasingReadiness
}

export interface ExecutiveWorkspaceHealth {
  readyDatasets: number

  totalDatasets: number

  coveragePercentage: number

  systemReady: boolean

  importStatus:
    DataCenterState['importStatus']

  lastImportedAt:
    string | null

  readyDomains?: number

  totalDomains?: number

  domainCoveragePercentage?: number

  purchasingReady?: boolean
}

export interface ExecutiveWorkspaceModel {
  sales:
    SalesDatasetSummary | null

  metrics:
    BusinessMetrics | null

  repository:
    BusinessRepository | null

  currentPeriodId:
    string | null

  customers:
    CustomerIntelligenceSummary | null

  brands:
    BrandIntelligenceSummary | null

  insights:
    BusinessInsight[]

  executiveBrief:
    ExecutiveBrief | null

  opportunityRadar:
    OpportunityRadar | null

  datasets:
    DatasetRegistryItem[]

  health:
    ExecutiveWorkspaceHealth

  domains?:
    ExecutiveDomainRegistry

  purchasingReadiness?:
    ExecutivePurchasingReadiness

  productAttention:
    ExecutiveProductAttentionSummary | null

  commercialTrends:
    ExecutiveCommercialTrends

  generatedAt?: string

  methodology?:
    'executive-workspace-v1'
}
