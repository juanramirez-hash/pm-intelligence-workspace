export interface BusinessCustomer {
  id: string

  name: string

  firstPurchase: string | null

  lastPurchase: string | null

  revenue: number

  grossProfit: number

  quantity: number

  documents: number

  brands: Set<string>

  products: Set<string>

  locations: Set<string>

  activePeriods: Set<string>
}