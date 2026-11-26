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

export function targetScopeNote(
  portfolio: Pick<MyDayPortfolio, 'brands' | 'brandsWithTarget'>,
): string {
  return `Cuota, avance, ritmo y brecha consideran solo marcas con meta (${portfolio.brandsWithTarget} de ${portfolio.brands})`
}

/** By revenue, highest first (negative revenue last), then by name. */
export function sortBrandsByRevenue(brands: readonly MyDayBrand[]): MyDayBrand[] {
  return [...brands].sort((left, right) =>
    right.revenue - left.revenue ||
    left.brandLabel.localeCompare(right.brandLabel),
  )
}
