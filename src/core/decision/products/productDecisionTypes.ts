export type ProductRiskLevel = 'critical' | 'high' | 'medium' | 'low'

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

export interface ProductDecisionModel {
  id: string
  generatedAt: string
  productId: string
  productName: string
  brandId: string
  brandName: string
  currentPeriodId: string
  current: ProductPeriodMetrics
  previous: ProductPeriodMetrics | null
  totalRevenue: number
  totalGrossProfit: number
  grossMargin: number | null
  lastActivePeriodId: string | null
  inactiveMonths: number
  riskLevel: ProductRiskLevel
  riskLabel: string
  recoveryProbability: number
  recoveryPotential: number
  activeCustomerIds: readonly string[]
  lostCustomers: readonly ProductLostCustomer[]
  timeline: readonly ProductPeriodMetrics[]
  diagnosis: string
  recommendedAction: string
}
