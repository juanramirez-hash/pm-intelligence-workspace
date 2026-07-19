export interface NormalizedSalesRow {
  date: string
  brand: string
  revenue: number
  grossProfit: number

  customerId: string | null
  customerName: string | null

  model: string | null
  quantity: number

  documentNumber: string | null
  location: string | null
  salesRep: string | null
  currency: string | null
}