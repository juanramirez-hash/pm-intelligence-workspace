// CAL-001: calls of Configuración > Calendario (administrators only):
// /api/settings/business-calendar. The calendar rules the business days of
// Mi día, the brand page and the portfolio.

import {
  authenticatedFetch,
} from '../../shared/http/authenticatedFetch'

export type CalendarDayType = 'official' | 'company'

export interface CalendarEntry {
  date: string
  type: CalendarDayType
  description: string
}

export interface CalendarMonth {
  period: string
  weekdays: number
  businessDays: number
}

export interface CalendarTemplateCheck {
  period: string
  calendarDays: number
  templateValues: Array<{ workingDays: number, brands: number }>
  status: 'match' | 'mismatch' | 'no-template'
}

export interface CalendarYearResponse {
  ok: true
  year: number
  years: number[]
  // false: the year has no day loaded (it is counted Monday to Friday).
  loaded: boolean
  entries: CalendarEntry[]
  months: CalendarMonth[]
  templateChecks: CalendarTemplateCheck[]
  templateMismatches: CalendarTemplateCheck[]
  limits: { firstYear: number, lastYear: number, descriptionMax: number }
}

export const DAY_TYPE_LABELS: Record<CalendarDayType, string> = {
  official: 'Oficial',
  company: 'Empresa',
}

const BASE = '/api/settings/business-calendar'

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  signal?: AbortSignal,
): Promise<T> {
  const response = await authenticatedFetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal,
  })
  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : `La consulta respondió ${response.status}`

    throw new Error(message)
  }

  return payload as T
}

export function loadCalendarYear(
  year: number | null,
  signal?: AbortSignal,
): Promise<CalendarYearResponse> {
  return requestJson(year === null ? BASE : `${BASE}?year=${year}`, undefined, signal)
}

export function saveCalendarDay(
  date: string,
  input: { type: CalendarDayType, description: string },
): Promise<{ ok: true, created: boolean, entry: CalendarEntry }> {
  return requestJson(`${BASE}/${encodeURIComponent(date)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function removeCalendarDay(date: string): Promise<{ ok: true, removed: string }> {
  return requestJson(`${BASE}/${encodeURIComponent(date)}`, { method: 'DELETE' })
}
