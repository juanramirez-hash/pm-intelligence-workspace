// MD-001 "Mi día": SQL reads. Every brand list and date travels as a query
// parameter. Sales windows filter sale_date first (indexed) and then
// brand_key(brand), like /api/metrics/brands/:brand/comparison.

import {
  lossWindow,
} from './metricPeriods.js'

import {
  normalizeBrandKey,
} from '../middleware/requireBrandScope.js'

function toNumber(value) {
  if (value === null || value === undefined) {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

function toCount(value) {
  return toNumber(value) ?? 0
}

export async function loadDataCutoff(pool) {
  const result = await pool.query(
    'SELECT MAX(sale_date)::TEXT AS cutoff FROM sales_facts',
  )

  return result.rows[0]?.cutoff ?? null
}

/**
 * Brands for a user with scope 'all' and no assignments: every brand with
 * sales or target in the period or the previous one.
 */
export async function loadActiveBrandKeys(pool, period, previousPeriod) {
  const result = await pool.query(
    `SELECT brand_key FROM brand_period_metrics
       WHERE period_id = ANY($1::TEXT[])
     UNION
     SELECT brand_key(brand_id) AS brand_key FROM brand_targets
       WHERE period_id = ANY($1::TEXT[])
     ORDER BY brand_key`,
    [[period, previousPeriod]],
  )

  return result.rows
    .map((row) => row.brand_key)
    .filter((key) => typeof key === 'string' && key !== '')
}

/** Latest label per brand; brands without sales keep their key. */
export async function loadBrandLabels(pool, brandKeys) {
  const result = await pool.query(
    `SELECT DISTINCT ON (brand_key) brand_key, brand_label
       FROM brand_period_metrics
      WHERE brand_key = ANY($1::TEXT[])
      ORDER BY brand_key, period_id DESC`,
    [brandKeys],
  )

  return new Map(
    result.rows.map((row) => [row.brand_key, row.brand_label]),
  )
}

function toMetrics(row) {
  return {
    revenue: toCount(row.revenue),
    grossProfit: toCount(row.gross_profit),
    quantity: toCount(row.quantity),
    documents: toCount(row.documents),
    customers: toCount(row.customers),
    products: toCount(row.products),
  }
}

/** Sales by brand in the current and previous windows. */
export async function loadWindowMetrics(pool, brandKeys, comparison) {
  const result = await pool.query(
    `WITH windows(label, date_from, date_to) AS (
       VALUES ('current', $1::DATE, $2::DATE), ('previous', $3::DATE, $4::DATE)
     )
     SELECT w.label,
            brand_key(f.brand) AS brand_key,
            COALESCE(SUM(f.revenue), 0) AS revenue,
            COALESCE(SUM(f.gross_profit), 0) AS gross_profit,
            COALESCE(SUM(f.quantity), 0) AS quantity,
            COUNT(DISTINCT NULLIF(f.document_number, '')) AS documents,
            COUNT(DISTINCT NULLIF(f.customer_id, '')) AS customers,
            COUNT(DISTINCT NULLIF(UPPER(BTRIM(f.product_name)), '')) AS products
       FROM windows w
       JOIN sales_facts f
         ON f.sale_date BETWEEN w.date_from AND w.date_to
      WHERE brand_key(f.brand) = ANY($5::TEXT[])
      GROUP BY w.label, brand_key(f.brand)`,
    [
      comparison.currentFrom,
      comparison.currentTo,
      comparison.previousFrom,
      comparison.previousTo,
      brandKeys,
    ],
  )

  const current = new Map()
  const previous = new Map()

  for (const row of result.rows) {
    ;(row.label === 'current' ? current : previous).set(
      row.brand_key,
      toMetrics(row),
    )
  }

  return { current, previous }
}

/** Latest stored target per brand, like brand_period_scorecard. */
export async function loadTargets(pool, brandKeys, period) {
  const result = await pool.query(
    `SELECT DISTINCT ON (brand_key(brand_id))
            brand_key(brand_id) AS brand_key,
            target_revenue, target_gross_profit, target_gross_margin, working_days
       FROM brand_targets
      WHERE period_id = $1 AND brand_key(brand_id) = ANY($2::TEXT[])
      ORDER BY brand_key(brand_id), updated_at DESC, id DESC`,
    [period, brandKeys],
  )

  return new Map(
    result.rows.map((row) => [
      row.brand_key,
      {
        revenue: toNumber(row.target_revenue),
        grossProfit: toNumber(row.target_gross_profit),
        grossMargin: toNumber(row.target_gross_margin),
        workingDays: toNumber(row.working_days),
      },
    ]),
  )
}

/** Brands with activity before the previous period (new vs recovered). */
export async function loadActiveBeforePrevious(pool, brandKeys, previousPeriod) {
  const result = await pool.query(
    `SELECT DISTINCT brand_key
       FROM brand_period_metrics
      WHERE brand_key = ANY($1::TEXT[])
        AND period_id < $2
        AND (COALESCE(revenue, 0) <> 0 OR COALESCE(gross_profit, 0) <> 0
          OR COALESCE(quantity, 0) <> 0 OR COALESCE(documents, 0) > 0)`,
    [brandKeys, previousPeriod],
  )

  return new Set(result.rows.map((row) => row.brand_key))
}

// Same rule as /api/metrics/brands/:brand/lost-customers, for several brands:
// one row per brand and customer.
const LOST_CUSTOMERS_SQL = `
  SELECT m.brand_key, m.customer_id, MIN(m.customer_name) AS customer_name,
         SUM(m.revenue) AS base_revenue, SUM(m.gross_profit) AS base_gross_profit,
         COUNT(DISTINCT m.period_id) AS active_months,
         MAX(m.last_sale_date)::TEXT AS last_sale_date,
         ROUND(SUM(m.revenue) / NULLIF(COUNT(DISTINCT m.period_id), 0), 2) AS avg_monthly_revenue
    FROM brand_customer_period_metrics m
   WHERE m.brand_key = ANY($1::TEXT[]) AND m.period_id BETWEEN $2 AND $3
     AND NOT EXISTS (
       SELECT 1 FROM brand_customer_period_metrics r
        WHERE r.brand_key = m.brand_key AND r.customer_id = m.customer_id
          AND r.period_id BETWEEN $4 AND $5)
   GROUP BY m.brand_key, m.customer_id
  HAVING SUM(m.revenue) > 0`

export function resolveLossWindow(period, cutoff, inactivePeriods, basePeriods) {
  return cutoff
    ? lossWindow(period, cutoff, inactivePeriods, basePeriods)
    : null
}

export async function countLostCustomers(pool, brandKeys, window) {
  const result = await pool.query(
    `SELECT brand_key, COUNT(*) AS customers FROM (${LOST_CUSTOMERS_SQL}) lost
      GROUP BY brand_key`,
    [brandKeys, window.baseFrom, window.baseTo, window.inactiveFrom, window.inactiveTo],
  )

  return new Map(
    result.rows.map((row) => [row.brand_key, toCount(row.customers)]),
  )
}

export async function loadLostCustomers(pool, brandKeys, window, { limit, offset }) {
  const result = await pool.query(
    `${LOST_CUSTOMERS_SQL}
     ORDER BY base_revenue DESC, m.brand_key, m.customer_id
     LIMIT $6 OFFSET $7`,
    [
      brandKeys,
      window.baseFrom,
      window.baseTo,
      window.inactiveFrom,
      window.inactiveTo,
      limit + 1,
      offset,
    ],
  )

  return {
    hasMore: result.rows.length > limit,
    rows: result.rows.slice(0, limit).map((row) => ({
      brandKey: row.brand_key,
      customerId: row.customer_id,
      customerName: row.customer_name,
      baseRevenue: toNumber(row.base_revenue),
      baseGrossProfit: toNumber(row.base_gross_profit),
      activeMonths: toCount(row.active_months),
      lastSaleDate: row.last_sale_date,
      avgMonthlyRevenue: toNumber(row.avg_monthly_revenue),
    })),
  }
}

/**
 * Labels for the user's brands: the latest sales label, then the assignment
 * text, then the key.
 */
export function labelBrands(brandKeys, labels, assignedNames = []) {
  const assigned = new Map(
    assignedNames
      .map((name) => [normalizeBrandKey(name), name])
      .filter(([key]) => key !== null),
  )

  return brandKeys.map((brandKey) => ({
    brandKey,
    brandLabel: labels.get(brandKey) ?? assigned.get(brandKey) ?? brandKey,
  }))
}
