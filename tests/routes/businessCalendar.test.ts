// CAL-001: GET /api/business-calendar (any signed-in user) and the
// administration endpoints of Configuración (admin only).

import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import {
  CALENDAR_LIMITS,
  createBusinessCalendarRouter,
  createSettingsBusinessCalendarRouter,
  resolveCalendarYear,
  validateCalendarEntry,
} from '../../server/routes/businessCalendar.js'

interface TestRequest {
  query?: Record<string, string>
  params?: Record<string, string>
  body?: unknown
  authUser?: { id: number }
}

function buildResponse() {
  const res = { status: vi.fn(), json: vi.fn(), set: vi.fn() }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  res.set.mockReturnValue(res)

  return res
}

type Handler = (req: TestRequest, res: ReturnType<typeof buildResponse>, next?: () => void) => unknown
type Layer = { route?: { path: string, methods: Record<string, boolean>, stack: Array<{ handle: Handler }> }, handle: Handler }

async function call(router: unknown, method: string, path: string, input: TestRequest = {}) {
  const req: TestRequest = { query: {}, params: {}, ...input }
  const stack = (router as { stack: Layer[] }).stack
  const res = buildResponse()

  for (const layer of stack.filter((item) => !item.route)) {
    layer.handle(req, res, () => {})
  }

  const route = stack.find((layer) => layer.route?.path === path && layer.route.methods[method])?.route

  if (!route) {
    throw new Error(`${method} ${path} was not found`)
  }

  await route.stack[0]!.handle(req, res)

  return res
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const body = (res: ReturnType<typeof buildResponse>) => res.json.mock.calls[0]?.[0] as Record<string, any>
const statusOf = (res: ReturnType<typeof buildResponse>) => res.status.mock.calls[0]?.[0] as number | undefined

const CALENDAR_ROWS = [
  { calendar_date: '2026-02-02', day_type: 'official', description: 'Día de la Constitución' },
  { calendar_date: '2026-11-16', day_type: 'official', description: 'Día de la Revolución' },
  { calendar_date: '2026-12-31', day_type: 'company', description: 'Fin de año' },
  { calendar_date: '2025-12-25', day_type: 'official', description: 'Navidad' },
]

const NOW = () => new Date('2026-11-27T12:00:00Z')

function fakePool(options: { template?: Array<Record<string, unknown>>, upsert?: Array<Record<string, unknown>>, remove?: Array<Record<string, unknown>> } = {}) {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes('INSERT INTO business_calendar')) {
      return { rows: options.upsert ?? [{ calendar_date: '2027-01-01', day_type: 'official', description: 'Año Nuevo', inserted: true }] }
    }

    if (sql.includes('DELETE FROM business_calendar')) {
      return { rows: options.remove ?? [{ calendar_date: '2027-01-01' }] }
    }

    if (sql.includes('FROM business_calendar')) {
      return { rows: CALENDAR_ROWS }
    }

    if (sql.includes('FROM brand_targets')) {
      return { rows: options.template ?? [] }
    }

    throw new Error(`unexpected SQL: ${sql.slice(0, 60)}`)
  })

  return { pool: { query }, query }
}

describe('CAL-001 public read', () => {
  it('returns the dates, types and descriptions, ordered, without cache', async () => {
    const { pool } = fakePool()
    const res = await call(createBusinessCalendarRouter(pool), 'get', '/')

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(body(res)).toEqual({
      ok: true,
      years: [2025, 2026],
      entries: [
        { date: '2025-12-25', type: 'official', description: 'Navidad' },
        { date: '2026-02-02', type: 'official', description: 'Día de la Constitución' },
        { date: '2026-11-16', type: 'official', description: 'Día de la Revolución' },
        { date: '2026-12-31', type: 'company', description: 'Fin de año' },
      ],
    })
  })

  it('has no write endpoint', () => {
    const stack = (createBusinessCalendarRouter(fakePool().pool) as unknown as { stack: Layer[] }).stack
    const methods = stack.filter((layer) => layer.route).flatMap((layer) => Object.keys(layer.route!.methods))

    expect(methods).toEqual(['get'])
  })
})

