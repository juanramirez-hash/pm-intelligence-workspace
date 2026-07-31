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

function salesRow(
  date: string,
  revenue: number,
): NormalizedSalesRow {
  return {
    date,
    brand: 'UNV',
    revenue,
    grossProfit: revenue * 0.25,
    customerId: 'C-1',
    customerName: 'Cliente Uno',
    productName: 'CI111UNI21',
    productCode: 'CI111UNI21',
    model: 'IPC-A',
    quantity: 1,
    documentNumber: `F-${date}`,
    location: 'CDMX',
    salesRep: 'VENDEDOR 1',
    currency: 'MXN',
  }
}

describe('FW-001 Forecast Data Foundation', () => {
  it('define historia, granularidades, fuentes y escenarios sin calcular proyecciones', () => {
    const model = buildBusinessDataModel(
      [
        salesRow('2026-01-15', 100),
        salesRow('2026-02-15', 120),
        salesRow('2026-03-15', 150),
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

    expect(foundation.status).toBe('ready')
    expect(foundation.currentPeriodId).toBe('2026-03')
    expect(foundation.history.periodIds).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ])
    expect(foundation.history.baselinePeriodIds).toEqual([
      '2026-01',
      '2026-02',
    ])
    expect(
      foundation.granularities.find(
        (item) => item.granularity === 'brand',
      )?.status,
    ).toBe('ready')
    expect(
      foundation.granularities.find(
        (item) => item.granularity === 'product',
      )?.status,
    ).toBe('ready')
    expect(
      foundation.capabilities.find(
        (item) => item.id === 'target-pace',
      )?.status,
    ).toBe('ready')
    expect(
      foundation.sources.find(
        (item) => item.id === 'purchasing',
      )?.status,
    ).toBe('planned')
    expect(
      foundation.scenarios.map((scenario) => scenario.id),
    ).toEqual([
      'conservative',
      'expected',
      'accelerated',
    ])
    expect(foundation).not.toHaveProperty('projectedRevenue')
  })

  it('marca historia limitada y detecta periodos mensuales faltantes', () => {
    const model = buildBusinessDataModel([
      salesRow('2026-01-15', 100),
      salesRow('2026-03-15', 150),
    ])

    const foundation = buildForecastDataFoundation(model)

    expect(foundation.status).toBe('partial')
    expect(foundation.history.missingPeriodIds).toEqual([
      '2026-02',
    ])
    expect(foundation.quality.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'LIMITED_HISTORY',
        }),
        expect.objectContaining({
          code: 'NON_CONSECUTIVE_HISTORY',
        }),
      ]),
    )
  })

  it('declara la fundacion no disponible cuando no existen ventas', () => {
    const model = buildBusinessDataModel([])

    const foundation = buildForecastDataFoundation(model)

    expect(foundation.available).toBe(false)
    expect(foundation.status).toBe('unavailable')
    expect(foundation.quality.blockingIssues).toBe(1)
    expect(foundation.quality.issues[0]?.code).toBe(
      'NO_SALES_HISTORY',
    )
  })
})
