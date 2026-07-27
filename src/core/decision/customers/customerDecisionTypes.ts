export type CustomerScope =
  | 'all-brands'
  | 'brand'

export type CustomerRiskLevel =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export interface CustomerPeriodMetrics {
  periodId: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
  products: number
}

export interface CustomerBrandOption {
  id: string
  name: string
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
  lastActivePeriodId: string | null
  inactiveMonths: number
  riskLevel: CustomerRiskLevel
  riskLabel: string
  recoveryProbability: number
  recoveryPotential: number
  activeProductIds: readonly string[]
  inactiveProductIds: readonly string[]
  timeline: readonly CustomerPeriodMetrics[]
  availableBrands: readonly CustomerBrandOption[]
  diagnosis: string
  recommendedAction: string
}
