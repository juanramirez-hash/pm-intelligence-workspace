// CAL-001: Configuración > Calendario rendered with sample data (static markup,
// no network), the repository calls and its place in Configuración.

import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  loadCalendarYear,
  removeCalendarDay,
  saveCalendarDay,
  type CalendarYearResponse,
} from './businessCalendarRepository'
import { templateWarning } from './businessCalendarFormat'
import { CalendarSettingsView } from './CalendarSettings'

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ')

const MONTHS = [
  [21, 21], [20, 19], [22, 21], [22, 20], [21, 20], [22, 22],
  [23, 23], [21, 21], [22, 20], [22, 22], [21, 20], [23, 21],
] as const

function response(overrides: Partial<CalendarYearResponse> = {}): CalendarYearResponse {
  return {
    ok: true,
    year: 2026,
    years: [2025, 2026, 2027],
    loaded: true,
    entries: [
      { date: '2026-02-02', type: 'official', description: 'Día de la Constitución' },
      { date: '2026-09-21', type: 'company', description: 'Yom Kipur' },
      { date: '2026-12-31', type: 'company', description: 'Fin de año' },
    ],
    months: MONTHS.map(([weekdays, businessDays], index) => ({
      period: `2026-${String(index + 1).padStart(2, '0')}`,
      weekdays,
      businessDays,
    })),
    templateChecks: [],
    templateMismatches: [
      { period: '2026-02', calendarDays: 19, templateValues: [{ workingDays: 20, brands: 31 }], status: 'mismatch' },
      { period: '2026-12', calendarDays: 21, templateValues: [{ workingDays: 23, brands: 30 }, { workingDays: 21, brands: 1 }], status: 'mismatch' },
    ],
    limits: { firstYear: 2020, lastYear: 2100, descriptionMax: 120 },
    ...overrides,
  }
}

const render = (data: CalendarYearResponse | null, options: { status?: 'loading' | 'success' | 'error', year?: number, message?: string | null, error?: Error | null } = {}) =>
  renderToStaticMarkup(
    <CalendarSettingsView
      data={data}
      year={options.year ?? 2026}
      status={options.status ?? 'success'}
      error={options.error ?? null}
      busy={false}
      message={options.message ?? null}
      onYearChange={() => {}}
      onSave={() => {}}
      onRemove={() => {}}
      onRetry={() => {}}
    />,
  )

describe('CAL-001 Configuración > Calendario', () => {
  it('lists the 12 months with Monday-to-Friday days against business days', () => {
    const html = render(response())

    expect((html.match(/data-calendar-month=/g) ?? []).length).toBe(12)

    const february = text(html.split('data-calendar-month="2026-02"')[1]?.split('</tr>')[0] ?? '')

    expect(february).toContain('Febrero de 2026')
    expect(february).toContain('20')
    expect(february).toContain('19')
    expect(february).toContain('2 feb 2026')
    expect(february).toContain('Oficial')
    expect(february).toContain('Día de la Constitución')
  })

  it('shows the type of each day as Oficial or Empresa', () => {
    const content = text(render(response()))

    expect(content).toContain('Empresa')
    expect(content).toContain('Fin de año')
    expect(content).toContain('3 días')
  })

  it('lists the months where the quota template differs, and says the calendar rules', () => {
    const html = render(response())
    const warnings = text(html.split('data-calendar-template-warnings')[1] ?? '')

    expect(warnings).toContain('no coincide con el calendario en 2 meses')
    expect(warnings).toContain('Manda el calendario')
    expect(warnings).toContain('Febrero de 2026: la plantilla de cuotas indica 20 (31 marcas) días hábiles; el calendario, 19.')
    expect(warnings).toContain('Diciembre de 2026: la plantilla de cuotas indica 23 (30 marcas), 21 (1 marca) días hábiles; el calendario, 21.')
  })

  it('no warning when the template agrees', () => {
    expect(render(response({ templateMismatches: [] }))).not.toContain('data-calendar-template-warnings')
  })

  it('a year without calendar says so (counted Monday to Friday)', () => {
    const html = render(response({ year: 2027, loaded: false, entries: [], templateMismatches: [] }), { year: 2027 })

    expect(html).toContain('data-calendar-missing="true"')
    expect(text(html)).toContain('No hay calendario de días no laborables cargado para 2027')
    expect(text(html)).toContain('0 días')
    // Every month is "—" without days.
    expect((text(html).match(/—/g) ?? []).length).toBe(12)
  })

  it('offers the add form (date, type, description) and the years to choose', () => {
    const html = render(response())

    expect(html).toContain('data-calendar-form="true"')
    expect(html).toContain('type="date"')
    expect(html).toContain('min="2026-01-01"')
    expect(html).toContain('max="2026-12-31"')
    expect(html).toContain('maxLength="120"')
    expect(text(html)).toContain('Agregar o actualizar')
    expect(html).toContain('<option value="2027">2027</option>')
    expect(text(html)).toContain('Quitar')
    // The add button starts disabled until there is a date and a description.
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Agregar o actualizar/)
  })

  it('shows the result message and the loading and error states', () => {
    expect(text(render(response(), { message: 'Día agregado al calendario.' }))).toContain('Día agregado al calendario.')
    expect(text(render(null, { status: 'loading' }))).toContain('Cargando…')

    const failed = text(render(null, { status: 'error', error: new Error('Administrator access required') }))

    expect(failed).toContain('Administrator access required')
    expect(failed).toContain('Reintentar')
  })

  it('templateWarning writes the month, the values with their brands and the calendar days', () => {
    expect(templateWarning({
      period: '2026-02', calendarDays: 19, status: 'mismatch', templateValues: [{ workingDays: 20, brands: 1 }],
    })).toBe('Febrero de 2026: la plantilla de cuotas indica 20 (1 marca) días hábiles; el calendario, 19.')
  })
})

describe('CAL-001 repository calls', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stubFetch(status = 200, body: unknown = { ok: true }) {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }))

    vi.stubGlobal('fetch', fetchMock)

    return fetchMock
  }

  it('reads a year, saves and removes a day, always under /api/settings/business-calendar', async () => {
    const fetchMock = stubFetch()

    await loadCalendarYear(2027)
    await loadCalendarYear(null)
    await saveCalendarDay('2027-01-01', { type: 'official', description: 'Año Nuevo' })
    await removeCalendarDay('2027-01-01')

    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>

    expect(calls.map((call) => call[0])).toEqual([
      '/api/settings/business-calendar?year=2027',
      '/api/settings/business-calendar',
      '/api/settings/business-calendar/2027-01-01',
      '/api/settings/business-calendar/2027-01-01',
    ])
    expect(calls[2]?.[1].method).toBe('PUT')
    expect(calls[2]?.[1].body).toBe(JSON.stringify({ type: 'official', description: 'Año Nuevo' }))
    expect(calls[3]?.[1].method).toBe('DELETE')
  })

  it('turns a server error into a message', async () => {
    stubFetch(400, { error: 'Esa fecha es fin de semana' })

    await expect(saveCalendarDay('2027-01-02', { type: 'official', description: 'x' })).rejects.toThrow('Esa fecha es fin de semana')

    stubFetch(403, { ok: false, error: 'Administrator access required' })

    await expect(loadCalendarYear(2026)).rejects.toThrow('Administrator access required')
  })
})
