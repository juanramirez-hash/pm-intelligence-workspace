// MB-001: API paths and messages, URL helpers, Excel sheet and the guarantee
// that the brand page never reads the /api/data/* datasets.

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BrandsApiError,
  brandsErrorMessage,
  brandsPath,
  loadBrandCustomers,
  loadBrandDirectory,
  loadBrandHeader,
  loadBrandProducts,
  loadBrandSales,
  loadBrandSalesExport,
} from './api/brandsApi'
import { tabOfPath } from './components/brandContext'
import {
  EXPORT_TRUNCATED_NOTICE,
  buildExportSheet,
  exportFileName,
} from './export/exportBrandDetail'
import {
  annualTargetNote,
  brandForecastPath,
  brandReasonMessage,
  brandSegment,
  brandTabPath,
  describeDates,
  marginPointsText,
  readPeriodParam,
  shortMonthLabel,
  variationText,
} from './format/brandsFormat'

describe('MB-001 URL helpers', () => {
  it('uses the brand name of the page for the tabs and keeps the key as a fallback', () => {
    expect(brandSegment('UNVUNIVIEW', 'unv (uniview)')).toBe('UNV (UNIVIEW)')
    expect(brandSegment('UNVUNIVIEW', null)).toBe('UNVUNIVIEW')
    expect(brandTabPath('UNVUNIVIEW', 'UNV (UNIVIEW)', 'clientes')).toBe('/brands/UNV%20(UNIVIEW)/clientes')
    expect(brandTabPath('X', 'X', 'ventas', '2026-09')).toBe('/brands/X/ventas?period=2026-09')
    expect(brandForecastPath('UNVUNIVIEW', 'UNV (UNIVIEW)')).toBe('/forecast?brand=UNV%20(UNIVIEW)')
  })

  it('reads only a YYYY-MM period', () => {
    expect(readPeriodParam('2026-11')).toBe('2026-11')
    expect(readPeriodParam('2026-13')).toBeNull()
    expect(readPeriodParam('noviembre')).toBeNull()
    expect(readPeriodParam(null)).toBeNull()
  })

  it('finds the tab of an address', () => {
    expect(tabOfPath('/brands/X/ventas')).toBe('ventas')
    expect(tabOfPath('/brands/X/inteligencia')).toBe('inteligencia')
    expect(tabOfPath('/brands/X')).toBeNull()
  })
})

describe('MB-001 texts', () => {
  it('missing values are "—"', () => {
    expect(variationText(null)).toBe('—')
    expect(variationText({ amount: null, percentage: null })).toBe('—')
    expect(variationText({ amount: 1, percentage: 0.5 })).toBe('+50.0%')
    expect(marginPointsText(null)).toBe('—')
    expect(marginPointsText(1.234)).toBe('+1.2 pp')
    expect(marginPointsText(-0.5)).toBe('-0.5 pp')
    expect(describeDates(null, '2026-11-24')).toBe('—')
    expect(describeDates('2026-11-01', '2026-11-24', 1)).toBe('1 nov 2026 – 24 nov 2026 · 1 día hábil')
    expect(shortMonthLabel('2026-03')).toBe('mar 26')
  })

  it('says "N de 12 meses" only when the quota is incomplete', () => {
    expect(annualTargetNote(null)).toBeNull()
    expect(annualTargetNote({ revenue: 1, monthsWithTarget: 12, monthsInYear: 12, complete: true, projectedAttainment: null, ytdAttainment: null })).toBeNull()
    expect(annualTargetNote({ revenue: 1, monthsWithTarget: 10, monthsInYear: 12, complete: false, projectedAttainment: null, ytdAttainment: null })).toBe('Cuota de 10 de 12 meses')
  })

  it('explains the server reasons', () => {
    expect(brandReasonMessage(undefined)).toBeNull()
    expect(brandReasonMessage('no-sales-data')).toBe('No hay ventas cargadas.')
    expect(brandReasonMessage('otra-razon')).toBe('Sin datos para mostrar.')
  })

  it('403 keeps the server message and 404 says the brand was not found', () => {
    expect(brandsErrorMessage(403, 'Marca fuera del alcance del usuario')).toBe('Marca fuera del alcance del usuario')
    expect(brandsErrorMessage(403, null)).toBe('Marca fuera del alcance del usuario')
    expect(brandsErrorMessage(404, 'Marca no encontrada')).toBe('Marca no encontrada')
    expect(brandsErrorMessage(500, null)).toBe('La consulta respondió 500')
  })
})

