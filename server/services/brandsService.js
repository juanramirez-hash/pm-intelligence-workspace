// MB-001 brand page: SQL reads. Every brand, date and filter travels as a
// query parameter. Each query is built by a function that returns
// { sql, params } so server/scripts/explainBrandQueries.js can measure the
// very same statements with EXPLAIN ANALYZE.

import {
  itemKeySql,
} from './myDayAvailabilityService.js'

import {
  monthEnd,
} from './metricPeriods.js'

function toNumber(value) {
  if (value === null || value === undefined) {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

const toCount = (value) => toNumber(value) ?? 0
const toDate = (value) => (value === null || value === undefined ? null : String(value).slice(0, 10))

// -- Identity ----------------------------------------------------------------

/**
 * A brand is known when it has sales, a target, an assignment or products.
 * Its label is the latest sales label (same source as "Mi día"), then the
 * target, then the product master name.
 */
export function brandIdentityQuery(brandKey) {
  return {
    sql: `SELECT
            (EXISTS (SELECT 1 FROM brand_period_metrics WHERE brand_key = $1)
             OR EXISTS (SELECT 1 FROM brand_targets WHERE brand_key(brand_id) = $1)
             OR EXISTS (SELECT 1 FROM app_user_brand_assignments WHERE brand_key(brand_id) = $1)
             OR EXISTS (SELECT 1 FROM products WHERE brand_key(brand) = $1)) AS known,
            COALESCE(
              (SELECT brand_label FROM brand_period_metrics
                WHERE brand_key = $1 ORDER BY period_id DESC LIMIT 1),
              (SELECT BTRIM(brand_id) FROM brand_targets
                WHERE brand_key(brand_id) = $1 ORDER BY period_id DESC LIMIT 1),
              (SELECT BTRIM(brand_id) FROM app_user_brand_assignments
                WHERE brand_key(brand_id) = $1 LIMIT 1),
              (SELECT BTRIM(brand) FROM products
                WHERE brand_key(brand) = $1 AND NULLIF(BTRIM(brand), '') IS NOT NULL LIMIT 1)
            ) AS label,
            (SELECT MIN(first_sale_date)::TEXT FROM brand_period_metrics WHERE brand_key = $1) AS first_sale_date,
            (SELECT MAX(last_sale_date)::TEXT FROM brand_period_metrics WHERE brand_key = $1) AS last_sale_date`,
    params: [brandKey],
  }
}

export async function loadBrandIdentity(pool, brandKey) {
  const { sql, params } = brandIdentityQuery(brandKey)
  const row = (await pool.query(sql, params)).rows[0] ?? {}

  return {
    known: row.known === true,
    label: row.label ?? brandKey,
    firstSaleDate: toDate(row.first_sale_date),
    lastSaleDate: toDate(row.last_sale_date),
  }
}

/** Active PMs of the brand and the assistants that see it (own or inherited). */
export function brandTeamQueries(brandKey) {
  return {
    pms: {
      sql: `SELECT DISTINCT u.id, COALESCE(NULLIF(BTRIM(u.name), ''), u.email) AS name
              FROM app_user_brand_assignments a
              JOIN app_users u ON u.id = a.user_id AND u.active = TRUE AND u.role = 'pm'
             WHERE brand_key(a.brand_id) = $1
             ORDER BY name`,
      params: [brandKey],
    },
    assistants: {
      sql: `SELECT DISTINCT u.id, COALESCE(NULLIF(BTRIM(u.name), ''), u.email) AS name
              FROM app_users u
             WHERE u.active = TRUE AND u.role = 'assistant'
               AND (
                 EXISTS (
                   SELECT 1 FROM app_user_brand_assignments own
                    WHERE own.user_id = u.id AND brand_key(own.brand_id) = $1)
                 OR EXISTS (
                   SELECT 1
                     FROM app_user_pm_links l
                     JOIN app_users pm ON pm.id = l.pm_user_id AND pm.active = TRUE AND pm.role = 'pm'
                     JOIN app_user_brand_assignments pa ON pa.user_id = pm.id
                    WHERE l.assistant_user_id = u.id AND brand_key(pa.brand_id) = $1)
               )
             ORDER BY name`,
      params: [brandKey],
    },
  }
}

export async function loadBrandTeam(pool, brandKey) {
  const queries = brandTeamQueries(brandKey)
  const [pms, assistants] = await Promise.all([
    pool.query(queries.pms.sql, queries.pms.params),
    pool.query(queries.assistants.sql, queries.assistants.params),
  ])
  const people = (result) => result.rows.map((row) => ({ id: Number(row.id), name: row.name }))

  return { pms: people(pms), assistants: people(assistants) }
}

// -- Directory ---------------------------------------------------------------

/** Every brand with sales or a target: the directory of a team-wide user. */
export function allBrandKeysQuery() {
  return {
    sql: `SELECT brand_key FROM brand_period_metrics
          UNION
          SELECT brand_key(brand_id) AS brand_key FROM brand_targets
          ORDER BY brand_key`,
    params: [],
  }
}

export async function loadAllBrandKeys(pool) {
  const { sql, params } = allBrandKeysQuery()

  return (await pool.query(sql, params)).rows
    .map((row) => row.brand_key)
    .filter((key) => typeof key === 'string' && key !== '')
}

export function brandSalesDatesQuery(brandKeys) {
  return {
    sql: `SELECT brand_key,
                 MIN(first_sale_date)::TEXT AS first_sale_date,
                 MAX(last_sale_date)::TEXT AS last_sale_date
            FROM brand_period_metrics
           WHERE brand_key = ANY($1::TEXT[])
           GROUP BY brand_key`,
    params: [brandKeys],
  }
}

export async function loadBrandSalesDates(pool, brandKeys) {
  const { sql, params } = brandSalesDatesQuery(brandKeys)

  return new Map(
    (await pool.query(sql, params)).rows.map((row) => [
      row.brand_key,
      { firstSaleDate: toDate(row.first_sale_date), lastSaleDate: toDate(row.last_sale_date) },
    ]),
  )
}

// -- Sales: year over year ---------------------------------------------------

/**
 * One row per window (key) with its sums, zeros and row_count 0 when the
 * sales are empty there. MB-001C ("alternativa C"):
 *
 * - One read of sales_facts (scoped): the brand filter and the range from the
 *   oldest window start to the newest window end.
 * - Amounts (revenue, gross profit, quantity, rows): SUM / COUNT with FILTER
 *   per window, in one aggregate over the scope.
 * - Distinct documents, customers and products: no COUNT(DISTINCT) (each one
 *   sorts its own rows). Each key is grouped once (hash) with one BOOL_OR flag
 *   per window (did the key sell inside that window?) and the flags are
 *   counted. Same result as COUNT(DISTINCT key) FILTER (WHERE window): a key
 *   counts in a window if and only if one of its rows falls inside it.
 */
function yearWindowsStatement(windows, brandCondition, leadingParams) {
  const params = [...leadingParams]
  const refs = windows.map((window) => {
    params.push(window.key, window.dateFrom, window.dateTo)
    const base = params.length

    return { key: `$${base - 2}::TEXT`, from: `$${base - 1}::DATE`, to: `$${base}::DATE` }
  })
  const between = (ref) => `sale_date BETWEEN ${ref.from} AND ${ref.to}`
  const amounts = refs.flatMap((ref, index) => [
    `SUM(revenue) FILTER (WHERE ${between(ref)}) AS revenue_${index}`,
    `SUM(gross_profit) FILTER (WHERE ${between(ref)}) AS gross_profit_${index}`,
    `SUM(quantity) FILTER (WHERE ${between(ref)}) AS quantity_${index}`,
    `COUNT(*) FILTER (WHERE ${between(ref)}) AS row_count_${index}`,
  ])
  const flags = refs.map((ref, index) => `BOOL_OR(${between(ref)}) AS w${index}`).join(', ')
  const counted = (alias) => refs
    .map((_ref, index) => `COUNT(*) FILTER (WHERE w${index}) AS ${alias}_${index}`)
    .join(', ')
  const distinctCounts = (name, alias, column) => `${name} AS (
            SELECT ${counted(alias)}
              FROM (SELECT ${flags}
                      FROM scoped
                     WHERE ${column} IS NOT NULL
                     GROUP BY ${column}) grouped
          )`
  const rows = refs.map((ref, index) =>
    `(${ref.key}, COALESCE(a.revenue_${index}, 0), COALESCE(a.gross_profit_${index}, 0), ` +
    `COALESCE(a.quantity_${index}, 0), d.documents_${index}, c.customers_${index}, ` +
    `p.products_${index}, a.row_count_${index})`,
  )
  const where = brandCondition
    ? `WHERE ${brandCondition}
               AND f.sale_date BETWEEN`
    : 'WHERE f.sale_date BETWEEN'

  return {
    sql: `WITH scoped AS (
            SELECT f.sale_date, f.revenue, f.gross_profit, f.quantity,
                   NULLIF(f.document_number, '') AS document_key,
                   NULLIF(f.customer_id, '') AS customer_key,
                   NULLIF(UPPER(BTRIM(f.product_name)), '') AS product_key
              FROM sales_facts f
             ${where} LEAST(${refs.map((ref) => ref.from).join(', ')})
                                     AND GREATEST(${refs.map((ref) => ref.to).join(', ')})
          ),
          amounts AS (
            SELECT ${amounts.join(', ')}
              FROM scoped
          ),
          ${distinctCounts('doc_counts', 'documents', 'document_key')},
          ${distinctCounts('customer_counts', 'customers', 'customer_key')},
          ${distinctCounts('product_counts', 'products', 'product_key')}
          SELECT t.key, t.revenue, t.gross_profit, t.quantity, t.documents,
                 t.customers, t.products, t.row_count
            FROM amounts a
           CROSS JOIN doc_counts d
           CROSS JOIN customer_counts c
           CROSS JOIN product_counts p
           CROSS JOIN LATERAL (VALUES ${rows.join(', ')})
                 AS t(key, revenue, gross_profit, quantity, documents, customers, products, row_count)`,
    params,
  }
}

/** A brand: brand_key(f.brand) = $1 (the index of migration 042). */
export function yearWindowsQuery(brandKey, windows) {
  return yearWindowsStatement(windows, 'brand_key(f.brand) = $1', [brandKey])
}

/**
 * MB-001C: the same windows for a portfolio. brandKeys = the brands of the user
 * (brand_key(f.brand) = ANY($1)); null = all the sales, with no brand filter
 * (brands without a PM included). Same statement, so the same rules.
 */
export function portfolioYearWindowsQuery(brandKeys, windows) {
  return brandKeys === null
    ? yearWindowsStatement(windows, null, [])
    : yearWindowsStatement(windows, 'brand_key(f.brand) = ANY($1::TEXT[])', [brandKeys])
}

function mapYearWindows(rows) {
  return new Map(
    rows.map((row) => [
      row.key,
      {
        revenue: toCount(row.revenue),
        grossProfit: toCount(row.gross_profit),
        quantity: toCount(row.quantity),
        documents: toCount(row.documents),
        customers: toCount(row.customers),
        products: toCount(row.products),
        rowCount: toCount(row.row_count),
      },
    ]),
  )
}

export async function loadYearWindows(pool, brandKey, windows) {
  const { sql, params } = yearWindowsQuery(brandKey, windows)

  return mapYearWindows((await pool.query(sql, params)).rows)
}

/** brandKeys = list of brands, or null for all the sales. */
export async function loadPortfolioYearWindows(pool, brandKeys, windows) {
  const { sql, params } = portfolioYearWindowsQuery(brandKeys, windows)

  return mapYearWindows((await pool.query(sql, params)).rows)
}

// -- Sales: monthly series and targets ---------------------------------------

export function monthlySeriesQuery(brandKey, fromPeriod, toPeriod) {
  return {
    sql: `SELECT period_id, revenue, gross_profit, gross_margin, quantity,
                 active_customers, active_products, documents
            FROM brand_period_metrics
           WHERE brand_key = $1 AND period_id BETWEEN $2 AND $3
           ORDER BY period_id`,
    params: [brandKey, fromPeriod, toPeriod],
  }
}

export async function loadMonthlySeriesRows(pool, brandKey, fromPeriod, toPeriod) {
  const { sql, params } = monthlySeriesQuery(brandKey, fromPeriod, toPeriod)

  return (await pool.query(sql, params)).rows.map((row) => ({
    periodId: row.period_id,
    revenue: toCount(row.revenue),
    grossProfit: toCount(row.gross_profit),
    grossMargin: toNumber(row.gross_margin),
    quantity: toCount(row.quantity),
    customers: toCount(row.active_customers),
    products: toCount(row.active_products),
    documents: toCount(row.documents),
  }))
}

/** Latest stored target per period, like brand_period_scorecard. */
export function targetsRangeQuery(brandKey, fromPeriod, toPeriod) {
  return {
    sql: `SELECT DISTINCT ON (period_id)
                 period_id, target_revenue, target_gross_profit, target_gross_margin
            FROM brand_targets
           WHERE brand_key(brand_id) = $1 AND period_id BETWEEN $2 AND $3
           ORDER BY period_id, updated_at DESC, id DESC`,
    params: [brandKey, fromPeriod, toPeriod],
  }
}

export async function loadTargetsRange(pool, brandKey, fromPeriod, toPeriod) {
  const { sql, params } = targetsRangeQuery(brandKey, fromPeriod, toPeriod)

  return (await pool.query(sql, params)).rows.map((row) => ({
    periodId: row.period_id,
    revenue: toNumber(row.target_revenue),
    grossProfit: toNumber(row.target_gross_profit),
    grossMargin: toNumber(row.target_gross_margin),
  }))
}

/**
 * MB-001C: monthly quota of a portfolio = the latest stored target of each
 * brand and month (like brand_period_scorecard), summed by month. brandKeys
 * null = every target loaded (brands without sales included).
 */
export function portfolioTargetsRangeQuery(brandKeys, fromPeriod, toPeriod) {
  const params = [fromPeriod, toPeriod]
  const brandFilter = brandKeys === null ? '' : ' AND brand_key(brand_id) = ANY($3::TEXT[])'

  if (brandKeys !== null) {
    params.push(brandKeys)
  }

  return {
    sql: `SELECT period_id, SUM(target_revenue) AS target_revenue,
                 SUM(target_gross_profit) AS target_gross_profit
            FROM (
              SELECT DISTINCT ON (period_id, brand_key(brand_id))
                     period_id, target_revenue, target_gross_profit
                FROM brand_targets
               WHERE period_id BETWEEN $1 AND $2${brandFilter}
               ORDER BY period_id, brand_key(brand_id), updated_at DESC, id DESC
            ) latest
           GROUP BY period_id
           ORDER BY period_id`,
    params,
  }
}

export async function loadPortfolioTargetsRange(pool, brandKeys, fromPeriod, toPeriod) {
  const { sql, params } = portfolioTargetsRangeQuery(brandKeys, fromPeriod, toPeriod)

  return (await pool.query(sql, params)).rows.map((row) => ({
    periodId: row.period_id,
    revenue: toNumber(row.target_revenue),
    grossProfit: toNumber(row.target_gross_profit),
    grossMargin: null,
  }))
}

/** Annual quota: the registered monthly targets of the year, summed. */
export function annualTargetFrom(targetRows, year) {
  const months = targetRows.filter(
    (row) => row.periodId.startsWith(`${year}-`) && row.revenue !== null,
  )

  return months.length === 0
    ? null
    : {
      revenue: months.reduce((total, row) => total + row.revenue, 0),
      // Distinct months with a quota: a month repeated in the rows counts once.
      monthsWithTarget: new Set(months.map((row) => row.periodId)).size,
    }
}

// -- Sales: documents ---------------------------------------------------------

// Lines without a document number are grouped by date and customer.
const DOCUMENT_GROUP = `COALESCE(
  NULLIF(f.document_number, ''),
  'SIN-DOC:' || f.sale_date::TEXT || ':' || COALESCE(NULLIF(f.customer_id, ''), ''))`

export function documentsQuery(brandKey, from, to, limit, offset) {
  return {
    sql: `SELECT ${DOCUMENT_GROUP} AS document_key,
                 MIN(NULLIF(f.document_number, '')) AS document_number,
                 MIN(f.sale_date)::TEXT AS sale_date,
                 MIN(NULLIF(f.customer_id, '')) AS customer_id,
                 MIN(NULLIF(f.customer_name, '')) AS customer_name,
                 MIN(NULLIF(f.sales_rep, '')) AS sales_rep,
                 MIN(NULLIF(f.location, '')) AS location,
                 COUNT(*) AS lines,
                 SUM(f.quantity) AS quantity,
                 SUM(f.revenue) AS revenue,
                 SUM(f.gross_profit) AS gross_profit
            FROM sales_facts f
           WHERE brand_key(f.brand) = $1 AND f.sale_date BETWEEN $2::DATE AND $3::DATE
           GROUP BY ${DOCUMENT_GROUP}
           ORDER BY MIN(f.sale_date) DESC, document_key
           LIMIT $4 OFFSET $5`,
    params: [brandKey, from, to, limit + 1, offset],
  }
}

export function documentTotalsQuery(brandKey, from, to) {
  return {
    sql: `SELECT COUNT(DISTINCT ${DOCUMENT_GROUP}) AS documents, COUNT(*) AS lines,
                 COALESCE(SUM(f.revenue), 0) AS revenue,
                 COALESCE(SUM(f.gross_profit), 0) AS gross_profit
            FROM sales_facts f
           WHERE brand_key(f.brand) = $1 AND f.sale_date BETWEEN $2::DATE AND $3::DATE`,
    params: [brandKey, from, to],
  }
}

export async function loadDocuments(pool, brandKey, from, to, { limit, offset }) {
  const rows = documentsQuery(brandKey, from, to, limit, offset)
  const totals = documentTotalsQuery(brandKey, from, to)
  const [page, summary] = await Promise.all([
    pool.query(rows.sql, rows.params),
    pool.query(totals.sql, totals.params),
  ])
  const total = summary.rows[0] ?? {}

  return {
    total: toCount(total.documents),
    lines: toCount(total.lines),
    revenue: toCount(total.revenue),
    grossProfit: toCount(total.gross_profit),
    hasMore: page.rows.length > limit,
    rows: page.rows.slice(0, limit).map((row) => ({
      documentNumber: row.document_number ?? null,
      saleDate: toDate(row.sale_date),
      customerId: row.customer_id ?? null,
      customerName: row.customer_name ?? null,
      salesRep: row.sales_rep ?? null,
      location: row.location ?? null,
      lines: toCount(row.lines),
      quantity: toCount(row.quantity),
      revenue: toCount(row.revenue),
      grossProfit: toCount(row.gross_profit),
    })),
  }
}

/** Lines of the period for "Exportar detalle" (one more than the maximum). */
export function exportLinesQuery(brandKey, from, to, maxRows) {
  return {
    sql: `SELECT f.sale_date::TEXT AS sale_date, f.document_number, f.customer_id,
                 f.customer_name, f.sales_rep, f.location, f.product_name, f.model,
                 f.quantity, f.revenue, f.gross_profit
            FROM sales_facts f
           WHERE brand_key(f.brand) = $1 AND f.sale_date BETWEEN $2::DATE AND $3::DATE
           ORDER BY f.sale_date, f.document_number, f.product_name
           LIMIT $4`,
    params: [brandKey, from, to, maxRows + 1],
  }
}

export async function loadExportLines(pool, brandKey, from, to, maxRows) {
  const { sql, params } = exportLinesQuery(brandKey, from, to, maxRows)
  const result = await pool.query(sql, params)

  return {
    truncated: result.rows.length > maxRows,
    rows: result.rows.slice(0, maxRows).map((row) => ({
      saleDate: toDate(row.sale_date),
      documentNumber: row.document_number ?? null,
      customerId: row.customer_id ?? null,
      customerName: row.customer_name ?? null,
      salesRep: row.sales_rep ?? null,
      location: row.location ?? null,
      productCode: row.product_name ?? null,
      model: row.model ?? null,
      quantity: toCount(row.quantity),
      revenue: toCount(row.revenue),
      grossProfit: toCount(row.gross_profit),
    })),
  }
}

// -- Customers ---------------------------------------------------------------

// The selected window against the previous one (MD-001 windows), by customer.
const CUSTOMER_PER_CUSTOMER = `
  SELECT COALESCE(NULLIF(f.customer_id, ''), '') AS customer_id,
         MIN(NULLIF(f.customer_name, '')) AS customer_name,
         COALESCE(SUM(f.revenue) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE), 0) AS revenue,
         COALESCE(SUM(f.gross_profit) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE), 0) AS gross_profit,
         COUNT(DISTINCT NULLIF(f.document_number, '')) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE) AS documents,
         COUNT(*) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE) AS current_rows,
         COALESCE(SUM(f.revenue) FILTER (WHERE f.sale_date BETWEEN $4::DATE AND $5::DATE), 0) AS previous_revenue,
         COALESCE(SUM(f.gross_profit) FILTER (WHERE f.sale_date BETWEEN $4::DATE AND $5::DATE), 0) AS previous_gross_profit,
         MAX(f.sale_date)::TEXT AS last_sale_date
    FROM sales_facts f
   WHERE brand_key(f.brand) = $1 AND f.sale_date BETWEEN $4::DATE AND $3::DATE
   GROUP BY 1`

const CUSTOMER_FILTERS = Object.freeze({
  activos: { where: 'current_rows > 0', order: 'revenue DESC, customer_id' },
  suben: { where: 'revenue - previous_revenue > 0', order: '(revenue - previous_revenue) DESC, customer_id' },
  bajan: { where: 'revenue - previous_revenue < 0', order: '(revenue - previous_revenue) ASC, customer_id' },
})

export function customerRowsQuery(brandKey, comparison, filter, limit, offset) {
  const selected = CUSTOMER_FILTERS[filter]

  if (!selected) {
    throw new Error(`Filtro de clientes desconocido: ${filter}`)
  }

  return {
    sql: `WITH per_customer AS (${CUSTOMER_PER_CUSTOMER}),
               counted AS (
                 SELECT pc.*,
                        COUNT(*) FILTER (WHERE current_rows > 0) OVER () AS active_total,
                        COUNT(*) FILTER (WHERE revenue - previous_revenue > 0) OVER () AS rising_total,
                        COUNT(*) FILTER (WHERE revenue - previous_revenue < 0) OVER () AS falling_total
                   FROM per_customer pc)
          SELECT * FROM counted
           WHERE ${selected.where}
           ORDER BY ${selected.order}
           LIMIT $6 OFFSET $7`,
    params: [
      brandKey,
      comparison.currentFrom,
      comparison.currentTo,
      comparison.previousFrom,
      comparison.previousTo,
      limit + 1,
      offset,
    ],
  }
}

/** Counts of every filter, also when the selected filter has no rows. */
export function customerCountsQuery(brandKey, comparison) {
  return {
    sql: `WITH per_customer AS (${CUSTOMER_PER_CUSTOMER})
          SELECT COUNT(*) FILTER (WHERE current_rows > 0) AS active,
                 COUNT(*) FILTER (WHERE revenue - previous_revenue > 0) AS rising,
                 COUNT(*) FILTER (WHERE revenue - previous_revenue < 0) AS falling
            FROM per_customer`,
    params: [
      brandKey,
      comparison.currentFrom,
      comparison.currentTo,
      comparison.previousFrom,
      comparison.previousTo,
    ],
  }
}

export async function loadCustomerRows(pool, brandKey, comparison, filter, { limit, offset }) {
  const query = customerRowsQuery(brandKey, comparison, filter, limit, offset)
  const page = await pool.query(query.sql, query.params)
  let totals = page.rows[0]
    ? {
      active: page.rows[0].active_total,
      rising: page.rows[0].rising_total,
      falling: page.rows[0].falling_total,
    }
    : null

  // An empty page carries no counts: ask for them.
  if (!totals) {
    const counts = customerCountsQuery(brandKey, comparison)

    totals = (await pool.query(counts.sql, counts.params)).rows[0] ?? {}
  }

  return {
    counts: {
      activos: toCount(totals.active),
      suben: toCount(totals.rising),
      bajan: toCount(totals.falling),
    },
    hasMore: page.rows.length > limit,
    rows: page.rows.slice(0, limit).map((row) => ({
      customerId: row.customer_id === '' ? null : row.customer_id,
      customerName: row.customer_name ?? null,
      revenue: toCount(row.revenue),
      previousRevenue: toCount(row.previous_revenue),
      grossProfit: toCount(row.gross_profit),
      previousGrossProfit: toCount(row.previous_gross_profit),
      documents: toCount(row.documents),
      lastSaleDate: toDate(row.last_sale_date),
    })),
  }
}

// -- Products ----------------------------------------------------------------

const PRODUCT_PER_ITEM = `
  SELECT ${itemKeySql('f.product_name')} AS item_key,
         MIN(f.product_name) AS item_code,
         MAX(NULLIF(BTRIM(f.model), '')) AS model,
         COALESCE(SUM(f.quantity) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE), 0) AS quantity,
         COALESCE(SUM(f.revenue) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE), 0) AS revenue,
         COALESCE(SUM(f.gross_profit) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE), 0) AS gross_profit,
         COUNT(*) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE) AS current_rows,
         COALESCE(SUM(f.quantity) FILTER (WHERE f.sale_date BETWEEN $4::DATE AND $5::DATE), 0) AS previous_quantity,
         COALESCE(SUM(f.revenue) FILTER (WHERE f.sale_date BETWEEN $4::DATE AND $5::DATE), 0) AS previous_revenue,
         COALESCE(SUM(f.gross_profit) FILTER (WHERE f.sale_date BETWEEN $4::DATE AND $5::DATE), 0) AS previous_gross_profit
    FROM sales_facts f
   WHERE brand_key(f.brand) = $1
     AND f.sale_date BETWEEN $4::DATE AND $3::DATE
     AND NULLIF(BTRIM(f.product_name), '') IS NOT NULL
   GROUP BY 1`

export function productRowsQuery(brandKey, comparison, limit, offset) {
  return {
    sql: `WITH per_item AS (${PRODUCT_PER_ITEM})
          SELECT per_item.*, COUNT(*) FILTER (WHERE current_rows > 0) OVER () AS sold_total
            FROM per_item
           WHERE current_rows > 0
           ORDER BY revenue DESC, item_key
           LIMIT $6 OFFSET $7`,
    params: [
      brandKey,
      comparison.currentFrom,
      comparison.currentTo,
      comparison.previousFrom,
      comparison.previousTo,
      limit + 1,
      offset,
    ],
  }
}

export async function loadProductRows(pool, brandKey, comparison, { limit, offset }) {
  const { sql, params } = productRowsQuery(brandKey, comparison, limit, offset)
  const result = await pool.query(sql, params)

  return {
    soldTotal: toCount(result.rows[0]?.sold_total),
    hasMore: result.rows.length > limit,
    rows: result.rows.slice(0, limit).map((row) => ({
      itemKey: row.item_key,
      itemCode: row.item_code,
      model: row.model ?? null,
      quantity: toCount(row.quantity),
      previousQuantity: toCount(row.previous_quantity),
      revenue: toCount(row.revenue),
      previousRevenue: toCount(row.previous_revenue),
      grossProfit: toCount(row.gross_profit),
      previousGrossProfit: toCount(row.previous_gross_profit),
    })),
  }
}

/**
 * Products that sold in the base month and in none of the inactive months
 * (same loss window as the lost customers of "Mi día").
 */
export function lostProductsQuery(brandKey, window, limit, offset) {
  return {
    sql: `SELECT ${itemKeySql('f.product_name')} AS item_key,
                 MIN(f.product_name) AS item_code,
                 MAX(NULLIF(BTRIM(f.model), '')) AS model,
                 SUM(f.revenue) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE) AS base_revenue,
                 SUM(f.quantity) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE) AS base_quantity,
                 SUM(f.gross_profit) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE) AS base_gross_profit,
                 COUNT(*) OVER () AS lost_total
            FROM sales_facts f
           WHERE brand_key(f.brand) = $1
             AND f.sale_date BETWEEN $2::DATE AND $5::DATE
             AND NULLIF(BTRIM(f.product_name), '') IS NOT NULL
           GROUP BY 1
          HAVING SUM(f.revenue) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE) > 0
             AND COUNT(*) FILTER (WHERE f.sale_date BETWEEN $4::DATE AND $5::DATE) = 0
           ORDER BY base_revenue DESC, item_key
           LIMIT $6 OFFSET $7`,
    params: [
      brandKey,
      `${window.baseFrom}-01`,
      monthEnd(window.baseTo),
      `${window.inactiveFrom}-01`,
      monthEnd(window.inactiveTo),
      limit + 1,
      offset,
    ],
  }
}

export async function loadLostProducts(pool, brandKey, window, { limit, offset }) {
  const { sql, params } = lostProductsQuery(brandKey, window, limit, offset)
  const result = await pool.query(sql, params)

  return {
    total: toCount(result.rows[0]?.lost_total),
    hasMore: result.rows.length > limit,
    rows: result.rows.slice(0, limit).map((row) => ({
      itemKey: row.item_key,
      itemCode: row.item_code,
      model: row.model ?? null,
      baseRevenue: toCount(row.base_revenue),
      baseQuantity: toCount(row.base_quantity),
      baseGrossProfit: toCount(row.base_gross_profit),
    })),
  }
}

/** Stock and catalog status of the latest inventory import, by item. */
export function inventoryForItemsQuery(importId, itemKeys) {
  return {
    sql: `SELECT ${itemKeySql('item_code')} AS item_key,
                 SUM(on_hand) AS on_hand,
                 SUM(on_order) AS on_order,
                 MAX(UPPER(BTRIM(catalog_status))) AS catalog_status,
                 MAX(last_sale_date)::TEXT AS last_sale_date
            FROM inventory_items
           WHERE import_id = $1 AND ${itemKeySql('item_code')} = ANY($2::TEXT[])
           GROUP BY 1`,
    params: [importId, itemKeys],
  }
}

export async function loadInventoryForItems(pool, importId, itemKeys) {
  if (itemKeys.length === 0) {
    return new Map()
  }

  const { sql, params } = inventoryForItemsQuery(importId, itemKeys)

  return new Map(
    (await pool.query(sql, params)).rows.map((row) => [
      row.item_key,
      {
        onHand: toNumber(row.on_hand),
        pendingReceiptUnits: toNumber(row.on_order),
        catalogStatus: row.catalog_status ?? null,
        lastSaleDate: toDate(row.last_sale_date),
      },
    ]),
  )
}
