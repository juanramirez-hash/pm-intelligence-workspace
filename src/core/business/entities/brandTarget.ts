export interface BusinessBrandTarget {
  id: string
  brandId: string
  periodId: string

  targetRevenue: number | null
  targetGrossProfit: number | null
  targetGrossMargin: number | null
  workingDays: number | null
}
