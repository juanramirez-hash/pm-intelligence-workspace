export interface NormalizedSalesRow {
  date: string
  brand: string
  revenue: number
  grossProfit: number

  customerId: string | null
  customerName: string | null

  /** Unique ERP Name used as the primary Product Master identity. */
  productName?: string | null

  /** Legacy/alternate product code retained as a secondary fallback. */
  productCode?: string | null

  model: string | null
  productStatus?: 'A' | 'B' | 'C' | 'D' | 'E' | null
  quantity: number

  documentNumber: string | null
  location: string | null
  salesRep: string | null
  currency: string | null
}
