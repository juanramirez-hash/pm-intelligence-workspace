// MB-001 brand page: pure rules (no SQL). Everything the brand endpoints
// decide lives here and is returned in the response as `rules`.
//
// Month against month, status, trend, attention and quota pace reuse
// myDayRules.js (MD-001). The year over year comparison, year to date and the
// annual close are a port of src/core/decision/brands/brandCommercialComparison.ts
// with exactly the same rules (a parity test compares them).

import {
  monthEnd,
  shiftMonth,
  weekdaysBetween,
} from './metricPeriods.js'

import {
  httpError,
  periodId as validatePeriod,
} from './actionValidation.js'

import {
  EMPTY_CALENDAR,
} from './businessCalendar.js'

import {
  variationPercentage,
} from './myDayRules.js'

export const BRAND_RULES = Object.freeze({
  // Selectable months: the data cutoff month and the 11 before it.
  periodOptions: 12,
  // Monthly series ending at the selected month.
  seriesMonths: 24,
  // Years of the year over year comparison: current, -1 and -2.
  comparisonYears: 3,
  // CAL-001: the calendar of non-working days (Configuración) rules.
  workingDays: 'Lunes a viernes menos los feriados oficiales y los días de la empresa del calendario',
  exportMaxRows: 20000,
  pageLimit: Object.freeze({ default: 50, max: 500 }),
  customerFilters: Object.freeze(['activos', 'por-recuperar', 'suben', 'bajan']),
  productFilters: Object.freeze(['vendidos', 'por-recuperar', 'agotados']),
  notes: Object.freeze({
    missing:
      'Un año sin ventas es un dato faltante (null), no un cero. El año actual conserva sus valores aunque no tenga filas (rowCount 0).',
    annualProjection:
      'Proyección del año actual = acumulado del año (YTD) / promedio de la proporción que el YTD representó del año completo en los años anteriores con dato (-1 y -2). Promedio aritmético de las proporciones positivas; sin ninguna, no hay proyección. La utilidad bruta usa su propia proporción.',
    annualTarget:
      'Cuota anual = suma de las cuotas mensuales registradas del año actual; monthsWithTarget indica cuántos de los 12 meses la tienen. Sin ninguna cuota no hay cuota anual.',
    grossProfit:
      'La utilidad bruta y el margen revelan el costo: sin acceso a costos de la marca se devuelven null con costHidden: true, nunca 0.',
  }),
})

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

// -- Periods ---------------------------------------------------------------

/** The cutoff month and the 11 before it, newest first. */
export function periodOptions(cutoff, count = BRAND_RULES.periodOptions) {
  if (!cutoff) {
    return []
  }

  const current = cutoff.slice(0, 7)

  return Array.from({ length: count }, (_, index) => shiftMonth(current, -index))
}

/**
 * period=YYYY-MM, by default the cutoff month. 400 when it is not one of
 * the selectable months. null when there are no sales at all.
 */
export function resolveBrandPeriod(value, cutoff) {
  const options = periodOptions(cutoff)

  if (options.length === 0) {
    return null
  }

  if (value === undefined) {
    return options[0]
  }

  validatePeriod(value)

  if (!options.includes(value)) {
    throw httpError(400, 'El periodo debe estar dentro de los últimos 12 meses')
  }

  return value
}

// -- Equivalent working days (port of dateAnalytics.ts) --------------------

/**
 * Same rule as resolveEquivalentWorkingDayCutoff in
 * src/core/analytics/shared/dateAnalytics.ts, with the CAL-001 calendar: the
 * target month is cut on its Nth business day, N being the business days
 * elapsed in the source month up to its cutoff; the target month end when it
 * has fewer. null when no business day has elapsed. Without a calendar (the
 * default) the days are Monday to Friday, as the client rule.
 */
