// MB-001: prints a psql script that measures with EXPLAIN (ANALYZE, BUFFERS)
// the very same SQL the brand endpoints run. It only prints SQL: it does not
// connect to any database. The script is read only (BEGIN READ ONLY ...
// ROLLBACK).
//
// Usage (from the repository, on the server):
//   node server/scripts/explainBrandQueries.js --cutoff=2026-11-24 BELDEN UNVUNIVIEW > /tmp/explain.sql
//   sudo -u postgres psql -d pm_intelligence_db -P pager=off -f /tmp/explain.sql
//
// --cutoff=YYYY-MM-DD   data cutoff (MAX(sale_date)); the period is its month
// --period=YYYY-MM      month to measure (default: the cutoff month)
// --portfolio-mine=A,B,C  MB-001C: the 8 year windows of a portfolio of brands
//                         ("Mis marcas" of a PM, for example 6 brands)
// --portfolio-all       MB-001C: the 8 year windows of ALL the sales, with no
//                         brand filter ("Todas")
// --compare           MB-001C: besides the EXPLAIN of the year windows, a block that
//                         compares the previous statement (COUNT(DISTINCT) per window)
//                         with the current one (BOOL_OR flags): EXCEPT in both
//                         directions for each brand, the portfolio of --portfolio-mine
//                         and --portfolio-all. Both must return 0 rows. Read only; the
//                         previous statement is slow on Todas (about 5 s).
// A portfolio does not need a brand in the command line.
// Brands: brand_key, name or any spelling the URL accepts.

import {
  normalizeBrandKey,
} from '../middleware/requireBrandScope.js'

import {
  BRAND_RULES,
  buildYearWindowPlan,
} from '../services/brandRules.js'

import {
  customerRowsQuery,
  documentTotalsQuery,
  documentsQuery,
  exportLinesQuery,
  lostProductsQuery,
  monthlySeriesQuery,
  portfolioTargetsRangeQuery,
  portfolioYearWindowsQuery,
  productRowsQuery,
  targetsRangeQuery,
  yearWindowsQuery,
} from '../services/brandsService.js'

import {
  lossWindow,
  monthEnd,
  shiftMonth,
} from '../services/metricPeriods.js'

import {
  resolvePeriodWindow,
} from '../services/myDayRules.js'

function literal(value) {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  if (Array.isArray(value)) {
    return `ARRAY[${value.map(literal).join(', ')}]::TEXT[]`
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return `'${String(value).replace(/'/g, "''")}'`
}

const args = process.argv.slice(2)
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1]
const brands = args
  .filter((arg) => !arg.startsWith('--'))
  .map((arg) => normalizeBrandKey(arg))
  .filter(Boolean)
const cutoff = option('cutoff')
const portfolioMine = (option('portfolio-mine') ?? '')
  .split(',')
  .map((name) => normalizeBrandKey(name))
  .filter(Boolean)
const portfolioAll = args.includes('--portfolio-all')
const compare = args.includes('--compare')
const portfolios = portfolioMine.length > 0 || portfolioAll

if (!cutoff || !/^\d{4}-\d{2}-\d{2}$/.test(cutoff) || (brands.length === 0 && !portfolios)) {
  console.error('Uso: node server/scripts/explainBrandQueries.js --cutoff=YYYY-MM-DD [--period=YYYY-MM] [--portfolio-mine=A,B,C] [--portfolio-all] [--compare] [MARCA...]')
  process.exit(1)
}

const period = option('period') ?? cutoff.slice(0, 7)
const window = resolvePeriodWindow(period, cutoff)
const plan = buildYearWindowPlan(period, cutoff)
const losses = lossWindow(period, cutoff, 2, 1)
const output = ['BEGIN READ ONLY;', '\\timing on']
let counter = 0

function measure(brand, name, query) {
  counter += 1
  output.push(
    `\\echo ''`,
    `\\echo '=== ${brand} · ${name} ==='`,
    `PREPARE q${counter} AS ${query.sql.replace(/\s+/g, ' ').trim()};`,
    `EXPLAIN (ANALYZE, BUFFERS) EXECUTE q${counter}(${query.params.map(literal).join(', ')});`,
    `DEALLOCATE q${counter};`,
  )
}

/**
 * The statement of the year windows BEFORE MB-001C (a COUNT(DISTINCT) FILTER per
 * window). Kept here only to compare results with --compare.
 */
