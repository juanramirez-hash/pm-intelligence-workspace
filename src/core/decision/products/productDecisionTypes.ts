import type { BusinessProductDNA } from './intelligence'
export type ProductRiskLevel = 'critical' | 'high' | 'medium' | 'low'
export type ProductCommercialStatus = 'A' | 'B' | 'C' | 'D' | 'E' | 'unclassified'
export type ProductLifecycleStage = 'launch' | 'growth' | 'mature' | 'declining' | 'dormant'
export type ProductDecisionSeverity = 'critical' | 'high' | 'medium' | 'low'
export type ProductDecisionCategory = 'risk' | 'opportunity' | 'recommendation'

export interface ProductPeriodMetrics {
  periodId: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
  customers: number
}

export interface ProductLostCustomer {
  customerId: string
  customerName: string
  estimatedBaseRevenue: number
  recoveryProbability: number
  expectedImpact: number
}

export interface ProductDecisionSignal {
  id: string
  category: ProductDecisionCategory
  severity: ProductDecisionSeverity
  title: string
  description: string
  recommendedAction: string
  score: number
  expectedImpact: number
  confidence: number
  evidence: readonly string[]
  ruleId: string
}

export interface ProductHealthComponent {
  id: 'activity' | 'trend' | 'penetration' | 'recurrence' | 'margin'
  label: string
  score: number
  weight: number
  explanation: string
}

export interface ProductDecisionModel {
  id: string
  generatedAt: string
  productId: string
  productName: string
  sku: string
  brandId: string
  brandName: string
  currentPeriodId: string
  current: ProductPeriodMetrics
  previous: ProductPeriodMetrics | null
  totalRevenue: number
  totalGrossProfit: number
  grossMargin: number | null
  revenueVariation: number | null
  grossMarginVariation: number | null
  quantityVariation: number | null
  customerVariation: number | null
  customerDelta: number | null
  previousHealthScore: number | null
  healthVariation: number | null
  lastActivePeriodId: string | null
  inactiveMonths: number
  commercialStatus: ProductCommercialStatus
  commercialStatusLabel: string
  penetrationInterpretation: string
  lifecycleStage: ProductLifecycleStage
  lifecycleLabel: string
  isNewProduct: boolean
  healthScore: number
  healthLabel: string
  healthComponents: readonly ProductHealthComponent[]
  riskLevel: ProductRiskLevel
  riskLabel: string
  recoveryProbability: number
  recoveryPotential: number
  activeCustomerIds: readonly string[]
  lostCustomers: readonly ProductLostCustomer[]
  risks: readonly ProductDecisionSignal[]
  opportunities: readonly ProductDecisionSignal[]
  recommendations: readonly ProductDecisionSignal[]
  topDecision: ProductDecisionSignal | null
  confidence: number
  timeline: readonly ProductPeriodMetrics[]
  diagnosis: string
  recommendedAction: string
  dna: BusinessProductDNA
}