describe('MB-001 Excel sheet', () => {
  const response = {
    columns: [
      { key: 'saleDate', label: 'Fecha' },
      { key: 'revenue', label: 'Venta' },
      { key: 'model', label: 'Modelo' },
    ],
    rows: [
      { saleDate: '2026-11-02', revenue: 100, model: null, grossProfit: 20 },
      { saleDate: '2026-11-03', revenue: 50, model: 'M1', grossProfit: null },
    ],
  }

  it('writes the header and one row per line in the order of the server columns', () => {
    expect(buildExportSheet(response)).toEqual([
      ['Fecha', 'Venta', 'Modelo'],
      ['2026-11-02', 100, null],
      ['2026-11-03', 50, 'M1'],
    ])
  })

  it('never writes a column the server did not send (cost columns hidden)', () => {
    const sheet = buildExportSheet(response)

    expect(sheet[0]).not.toContain('Utilidad bruta')
    expect(sheet.flat()).not.toContain(20)
  })

  it('names the file by brand and period, and has a truncation notice', () => {
    expect(exportFileName('UNV (UNIVIEW)', '2026-11')).toBe('detalle-ventas-UNV_UNIVIEW_-2026-11.xlsx')
    expect(exportFileName('X', null)).toBe('detalle-ventas-X-sin-periodo.xlsx')
    expect(EXPORT_TRUNCATED_NOTICE).toContain('incompleto')
  })
})

describe('MB-001 server calls', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stubFetch(status = 200, body: unknown = { ok: true }) {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }))

    vi.stubGlobal('fetch', fetchMock)

    return fetchMock
  }

  it('builds the query without empty values', () => {
    expect(brandsPath('/api/brands', { a: 1, b: '', c: null, d: undefined, e: 'x y' })).toBe('/api/brands?a=1&e=x+y')
    expect(brandsPath('/api/brands')).toBe('/api/brands')
  })

  it('only calls /api/brands endpoints, never /api/data/*', async () => {
    const fetchMock = stubFetch()

    await loadBrandDirectory({ view: 'all', period: '2026-10', q: ' unv ', sales: 'with', sort: 'name', limit: 50, offset: 50 })
    await loadBrandHeader('UNV (UNIVIEW)', '2026-11')
    await loadBrandSales('UNV (UNIVIEW)', { period: '2026-11', sections: ['comparison', 'yoy', 'series', 'documents'], limit: 50 })
    await loadBrandSalesExport('UNV (UNIVIEW)', '2026-11')
    await loadBrandCustomers('UNV (UNIVIEW)', { period: null, filter: 'suben', limit: 50, offset: 0 })
    await loadBrandProducts('UNV (UNIVIEW)', { period: null, filter: 'agotados', limit: 50, offset: 0 })

    const urls = fetchMock.mock.calls.map((call) => String((call as unknown[])[0]))

    expect(urls).toEqual([
      '/api/brands?view=all&period=2026-10&q=unv&sales=with&sort=name&limit=50&offset=50',
      '/api/brands/UNV%20(UNIVIEW)?period=2026-11',
      '/api/brands/UNV%20(UNIVIEW)/sales?period=2026-11&sections=comparison%2Cyoy%2Cseries%2Cdocuments&limit=50',
      '/api/brands/UNV%20(UNIVIEW)/sales/export?period=2026-11',
      '/api/brands/UNV%20(UNIVIEW)/customers?filter=suben&limit=50',
      '/api/brands/UNV%20(UNIVIEW)/products?filter=agotados&limit=50',
    ])
    expect(urls.some((url) => url.startsWith('/api/data'))).toBe(false)
  })

  it('does not send view=mine nor the default sort', async () => {
    const fetchMock = stubFetch()

    await loadBrandDirectory({ view: 'mine', sort: 'revenue', limit: 50, offset: 0 })

    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe('/api/brands?limit=50')
  })

  it('turns a 403 and a 404 into errors with their status and message', async () => {
    stubFetch(403, { error: 'Marca fuera del alcance del usuario' })

    await expect(loadBrandHeader('HIKVISION', null)).rejects.toMatchObject({
      status: 403,
      message: 'Marca fuera del alcance del usuario',
    })

    stubFetch(404, { error: 'Marca no encontrada' })

    const error = await loadBrandHeader('NADA', null).catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(BrandsApiError)
    expect((error as BrandsApiError).status).toBe(404)
    expect((error as BrandsApiError).message).toBe('Marca no encontrada')
  })
})
