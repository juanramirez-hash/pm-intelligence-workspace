import type { ProductCommercialStatus, ProductDecisionSignal, ProductHealthComponent, ProductLifecycleStage, ProductPeriodMetrics } from '../productDecisionTypes'

export type ProductBCGClassification = 'star' | 'cash-cow' | 'question-mark' | 'dog' | 'unclassified'
export type ProductConcentrationRisk = 'critical' | 'high' | 'medium' | 'low' | 'unknown'
export type ProductRadarSignalType = 'growth' | 'decline' | 'launch' | 'opportunity' | 'risk' | 'replacement' | 'cannibalization'

export interface ProductCommercialPenetration {
  status: ProductCommercialStatus
  label: string
  interpretation: string
  score: number
  recommendation: string
  confidence: number
  isNewProduct: boolean
}

export interface ProductCustomerConcentration {
  topCustomerShare: number | null
  topFiveShare: number | null
  customerCount: number
  risk: ProductConcentrationRisk
  label: string
  confidence: number
  evidence: readonly string[]
}

export interface ProductAdoptionModel {
  applies: boolean
  daysSinceFirstSale: number | null
  activePeriods: number
  accumulatedCustomers: number
  activeLocations: number
  adoptionScore: number
  label: string
  recommendation: string
  confidence: number
}

export interface ProductBCGModel {
  classification: ProductBCGClassification
  label: string
  growthScore: number
  penetrationScore: number
  rationale: string
  confidence: number
}

export interface ProductRadarSignal {
  id: string
  type: ProductRadarSignalType
  title: string
  description: string
  score: number
  confidence: number
  evidence: readonly string[]
}

export interface BusinessProductDNA {
  productId: string
  generatedAt: string
  lifecycle: {
    stage: ProductLifecycleStage
    label: string
    confidence: number
    evidence: readonly string[]
  }
  penetration: ProductCommercialPenetration
  concentration: ProductCustomerConcentration
  adoption: ProductAdoptionModel
  bcg: ProductBCGModel
  health: {
    score: number
    label: string
    components: readonly ProductHealthComponent[]
  }
  radar: readonly ProductRadarSignal[]
  risks: readonly ProductDecisionSignal[]
  opportunities: readonly ProductDecisionSignal[]
  recommendations: readonly ProductDecisionSignal[]
  timeline: readonly ProductPeriodMetrics[]
  explainability: readonly string[]
}