describe('CAL-001 administration: read', () => {
  it('returns the year, business days per month and the quota template check', async () => {
    const { pool, query } = fakePool({
      template: [
        { period_id: '2026-02', working_days: 20, brands: '31' },
        { period_id: '2026-11', working_days: 20, brands: '31' },
        { period_id: '2026-12', working_days: 23, brands: '30' },
      ],
    })
    const res = await call(createSettingsBusinessCalendarRouter(pool, NOW), 'get', '/', { query: { year: '2026' } })
    const result = body(res)

    expect(result).toMatchObject({ ok: true, year: 2026, loaded: true })
    expect(result.entries.map((entry: { date: string }) => entry.date)).toEqual(['2026-02-02', '2026-11-16', '2026-12-31'])
    expect(result.years).toEqual([2025, 2026, 2027])
    expect(result.months[1]).toEqual({ period: '2026-02', weekdays: 20, businessDays: 19 })
    expect(result.months[11]).toEqual({ period: '2026-12', weekdays: 23, businessDays: 22 })
    expect(result.templateMismatches.map((item: { period: string }) => item.period)).toEqual(['2026-02', '2026-12'])
    expect(result.templateChecks.find((item: { period: string }) => item.period === '2026-11')).toMatchObject({ status: 'match' })
    expect(result.templateChecks.find((item: { period: string }) => item.period === '2026-03')).toMatchObject({ status: 'no-template' })
    // The template is read for the requested year only.
    expect((query.mock.calls.find((call) => String(call[0]).includes('brand_targets')) as unknown[])[1]).toEqual(['2026-01', '2026-12'])
  })

  it('a year without calendar says it is not loaded', async () => {
    const res = await call(createSettingsBusinessCalendarRouter(fakePool().pool, NOW), 'get', '/', { query: { year: '2027' } })

    expect(body(res)).toMatchObject({ year: 2027, loaded: false, entries: [] })
    expect(body(res).months[0]).toMatchObject({ weekdays: 21, businessDays: 21 })
  })

  it('defaults to the current year and validates the year', async () => {
    expect(body(await call(createSettingsBusinessCalendarRouter(fakePool().pool, NOW), 'get', '/')).year).toBe(2026)

    for (const year of ['1999', '2101', 'abc', '20267']) {
      expect(statusOf(await call(createSettingsBusinessCalendarRouter(fakePool().pool, NOW), 'get', '/', { query: { year } })), year).toBe(400)
    }

    expect(resolveCalendarYear('2030')).toBe(2030)
    expect(resolveCalendarYear(undefined, new Date('2031-01-01T00:00:00Z'))).toBe(2031)
  })
})

describe('CAL-001 administration: add, edit and remove', () => {
  it('adds a day: 201 with the author and the values as parameters', async () => {
    const { pool, query } = fakePool()
    const res = await call(createSettingsBusinessCalendarRouter(pool, NOW), 'put', '/:date', {
      params: { date: '2027-01-01' },
      body: { type: 'official', description: '  Año Nuevo ' },
      authUser: { id: 7 },
    })

    expect(statusOf(res)).toBe(201)
    expect(body(res)).toEqual({ ok: true, created: true, entry: { date: '2027-01-01', type: 'official', description: 'Año Nuevo' } })

    const [sql, params] = query.mock.calls[0] as [string, unknown[]]

    expect(sql).toContain('ON CONFLICT (calendar_date) DO UPDATE')
    expect(sql).not.toContain('2027-01-01')
    expect(params).toEqual(['2027-01-01', 'official', 'Año Nuevo', 7])
  })

  it('edits an existing day: 200', async () => {
    const { pool } = fakePool({ upsert: [{ calendar_date: '2026-12-31', day_type: 'company', description: 'Cierre', inserted: false }] })
    const res = await call(createSettingsBusinessCalendarRouter(pool, NOW), 'put', '/:date', {
      params: { date: '2026-12-31' },
      body: { type: 'company', description: 'Cierre' },
      authUser: { id: 7 },
    })

    expect(statusOf(res)).toBe(200)
    expect(body(res)).toMatchObject({ ok: true, created: false })
  })

  it.each([
    ['a weekend', '2027-01-02', { type: 'official', description: 'x' }],
    ['a Sunday', '2027-01-03', { type: 'official', description: 'x' }],
    ['a malformed date', '01-01-2027', { type: 'official', description: 'x' }],
    ['an impossible date', '2027-02-30', { type: 'official', description: 'x' }],
    ['a year out of range', '2101-01-01', { type: 'official', description: 'x' }],
    ['an unknown type', '2027-01-01', { type: 'feriado', description: 'x' }],
    ['no type', '2027-01-01', { description: 'x' }],
    ['an empty description', '2027-01-01', { type: 'official', description: '   ' }],
    ['no description', '2027-01-01', { type: 'official' }],
    ['a long description', '2027-01-01', { type: 'official', description: 'x'.repeat(CALENDAR_LIMITS.descriptionMax + 1) }],
    ['no body', '2027-01-01', undefined],
  ])('rejects %s with 400 and writes nothing', async (_name, date, payload) => {
    const { pool, query } = fakePool()
    const res = await call(createSettingsBusinessCalendarRouter(pool, NOW), 'put', '/:date', {
      params: { date },
      body: payload,
      authUser: { id: 7 },
    })

    expect(statusOf(res)).toBe(400)
    expect(body(res).ok).toBe(false)
    expect(query).not.toHaveBeenCalled()
  })

  it('validateCalendarEntry accepts a weekday and trims the description', () => {
    expect(validateCalendarEntry('2027-05-03', { type: 'company', description: ' Puente ' })).toEqual({ type: 'company', description: 'Puente' })
    expect(() => validateCalendarEntry('2027-05-01', { type: 'company', description: 'Sábado' })).toThrow('fin de semana')
  })

  it('removes a day, and answers 404 when it is not in the calendar', async () => {
    const removed = await call(createSettingsBusinessCalendarRouter(fakePool().pool, NOW), 'delete', '/:date', { params: { date: '2027-01-01' } })

    expect(body(removed)).toEqual({ ok: true, removed: '2027-01-01' })

    const missing = await call(createSettingsBusinessCalendarRouter(fakePool({ remove: [] }).pool, NOW), 'delete', '/:date', { params: { date: '2027-01-04' } })

    expect(statusOf(missing)).toBe(404)
    expect(statusOf(await call(createSettingsBusinessCalendarRouter(fakePool().pool, NOW), 'delete', '/:date', { params: { date: 'x' } }))).toBe(400)
  })
})

