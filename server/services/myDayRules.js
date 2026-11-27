// MD-001 "Mi día": pure rules, without SQL.
//
// Status, trend, participation and attention follow the Executive
// "Detalle ejecutivo por marca" table (src/core/analytics/brands/
// brandIntelligence.ts); tests/server/myDayParity.test.ts keeps the
// thresholds, texts and working-day comparison identical.

import {
  equivalentPreviousCutoff,
  monthEnd,
  shiftMonth,
  weekdaysBetween,
  weekdaysInPeriod,
} from './metricPeriods.js'

export const MY_DAY_RULES = Object.freeze({
  // Revenue change beyond ±5 % is growing or declining (Executive).
  stableVariationThreshold: 0.05,
  // A decline of 15 % or more needs attention (Executive).
  attentionDeclineThreshold: -0.15,
  // Bought the brand in the base month and nothing in the last 2 completed
  // months (/api/metrics/brands/:brand/lost-customers).
  lostCustomers: Object.freeze({
    inactivePeriods: 2,
    basePeriods: 1,
  }),
})

export const ATTENTION_REASONS = Object.freeze({
  lost: 'Marca con venta en el periodo anterior y sin actividad en el periodo actual.',
  inactive: 'Marca sin actividad en los periodos actual y anterior.',
  declining: 'Marca con caída relevante de venta frente al periodo anterior.',
})

export function emptyMetrics() {
  return {
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
    customers: 0,
    products: 0,
  }
}

export function hasActivity(metrics) {
  return (
    metrics.revenue !== 0 ||
    metrics.grossProfit !== 0 ||
    metrics.quantity !== 0 ||
    metrics.documents > 0 ||
    metrics.customers > 0 ||
    metrics.products > 0
  )
}

export function margin(revenue, grossProfit) {
  return revenue === 0 ? null : grossProfit / revenue
}

export function variationPercentage(current, previous) {
  if (previous === 0) {
    return current === 0 ? 0 : null
  }

  return (current - previous) / previous
}

export function lifecycleStatus(current, previous, hadActivityBeforePrevious) {
  const hasCurrent = hasActivity(current)
  const hasPrevious = hasActivity(previous)

  if (hasCurrent && !hasPrevious) {
    return hadActivityBeforePrevious ? 'recovered' : 'new'
  }

  if (!hasCurrent && hasPrevious) {
    return 'lost'
  }

  if (!hasCurrent && !hasPrevious) {
    return 'inactive'
  }

  return 'active'
}

export function trendStatus(
  currentRevenue,
  previousRevenue,
  stableThreshold = MY_DAY_RULES.stableVariationThreshold,
) {
  if (previousRevenue === 0) {
    return 'without_comparison'
  }

  const variation = (currentRevenue - previousRevenue) / previousRevenue

  if (variation > stableThreshold) {
    return 'growing'
  }

  if (variation < -stableThreshold) {
    return 'declining'
  }

  return 'stable'
}

export function attentionReason(
  lifecycle,
  trend,
  revenueVariationPercentage,
  declineThreshold = MY_DAY_RULES.attentionDeclineThreshold,
) {
  if (lifecycle === 'lost') {
    return ATTENTION_REASONS.lost
  }

  if (lifecycle === 'inactive') {
    return ATTENTION_REASONS.inactive
  }

  if (
    trend === 'declining' &&
    revenueVariationPercentage !== null &&
    revenueVariationPercentage <= declineThreshold
  ) {
    return ATTENTION_REASONS.declining
  }

  return null
}

/**
 * Current and previous windows of a period for a data cutoff.
 * - closed: the cutoff reached the month end; full months are compared.
 * - open: the month to the cutoff against the previous month cut on the same
 *   number of weekdays (Executive rule).
 * - after-cutoff: the period starts after the data cutoff; no data.
 */