function previousYearWindows(brandCondition, leadingParams) {
  const params = [...leadingParams]
  const refs = plan.windows.map((item) => {
    params.push(item.key, item.dateFrom, item.dateTo)
    const base = params.length

    return { key: '$' + (base - 2) + '::TEXT', from: '$' + (base - 1) + '::DATE', to: '$' + base + '::DATE' }
  })
  const inWindow = (ref) => 'FILTER (WHERE f.sale_date BETWEEN ' + ref.from + ' AND ' + ref.to + ')'
  const aggregates = refs.flatMap((ref, index) => [
    'SUM(f.revenue) ' + inWindow(ref) + ' AS revenue_' + index,
    'SUM(f.gross_profit) ' + inWindow(ref) + ' AS gross_profit_' + index,
    'SUM(f.quantity) ' + inWindow(ref) + ' AS quantity_' + index,
    "COUNT(DISTINCT NULLIF(f.document_number, '')) " + inWindow(ref) + ' AS documents_' + index,
    "COUNT(DISTINCT NULLIF(f.customer_id, '')) " + inWindow(ref) + ' AS customers_' + index,
    "COUNT(DISTINCT NULLIF(UPPER(BTRIM(f.product_name)), '')) " + inWindow(ref) + ' AS products_' + index,
    'COUNT(f.sale_date) ' + inWindow(ref) + ' AS row_count_' + index,
  ])
  const rows = refs.map((ref, index) =>
    '(' + ref.key + ', COALESCE(a.revenue_' + index + ', 0), COALESCE(a.gross_profit_' + index + ', 0), ' +
    'COALESCE(a.quantity_' + index + ', 0), a.documents_' + index + ', a.customers_' + index + ', ' +
    'a.products_' + index + ', a.row_count_' + index + ')',
  )
  const where = brandCondition ? 'WHERE ' + brandCondition + ' AND ' : 'WHERE '

  return {
    sql: 'WITH agg AS (SELECT ' + aggregates.join(', ') +
      ' FROM sales_facts f ' + where + 'f.sale_date BETWEEN LEAST(' + refs.map((ref) => ref.from).join(', ') +
      ') AND GREATEST(' + refs.map((ref) => ref.to).join(', ') + ')) ' +
      'SELECT t.key, t.revenue, t.gross_profit, t.quantity, t.documents, t.customers, t.products, t.row_count ' +
      'FROM agg a CROSS JOIN LATERAL (VALUES ' + rows.join(', ') + ') ' +
      'AS t(key, revenue, gross_profit, quantity, documents, customers, products, row_count)',
    params,
  }
}

/** The very same SQL with its parameters written in (to nest it in a comparison). */
function inline(query) {
  return query.sql.replace(/[$](\d+)/g, (_match, number) => literal(query.params[Number(number) - 1]))
}

/** "Previous vs current": EXCEPT in both directions; both must return 0 rows. */
function compareWindows(label, current, previous) {
  const current_ = inline(current).replace(/\s+/g, ' ').trim()
  const previous_ = inline(previous).replace(/\s+/g, ' ').trim()

  output.push(
    "\\echo ''",
    "\\echo '=== " + label + ' · anterior vs nueva (debe devolver 0 filas) ===' + "'",
    'WITH nueva AS (' + current_ + '), anterior AS (' + previous_ + ') ' +
    "SELECT 'solo en la nueva' AS lado, x.* FROM (SELECT * FROM nueva EXCEPT SELECT * FROM anterior) x " +
    "UNION ALL SELECT 'solo en la anterior', y.* FROM (SELECT * FROM anterior EXCEPT SELECT * FROM nueva) y;",
  )
}

const brandCondition = 'brand_key(f.brand) = $1'
const mineCondition = 'brand_key(f.brand) = ANY($1::TEXT[])'

if (plan.available && portfolioMine.length > 0) {
  const name = 'MIS MARCAS (' + portfolioMine.length + ')'

  measure(name, 'comparativo anual de cartera', portfolioYearWindowsQuery(portfolioMine, plan.windows))
  measure(name, 'cuotas de cartera', portfolioTargetsRangeQuery(portfolioMine, period.slice(0, 4) + '-01', period.slice(0, 4) + '-12'))
}

if (plan.available && portfolioAll) {
  measure('TODAS', 'comparativo anual de cartera (sin filtro de marca)', portfolioYearWindowsQuery(null, plan.windows))
  measure('TODAS', 'cuotas de cartera', portfolioTargetsRangeQuery(null, period.slice(0, 4) + '-01', period.slice(0, 4) + '-12'))
}

if (plan.available && compare) {
  for (const brand of brands) {
    compareWindows(brand, yearWindowsQuery(brand, plan.windows), previousYearWindows(brandCondition, [brand]))
  }

  if (portfolioMine.length > 0) {
    compareWindows(
      'MIS MARCAS (' + portfolioMine.length + ')',
      portfolioYearWindowsQuery(portfolioMine, plan.windows),
      previousYearWindows(mineCondition, [portfolioMine]),
    )
  }

  if (portfolioAll) {
    compareWindows('TODAS', portfolioYearWindowsQuery(null, plan.windows), previousYearWindows(null, []))
  }
}

for (const brand of brands) {
  if (plan.available) {
    measure(brand, 'comparativo anual (8 ventanas)', yearWindowsQuery(brand, plan.windows))
  }

  measure(brand, 'serie de 24 meses', monthlySeriesQuery(brand, shiftMonth(period, -(BRAND_RULES.seriesMonths - 1)), period))
  measure(brand, 'cuotas', targetsRangeQuery(brand, shiftMonth(period, -(BRAND_RULES.seriesMonths - 1)), `${period.slice(0, 4)}-12`))
  measure(brand, 'documentos (página)', documentsQuery(brand, `${period}-01`, monthEnd(period), BRAND_RULES.pageLimit.default, 0))
  measure(brand, 'documentos (totales)', documentTotalsQuery(brand, `${period}-01`, monthEnd(period)))
  measure(brand, 'exportar detalle', exportLinesQuery(brand, `${period}-01`, monthEnd(period), BRAND_RULES.exportMaxRows))

  if (window.comparison) {
    for (const filter of ['activos', 'suben', 'bajan']) {
      measure(brand, `clientes ${filter}`, customerRowsQuery(brand, window.comparison, filter, BRAND_RULES.pageLimit.default, 0))
    }

    measure(brand, 'productos vendidos', productRowsQuery(brand, window.comparison, BRAND_RULES.pageLimit.default, 0))
  }

  measure(brand, 'productos por recuperar', lostProductsQuery(brand, losses, BRAND_RULES.pageLimit.default, 0))
}

output.push('ROLLBACK;')
console.log(output.join('\n'))
