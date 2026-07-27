import type { BusinessBrandTarget } from '../../../../core/business/entities/brandTarget'
import { buildBusinessBrandTargets } from '../../../../core/business/targets'
import type { NormalizedTargetRow, TargetDatasetSummary } from './targetTypes'

export interface TargetBusinessModel {
  targets: BusinessBrandTarget[]
  summary: TargetDatasetSummary
}

export function buildTargetBusinessModel(
  rows: NormalizedTargetRow[],
  ignoredRows = 0,
): TargetBusinessModel {
  const result = buildBusinessBrandTargets(rows)
  const targets = [...result.brandTargets.values()]
  const periods = [...new Set(targets.map((target) => target.periodId))].sort()
  const margins = targets
    .map((target) => target.targetGrossMargin)
    .filter((value): value is number => value !== null)

  return {
    targets,
    summary: {
      periodStart: periods[0] ?? null,
      periodEnd: periods.at(-1) ?? null,
      totalTargets: targets.length,
      uniqueBrands: new Set(targets.map((target) => target.brandId)).size,
      totalRevenueTarget: targets.reduce(
        (total, target) => total + (target.targetRevenue ?? 0),
        0,
      ),
      totalGrossProfitTarget: targets.reduce(
        (total, target) => total + (target.targetGrossProfit ?? 0),
        0,
      ),
      averageGrossMarginTarget:
        margins.length > 0
          ? margins.reduce((total, value) => total + value, 0) / margins.length
          : null,
      periods: periods.length,
      rowsWithWorkingDays: targets.filter(
        (target) => target.workingDays !== null,
      ).length,
      processedRows: result.processedRows,
      ignoredRows: ignoredRows + result.ignoredRows,
    },
  }
}
