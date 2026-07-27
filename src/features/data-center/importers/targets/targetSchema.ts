import type { TargetField } from './targetColumnAliases'

export const REQUIRED_TARGET_FIELDS = [
  'brandId',
  'periodId',
] as const satisfies readonly TargetField[]

export const RECOMMENDED_TARGET_FIELDS = [
  'targetRevenue',
  'targetGrossProfit',
  'workingDays',
] as const satisfies readonly TargetField[]

export const OPTIONAL_TARGET_FIELDS = [
  'targetGrossMargin',
] as const satisfies readonly TargetField[]

export const ALL_TARGET_FIELDS = [
  ...REQUIRED_TARGET_FIELDS,
  ...RECOMMENDED_TARGET_FIELDS,
  ...OPTIONAL_TARGET_FIELDS,
] as const satisfies readonly TargetField[]