export function resolvePeriodWindow(period, cutoff) {
  const previousPeriod = shiftMonth(period, -1)
  const total = weekdaysInPeriod(period)

  if (!cutoff || cutoff < `${period}-01`) {
    return {
      period,
      previousPeriod,
      periodStatus: 'after-cutoff',
      comparison: null,
      workingDays: { elapsed: 0, total, remaining: total, holidaysExcluded: false },
    }
  }

  const periodEnd = monthEnd(period)
  const fullPrevious = {
    previousFrom: `${previousPeriod}-01`,
    previousTo: monthEnd(previousPeriod),
  }

  if (cutoff >= periodEnd) {
    return {
      period,
      previousPeriod,
      periodStatus: 'closed',
      comparison: {
        basis: 'full-month',
        currentFrom: `${period}-01`,
        currentTo: periodEnd,
        ...fullPrevious,
        holidaysExcluded: false,
      },
      workingDays: { elapsed: total, total, remaining: 0, holidaysExcluded: false },
    }
  }

  const elapsed = weekdaysBetween(`${period}-01`, cutoff)
  const previousCutoff = equivalentPreviousCutoff(period, cutoff)

  return {
    period,
    previousPeriod,
    periodStatus: 'open',
    comparison: {
      basis: previousCutoff ? 'equivalent-working-days' : 'full-previous-month',
      currentFrom: `${period}-01`,
      currentTo: cutoff,
      previousFrom: fullPrevious.previousFrom,
      previousTo: previousCutoff ?? fullPrevious.previousTo,
      holidaysExcluded: false,
    },
    workingDays: { elapsed, total, remaining: total - elapsed, holidaysExcluded: false },
  }
}

/**
 * Quota progress and pace with Monday-to-Friday working days.
 * - projectedRevenue: revenue / elapsed × total (the revenue itself once
 *   closed; NULL before the first weekday).
 * - dailyGap: (target − revenue) / remaining weekdays, 0 once reached; NULL
 *   without target or without remaining weekdays.
 */
export function quotaPace(revenue, targetRevenue, workingDays, periodStatus) {
  const hasTarget = targetRevenue !== null && targetRevenue !== undefined

  let projectedRevenue = null

  if (periodStatus === 'closed') {
    projectedRevenue = revenue
  } else if (periodStatus === 'open' && workingDays.elapsed > 0) {
    projectedRevenue = (revenue / workingDays.elapsed) * workingDays.total
  }

  const gap = hasTarget ? Math.max(targetRevenue - revenue, 0) : null

  return {
    attainment: hasTarget && targetRevenue > 0 ? revenue / targetRevenue : null,
    gap,
    projectedRevenue,
    projectedAttainment:
      hasTarget && targetRevenue > 0 && projectedRevenue !== null
        ? projectedRevenue / targetRevenue
        : null,
    dailyGap:
      gap !== null && workingDays.remaining > 0 && periodStatus === 'open'
        ? gap / workingDays.remaining
        : null,
  }
}

/** Revenue share inside the user's brands (0 when they sold nothing). */
export function participation(revenue, portfolioRevenue) {
  return portfolioRevenue === 0 ? 0 : revenue / portfolioRevenue
}

function toTarget(target) {
  if (!target) {
    return null
  }

  return {
    revenue: target.revenue,
    grossProfit: target.grossProfit,
    grossMargin: target.grossMargin,
    // Informative only: the pace always uses calculated weekdays.
    workingDays: target.workingDays,
  }
}

/**
 * @param {object} input
 * @param {ReturnType<typeof resolvePeriodWindow>} input.window
 * @param {string} input.dataCutoff
 * @param {Array<{ brandKey: string, brandLabel: string }>} input.brands
 * @param {Map<string, object>} input.current metrics by brand key
 * @param {Map<string, object>} input.previous metrics by brand key
 * @param {Map<string, object>} input.targets target by brand key
 * @param {Set<string>} input.activeBeforePrevious brand keys
 * @param {Map<string, number>} input.lostCustomers count by brand key
 */
