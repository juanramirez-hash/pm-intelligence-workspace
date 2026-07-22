export interface BusinessBrand {
  id: string

  name: string

  revenue: number

  grossProfit: number

  quantity: number

  customers: Set<string>

  products: Set<string>
}