import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessBrandPeriod,
} from '../entities/brandPeriod'

import type {
  BusinessBrandTarget,
} from '../entities/brandTarget'

import {
  BusinessRepository,
} from '../repository'

import {
  createMinimalBusinessModel,
} from '../testing/createMinimalBusinessModel'

import {
  TargetAttainmentEngine,
} from './targetAttainmentEngine'

function createEngine():
  TargetAttainmentEngine {
  const model =
    createMinimalBusinessModel()

  const period:
    BusinessBrandPeriod = {
      id: '2026-07::BELDEN',
      brandId: 'BELDEN',
      periodId: '2026-07',
      revenue: 600,
      grossProfit: 150,
      quantity: 10,
      documents: 4,
      customers: new Set([
        'CUSTOMER-1',
      ]),
      products: new Set([
        'PRODUCT-1',
      ]),
    }

  const target:
    BusinessBrandTarget = {
      id: '2026-07::BELDEN',
      brandId: 'BELDEN',
      periodId: '2026-07',
      targetRevenue: 1_000,
      targetGrossProfit: 200,
      targetGrossMargin: 0.2,
      workingDays: 20,
    }

  model.brandPeriods.set(
    period.id,
    period,
  )

  model.brandTargets.set(
    target.id,
    target,
  )

  return new TargetAttainmentEngine(
    new BusinessRepository(model),
  )
}

describe(
  'TargetAttainmentEngine',
  () => {
    it(
      'calcula cumplimiento, variaciones y ritmo esperado',
      () => {
        const result =
          createEngine()
            .calculateBrandAttainment(
              ' belden ',
              '2026-07',
              {
                elapsedWorkingDays: 10,
              },
            )

        expect(result).toMatchObject({
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
        })

        expect(
          result?.grossMargin.variance,
        ).toBeCloseTo(0.05)
      },
    )

    it(
      'marca como logrado cuando la venta alcanza el objetivo total',
      () => {
        const model =
          createMinimalBusinessModel()

        const period:
          BusinessBrandPeriod = {
            id: '2026-08::UNV',
            brandId: 'UNV',
            periodId: '2026-08',
            revenue: 1_100,
            grossProfit: 220,
            quantity: 1,
            documents: 1,
            customers: new Set(),
            products: new Set(),
          }

        const target:
          BusinessBrandTarget = {
            id: '2026-08::UNV',
            brandId: 'UNV',
            periodId: '2026-08',
            targetRevenue: 1_000,
            targetGrossProfit: null,
            targetGrossMargin: null,
            workingDays: 20,
          }

        model.brandPeriods.set(
          period.id,
          period,
        )

        model.brandTargets.set(
          target.id,
          target,
        )

        const achievedEngine =
          new TargetAttainmentEngine(
            new BusinessRepository(model),
          )

        expect(
          achievedEngine
            .calculateBrandAttainment(
              'UNV',
              '2026-08',
              {
                elapsedWorkingDays: 15,
              },
            )
            ?.revenuePace.status,
        ).toBe('achieved')
      },
    )

    it(
      'permite evaluar un objetivo aun sin hechos del periodo',
      () => {
        const model =
          createMinimalBusinessModel()

        const target:
          BusinessBrandTarget = {
            id: '2026-09::UNV',
            brandId: 'UNV',
            periodId: '2026-09',
            targetRevenue: 900,
            targetGrossProfit: null,
            targetGrossMargin: null,
            workingDays: 18,
          }

        model.brandTargets.set(
          target.id,
          target,
        )

        const engine =
          new TargetAttainmentEngine(
            new BusinessRepository(model),
          )

        const result =
          engine.calculateBrandAttainment(
            'UNV',
            '2026-09',
            {
              elapsedWorkingDays: 3,
            },
          )

        expect(result?.hasActual)
          .toBe(false)

        expect(result?.revenue)
          .toEqual({
            actual: 0,
            target: 900,
            variance: -900,
            attainment: 0,
          })

        expect(result?.revenuePace.status)
          .toBe('behind-plan')
      },
    )

    it(
      'no inventa ritmo cuando los dias transcurridos son invalidos',
      () => {
        const result =
          createEngine()
            .calculateBrandAttainment(
              'BELDEN',
              '2026-07',
              {
                elapsedWorkingDays: 21,
              },
            )

        expect(result?.revenuePace)
          .toEqual({
            workingDays: 20,
            elapsedWorkingDays: null,
            expectedToDate: null,
            varianceToPlan: null,
            attainmentToPlan: null,
            projectedPeriodEnd: null,
            status: 'not-evaluable',
          })
      },
    )

    it(
      'devuelve undefined cuando no existen hechos ni objetivo',
      () => {
        expect(
          createEngine()
            .calculateBrandAttainment(
              'UNV',
              '2026-10',
            ),
        ).toBeUndefined()
      },
    )
  },
)
