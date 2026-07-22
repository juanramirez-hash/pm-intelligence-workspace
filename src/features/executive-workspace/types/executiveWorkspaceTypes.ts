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
  DatasetRegistryItem,
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

export interface ExecutiveWorkspaceModel {
  sales:
    SalesDatasetSummary | null

  metrics:
    BusinessMetrics | null

  customers:
    CustomerIntelligenceSummary | null

  brands:
    BrandIntelligenceSummary | null

  insights:
    BusinessInsight[]

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