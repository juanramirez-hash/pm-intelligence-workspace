export type CustomerLifecycleStatus =
  | 'active'
  | 'new'
  | 'recovered'
  | 'inactive'
  | 'lost'

export type CustomerTrendStatus =
  | 'growing'
  | 'declining'
  | 'stable'
  | 'without_comparison'

export interface CustomerPeriodMetrics {
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
}

export interface CustomerIntelligenceItem {
  customerId: string
  customerName: string

  lifecycleStatus:
    CustomerLifecycleStatus

  trendStatus:
    CustomerTrendStatus

  lastPurchaseDate: string
  daysSinceLastPurchase: number

  currentPeriod:
    CustomerPeriodMetrics

  previousPeriod:
    CustomerPeriodMetrics

  revenueVariation: number | null
  revenueVariationPercentage:
    number | null

  historicalRevenue: number
  historicalGrossProfit: number
  historicalQuantity: number
  historicalDocuments: number

  requiresAttention: boolean
  attentionReason: string | null
}

export interface CustomerIntelligenceSummary {
  analysisDate: string

  currentPeriodStart: string
  currentPeriodEnd: string

  previousPeriodStart: string
  previousPeriodEnd: string

  totalCustomers: number

  activeCustomers: number
  newCustomers: number
  recoveredCustomers: number
  inactiveCustomers: number
  lostCustomers: number

  growingCustomers: number
  decliningCustomers: number
  stableCustomers: number

  customersRequiringAttention: number

  customers:
    CustomerIntelligenceItem[]

  attentionCustomers:
    CustomerIntelligenceItem[]

  topGrowingCustomers:
    CustomerIntelligenceItem[]

  topDecliningCustomers:
    CustomerIntelligenceItem[]
}