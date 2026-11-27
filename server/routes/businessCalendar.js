// CAL-001: calendar of non-working days.
//
// GET /api/business-calendar
//   Any signed-in user: the screens need it to explain the days they show. It
//   returns dates and descriptions, never business data.
//
// Administration (/api/settings/business-calendar, admin only):
//   GET    ?year=YYYY   days of the year, business days per month, quota template check
//   PUT    /:date       adds or edits a non-working day { type, description }
//   DELETE /:date       removes it
//
// Business days = Monday to Friday minus these days. Changing the calendar
// changes the day counts on the next request (there is no cache).

import { Router } from 'express'

import {
  handleRouteError,
  httpError,
  isoDate,
} from '../services/actionValidation.js'

import {
  DAY_TYPES,
  loadBusinessCalendar,
  monthSummaries,
  templateChecks,
} from '../services/businessCalendar.js'

export const CALENDAR_LIMITS = Object.freeze({
  firstYear: 2020,
  lastYear: 2100,
  descriptionMax: 120,
})

const publicEntry = (entry) => ({
  date: entry.date,
  type: entry.type,
  description: entry.description,
})

/** Year of ?year=; the current year by default. 400 when it is out of range. */
export function resolveCalendarYear(value, now = new Date()) {
  if (value === undefined) {
    return now.getUTCFullYear()
  }

  const year = typeof value === 'string' && /^\d{4}$/.test(value) ? Number(value) : NaN

  if (!(year >= CALENDAR_LIMITS.firstYear && year <= CALENDAR_LIMITS.lastYear)) {
    throw httpError(400, `El año debe estar entre ${CALENDAR_LIMITS.firstYear} y ${CALENDAR_LIMITS.lastYear}`)
  }

  return year
}

/** Date, type and description of a PUT; a clear 400 for anything invalid. */
export function validateCalendarEntry(date, body) {
  isoDate(date)

  const year = Number(date.slice(0, 4))

  if (year < CALENDAR_LIMITS.firstYear || year > CALENDAR_LIMITS.lastYear) {
    throw httpError(400, `El año debe estar entre ${CALENDAR_LIMITS.firstYear} y ${CALENDAR_LIMITS.lastYear}`)
  }

  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()

  if (weekday === 0 || weekday === 6) {
    throw httpError(400, 'Esa fecha es fin de semana: ya no es día laborable y no necesita registrarse')
  }

  const type = body?.type

  if (typeof type !== 'string' || !DAY_TYPES.includes(type)) {
    throw httpError(400, 'El tipo debe ser official (oficial) o company (empresa)')
  }

  const description = typeof body?.description === 'string' ? body.description.trim() : ''

  if (description === '' || description.length > CALENDAR_LIMITS.descriptionMax) {
    throw httpError(400, `La descripción es obligatoria y de máximo ${CALENDAR_LIMITS.descriptionMax} caracteres`)
  }

  return { type, description }
}

/** Public read: the whole calendar. */
export function createBusinessCalendarRouter(pool) {
  const router = Router()

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.get('/', async (_req, res) => {
    try {
      const calendar = await loadBusinessCalendar(pool)
      const years = [...new Set(calendar.entries.map((entry) => Number(entry.date.slice(0, 4))))]

      return res.json({
        ok: true,
        years,
        entries: calendar.entries.map(publicEntry),
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo consultar el calendario')
    }
  })

  return router
}

/** Administration (the caller mounts it behind requireAdmin). */
export function createSettingsBusinessCalendarRouter(pool, now = () => new Date()) {
  const router = Router()

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.get('/', async (req, res) => {
    try {
      const year = resolveCalendarYear(req.query.year, now())
      const calendar = await loadBusinessCalendar(pool)
      const templates = await pool.query(
        `SELECT period_id, working_days, COUNT(*) AS brands
           FROM (
             SELECT DISTINCT ON (period_id, brand_key(brand_id))
                    period_id, working_days
               FROM brand_targets
              WHERE period_id BETWEEN $1 AND $2
              ORDER BY period_id, brand_key(brand_id), updated_at DESC, id DESC
           ) latest
          WHERE working_days IS NOT NULL
          GROUP BY period_id, working_days
          ORDER BY period_id, working_days`,
        [`${year}-01`, `${year}-12`],
      )
      const checks = templateChecks(
        calendar,
        year,
        templates.rows.map((row) => ({
          period: row.period_id,
          workingDays: Number(row.working_days),
          brands: Number(row.brands),
        })),
      )
      const loadedYears = new Set(calendar.entries.map((entry) => Number(entry.date.slice(0, 4))))
      const current = now().getUTCFullYear()

      // The years the screen offers: the loaded ones, this year and the next.
      for (const candidate of [current, current + 1, year]) {
        loadedYears.add(candidate)
      }

      return res.json({
        ok: true,
        year,
        years: [...loadedYears].sort((left, right) => left - right),
        loaded: calendar.coversYear(year),
        entries: calendar.entries
          .filter((entry) => entry.date.startsWith(`${year}-`))
          .map(publicEntry),
        months: monthSummaries(calendar, year),
        templateChecks: checks,
        templateMismatches: checks.filter((check) => check.status === 'mismatch'),
        limits: CALENDAR_LIMITS,
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo consultar el calendario')
    }
  })

  router.put('/:date', async (req, res) => {
    try {
      const { type, description } = validateCalendarEntry(req.params.date, req.body)
      const result = await pool.query(
        `INSERT INTO business_calendar
           (calendar_date, day_type, description, created_by, updated_by)
         VALUES ($1::DATE, $2, $3, $4, $4)
         ON CONFLICT (calendar_date) DO UPDATE
            SET day_type = EXCLUDED.day_type,
                description = EXCLUDED.description,
                updated_at = NOW(),
                updated_by = EXCLUDED.updated_by
         RETURNING calendar_date::TEXT AS calendar_date, day_type, description,
                   (xmax = 0) AS inserted`,
        [req.params.date, type, description, req.authUser?.id ?? null],
      )
      const [row] = result.rows

      return res.status(row.inserted ? 201 : 200).json({
        ok: true,
        created: Boolean(row.inserted),
        entry: { date: row.calendar_date, type: row.day_type, description: row.description },
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo guardar el día no laborable')
    }
  })

  router.delete('/:date', async (req, res) => {
    try {
      isoDate(req.params.date)

      const result = await pool.query(
        'DELETE FROM business_calendar WHERE calendar_date = $1::DATE RETURNING calendar_date::TEXT AS calendar_date',
        [req.params.date],
      )

      if (result.rows.length === 0) {
        throw httpError(404, 'Ese día no está en el calendario')
      }

      return res.json({ ok: true, removed: result.rows[0].calendar_date })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo quitar el día no laborable')
    }
  })

  return router
}

