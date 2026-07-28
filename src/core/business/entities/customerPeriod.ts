export interface BusinessCustomerPeriod {
  id: string

  customerId: string
  periodId: string

  revenue: number
  grossProfit: number
  quantity: number
  documents: number

  brands: Set<string>
  products: Set<string>
  locations: Set<string>
}