import type { BusinessBrandTargetInput } from '../../../../core/business/targets'

export type NormalizedTargetRow = BusinessBrandTargetInput

export interface TargetDatasetSummary {
  periodStart: string | null
  periodEnd: string | null
  totalTargets: number
  uniqueBrands: number
  totalRevenueTarget: number
  totalGrossProfitTarget: number
  averageGrossMarginTarget: number | null
  periods: number
  rowsWithWorkingDays: number
  processedRows: number
  ignoredRows: number
}