export function equivalentWorkingDayCutoff(sourcePeriod, sourceCutoff, targetPeriod, calendar = EMPTY_CALENDAR) {
  const elapsed = weekdaysBetween(`${sourcePeriod}-01`, sourceCutoff, calendar)

  if (elapsed <= 0) {
    return null
  }

  return calendar.nthBusinessDay(targetPeriod, elapsed) ?? monthEnd(targetPeriod)
}

/**
 * Port of resolveComparableMonthCutoffs: the end date of the selected month
 * in each year, with the same number of working days when the month is
 * still open. null when no equivalent cutoff can be set.
 */
export function resolveComparableMonthCutoffs(currentPeriod, currentTo, years, closed, calendar = EMPTY_CALENDAR) {
  const month = currentPeriod.slice(5, 7)
  const currentYear = Number(currentPeriod.slice(0, 4))
  const preliminary = []

  for (const year of years) {
    const period = `${year}-${month}`
    const end = monthEnd(period)
    let dateTo

    if (year === currentYear) {
      dateTo = closed ? end : currentTo
    } else if (closed) {
      dateTo = end
    } else {
      const equivalent = equivalentWorkingDayCutoff(currentPeriod, currentTo, period, calendar)

      if (!equivalent) {
        return null
      }

      dateTo = equivalent
    }

    preliminary.push({
      year,
      periodId: period,
      end,
      dateTo,
      workingDays: weekdaysBetween(`${period}-01`, dateTo, calendar),
    })
  }

  // Closed month: the complete months are compared.
  if (closed) {
    return preliminary
  }

  if (preliminary.some((item) => item.workingDays <= 0)) {
    return null
  }

  // Open month: the shortest window is the reference and the others are
  // adjusted to its number of working days.
  const reference = preliminary.reduce((shortest, candidate) =>
    candidate.workingDays < shortest.workingDays ? candidate : shortest,
  )

  const adjusted = []

  for (const item of preliminary) {
    if (item.workingDays === reference.workingDays) {
      adjusted.push(item)
      continue
    }

    const dateTo = equivalentWorkingDayCutoff(reference.periodId, reference.dateTo, item.periodId, calendar)

    if (!dateTo) {
      return null
    }

    adjusted.push({
      ...item,
      dateTo,
      workingDays: weekdaysBetween(`${item.periodId}-01`, dateTo, calendar),
    })
  }

  return adjusted
}

// -- Year over year, year to date and annual close --------------------------

/**
 * The windows to read for the year over year comparison. Pure dates: the
 * service sums sales_facts inside each one.
 * { available: false, description } when the comparison cannot be built.
 */
