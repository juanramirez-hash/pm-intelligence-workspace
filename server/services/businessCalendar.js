// CAL-001: calendar of non-working days and the single rule of business days.
//
// Business days = Monday to Friday MINUS the days of business_calendar
// (official holidays and company days; they change every year and are loaded
// from Configuración). Everything on the server that counts working days
// (Mi día, the brand page, the year over year windows, the portfolio) goes
// through this module.
//
// Sales of a non-working day are still summed: only the count of days changes.
//
// A year without any row in the calendar is NOT assumed to have no holidays:
// missingYears() reports it so the screens warn, and the count falls back to
// Monday to Friday for those dates.

export const DAY_TYPES = Object.freeze(['official', 'company'])

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function assertDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) {
    throw new Error(`Invalid date: ${String(value)}`)
  }
}

function monthEndOf(period) {
  const year = Number(period.slice(0, 4))
  const month = Number(period.slice(5, 7))

  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

/**
 * @param {Array<{ date: string, type: string, description: string }>} entries
 */
export function createBusinessCalendar(entries = []) {
  const sorted = [...entries].sort((left, right) => left.date.localeCompare(right.date))
  const nonWorking = new Set(sorted.map((entry) => entry.date))
  const coveredYears = new Set(sorted.map((entry) => Number(entry.date.slice(0, 4))))

  const isWorkingDay = (date) => {
    assertDate(date)
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()

    return weekday !== 0 && weekday !== 6 && !nonWorking.has(date)
  }

  /** Business days from `from` to `to`, both included; 0 when from > to. */
  const businessDaysBetween = (from, to) => {
    assertDate(from)
    assertDate(to)

    if (from > to) {
      return 0
    }

    let count = 0

    for (
      const cursor = new Date(`${from}T00:00:00Z`);
      cursor.toISOString().slice(0, 10) <= to;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      if (isWorkingDay(cursor.toISOString().slice(0, 10))) {
        count += 1
      }
    }

    return count
  }

  const businessDaysInPeriod = (period) =>
    businessDaysBetween(`${period}-01`, monthEndOf(period))

  /** The Nth business day of the month (1-based); null when it has fewer. */
  const nthBusinessDay = (period, n) => {
    const end = monthEndOf(period)
    let counted = 0

    for (
      const cursor = new Date(`${period}-01T00:00:00Z`);
      cursor.toISOString().slice(0, 10) <= end;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const date = cursor.toISOString().slice(0, 10)

      if (isWorkingDay(date)) {
        counted += 1

        if (counted === n) {
          return date
        }
      }
    }

    return null
  }

  /** Years of [from, to] that have no row in the calendar, ascending. */
  const missingYears = (from, to) => {
    assertDate(from)
    assertDate(to)

    const missing = []

    for (let year = Number(from.slice(0, 4)); year <= Number(to.slice(0, 4)); year += 1) {
      if (!coveredYears.has(year)) {
        missing.push(year)
      }
    }

    return missing
  }

  return Object.freeze({
    entries: Object.freeze(sorted),
    isWorkingDay,
    businessDaysBetween,
    businessDaysInPeriod,
    nthBusinessDay,
    missingYears,
    coversYear: (year) => coveredYears.has(year),
  })
}

const pad = (value) => String(value).padStart(2, '0')

/**
 * The 12 months of a year with their Monday-to-Friday days and their business
 * days (Configuración shows both).
 */
export function monthSummaries(calendar, year) {
  const plain = createBusinessCalendar([])

  return Array.from({ length: 12 }, (_, index) => {
    const period = `${year}-${pad(index + 1)}`

    return {
      period,
      weekdays: plain.businessDaysInPeriod(period),
      businessDays: calendar.businessDaysInPeriod(period),
    }
  })
}

/**
 * CAL-001: the quota template (brand_targets.working_days) against the
 * calendar, per month. The calendar rules; a month where the template differs
 * is reported so the screens can warn.
 *
 * rows: [{ period, workingDays, brands }] with the working_days of the latest
 * target of each brand, grouped by value.
 * status: 'match' | 'mismatch' | 'no-template'.
 */
export function templateChecks(calendar, year, rows) {
  return monthSummaries(calendar, year).map(({ period, businessDays }) => {
    const values = rows
      .filter((row) => row.period === period && Number.isFinite(row.workingDays))
      .sort((left, right) => left.workingDays - right.workingDays)
    const status = values.length === 0
      ? 'no-template'
      : values.every((row) => row.workingDays === businessDays) ? 'match' : 'mismatch'

    return {
      period,
      calendarDays: businessDays,
      templateValues: values.map((row) => ({ workingDays: row.workingDays, brands: row.brands })),
      status,
    }
  })
}

/** No non-working days at all: Monday to Friday (default of the pure rules). */
export const EMPTY_CALENDAR = createBusinessCalendar([])

/** Reads the whole calendar (a few dozen rows a year). */
export async function loadBusinessCalendar(pool) {
  const result = await pool.query(
    `SELECT calendar_date::TEXT AS calendar_date, day_type, description
       FROM business_calendar
      ORDER BY calendar_date`,
  )

  return createBusinessCalendar(
    result.rows.map((row) => ({
      date: row.calendar_date,
      type: row.day_type,
      description: row.description,
    })),
  )
}

const official = (date, description) => ({ date, type: 'official', description })
const company = (date, description) => ({ date, type: 'company', description })

/**
 * Initial calendar (migration 043). The same rows are in the migration; a test
 * keeps both equal. The simulation script uses this list, so it runs before
 * the migration is applied.
 */
export const BUSINESS_CALENDAR_SEED = Object.freeze([
  official('2024-01-01', 'Año Nuevo'),
  official('2024-02-05', 'Día de la Constitución'),
  official('2024-03-18', 'Natalicio de Benito Juárez'),
  company('2024-03-28', 'Semana Santa'),
  company('2024-03-29', 'Semana Santa'),
  official('2024-05-01', 'Día del Trabajo'),
  official('2024-09-16', 'Día de la Independencia'),
  official('2024-10-01', 'Transmisión del Poder Ejecutivo'),
  company('2024-10-03', 'Rosh Hashaná'),
  company('2024-10-04', 'Rosh Hashaná'),
  official('2024-11-18', 'Día de la Revolución'),
  official('2024-12-25', 'Navidad'),
  official('2025-01-01', 'Año Nuevo'),
  official('2025-02-03', 'Día de la Constitución'),
  official('2025-03-17', 'Natalicio de Benito Juárez'),
  company('2025-04-17', 'Semana Santa'),
  company('2025-04-18', 'Semana Santa'),
  official('2025-05-01', 'Día del Trabajo'),
  official('2025-09-16', 'Día de la Independencia'),
  company('2025-09-23', 'Rosh Hashaná'),
  company('2025-09-24', 'Rosh Hashaná'),
  company('2025-10-02', 'Yom Kipur'),
  official('2025-11-17', 'Día de la Revolución'),
  official('2025-12-25', 'Navidad'),
  official('2026-01-01', 'Año Nuevo'),
  official('2026-02-02', 'Día de la Constitución'),
  official('2026-03-16', 'Natalicio de Benito Juárez'),
  company('2026-04-02', 'Semana Santa'),
  company('2026-04-03', 'Semana Santa'),
  official('2026-05-01', 'Día del Trabajo'),
  official('2026-09-16', 'Día de la Independencia'),
  company('2026-09-21', 'Yom Kipur'),
  official('2026-11-16', 'Día de la Revolución'),
  official('2026-12-25', 'Navidad'),
  company('2026-12-31', 'Fin de año'),
])
