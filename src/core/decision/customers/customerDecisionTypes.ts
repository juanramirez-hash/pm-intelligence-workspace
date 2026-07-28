export type CustomerScope =
  | 'all-brands'
  | 'brand'

export type CustomerRiskLevel =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export type CustomerInsightSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'positive'

export type CustomerInsightCategory =
  | 'activity'
  | 'revenue'
  | 'frequency'
  | 'portfolio'
  | 'concentration'
  | 'recovery'
  | 'growth'
  | 'cross-sell'

export type CustomerRecommendationPriority =
  | 'immediate'
  | 'high'
  | 'medium'
  | 'routine'

export interface CustomerPeriodMetrics {
  periodId: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
  products: number
  brands: number
  locations: number
}

export interface CustomerBrandOption {
  id: string
  name: string
}

export interface CustomerHealthComponent {
  id:
    | 'activity'
    | 'trend'
    | 'frequency'
    | 'portfolio'
    | 'stability'
  label: string
  score: number
  weight: number
  explanation: string
}

export interface CustomerHealthScore {
  score: number
  level:
    | 'strong'
    | 'healthy'
    | 'attention'
    | 'critical'
  label: string
  components: readonly CustomerHealthComponent[]
}

export interface CustomerDecisionEvidence {
  metric: string
  label: string
  value: number | string | null
  comparison?: number | string | null
}

export interface CustomerDecisionInsight {
  id: string
  ruleId: string
  category: CustomerInsightCategory
  severity: CustomerInsightSeverity
  title: string
  description: string
  rationale: string
  impact: number
  confidence: number
  evidence: readonly CustomerDecisionEvidence[]
}

export interface CustomerRecommendedAction {
  id: string
  code: string
  priority: CustomerRecommendationPriority
  title: string
  description: string
  expectedOutcome: string
  reasonIds: readonly string[]
}

export interface CustomerDecisionExplanation {
  ruleId: string
  rationale: string
  evidence: readonly CustomerDecisionEvidence[]
}

export interface CustomerDecisionModel {
  id: string
  generatedAt: string
  customerId: string
  customerName: string
  scope: CustomerScope
  selectedBrandId: string | null
  selectedBrandName: string
  currentPeriodId: string
  previousPeriodId: string | null
  current: CustomerPeriodMetrics
  previous: CustomerPeriodMetrics | null
  totalRevenue: number
  totalGrossProfit: number
  grossMargin: number | null
  revenueVariation: number | null
  documentVariation: number | null
  productRetention: number | null
  activePeriodRate: number
  lastActivePeriodId: string | null
  inactiveMonths: number
  riskLevel: CustomerRiskLevel
  riskLabel: string
  recoveryProbability: number
  recoveryPotential: number
  healthScore: CustomerHealthScore
  risks: readonly CustomerDecisionInsight[]
  opportunities: readonly CustomerDecisionInsight[]
  recommendedActions: readonly CustomerRecommendedAction[]
  explanations: readonly CustomerDecisionExplanation[]
  decisionConfidence: number
  activeProductIds: readonly string[]
  inactiveProductIds: readonly string[]
  timeline: readonly CustomerPeriodMetrics[]
  availableBrands: readonly CustomerBrandOption[]
  diagnosis: string
  recommendedAction: string
}
