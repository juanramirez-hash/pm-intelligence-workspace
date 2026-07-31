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
  ForecastDataQueries,
} from './forecastDataQueries'

function row(
  date: string,
): NormalizedSalesRow {
  return {
    date,
    brand: 'UNV',
    revenue: 100,
    grossProfit: 25,
    customerId: 'C-1',
    customerName: 'Cliente Uno',
    productName: 'CI111UNI21',
    productCode: 'CI111UNI21',
    model: 'IPC-A',
    quantity: 1,
    documentNumber: `F-${date}`,
    location: 'CDMX',
    salesRep: null,
    currency: 'MXN',
  }
}

describe('FW-001 ForecastDataQueries', () => {
  it('expone el contrato oficial desde BusinessRepository y aísla colecciones', () => {
    const model = buildBusinessDataModel([
      row('2026-01-15'),
      row('2026-02-15'),
      row('2026-03-15'),
    ])
    const queries = new ForecastDataQueries(model)

    const first = queries.getFoundation()
    first.history.periodIds.push('2099-12')
    first.sources[0]?.notes.push('Mutación externa')

    const second = queries.getFoundation()

    expect(second.history.periodIds).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ])
    expect(second.sources[0]?.notes).not.toContain(
      'Mutación externa',
    )
    expect(
      queries.findCapability('product-demand')?.status,
    ).toBe('ready')
    expect(
      queries.findGranularity('customer')?.priority,
    ).toBe('secondary')
    expect(
      queries.findSource('purchasing')?.status,
    ).toBe('planned')
    expect(
      queries.findSeries('brand', 'unv')?.observations.map(
        (observation) => observation.periodId,
      ),
    ).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ])
    expect(
      queries.getSeries('portfolio')[0]?.observations[0]?.revenue,
    ).toBe(100)
  })
})
