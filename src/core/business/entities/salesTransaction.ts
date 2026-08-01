export interface BusinessSalesTransactionLine {
  id: string
  date: string
  periodId: string
  documentNumber: string

  brandId: string
  customerId: string | null
  customerName: string | null
  productId: string | null
  locationId: string | null
  salesRepresentativeId: string | null
  currency: string | null

  revenue: number
  grossProfit: number
  quantity: number
}

export interface BusinessSalesTransactionDocument {
  id: string
  documentNumber: string
  firstDate: string
  lastDate: string

  revenue: number
  grossProfit: number
  quantity: number
  lineCount: number

  lineIds: Set<string>
  periodIds: Set<string>
  brandIds: Set<string>
  customerIds: Set<string>
  productIds: Set<string>
  locationIds: Set<string>
  salesRepresentativeIds: Set<string>
  currencies: Set<string>
}
