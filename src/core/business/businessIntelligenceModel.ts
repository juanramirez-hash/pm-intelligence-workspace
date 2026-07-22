import type {
  CustomerIntelligenceSummary,
} from '../analytics/customers'

import type {
  BusinessInsight,
} from '../insights/insightTypes'

import type {
  BusinessDataModel,
} from './models'

import type {
  BrandIntelligenceSummary,
} from '../analytics/brands'

import type {
  BusinessRepository,
} from './repository'

import type {
  BusinessMetrics,
} from './metrics'

export interface BusinessIntelligenceModel {
  generatedAt: string

  data: BusinessDataModel

  repository: BusinessRepository

  metrics: BusinessMetrics

  customers:
    CustomerIntelligenceSummary | null

  brands:
    BrandIntelligenceSummary | null

  insights:
    BusinessInsight[]
}