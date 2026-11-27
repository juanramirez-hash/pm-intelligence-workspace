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

if (!cutoff || !/^\d{4}-\d{2}-\d{2}$/.test(cutoff) || brands.length === 0) {
  console.error('Uso: node server/scripts/explainBrandQueries.js --cutoff=YYYY-MM-DD [--period=YYYY-MM] MARCA [MARCA...]')
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
