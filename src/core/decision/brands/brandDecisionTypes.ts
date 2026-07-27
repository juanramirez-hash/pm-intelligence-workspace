import type {
  BusinessExecutiveBrief,
  BusinessHealthScore,
  BusinessBrandSnapshot,
  BusinessNarrativeCategory,
  BusinessNarrativeSeverity,
} from '../../business'

import type {
  BrandAICommercialSummary,
  BrandExecutiveScore,
  BrandPrioritizedAction,
} from './brandCommercialIntelligence'

import type {
  BrandForecastIntelligence,
} from './brandForecastIntelligence'

import type {
  BrandExecutiveActionCenter,
} from './brandExecutiveActionCenter'

export type CommercialPriorityLevel =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export type BrandDecisionReasonCategory =
  | 'revenue'
  | 'margin'
  | 'target'
  | 'customers'
  | 'products'
  | 'activity'

export interface BrandDecisionReason {
  code: string
  category: BrandDecisionReasonCategory
  message: string
  impact: number
}

export interface BrandLostCustomer {
  customerId: string
  customerName: string
  previousRevenue: number
  previousGrossProfit: number
  previousQuantity: number
  previousDocuments: number
}

export interface BrandLostProduct {
  productId: string
  productModel: string
}

export interface BrandCommercialPriority {
  score: number
  level: CommercialPriorityLevel
  reasons: readonly BrandDecisionReason[]
}

export interface BrandDecisionInsight {
  code: string
  category: BusinessNarrativeCategory
  severity: BusinessNarrativeSeverity
  title: string
  description: string
}

export type BrandRecommendedActionPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export interface BrandRecommendedAction {
  code: string
  priority: BrandRecommendedActionPriority
  title: string
  description: string
  reasonCodes: readonly string[]
}

export interface BrandLossEvaluation {
  basePeriodId: string | null
  inactivityPeriodIds: readonly string[]
  completedPeriodsOnly: true
}

export interface BrandDecisionModel {
  id: string
  generatedAt: string
  brandId: string
  brandName: string
  currentPeriodId: string
  previousPeriodId: string
  currentSnapshot: BusinessBrandSnapshot
  previousSnapshot: BusinessBrandSnapshot | null
  healthScore: BusinessHealthScore
  executiveBrief: BusinessExecutiveBrief
  priority: BrandCommercialPriority
  lostCustomers: readonly BrandLostCustomer[]
  lostProducts: readonly BrandLostProduct[]
  lossEvaluation: BrandLossEvaluation
  why: readonly string[]
  risks: readonly BrandDecisionInsight[]
  opportunities: readonly BrandDecisionInsight[]
  recommendedActions: readonly BrandRecommendedAction[]
  executiveScore: BrandExecutiveScore
  aiSummary: BrandAICommercialSummary
  prioritizedActions: readonly BrandPrioritizedAction[]
  forecast: BrandForecastIntelligence
  actionCenter: BrandExecutiveActionCenter
}

export interface BrandDecisionOptions {
  previousPeriodId?: string
  elapsedWorkingDays?: number
}
