// NAV-001: "Datos al corte" of the top bar.

import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authenticatedFetch = vi.hoisted(() => vi.fn())

vi.mock('../../shared/http/authenticatedFetch', () => ({
  authenticatedFetch,
}))

import { DataCutoffBadgeView } from './DataCutoffBadge'
import {
  DATA_CUTOFF_PATH,
  loadDataCutoff,
  summarizeDataCutoff,
  type DataCutoffResponse,
} from './dataCutoffApi'

const source = (referenceDate: string | null, stale: boolean) => ({
  lastImportedAt: referenceDate ? `${referenceDate}T15:00:00.000Z` : null,
  dataCutoff: null,
  referenceDate,
  daysSince: stale ? 93 : 1,
  status: referenceDate ? (stale ? 'stale' as const : 'up-to-date' as const) : 'no-data' as const,
  stale: referenceDate ? stale : null,
})

const DATA: DataCutoffResponse = {
  ok: true,
  salesCutoff: '2026-11-24',
  staleAfterDays: 7,
  anyStale: true,
  sources: {
    sales: source('2026-11-24', false),
    inventory: source('2026-11-26', false),
    purchases: source('2026-08-26', true),
  },
}

beforeEach(() => {
  authenticatedFetch.mockReset()
})

describe('NAV-001 data cutoff', () => {
  it('shows the sales cutoff and every source date in the tooltip', () => {
    expect(summarizeDataCutoff(DATA)).toEqual({
      label: 'Datos al corte: 24 nov 2026',
      tooltip: 'Ventas al 24 nov 2026 · Inventario al 26 nov 2026 · Compras al 26 ago 2026 (atrasado, más de 7 días)',
      stale: true,
    })
  })

  it('never invents a date while loading, on error or without data', () => {
    expect(summarizeDataCutoff(null).label).toBe('Datos al corte: …')
    expect(summarizeDataCutoff(null, true).label).toBe('Datos al corte: sin dato')
    expect(summarizeDataCutoff({
      ...DATA,
      salesCutoff: null,
      anyStale: false,
      sources: { ...DATA.sources, purchases: source(null, false) },
    })).toMatchObject({
      label: 'Datos al corte: —',
      stale: false,
      tooltip: expect.stringContaining('Compras: sin datos cargados'),
    })
  })

  it('marks a stale source with an amber dot', () => {
    const stale = renderToStaticMarkup(<DataCutoffBadgeView data={DATA} failed={false} />)
    const fresh = renderToStaticMarkup(<DataCutoffBadgeView data={{ ...DATA, anyStale: false }} failed={false} />)

    expect(stale).toContain('data-data-cutoff-stale="true"')
    expect(stale).toContain('Datos al corte: 24 nov 2026')
    expect(stale).toContain('title="Ventas al 24 nov 2026')
    expect(fresh).not.toContain('data-data-cutoff-stale')
  })

  it('reads only /api/status/data-cutoff through authenticatedFetch', async () => {
    authenticatedFetch.mockResolvedValue(new Response(JSON.stringify(DATA), { status: 200 }))

    expect(await loadDataCutoff()).toEqual(DATA)
    expect(DATA_CUTOFF_PATH).toBe('/api/status/data-cutoff')
    expect(authenticatedFetch.mock.calls[0]?.[0]).toBe('/api/status/data-cutoff')

    authenticatedFetch.mockResolvedValue(new Response('{}', { status: 500 }))

    await expect(loadDataCutoff()).rejects.toThrow('La consulta respondió 500')
  })
})
