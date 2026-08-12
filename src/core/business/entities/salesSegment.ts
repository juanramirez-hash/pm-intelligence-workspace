/**
 * Aggregated daily sales grain used by Sales Workspace segmentation.
 *
 * The grain is deterministic and combines transaction date, period, brand,
 * customer, product, location and sales representative. Workspaces never
 * access this collection directly; all reads go through
 * SalesSegmentationQueries.
 */
export interface BusinessSalesSegment {
  id: string

  dateId: string
  periodId: string
  brandId: string
  customerId: string | null
  productId: string | null
  locationId: string | null
  salesRepresentativeId: string | null

  revenue: number
  grossProfit: number
  quantity: number
  rowCount: number

  /** Internal document identity used to produce exact distinct counts. */
  documentNumbers: Set<string>
}