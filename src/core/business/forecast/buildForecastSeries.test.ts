import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../builders'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import {
  buildForecastSeries,
} from './buildForecastSeries'

function row(
  date: string,
  brand: string,
  productName: string,
  revenue: number,
): NormalizedSalesRow {
  return {
    date,
    brand,
    revenue,
    grossProfit: revenue * 0.2,
    customerId: 'C-1',
    customerName: 'Cliente Uno',
    productName,
    productCode: productName,
    model: productName,
    quantity: 1,
    documentNumber: `${brand}-${date}`,
    location: 'CDMX',
    salesRep: null,
    currency: 'MXN',
  }
}

describe('FW-001 Forecast series contracts', () => {
  it('materializa observaciones mensuales sin producir escenarios calculados', () => {
    const model = buildBusinessDataModel([
      row('2026-02-15', 'UNV', 'P-1', 120),
      row('2026-01-15', 'UNV', 'P-1', 100),
      row('2026-01-20', 'ZKTECO', 'P-2', 80),
    ])

    const portfolio = buildForecastSeries(model, 'portfolio')
    const brands = buildForecastSeries(model, 'brand')
    const products = buildForecastSeries(model, 'product')

    expect(portfolio[0]?.observations).toEqual([
      expect.objectContaining({
        periodId: '2026-01',
        revenue: 180,
      }),
      expect.objectContaining({
        periodId: '2026-02',
        revenue: 120,
      }),
    ])
    expect(
      brands.find((series) => series.entityId === 'UNV')
        ?.observations,
    ).toHaveLength(2)
    expect(products).toHaveLength(2)
    expect(portfolio[0]).not.toHaveProperty('forecastValue')
  })
})
