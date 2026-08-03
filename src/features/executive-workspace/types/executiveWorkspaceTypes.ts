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

  generatedAt?: string

  methodology?:
    'executive-workspace-v1'
}