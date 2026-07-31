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
  buildForecastDataFoundation,
} from './buildForecastDataFoundation'

import {
  buildForecastSeries,
} from './buildForecastSeries'

import {
  ForecastBaselineEngine,
} from './forecastBaselineEngine'

function row(
  date: string,
  revenue: number,
  quantity: number,
  productName = 'P-1',
): NormalizedSalesRow {
  return {
    date,
    brand: 'UNV',
    revenue,
    grossProfit: revenue * 0.25,
    customerId: 'C-1',
    customerName: 'Cliente Uno',
    productName,
    productCode: productName,
    model: productName,
    quantity,
    documentNumber: `${productName}-${date}`,
    location: 'CDMX',
    salesRep: null,
    currency: 'MXN',
  }
}

describe('FW-002 Forecast Baseline Engine', () => {
  it('combina ritmo, promedio y tendencia para proyectar el cierre', () => {
    const model = buildBusinessDataModel(
      [
        row('2026-01-30', 100, 10),
        row('2026-02-27', 120, 12),
        row('2026-03-13', 100, 10),
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
    const foundation = buildForecastDataFoundation(model)
    const series = buildForecastSeries(model, 'portfolio')[0]
    const projection = series
      ? new ForecastBaselineEngine(model, foundation).project(series)
      : undefined

    expect(projection).toBeDefined()
    expect(projection?.timing).toEqual({
      periodStatus: 'in-progress',
      totalWorkingDays: 22,
      elapsedWorkingDays: 10,
      remainingWorkingDays: 12,
      progress: 0.4545,
    })
    expect(
      projection?.methods.find((method) => method.id === 'run-rate')?.values,
    ).toEqual({
      revenue: 220,
      grossProfit: 55,
      quantity: 22,
    })
    expect(projection?.historical.average?.revenue).toBe(110)
    expect(projection?.historical.recentTrendRate).toBe(0.1667)
    expect(projection?.expected.revenue).toBe(176.13)
    expect(projection?.expectedGrossMargin).toBe(0.25)
    expect(projection?.target).toEqual({
      revenue: 300,
      expectedAttainment: 0.5871,
      revenueGap: 200,
      requiredDailyRevenue: 16.67,
      status: 'behind',
    })
    expect(projection?.confidence.level).toBe('medium')
    expect(
      projection?.scenarios.map((scenario) => scenario.id),
    ).toEqual([
      'conservative',
      'expected',
      'accelerated',
    ])
    expect(
      projection?.scenarios[0]?.values.revenue,
    ).toBeLessThan(projection?.expected.revenue ?? 0)
    expect(
      projection?.scenarios[2]?.values.revenue,
    ).toBeGreaterThan(projection?.expected.revenue ?? 0)
  })

  it('incorpora meses sin actividad como cero en el baseline por producto', () => {
    const model = buildBusinessDataModel(
      [
        row('2026-01-30', 100, 10, 'P-1'),
        row('2026-02-27', 200, 20, 'P-2'),
        row('2026-03-13', 50, 5, 'P-1'),
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
    const foundation = buildForecastDataFoundation(model)
    const series = buildForecastSeries(model, 'product').find(
      (candidate) => candidate.entityId === 'P-1',
    )
    const projection = series
      ? new ForecastBaselineEngine(model, foundation).project(series)
      : undefined

    expect(projection?.historical.lookbackPeriodIds).toEqual([
      '2026-01',
      '2026-02',
    ])
    expect(projection?.historical.average?.revenue).toBe(50)
    expect(projection?.target.revenue).toBeNull()
    expect(projection?.target.status).toBe('unavailable')
  })

  it('converge al valor real cuando el periodo está cerrado', () => {
    const model = buildBusinessDataModel(
      [
        row('2026-01-30', 100, 10),
        row('2026-02-27', 120, 12),
        row('2026-03-31', 250, 25),
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
    const foundation = buildForecastDataFoundation(model)
    const series = buildForecastSeries(model, 'portfolio')[0]
    const projection = series
      ? new ForecastBaselineEngine(model, foundation).project(series)
      : undefined

    expect(projection?.timing.periodStatus).toBe('closed')
    expect(projection?.expected.revenue).toBe(250)
    expect(
      new Set(
        projection?.scenarios.map(
          (scenario) => scenario.values.revenue,
        ),
      ),
    ).toEqual(new Set([250]))
  })
})