export function buildYearWindowPlan(period, cutoff, calendar = EMPTY_CALENDAR) {
  if (!cutoff || !/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) {
    return {
      available: false,
      currentYear: null,
      description: 'No hay información suficiente para construir el comparativo multi-año.',
    }
  }

  const currentYear = Number(period.slice(0, 4))
  const currentStart = `${period}-01`
  const currentEnd = monthEnd(period)

  if (cutoff < currentStart) {
    return {
      available: false,
      currentYear,
      description: 'El periodo seleccionado todavía no tiene corte de datos.',
    }
  }

  const closed = cutoff >= currentEnd
  const currentTo = closed ? currentEnd : cutoff
  const years = Array.from(
    { length: BRAND_RULES.comparisonYears },
    (_, index) => currentYear - index,
  )
  const cutoffs = resolveComparableMonthCutoffs(period, currentTo, years, closed, calendar)

  if (!cutoffs) {
    return {
      available: false,
      currentYear,
      description: 'No se pudo establecer un corte laboral equivalente para los tres años.',
    }
  }

  const windows = []

  for (const comparable of cutoffs) {
    windows.push({
      key: `monthly:${comparable.year}`,
      kind: 'monthly',
      year: comparable.year,
      periodId: comparable.periodId,
      dateFrom: `${comparable.periodId}-01`,
      dateTo: comparable.dateTo,
      workingDays: weekdaysBetween(`${comparable.periodId}-01`, comparable.dateTo, calendar),
    })
    windows.push({
      key: `ytd:${comparable.year}`,
      kind: 'ytd',
      year: comparable.year,
      periodId: `${comparable.year}-YTD`,
      dateFrom: `${comparable.year}-01-01`,
      dateTo: comparable.dateTo,
      workingDays: weekdaysBetween(`${comparable.year}-01-01`, comparable.dateTo, calendar),
    })
  }

  for (const year of [currentYear - 1, currentYear - 2]) {
    windows.push({
      key: `fy:${year}`,
      kind: 'fy',
      year,
      periodId: `${year}-FY`,
      dateFrom: `${year}-01-01`,
      dateTo: `${year}-12-31`,
      workingDays: weekdaysBetween(`${year}-01-01`, `${year}-12-31`, calendar),
    })
  }

  const [previousYear, twoYearsBack] = [currentYear - 1, currentYear - 2]
  // CAL-001: years of the windows without a calendar are counted Monday to
  // Friday and reported so the screen warns.
  const calendarMissingYears = calendar.missingYears(
    windows.reduce((lowest, item) => (item.dateFrom < lowest ? item.dateFrom : lowest), windows[0].dateFrom),
    windows.reduce((highest, item) => (item.dateTo > highest ? item.dateTo : highest), windows[0].dateTo),
  )
  const holidaysExcluded = calendarMissingYears.length === 0

  return {
    available: true,
    currentYear,
    closed,
    windows,
    calendarMissingYears,
    holidaysExcluded,
    description: closed
      ? `Mes cerrado. Comparativo del mismo mes en ${currentYear}, ${previousYear} y ${twoYearsBack}; YTD al cierre del mes y proyección anual basada en la estacionalidad histórica disponible.`
      : `Mismo segmento del año: igual número de días laborables del mes actual (${holidaysExcluded ? 'lunes a viernes menos feriados y días de la empresa' : 'lunes a viernes, sin ajuste por feriados'}) para ${currentYear}, ${previousYear} y ${twoYearsBack}. YTD conserva los mismos meses completos más ese corte equivalente.`,
  }
}

function averagePositive(values) {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0)

  return valid.length === 0
    ? null
    : valid.reduce((total, value) => total + value, 0) / valid.length
}

const margin = (revenue, grossProfit) => (revenue !== 0 ? grossProfit / revenue : null)

/** A summed window as the response shows it. */
function toWindow(definition, metrics, costVisible) {
  const revenue = metrics?.revenue ?? 0
  const grossProfit = metrics?.grossProfit ?? 0

  return {
    year: definition.year,
    periodId: definition.periodId,
    dateFrom: definition.dateFrom,
    dateTo: definition.dateTo,
    workingDays: definition.workingDays ?? weekdaysBetween(definition.dateFrom, definition.dateTo),
    revenue,
    grossProfit: costVisible ? grossProfit : null,
    grossMargin: costVisible ? margin(revenue, grossProfit) : null,
    quantity: metrics?.quantity ?? 0,
    documents: metrics?.documents ?? 0,
    customers: metrics?.customers ?? 0,
    products: metrics?.products ?? 0,
    rowCount: metrics?.rowCount ?? 0,
    // Raw values for the ratios (never exposed when the cost is hidden).
    _grossProfit: grossProfit,
  }
}

const strip = (window) => {
  if (!window) {
    return null
  }

  const { _grossProfit: _hidden, ...visible } = window

  return visible
}

