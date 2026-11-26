// MD-003: the only server calls of "Mi día". It reads /api/my-day/* and
// /api/actions, never the /api/data/* datasets. authenticatedFetch sends the
// session cookie and, on 401, sends the user back to the login screen.

import {
  authenticatedFetch,
} from '../../../shared/http/authenticatedFetch'

import type {
  MyDayActionsResponse,
  MyDayArrivalTab,
  MyDayArrivalsResponse,
  MyDayLostCustomersResponse,
  MyDayStockAlertKind,
  MyDayStockAlertListResponse,
  MyDayStockAlertsResponse,
  MyDaySummaryResponse,
  MyDayView,
} from './myDayTypes'

export class MyDayApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'MyDayApiError'
    this.status = status
  }
}

type QueryValue = string | number | null | undefined

/** Path plus query string; empty values are left out. */
export function myDayPath(
  path: string,
  params: Record<string, QueryValue> = {},
): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }

  const text = query.toString()

  return text ? `${path}?${text}` : path
}

async function requestJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await authenticatedFetch(path, {
    headers: { Accept: 'application/json' },
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

    throw new MyDayApiError(response.status, message)
  }

  return payload as T
}

// The server default is view=mine; only view=all is sent.
const viewParam = (view: MyDayView) => (view === 'all' ? 'all' : undefined)

export interface MyDayPeriodRequest {
  view: MyDayView
  period?: string | null
}

export interface MyDayPageRequest {
  view: MyDayView
  limit: number
  offset?: number
}

export function loadMyDaySummary(
  { view, period }: MyDayPeriodRequest,
  signal?: AbortSignal,
): Promise<MyDaySummaryResponse> {
  return requestJson(
    myDayPath('/api/my-day', { view: viewParam(view), period }),
    signal,
  )
}

export function loadMyDayLostCustomers(
  { view, period, limit, offset = 0 }: MyDayPeriodRequest & { limit: number, offset?: number },
  signal?: AbortSignal,
): Promise<MyDayLostCustomersResponse> {
  return requestJson(
    myDayPath('/api/my-day/lost-customers', {
      view: viewParam(view),
      period,
      limit,
      offset: offset || undefined,
    }),
    signal,
  )
}

export function loadMyDayStockAlerts(
  { view, limit }: MyDayPageRequest,
  signal?: AbortSignal,
): Promise<MyDayStockAlertsResponse> {
  return requestJson(
    myDayPath('/api/my-day/stock-alerts', { view: viewParam(view), limit }),
    signal,
  )
}

export function loadMyDayStockAlertList(
  kind: MyDayStockAlertKind,
  { view, limit, offset = 0 }: MyDayPageRequest,
  signal?: AbortSignal,
): Promise<MyDayStockAlertListResponse> {
  return requestJson(
    myDayPath(`/api/my-day/stock-alerts/${kind}`, {
      view: viewParam(view),
      limit,
      offset: offset || undefined,
    }),
    signal,
  )
}

export function loadMyDayArrivals(
  { view, limit, offset = 0, status }: MyDayPageRequest & { status?: MyDayArrivalTab },
  signal?: AbortSignal,
): Promise<MyDayArrivalsResponse> {
  return requestJson(
    myDayPath('/api/my-day/arrivals', {
      view: viewParam(view),
      status,
      limit,
      offset: offset || undefined,
    }),
    signal,
  )
}

export const OPEN_ACTION_STATUSES = ['open', 'in_progress', 'blocked'] as const

/** Open actions in the user's scope; filtered and ordered on the client. */
export function loadMyDayOpenActions(
  signal?: AbortSignal,
): Promise<MyDayActionsResponse> {
  return requestJson(
    myDayPath('/api/actions', {
      status: OPEN_ACTION_STATUSES.join(','),
      limit: 500,
    }),
    signal,
  )
}
