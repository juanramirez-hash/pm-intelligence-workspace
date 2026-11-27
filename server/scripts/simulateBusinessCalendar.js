// CAL-001: read-only simulation of the business calendar. Run it BEFORE applying
// migration 043: the calendar is inside this script (BUSINESS_CALENDAR_SEED, the
// same rows the migration loads), so it needs neither the migration nor the
// table. It writes nothing: the only queries are SELECTs inside
// BEGIN READ ONLY ... ROLLBACK.
//
// Usage (from server/, as the application user):
//   node scripts/simulateBusinessCalendar.js                    # cutoff 2026-11-26
//   node scripts/simulateBusinessCalendar.js --cutoff=2026-11-26 [--year=2026] [--day=15]
//   node scripts/simulateBusinessCalendar.js --no-db            # days and cutoffs only
//
// It prints, TODAY (Monday to Friday) -> CALENDAR (Monday to Friday minus the
// non-working days):
//   1. the cutoff month: elapsed and total business days, remaining, the
//      projection factor total/elapsed, the previous-month cutoff and the
//      equivalent cutoff of the same month in 2025 and 2024;
//   2. every month of the year: total days, and at day --day (15): elapsed days
//      and the previous-month cutoff;
//   3. per brand (needs the database): sales to the cutoff, the projected close
//      ("cierre por ritmo" = sales / elapsed x total) and the quota attainment,
//      today -> calendar, with the portfolio total.
//
// After applying the migration, run it again with --from-db: the calendar is
// read from business_calendar and the CALENDAR column must be identical.

import {
  BUSINESS_CALENDAR_SEED,
  createBusinessCalendar,
  EMPTY_CALENDAR,
  loadBusinessCalendar,
} from '../services/businessCalendar.js'

import {
  equivalentWorkingDayCutoff,
} from '../services/brandRules.js'

import {
  equivalentPreviousCutoff,
  monthEnd,
  weekdaysBetween,
  weekdaysInPeriod,
} from '../services/metricPeriods.js'

const money = (value) =>
  value === null || value === undefined
    ? '—'
    : Math.round(value).toLocaleString('en-US')
const percent = (value) => (value === null || value === undefined ? '—' : `${(value * 100).toFixed(1)}%`)
const arrow = (before, after) => (before === after ? `${before}` : `${before} → ${after}`)

/** Projected close of an open month: sales / elapsed x total (null without elapsed days). */
export function projectedClose(revenue, elapsed, total) {
  return elapsed > 0 ? (revenue / elapsed) * total : null
}

/** Elapsed, total and remaining business days of a period at a cutoff. */
export function periodDays(period, cutoff, calendar) {
  const end = monthEnd(period)
  const to = cutoff < end ? cutoff : end
  const total = weekdaysInPeriod(period, calendar)
  const elapsed = cutoff < `${period}-01` ? 0 : weekdaysBetween(`${period}-01`, to, calendar)

  return { elapsed, total, remaining: total - elapsed, open: cutoff < end }
}

/**
 * Days and equivalent cutoffs of one period at a cutoff, with and without the
 * calendar (pure: the tests use it).
 */
export function simulatePeriod(period, cutoff, calendar) {
  const today = periodDays(period, cutoff, EMPTY_CALENDAR)
  const after = periodDays(period, cutoff, calendar)
  const month = period.slice(5, 7)
  const year = Number(period.slice(0, 4))
  const equivalents = (rule) => ({
    previousMonth: rule === 'today'
      ? equivalentPreviousCutoff(period, cutoff, EMPTY_CALENDAR)
      : equivalentPreviousCutoff(period, cutoff, calendar),
    previousYear: equivalentWorkingDayCutoff(period, cutoff, `${year - 1}-${month}`, rule === 'today' ? EMPTY_CALENDAR : calendar),
    twoYearsBack: equivalentWorkingDayCutoff(period, cutoff, `${year - 2}-${month}`, rule === 'today' ? EMPTY_CALENDAR : calendar),
  })

  return {
    period,
    cutoff,
    today,
    calendar: after,
    factor: {
      today: projectedClose(1, today.elapsed, today.total),
      calendar: projectedClose(1, after.elapsed, after.total),
    },
    equivalents: { today: equivalents('today'), calendar: equivalents('calendar') },
  }
}