/** Variation of one window against another; null when either is missing. */
export function variationSet(current, other, costVisible = true) {
  if (!current || !other) {
    return null
  }

  const amountAndPercentage = (now, before) =>
    isNumber(now) && isNumber(before)
      ? { amount: now - before, percentage: variationPercentage(now, before) }
      : { amount: null, percentage: null }

  return {
    revenue: amountAndPercentage(current.revenue, other.revenue),
    grossProfit: costVisible
      ? amountAndPercentage(current.grossProfit, other.grossProfit)
      : { amount: null, percentage: null },
    // Percentage points of margin.
    grossMarginPoints: costVisible && isNumber(current.grossMargin) && isNumber(other.grossMargin)
      ? (current.grossMargin - other.grossMargin) * 100
      : null,
    customers: amountAndPercentage(current.customers, other.customers),
    products: amountAndPercentage(current.products, other.products),
  }
}

/**
 * Year over year, year to date and annual close, from the sums of each
 * window (metrics: Map key → { revenue, grossProfit, quantity, documents,
 * customers, products, rowCount }). Same rules as brandCommercialComparison.ts.
 */
export function assembleYearComparison(plan, metrics, { costVisible = true, annualTarget = null } = {}) {
  if (!plan.available) {
    return {
      available: false,
      currentYear: plan.currentYear,
      description: plan.description,
      calendarMissingYears: plan.calendarMissingYears ?? [],
      holidaysExcluded: plan.holidaysExcluded ?? false,
      costHidden: !costVisible,
    }
  }

  const { currentYear } = plan
  const previousYear = currentYear - 1
  const twoYearsBack = currentYear - 2
  const window = (key) => {
    const definition = plan.windows.find((item) => item.key === key)

    return definition ? toWindow(definition, metrics.get(key), costVisible) : null
  }
  const historical = (candidate) => (candidate && candidate.rowCount > 0 ? candidate : null)

  const monthly = {
    current: window(`monthly:${currentYear}`),
    previousYear: historical(window(`monthly:${previousYear}`)),
    twoYearsBack: historical(window(`monthly:${twoYearsBack}`)),
  }
  const ytd = {
    current: window(`ytd:${currentYear}`),
    previousYear: historical(window(`ytd:${previousYear}`)),
    twoYearsBack: historical(window(`ytd:${twoYearsBack}`)),
  }
  const fullYears = {
    previousYear: historical(window(`fy:${previousYear}`)),
    twoYearsBack: historical(window(`fy:${twoYearsBack}`)),
  }

  // Share of the full year that the YTD represented in the previous years.
  const revenueRatios = []
  const grossProfitRatios = []

  for (const [year, yearToDate, full] of [
    [previousYear, window(`ytd:${previousYear}`), fullYears.previousYear],
    [twoYearsBack, window(`ytd:${twoYearsBack}`), fullYears.twoYearsBack],
  ]) {
    if (yearToDate && full && full.revenue !== 0) {
      const ratio = yearToDate.revenue / full.revenue

      if (Number.isFinite(ratio) && ratio > 0) {
        revenueRatios.push({ year, value: ratio })
      }
    }

    if (yearToDate && full && full._grossProfit !== 0) {
      const ratio = yearToDate._grossProfit / full._grossProfit

      if (Number.isFinite(ratio) && ratio > 0) {
        grossProfitRatios.push({ year, value: ratio })
      }
    }
  }

  const revenueCompletion = averagePositive(revenueRatios.map((item) => item.value))
  const grossProfitCompletion = averagePositive(grossProfitRatios.map((item) => item.value))
  const currentYtd = ytd.current
  let projection = null

  if (currentYtd && revenueCompletion) {
    const projectedRevenue = currentYtd.revenue / revenueCompletion
    const projectedGrossProfit = grossProfitCompletion
      ? currentYtd._grossProfit / grossProfitCompletion
      : null

    projection = {
      year: currentYear,
      revenue: projectedRevenue,
      grossProfit: costVisible ? projectedGrossProfit : null,
      grossMargin: costVisible && projectedGrossProfit !== null && projectedRevenue !== 0
        ? projectedGrossProfit / projectedRevenue
        : null,
      historicalRevenueCompletionRatio: revenueCompletion,
      historicalGrossProfitCompletionRatio: costVisible ? grossProfitCompletion : null,
      historicalYearsUsed: revenueRatios.map((item) => item.year),
    }
  }

  const target = annualTarget && annualTarget.revenue > 0
    ? {
      revenue: annualTarget.revenue,
      monthsWithTarget: annualTarget.monthsWithTarget,
      // The screen says how many of the 12 months have a quota (e.g. 10 de 12).
      monthsInYear: 12,
      complete: annualTarget.monthsWithTarget >= 12,
      // Share of the annual quota the projection reaches; null without one.
      projectedAttainment: projection ? projection.revenue / annualTarget.revenue : null,
      ytdAttainment: currentYtd ? currentYtd.revenue / annualTarget.revenue : null,
    }
    : null

  const variations = (set) => ({
    vsPreviousYear: variationSet(set.current, set.previousYear, costVisible),
    vsTwoYearsBack: variationSet(set.current, set.twoYearsBack, costVisible),
  })

  const projectionWindow = projection
    ? {
      revenue: projection.revenue,
      grossProfit: projection.grossProfit,
      grossMargin: projection.grossMargin,
      customers: null,
      products: null,
    }
    : null

  return {
    available: true,
    currentYear,
    closed: plan.closed,
    description: plan.description,
    // CAL-001: years without a calendar are counted Monday to Friday.
    calendarMissingYears: plan.calendarMissingYears ?? [],
    holidaysExcluded: plan.holidaysExcluded ?? false,
    costHidden: !costVisible,
    monthly: {
      current: strip(monthly.current),
      previousYear: strip(monthly.previousYear),
      twoYearsBack: strip(monthly.twoYearsBack),
      variations: variations(monthly),
    },
    ytd: {
      current: strip(ytd.current),
      previousYear: strip(ytd.previousYear),
      twoYearsBack: strip(ytd.twoYearsBack),
      variations: variations(ytd),
    },
    annual: {
      projection,
      previousYear: strip(fullYears.previousYear),
      twoYearsBack: strip(fullYears.twoYearsBack),
      target,
      projectionVariations: {
        vsPreviousYear: variationSet(projectionWindow, fullYears.previousYear, costVisible),
        vsTwoYearsBack: variationSet(projectionWindow, fullYears.twoYearsBack, costVisible),
      },
    },
  }
}

