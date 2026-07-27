export interface BusinessCustomerBrandPeriod {
  id: string

  customerId: string
  brandId: string
  periodId: string

  revenue: number
  grossProfit: number
  quantity: number
  documents: number

  products: Set<string>
}
