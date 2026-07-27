import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessBrand,
} from '../entities/brand'

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
  BusinessSnapshotEngine,
} from './businessSnapshotEngine'

function createEngine():
  BusinessSnapshotEngine {
  const model =
    createMinimalBusinessModel()

  const brand: BusinessBrand = {
    id: 'BELDEN',
    name: 'Belden',
    revenue: 600,
    grossProfit: 150,
    quantity: 10,
    customers: new Set([
      'CUSTOMER-1',
      'CUSTOMER-2',
    ]),
    products: new Set([
      'PRODUCT-1',
      'PRODUCT-2',
      'PRODUCT-3',
    ]),
  }

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
        'CUSTOMER-2',
      ]),
      products: new Set([
        'PRODUCT-1',
        'PRODUCT-2',
        'PRODUCT-3',
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

  model.brands.set(
    brand.id,
    brand,
  )

  model.brandPeriods.set(
    period.id,
    period,
  )

  model.brandTargets.set(
    target.id,
    target,
  )

  return new BusinessSnapshotEngine(
    new BusinessRepository(model),
  )
}

describe(
  'BusinessSnapshotEngine',
  () => {
    it(
      'consolida identidad, hechos, objetivos y cumplimiento',
      () => {
        const snapshot =
          createEngine()
            .getBrandSnapshot(
              ' belden ',
              '2026-07',
              {
                elapsedWorkingDays: 10,
              },
            )

        expect(snapshot).toMatchObject({
          id: '2026-07::BELDEN',
          entityType: 'brand',
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
            customers: 2,
            products: 3,
            averageTicket: 150,
          },
          target: {
            revenue: 1_000,
            grossProfit: 200,
            grossMargin: 0.2,
            workingDays: 20,
          },
          attainment: {
            revenue: {
              actual: 600,
              target: 1_000,
              variance: -400,
              attainment: 0.6,
            },
            revenuePace: {
              projectedPeriodEnd: 1_200,
              status: 'ahead-of-plan',
            },
          },
        })

        expect(snapshot?.generatedAt)
          .toBe('2026-02-28T12:00:00.000Z')
      },
    )

    it(
      'construye un snapshot objetivo aun sin hechos mensuales',
      () => {
        const model =
          createMinimalBusinessModel()

        model.brandTargets.set(
          '2026-08::UNV',
          {
            id: '2026-08::UNV',
            brandId: 'UNV',
            periodId: '2026-08',
            targetRevenue: 900,
            targetGrossProfit: null,
            targetGrossMargin: null,
            workingDays: 18,
          },
        )

        const snapshot =
          new BusinessSnapshotEngine(
            new BusinessRepository(model),
          ).getBrandSnapshot(
            'UNV',
            '2026-08',
            {
              elapsedWorkingDays: 3,
            },
          )

        expect(snapshot).toMatchObject({
          brand: {
            id: 'UNV',
            name: 'UNV',
          },
          hasActual: false,
          hasTarget: true,
          actuals: {
            revenue: 0,
            grossProfit: 0,
            grossMargin: null,
            quantity: 0,
            documents: 0,
            customers: 0,
            products: 0,
            averageTicket: null,
          },
          attainment: {
            revenue: {
              actual: 0,
              target: 900,
              variance: -900,
              attainment: 0,
            },
          },
        })
      },
    )

    it(
      'construye snapshot de hechos sin objetivo declarado',
      () => {
        const model =
          createMinimalBusinessModel()

        model.brandPeriods.set(
          '2026-09::UNV',
          {
            id: '2026-09::UNV',
            brandId: 'UNV',
            periodId: '2026-09',
            revenue: 300,
            grossProfit: 60,
            quantity: 5,
            documents: 2,
            customers: new Set(),
            products: new Set(),
          },
        )

        const snapshot =
          new BusinessSnapshotEngine(
            new BusinessRepository(model),
          ).getBrandSnapshot(
            'UNV',
            '2026-09',
          )

        expect(snapshot).toMatchObject({
          hasActual: true,
          hasTarget: false,
          actuals: {
            revenue: 300,
            grossProfit: 60,
            grossMargin: 0.2,
            averageTicket: 150,
          },
          target: {
            revenue: null,
            grossProfit: null,
            grossMargin: null,
            workingDays: null,
          },
        })
      },
    )

    it(
      'devuelve undefined cuando no existe realidad ni objetivo',
      () => {
        expect(
          createEngine()
            .getBrandSnapshot(
              'UNV',
              '2026-10',
            ),
        ).toBeUndefined()
      },
    )
  },
)
