export interface BusinessBrandPeriod {
  id: string

  brandId: string
  periodId: string

  revenue: number
  grossProfit: number
  quantity: number
  documents: number

  customers: Set<string>
  products: Set<string>
}