// -- Month against month (MD-001 windows) -----------------------------------

/** One side of the month against month comparison. */
function monthSide(metrics, costVisible, from, to, calendar) {
  const revenue = metrics?.revenue ?? 0
  const grossProfit = metrics?.grossProfit ?? 0

  return {
    dateFrom: from,
    dateTo: to,
    workingDays: weekdaysBetween(from, to, calendar),
    revenue,
    grossProfit: costVisible ? grossProfit : null,
    grossMargin: costVisible ? margin(revenue, grossProfit) : null,
    quantity: metrics?.quantity ?? 0,
    documents: metrics?.documents ?? 0,
    customers: metrics?.customers ?? 0,
    products: metrics?.products ?? 0,
  }
}

/**
 * Selected month against the previous one at the equivalent working day, with
 * the MD-001 windows (resolvePeriodWindow): revenue, gross profit, margin,
 * customers, products and documents.
 */
export function assembleMonthComparison(window, current, previous, costVisible = true, calendar = EMPTY_CALENDAR) {
  if (!window.comparison) {
    return {
      available: false,
      periodStatus: window.periodStatus,
      calendarMissingYears: window.calendarMissingYears ?? [],
      costHidden: !costVisible,
    }
  }

  const { comparison } = window
  const now = monthSide(current, costVisible, comparison.currentFrom, comparison.currentTo, calendar)
  const before = monthSide(previous, costVisible, comparison.previousFrom, comparison.previousTo, calendar)

  return {
    available: true,
    basis: comparison.basis,
    periodStatus: window.periodStatus,
    holidaysExcluded: comparison.holidaysExcluded,
    // CAL-001: years without a calendar are counted Monday to Friday.
    calendarMissingYears: window.calendarMissingYears ?? [],
    costHidden: !costVisible,
    current: now,
    previous: before,
    variations: {
      revenue: { amount: now.revenue - before.revenue, percentage: variationPercentage(now.revenue, before.revenue) },
      grossProfit: costVisible
        ? { amount: now.grossProfit - before.grossProfit, percentage: variationPercentage(now.grossProfit, before.grossProfit) }
        : { amount: null, percentage: null },
      grossMarginPoints: costVisible && isNumber(now.grossMargin) && isNumber(before.grossMargin)
        ? (now.grossMargin - before.grossMargin) * 100
        : null,
      customers: { amount: now.customers - before.customers, percentage: variationPercentage(now.customers, before.customers) },
      products: { amount: now.products - before.products, percentage: variationPercentage(now.products, before.products) },
      documents: { amount: now.documents - before.documents, percentage: variationPercentage(now.documents, before.documents) },
    },
  }
}

