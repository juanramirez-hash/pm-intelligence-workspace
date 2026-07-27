import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessBrandSnapshot,
} from '../snapshots'

import {
  BusinessHealthScoreEngine,
} from './healthScoreEngine'

function createSnapshot(): BusinessBrandSnapshot {
  return {
    id: '2026-07::BELDEN',
    entityType: 'brand',
    generatedAt: '2026-07-26T12:00:00.000Z',
    brand: {
      id: 'BELDEN',
      name: 'Belden',
    },
    periodId: '2026-07',
    hasActual: true,
    hasTarget: true,
    actuals: {
      revenue: 600,
      grossProfit: 150,
      grossMargin: 0.25,
      quantity: 10,
      documents: 4,
      customers: 8,
      products: 15,
      averageTicket: 150,
    },
    target: {
      revenue: 1_000,
      grossProfit: 200,
      grossMargin: 0.2,
      workingDays: 20,
    },
    attainment: {
      id: '2026-07::BELDEN',
      brandId: 'BELDEN',
      periodId: '2026-07',
      hasActual: true,
      hasTarget: true,
      revenue: {
        actual: 600,
        target: 1_000,
        variance: -400,
        attainment: 0.6,
      },
      grossProfit: {
        actual: 150,
        target: 200,
        variance: -50,
        attainment: 0.75,
      },
      grossMargin: {
        actual: 0.25,
        target: 0.2,
        variance: 0.05,
        attainment: 1.25,
      },
      revenuePace: {
        workingDays: 20,
        elapsedWorkingDays: 10,
        expectedToDate: 500,
        varianceToPlan: 100,
        attainmentToPlan: 1.2,
        projectedPeriodEnd: 1_200,
        status: 'ahead-of-plan',
      },
    },
  }
}

describe(
  'BusinessHealthScoreEngine',
  () => {
    it(
      'calcula un score explicable y renormaliza sólo componentes evaluables',
      () => {
        const result =
          new BusinessHealthScoreEngine()
            .calculate(createSnapshot())

        expect(result).toMatchObject({
          id: '2026-07::BELDEN::health',
          snapshotId: '2026-07::BELDEN',
          entityType: 'brand',
          generatedAt:
            '2026-07-26T12:00:00.000Z',
          evaluatedWeight: 85,
          totalConfiguredWeight: 100,
          score: 82.4,
          classification: {
            grade: 'healthy',
          },
        })

        expect(
          result.components.find(
            (component) =>
              component.id === 'customers',
          ),
        ).toMatchObject({
          normalizedScore: null,
          status: 'not-evaluable',
        })

        expect(
          result.recommendations.map(
            (recommendation) =>
              recommendation.componentId,
          ),
        ).toContain('revenue')
      },
    )

    it(
      'evalúa amplitud y tendencia cuando recibe benchmarks explícitos',
      () => {
        const result =
          new BusinessHealthScoreEngine()
            .calculate(
              createSnapshot(),
              {
                benchmarks: {
                  minimumCustomers: 10,
                  minimumProducts: 20,
                  revenueTrendRatio: 0.9,
                },
              },
            )

        expect(result.evaluatedWeight)
          .toBe(100)

        expect(
          result.components.find(
            (component) =>
              component.id === 'customers',
          ),
        ).toMatchObject({
          rawValue: 8,
          benchmark: 10,
          normalizedScore: 80,
          status: 'stable',
        })

        expect(
          result.components.find(
            (component) =>
              component.id === 'trend',
          ),
        ).toMatchObject({
          rawValue: 0.9,
          benchmark: 1,
          normalizedScore: 90,
          status: 'strong',
        })
      },
    )

    it(
      'permite sustituir pesos sin modificar el motor',
      () => {
        const result =
          new BusinessHealthScoreEngine()
            .calculate(
              createSnapshot(),
              {
                weights: {
                  revenue: 100,
                  grossProfit: 0,
                  margin: 0,
                  forecast: 0,
                  pace: 0,
                  customers: 0,
                  products: 0,
                  trend: 0,
                },
              },
            )

        expect(result.score).toBe(60)
        expect(result.evaluatedWeight).toBe(100)
      },
    )
  },
)
