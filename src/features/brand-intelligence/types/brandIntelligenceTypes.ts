import type { BrandIntelligenceItem } from '../../../core/analytics/brands'

export interface BrandIntelligenceRankingItem {
  id: string
  name: string
  revenue: number
  grossProfit: number
  grossMargin: number
  quantity: number
  participation: number
}

export interface BrandIntelligenceTimelineItem {
  period: string
  label: string

  revenue: number
  grossProfit: number
  grossMargin: number
  quantity: number

  customers: number
  products: number
  documents: number
}

export interface BrandIntelligenceKpis {
  revenue: number
  grossProfit: number
  grossMargin: number
  quantity: number

  customers: number
  products: number
  documents: number

  revenueVariation: number
  revenueVariationPercentage: number

  grossProfitVariation: number
  grossProfitVariationPercentage: number

  marginVariation: number
  customerVariation: number
  productVariation: number

  revenueParticipation: number
}

export type BrandInsightSeverity =
  | 'information'
  | 'opportunity'
  | 'warning'
  | 'critical'

export interface BrandIntelligenceInsight {
  id: string
  title: string
  description: string
  severity: BrandInsightSeverity
  metric?: string
  value?: number
}

export interface BrandIntelligencePlaceholder {
  status: 'pending'
  available: false
  message: string
}

export interface BrandIntelligenceData {
  brand: BrandIntelligenceItem

  kpis: BrandIntelligenceKpis

  timeline: BrandIntelligenceTimelineItem[]

  topCustomers: BrandIntelligenceRankingItem[]
  topProducts: BrandIntelligenceRankingItem[]

  insights: BrandIntelligenceInsight[]

  forecast: BrandIntelligencePlaceholder
  inventory: BrandIntelligencePlaceholder
  pricing: BrandIntelligencePlaceholder
  purchaseOrders: BrandIntelligencePlaceholder
  objectives: BrandIntelligencePlaceholder
}

export interface BrandIntelligenceState {
  brandId: string | null
  data: BrandIntelligenceData | null
  isLoading: boolean
  error: string | null
}