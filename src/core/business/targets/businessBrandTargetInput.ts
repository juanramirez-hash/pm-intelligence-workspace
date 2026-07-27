export interface BusinessBrandTargetInput {
  brandId: string
  periodId: string

  targetRevenue?: number | null
  targetGrossProfit?: number | null
  targetGrossMargin?: number | null
  workingDays?: number | null
}

export type BusinessBrandTargetIssueCode =
  | 'INVALID_BRAND_ID'
  | 'INVALID_PERIOD_ID'
  | 'MISSING_TARGET_VALUE'
  | 'INVALID_TARGET_REVENUE'
  | 'INVALID_TARGET_GROSS_PROFIT'
  | 'INVALID_TARGET_GROSS_MARGIN'
  | 'INVALID_WORKING_DAYS'
  | 'DUPLICATE_TARGET'

export interface BusinessBrandTargetIssue {
  rowIndex: number
  code: BusinessBrandTargetIssueCode
  message: string
}