describe('CAL-001 mounting', () => {
  const index = readFileSync('server/index.js', 'utf8').replace(/\r\n/g, '\n')
  const business = readFileSync('server/registerBusinessRoutes.js', 'utf8').replace(/\r\n/g, '\n')

  it('administration is behind requireAdmin; the read needs a session only', () => {
    const admin = index.slice(index.indexOf("'/api/settings/business-calendar'"))

    expect(admin.slice(0, 200)).toContain('requireAdmin')
    expect(admin.slice(0, 200)).toContain('createSettingsBusinessCalendarRouter(pool)')

    const read = business.slice(business.indexOf("'/api/business-calendar'"))

    expect(read.slice(0, 200)).toContain('requireAuth')
    expect(read.slice(0, 200)).not.toContain('requireAdmin')
  })

  it('the public read is rate limited', () => {
    expect(index).toContain("'/api/business-calendar',\n  createApiRateLimit()")
  })

  it('the backend does not start without the 043 table', () => {
    expect(readFileSync('server/db/schemaCheck.js', 'utf8')).toContain("migration: '043',\n    table: 'business_calendar'")
  })
})

describe('CAL-001 migration and rollback', () => {
  const migration = readFileSync('server/migrations/043_business_calendar.sql', 'utf8')
  const rollback = readFileSync('server/migrations/rollback/043_business_calendar.rollback.sql', 'utf8')

  it('is atomic, grants the app user and does not duplicate the seed on a second run', () => {
    expect(migration).toMatch(/^BEGIN;/)
    expect(migration.trimEnd()).toMatch(/COMMIT;$/)
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.business_calendar')
    expect(migration).toContain('calendar_date DATE PRIMARY KEY')
    expect(migration).toContain("CHECK (day_type IN ('official', 'company'))")
    expect(migration).toContain('GRANT SELECT, INSERT, UPDATE, DELETE')
    expect(migration).toContain('TO pm_intelligence')
  })

  it('the rollback drops the table and warns in its header that it destroys the loaded days', () => {
    expect(rollback).toContain('DROP TABLE IF EXISTS public.business_calendar;')
    expect(rollback.split('DROP TABLE')[0]).toMatch(/BORRA la tabla/)
    expect(rollback.split('DROP TABLE')[0]).toMatch(/Configuracion > Calendario/)
    expect(rollback.split('DROP TABLE')[0]).toMatch(/pg_dump/)
  })
})