// -- Monthly series ----------------------------------------------------------

/**
 * Monthly series of `months` months ending at endPeriod, oldest first. A month
 * without sales is missing data: hasSales false and null values (never 0).
 */
export function buildMonthlySeries({
  endPeriod,
  months = BRAND_RULES.seriesMonths,
  metricRows,
  targetRows,
  cutoff,
  costVisible = true,
}) {
  const metrics = new Map(metricRows.map((row) => [row.periodId, row]))
  const targets = new Map(targetRows.map((row) => [row.periodId, row]))
  const cutoffMonth = cutoff ? cutoff.slice(0, 7) : null
  const cutoffOpen = Boolean(cutoff) && cutoff < monthEnd(cutoff.slice(0, 7))

  return Array.from({ length: months }, (_, index) => {
    const period = shiftMonth(endPeriod, index - months + 1)
    const row = metrics.get(period) ?? null
    const target = targets.get(period) ?? null

    return {
      periodId: period,
      hasSales: row !== null,
      // The cutoff month is month to date while the month is open.
      partial: period === cutoffMonth && cutoffOpen,
      revenue: row ? row.revenue : null,
      grossProfit: row && costVisible ? row.grossProfit : null,
      grossMargin: row && costVisible ? row.grossMargin : null,
      customers: row ? row.customers : null,
      products: row ? row.products : null,
      documents: row ? row.documents : null,
      quantity: row ? row.quantity : null,
      target: target
        ? {
          revenue: target.revenue,
          grossProfit: costVisible ? target.grossProfit : null,
          grossMargin: costVisible ? target.grossMargin : null,
        }
        : null,
      attainment: row && target && target.revenue > 0 ? row.revenue / target.revenue : null,
    }
  })
}

// -- Cost visibility ---------------------------------------------------------

/**
 * MB-001C: cost visibility of a portfolio. brandKeys = the included brands;
 * null = all the sales (needs cost access to every brand). Visible only when
 * the user has cost access to EVERY included brand.
 */
export function costVisibleForPortfolio(costScope, brandKeys) {
  if (costScope?.mode === 'all') {
    return true
  }

  return costScope?.mode === 'assigned' &&
    Array.isArray(costScope.brandKeys) &&
    Array.isArray(brandKeys) &&
    brandKeys.length > 0 &&
    brandKeys.every((key) => costScope.brandKeys.includes(key))
}

/**
 * Gross profit and margin reveal the cost. With a cost scope (resolveCostScope
 * of SEC-003A): all brands, only the assigned ones, or none.
 */
export function costVisibleForBrand(costScope, brandKey) {
  if (costScope?.mode === 'all') {
    return true
  }

  return costScope?.mode === 'assigned' &&
    Array.isArray(costScope.brandKeys) &&
    costScope.brandKeys.includes(brandKey)
}