export function buildMyDayBrands({
  window,
  brands,
  current,
  previous,
  targets,
  activeBeforePrevious,
  lostCustomers,
  rules = MY_DAY_RULES,
}) {
  const portfolioRevenue = brands.reduce(
    (total, brand) => total + (current.get(brand.brandKey)?.revenue ?? 0),
    0,
  )

  return brands
    .map(({ brandKey, brandLabel }) => {
      const now = current.get(brandKey) ?? emptyMetrics()
      const before = previous.get(brandKey) ?? emptyMetrics()
      const target = toTarget(targets.get(brandKey))
      const lifecycle = lifecycleStatus(now, before, activeBeforePrevious.has(brandKey))
      const trend = trendStatus(now.revenue, before.revenue, rules.stableVariationThreshold)
      const revenueVariationPercentage = variationPercentage(now.revenue, before.revenue)
      const reason = attentionReason(
        lifecycle,
        trend,
        revenueVariationPercentage,
        rules.attentionDeclineThreshold,
      )
      const currentMargin = margin(now.revenue, now.grossProfit)
      const previousMargin = margin(before.revenue, before.grossProfit)

      return {
        brandKey,
        brandLabel,

        revenue: now.revenue,
        target,
        ...quotaPace(now.revenue, target?.revenue ?? null, window.workingDays, window.periodStatus),

        previousRevenue: before.revenue,
        revenueVariation: now.revenue - before.revenue,
        revenueVariationPercentage,

        grossProfit: now.grossProfit,
        grossMargin: currentMargin,
        previousGrossProfit: before.grossProfit,
        previousGrossMargin: previousMargin,
        marginVariation:
          currentMargin !== null && previousMargin !== null
            ? currentMargin - previousMargin
            : null,

        customers: now.customers,
        previousCustomers: before.customers,
        customerVariation: now.customers - before.customers,
        products: now.products,
        previousProducts: before.products,
        productVariation: now.products - before.products,

        participation: participation(now.revenue, portfolioRevenue),

        lifecycleStatus: lifecycle,
        trendStatus: trend,
        requiresAttention: reason !== null,
        attentionReason: reason,

        lostCustomers: lostCustomers.get(brandKey) ?? 0,
      }
    })
    .sort(
      (left, right) =>
        right.revenue - left.revenue ||
        left.brandLabel.localeCompare(right.brandLabel),
    )
}

/**
 * Portfolio totals.
 *
 * MD-003-HOTFIX2: the revenue of EVERY brand (with and without target) is
 * compared against the total target, the same rule as the quota progress
 * report (Alcance_cuota_marcas_GAP) and the DNR: attainment, gap, projected
 * close, projected attainment and daily gap use the total revenue. The
 * revenue and projection of the brands with target stay as information
 * (revenueWithTarget, projectedRevenueWithTarget, brandsWithTarget). Each
 * brand keeps its own rule: a brand without target has attainment null.
 */
export function buildMyDayPortfolio(brands, window) {
  const sum = (items, pick) => items.reduce((total, item) => total + pick(item), 0)
  const withTarget = brands.filter((brand) => brand.target?.revenue !== null && brand.target?.revenue !== undefined)
  const revenue = sum(brands, (brand) => brand.revenue)
  const previousRevenue = sum(brands, (brand) => brand.previousRevenue)
  const grossProfit = sum(brands, (brand) => brand.grossProfit)
  const target = withTarget.length > 0
    ? sum(withTarget, (brand) => brand.target.revenue)
    : null
  const revenueWithTarget = sum(withTarget, (brand) => brand.revenue)
  const pace = quotaPace(revenue, target, window.workingDays, window.periodStatus)

  return {
    brands: brands.length,
    brandsWithTarget: withTarget.length,
    revenue,
    revenueWithTarget,
    target,
    ...pace,
    projectedRevenueWithTarget: quotaPace(revenueWithTarget, null, window.workingDays, window.periodStatus).projectedRevenue,
    previousRevenue,
    revenueVariation: revenue - previousRevenue,
    revenueVariationPercentage: variationPercentage(revenue, previousRevenue),
    grossProfit,
    grossMargin: margin(revenue, grossProfit),
    brandsRequiringAttention: brands.filter((brand) => brand.requiresAttention).length,
    lostCustomers: sum(brands, (brand) => brand.lostCustomers),
  }
}