/** The 12 months of a year: total days and, at day `day`, elapsed days and previous-month cutoff. */
export function simulateYear(year, day, calendar) {
  return Array.from({ length: 12 }, (_, index) => {
    const period = `${year}-${String(index + 1).padStart(2, '0')}`
    const cutoff = `${period}-${String(Math.min(day, Number(monthEnd(period).slice(8)) - 1)).padStart(2, '0')}`
    const simulated = simulatePeriod(period, cutoff, calendar)

    return {
      period,
      totalToday: simulated.today.total,
      totalCalendar: simulated.calendar.total,
      cutoff,
      elapsedToday: simulated.today.elapsed,
      elapsedCalendar: simulated.calendar.elapsed,
      previousToday: simulated.equivalents.today.previousMonth,
      previousCalendar: simulated.equivalents.calendar.previousMonth,
    }
  })
}

/** Per brand: sales to the cutoff and the projected close, today -> calendar. */
export function simulateBrands(rows, simulated) {
  const brands = rows.map((row) => {
    const closeToday = projectedClose(row.revenue, simulated.today.elapsed, simulated.today.total)
    const closeCalendar = projectedClose(row.revenue, simulated.calendar.elapsed, simulated.calendar.total)

    return {
      ...row,
      closeToday,
      closeCalendar,
      delta: closeToday === null || closeCalendar === null ? null : closeCalendar - closeToday,
      attainmentToday: row.target > 0 && closeToday !== null ? closeToday / row.target : null,
      attainmentCalendar: row.target > 0 && closeCalendar !== null ? closeCalendar / row.target : null,
    }
  })
  const total = rows.reduce((sum, row) => sum + row.revenue, 0)
  const target = rows.reduce((sum, row) => sum + (row.target ?? 0), 0)
  const closeToday = projectedClose(total, simulated.today.elapsed, simulated.today.total)
  const closeCalendar = projectedClose(total, simulated.calendar.elapsed, simulated.calendar.total)

  return {
    brands,
    portfolio: {
      revenue: total,
      target,
      closeToday,
      closeCalendar,
      delta: closeToday === null || closeCalendar === null ? null : closeCalendar - closeToday,
      attainmentToday: target > 0 && closeToday !== null ? closeToday / target : null,
      attainmentCalendar: target > 0 && closeCalendar !== null ? closeCalendar / target : null,
    },
  }
}

function printPeriod(simulated) {
  const { today, calendar, factor, equivalents } = simulated

  console.log(`== Periodo ${simulated.period} con corte ${simulated.cutoff}`)
  console.log(`Días transcurridos : ${arrow(today.elapsed, calendar.elapsed)}`)
  console.log(`Días totales       : ${arrow(today.total, calendar.total)}`)
  console.log(`Días restantes     : ${arrow(today.remaining, calendar.remaining)}`)
  console.log(
    `Factor de proyección total/transcurridos: ${factor.today?.toFixed(4) ?? '—'} → ${factor.calendar?.toFixed(4) ?? '—'}` +
    (factor.today && factor.calendar ? ` (${(((factor.calendar / factor.today) - 1) * 100).toFixed(2)} %)` : ''),
  )
  console.log(`Corte del mes anterior : ${arrow(equivalents.today.previousMonth, equivalents.calendar.previousMonth)}`)
  console.log(`Corte equivalente ${Number(simulated.period.slice(0, 4)) - 1}  : ${arrow(equivalents.today.previousYear, equivalents.calendar.previousYear)}`)
  console.log(`Corte equivalente ${Number(simulated.period.slice(0, 4)) - 2}  : ${arrow(equivalents.today.twoYearsBack, equivalents.calendar.twoYearsBack)}`)
  console.log('')
}

function printYear(rows, year, day) {
  console.log(`== Meses de ${year}: días totales y, al día ${day}, transcurridos y corte del mes anterior (hoy → calendario)`)
  console.log('Mes      Totales      Transcurridos   Corte mes anterior')

  for (const row of rows) {
    console.log(
      `${row.period}  ${arrow(row.totalToday, row.totalCalendar).padEnd(11)}  ${arrow(row.elapsedToday, row.elapsedCalendar).padEnd(13)}   ${arrow(row.previousToday, row.previousCalendar)}`,
    )
  }

  console.log('')
}

