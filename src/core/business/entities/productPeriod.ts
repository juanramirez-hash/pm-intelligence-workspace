export interface BusinessProductPeriod {
  id: string
  productId: string
  periodId: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
  customers: Set<string>
}
