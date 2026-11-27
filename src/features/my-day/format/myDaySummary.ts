// MD-003: helpers of the summary blocks (kept out of the component files).

import type {
  MyDayBrand,
  MyDayPortfolio,
} from '../api/myDayTypes'

/** Rows requested for each summary block of the page. */
export const MY_DAY_SUMMARY_LIMITS = Object.freeze({
  lostCustomers: 5,
  stockAlerts: 10,
  arrivals: 20,
})

/**
 * MD-003-HOTFIX2: the portfolio compares the revenue of every brand (with
 * and without quota) against the total quota, as the quota progress report.
 */
export function targetScopeNote(
  portfolio: Pick<MyDayPortfolio, 'brands' | 'brandsWithTarget'>,
): string {
  const withoutTarget = Math.max(portfolio.brands - portfolio.brandsWithTarget, 0)

  return `Avance, ritmo y brecha comparan la venta de todas las marcas contra la cuota total (${withoutTarget} ${withoutTarget === 1 ? 'marca' : 'marcas'} sin cuota)`
}

/** By revenue, highest first (negative revenue last), then by name. */
export function sortBrandsByRevenue(brands: readonly MyDayBrand[]): MyDayBrand[] {
  return [...brands].sort((left, right) =>
    right.revenue - left.revenue ||
    left.brandLabel.localeCompare(right.brandLabel, 'es-MX'),
  )
}