function printBrands(result, period) {
  console.log(`== Cierre por ritmo por marca, ${period} (hoy → calendario)`)
  console.log('Marca'.padEnd(34) + 'Venta al corte'.padStart(16) + 'Cierre hoy'.padStart(14) + 'Cierre cal.'.padStart(14) + 'Dif.'.padStart(11) + '  Cuota'.padEnd(14) + 'Avance hoy → cal.')

  const line = (label, row) =>
    label.slice(0, 33).padEnd(34) +
    money(row.revenue).padStart(16) +
    money(row.closeToday).padStart(14) +
    money(row.closeCalendar).padStart(14) +
    money(row.delta).padStart(11) +
    (`  ${money(row.target || null)}`).padEnd(14) +
    `${percent(row.attainmentToday)} → ${percent(row.attainmentCalendar)}`

  for (const brand of result.brands) {
    console.log(line(brand.label, brand))
  }

  console.log('-'.repeat(120))
  console.log(line('CARTERA (todas las marcas)', result.portfolio))
  console.log('')
}

async function loadBrandRows(client, period, cutoff) {
  const to = cutoff < monthEnd(period) ? cutoff : monthEnd(period)
  const sales = await client.query(
    `SELECT brand_key(f.brand) AS brand_key, MIN(f.brand) AS label,
            COALESCE(SUM(f.revenue), 0) AS revenue
       FROM sales_facts f
      WHERE f.sale_date BETWEEN $1::DATE AND $2::DATE
      GROUP BY brand_key(f.brand)`,
    [`${period}-01`, to],
  )
  const targets = await client.query(
    `SELECT DISTINCT ON (brand_key(brand_id))
            brand_key(brand_id) AS brand_key, target_revenue
       FROM brand_targets
      WHERE period_id = $1
      ORDER BY brand_key(brand_id), updated_at DESC, id DESC`,
    [period],
  )
  const target = new Map(targets.rows.map((row) => [row.brand_key, Number(row.target_revenue ?? 0)]))
  const rows = sales.rows.map((row) => ({
    brandKey: row.brand_key,
    label: row.label ?? row.brand_key ?? '(sin marca)',
    revenue: Number(row.revenue),
    target: target.get(row.brand_key) ?? 0,
  }))

  // Brands with a quota and no sales yet still count against the quota.
  for (const [key, value] of target) {
    if (!rows.some((row) => row.brandKey === key)) {
      rows.push({ brandKey: key, label: key, revenue: 0, target: value })
    }
  }

  return rows.sort((left, right) => right.revenue - left.revenue)
}

async function main() {
  const args = process.argv.slice(2)
  const option = (name, fallback) => args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback
  const cutoff = option('cutoff', '2026-11-26')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) {
    console.error('Uso: node scripts/simulateBusinessCalendar.js [--cutoff=YYYY-MM-DD] [--year=YYYY] [--day=15] [--no-db] [--from-db]')
    process.exit(1)
  }

  const period = option('period', cutoff.slice(0, 7))
  const year = Number(option('year', cutoff.slice(0, 4)))
  const day = Number(option('day', '15'))
  const useDb = !args.includes('--no-db')
  const fromDb = args.includes('--from-db')
  let calendar = createBusinessCalendar([...BUSINESS_CALENDAR_SEED])
  let pool = null

  if (useDb) {
    await import('dotenv/config')
    pool = (await import('../db/pool.js')).pool
  }

  try {
    if (fromDb) {
      calendar = await loadBusinessCalendar(pool)
      console.log('Calendario leído de business_calendar (debe coincidir con la simulación previa).\n')
    } else {
      console.log('Calendario interno del script (los mismos 35 días de la migración 043). No se escribe nada.\n')
    }

    printPeriod(simulatePeriod(period, cutoff, calendar))
    printYear(simulateYear(year, day, calendar), year, day)

    if (useDb) {
      const client = await pool.connect()

      try {
        await client.query('BEGIN READ ONLY')

        const rows = await loadBrandRows(client, period, cutoff)

        printBrands(simulateBrands(rows, simulatePeriod(period, cutoff, calendar)), period)
      } finally {
        await client.query('ROLLBACK').catch(() => {})
        client.release()
      }
    } else {
      console.log('(--no-db: sin la tabla por marca; usa el script sin esa opción en el servidor)')
    }
  } finally {
    if (pool) {
      await pool.end()
    }
  }
}

// Only when it is run as a script (the tests import the functions).
if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/simulateBusinessCalendar.js')) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
