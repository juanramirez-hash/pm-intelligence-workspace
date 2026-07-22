export interface BusinessProduct {
  id: string

  model: string

  brand: string

  revenue: number

  grossProfit: number

  quantity: number

  customers: Set<string>
}