import type {
  BusinessHealthClassification,
} from './healthClassification'

import type {
  BusinessHealthComponentId,
  BusinessHealthWeights,
} from './healthWeights'

export type BusinessHealthComponentStatus =
  | 'strong'
  | 'stable'
  | 'attention'
  | 'risk'
  | 'not-evaluable'

export interface BusinessHealthComponent {
  id: BusinessHealthComponentId
  rawValue: number | null
  benchmark: number | null
  normalizedScore: number | null
  weight: number
  weightedImpact: number | null
  status: BusinessHealthComponentStatus
}

export type BusinessHealthRecommendationSeverity =
  | 'info'
  | 'attention'
  | 'critical'

export interface BusinessHealthRecommendation {
  code: string
  componentId: BusinessHealthComponentId
  severity: BusinessHealthRecommendationSeverity
  message: string
}

export interface BusinessHealthScore {
  id: string
  snapshotId: string
  entityType: 'brand'
  generatedAt: string
  score: number | null
  evaluatedWeight: number
  totalConfiguredWeight: number
  classification: BusinessHealthClassification
  components: readonly BusinessHealthComponent[]
  recommendations: readonly BusinessHealthRecommendation[]
  weights: BusinessHealthWeights
}
