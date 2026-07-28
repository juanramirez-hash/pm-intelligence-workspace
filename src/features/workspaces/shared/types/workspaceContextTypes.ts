import type {
  CustomerIntelligenceSummary,
} from '../../../../core/analytics/customers'

import type {
  BrandIntelligenceSummary,
} from '../../../../core/analytics/brands'

import type {
  BusinessMetrics,
} from '../../../../core/business/metrics'

import type {
  BusinessRepository,
} from '../../../../core/business/repository'

import type {
  DatasetRegistryItem,
} from '../../../../core/datasets/datasetTypes'

import type {
  BusinessInsight,
} from '../../../../core/insights/insightTypes'

import type {
  ExecutiveBrief,
} from '../../../../core/business/executiveBrief'

import type {
  OpportunityRadar,
} from '../../../../core/business/opportunityRadar'

import type {
  DataCenterState,
} from '../../../data-center/store/dataCenterStore'

import type {
  SalesDatasetSummary,
} from '../../../data-center/types/reportTypes'

export interface WorkspaceContextModel {
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

  health: {
    readyDatasets: number

    totalDatasets: number

    coveragePercentage: number

    systemReady: boolean

    importStatus:
      DataCenterState['importStatus']

    lastImportedAt:
      string | null
  }
}