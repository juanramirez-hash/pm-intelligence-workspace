export type BrandLifecycleStatus =
  | 'active'
  | 'new'
  | 'recovered'
  | 'inactive'
  | 'lost'

export type BrandTrendStatus =
  | 'growing'
  | 'declining'
  | 'stable'
  | 'without_comparison'

export interface BrandPeriodMetrics {
  revenue: number
  grossProfit: number
  quantity: number
  documents: number

  customers: number
  products: number

  margin: number | null
}

export interface BrandIntelligenceItem {
  brandId: string
  brandName: string

  lifecycleStatus:
    BrandLifecycleStatus

  trendStatus:
    BrandTrendStatus

  currentPeriod:
    BrandPeriodMetrics

  previousPeriod:
    BrandPeriodMetrics

  revenueVariation: number

  revenueVariationPercentage:
    number | null

  grossProfitVariation: number

  grossProfitVariationPercentage:
    number | null

  marginVariation:
    number | null

  customerVariation: number
  productVariation: number

  historicalRevenue: number
  historicalGrossProfit: number
  historicalQuantity: number

  historicalCustomers: number
  historicalProducts: number

  revenueParticipation: number

  requiresAttention: boolean
  attentionReason: string | null
}

export interface BrandIntelligenceSummary {
  analysisDate: string

  currentPeriodId: string
  currentPeriodStart: string
  currentPeriodEnd: string

  previousPeriodId: string
  previousPeriodStart: string
  previousPeriodEnd: string

  totalBrands: number

  activeBrands: number
  newBrands: number
  recoveredBrands: number
  inactiveBrands: number
  lostBrands: number

  growingBrands: number
  decliningBrands: number
  stableBrands: number
  brandsWithoutComparison: number

  brandsRequiringAttention: number

  currentPeriodRevenue: number
  previousPeriodRevenue: number

  revenueVariation: number

  revenueVariationPercentage:
    number | null

  brands:
    BrandIntelligenceItem[]

  attentionBrands:
    BrandIntelligenceItem[]

  topGrowingBrands:
    BrandIntelligenceItem[]

  topDecliningBrands:
    BrandIntelligenceItem[]

  topRevenueBrands:
    BrandIntelligenceItem[]
}