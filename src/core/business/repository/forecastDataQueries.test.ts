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

describe('FW-002 Forecast baseline queries', () => {
  it('expone proyecciones de portafolio, marca y producto con aislamiento', () => {
    const model = buildBusinessDataModel(
      [
        {
          ...row('2026-01-30'),
          revenue: 100,
          grossProfit: 25,
        },
        {
          ...row('2026-02-27'),
          revenue: 120,
          grossProfit: 30,
        },
        {
          ...row('2026-03-13'),
          revenue: 100,
          grossProfit: 25,
        },
      ],
      {
        brandTargets: [
          {
            brandId: 'UNV',
            periodId: '2026-03',
            targetRevenue: 300,
            workingDays: 22,
          },
        ],
      },
    )
    const queries = new ForecastDataQueries(model)

    const portfolio = queries.getPortfolioBaselineProjection()
    const brand = queries.findBaselineProjection('brand', 'unv')
    const products = queries.getBaselineProjections('product')

    expect(portfolio?.methodologyVersion).toBe('baseline-v1')
    expect(brand?.entityId).toBe('UNV')
    expect(products).toHaveLength(1)

    if (brand) {
      brand.confidence.signals.push('Mutación externa')
    }

    expect(
      queries.findBaselineProjection('brand', 'UNV')
        ?.confidence.signals,
    ).not.toContain('Mutación externa')
  })
})
