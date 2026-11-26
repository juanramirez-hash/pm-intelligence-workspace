// MD-003: the "Mi día" client reads only /api/my-day/* and /api/actions,
// through authenticatedFetch (an expired session goes back to the login).

import { beforeEach, describe, expect, it, vi } from 'vitest'

const authenticatedFetch = vi.hoisted(() => vi.fn())

vi.mock('../../../shared/http/authenticatedFetch', () => ({
  authenticatedFetch,
}))

import {
  MyDayApiError,
  loadMyDayArrivals,
  loadMyDayLostCustomers,
  loadMyDayOpenActions,
  loadMyDayStockAlertList,
  loadMyDayStockAlerts,
  loadMyDaySummary,
  myDayPath,
} from './myDayApi'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const calledUrls = () => authenticatedFetch.mock.calls.map(([url]) => String(url))

beforeEach(() => {
  authenticatedFetch.mockReset()
  authenticatedFetch.mockImplementation(async () => json({ ok: true, rows: [] }))
})

describe('MD-003 my day API client', () => {
  it('builds the query string without empty values', () => {
    expect(myDayPath('/api/my-day', { view: undefined, period: null })).toBe('/api/my-day')
    expect(myDayPath('/api/my-day', { view: 'all', period: '2026-10' })).toBe('/api/my-day?view=all&period=2026-10')
  })

  it('calls only /api/my-day/* and /api/actions with view, period and paging', async () => {
    const signal = new AbortController().signal

    await loadMyDaySummary({ view: 'mine', period: null }, signal)
    await loadMyDaySummary({ view: 'all', period: '2026-10' })
    await loadMyDayLostCustomers({ view: 'mine', period: '2026-10', limit: 5 })
    await loadMyDayLostCustomers({ view: 'all', period: null, limit: 50, offset: 100 })
    await loadMyDayStockAlerts({ view: 'mine', limit: 10 })
    await loadMyDayStockAlertList('out-of-stock', { view: 'all', limit: 50, offset: 50 })
    await loadMyDayStockAlertList('low-stock', { view: 'mine', limit: 50 })
    await loadMyDayArrivals({ view: 'mine', limit: 20, offset: 0 })
    await loadMyDayOpenActions()

    expect(calledUrls()).toEqual([
      '/api/my-day',
      '/api/my-day?view=all&period=2026-10',
      '/api/my-day/lost-customers?period=2026-10&limit=5',
      '/api/my-day/lost-customers?view=all&limit=50&offset=100',
      '/api/my-day/stock-alerts?limit=10',
      '/api/my-day/stock-alerts/out-of-stock?view=all&limit=50&offset=50',
      '/api/my-day/stock-alerts/low-stock?limit=50',
      '/api/my-day/arrivals?limit=20',
      '/api/actions?status=open%2Cin_progress%2Cblocked&limit=500',
    ])
    expect(calledUrls().some((url) => url.startsWith('/api/data'))).toBe(false)
    expect(authenticatedFetch.mock.calls[0]?.[1]).toMatchObject({ signal })
  })

  it('keeps the HTTP status and the server message of an error', async () => {
    authenticatedFetch.mockResolvedValueOnce(json({ ok: false, error: 'Vista no permitida' }, 403))

    const error = await loadMyDaySummary({ view: 'all' }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(MyDayApiError)
    expect(error).toMatchObject({ status: 403, message: 'Vista no permitida' })

    authenticatedFetch.mockResolvedValueOnce(new Response('oops', { status: 502 }))

    await expect(loadMyDayArrivals({ view: 'mine', limit: 20 })).rejects.toMatchObject({
      status: 502,
      message: 'La consulta respondió 502',
    })
  })
})
