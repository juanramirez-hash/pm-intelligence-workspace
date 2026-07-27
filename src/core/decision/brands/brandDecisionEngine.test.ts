import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessDataModel,
} from '../../business'

import {
  BusinessRepository,
} from '../../business'

import {
  BrandDecisionEngine,
} from './brandDecisionEngine'

import {
  buildBrandWorkspaceViewModel,
} from './brandWorkspaceViewModel'

function createModel(): BusinessDataModel {
  return {
    generatedAt:
      '2026-07-26T12:00:00.000Z',
    periodStart: '2026-04-01',
    periodEnd: '2026-07-20',
    totals: {
      revenue: 160,
      grossProfit: 48,
      quantity: 16,
      documents: 3,
    },
    customers: new Map([
      [
        'C001',
        {
          id: 'C001',
          name: 'Cliente activo',
          firstPurchase: '2026-06-01',
          lastPurchase: '2026-07-10',
          revenue: 130,
          grossProfit: 39,
          quantity: 13,
          documents: 2,
          brands: new Set(['BRAND']),
          products: new Set(['P001']),
          locations: new Set(['CDMX']),
        },
      ],
      [
        'C002',
        {
          id: 'C002',
          name: 'Cliente perdido',
          firstPurchase: '2026-06-01',
          lastPurchase: '2026-06-01',
          revenue: 30,
          grossProfit: 9,
          quantity: 3,
          documents: 1,
          brands: new Set(['BRAND']),
          products: new Set(['P002']),
          locations: new Set(['CDMX']),
        },
      ],
    ]),
    customerPeriods: new Map([
      [
        '2026-04::C002',
        {
          id: '2026-04::C002',
          customerId: 'C002',
          periodId: '2026-04',
          revenue: 30,
          grossProfit: 9,
          quantity: 3,
          documents: 1,
          brands: new Set(['BRAND']),
          products: new Set(['P002']),
        },
      ],
      [
        '2026-06::C001',
        {
          id: '2026-06::C001',
          customerId: 'C001',
          periodId: '2026-06',
          revenue: 70,
          grossProfit: 21,
          quantity: 7,
          documents: 1,
          brands: new Set(['BRAND']),
          products: new Set(['P001']),
        },
      ],
      [
        '2026-06::C002',
        {
          id: '2026-06::C002',
          customerId: 'C002',
          periodId: '2026-06',
          revenue: 30,
          grossProfit: 9,
          quantity: 3,
          documents: 1,
          brands: new Set(['BRAND']),
          products: new Set(['P002']),
        },
      ],
      [
        '2026-07::C001',
        {
          id: '2026-07::C001',
          customerId: 'C001',
          periodId: '2026-07',
          revenue: 60,
          grossProfit: 18,
          quantity: 6,
          documents: 1,
          brands: new Set(['BRAND']),
          products: new Set(['P001']),
        },
      ],
    ]),
    customerBrandPeriods: new Map(),
    brands: new Map([
      [
        'BRAND',
        {
          id: 'BRAND',
          name: 'Marca Demo',
          revenue: 160,
          grossProfit: 48,
          quantity: 16,
          customers: new Set([
            'C001',
            'C002',
          ]),
          products: new Set([
            'P001',
            'P002',
          ]),
        },
      ],
    ]),
    brandPeriods: new Map([
      [
        '2026-04::BRAND',
        {
          id: '2026-04::BRAND',
          brandId: 'BRAND',
          periodId: '2026-04',
          revenue: 30,
          grossProfit: 9,
          quantity: 3,
          documents: 1,
          customers: new Set(['C002']),
          products: new Set(['P002']),
        },
      ],
      [
        '2026-05::BRAND',
        {
          id: '2026-05::BRAND',
          brandId: 'BRAND',
          periodId: '2026-05',
          revenue: 70,
          grossProfit: 21,
          quantity: 7,
          documents: 1,
          customers: new Set(['C001']),
          products: new Set(['P001']),
        },
      ],
      [
        '2026-06::BRAND',
        {
          id: '2026-06::BRAND',
          brandId: 'BRAND',
          periodId: '2026-06',
          revenue: 100,
          grossProfit: 30,
          quantity: 10,
          documents: 2,
          customers: new Set(['C001']),
          products: new Set(['P001']),
        },
      ],
      [
        '2026-07::BRAND',
        {
          id: '2026-07::BRAND',
          brandId: 'BRAND',
          periodId: '2026-07',
          revenue: 60,
          grossProfit: 18,
          quantity: 6,
          documents: 1,
          customers: new Set(['C001']),
          products: new Set(['P001']),
        },
      ],
    ]),
    brandTargets: new Map([
      [
        '2026-07::BRAND',
        {
          id: '2026-07::BRAND',
          brandId: 'BRAND',
          periodId: '2026-07',
          targetRevenue: 100,
          targetGrossProfit: 30,
          targetGrossMargin: 0.35,
          workingDays: 22,
        },
      ],
    ]),

    productPeriods: new Map(),

    products: new Map([
      [
        'P001',
        {
          id: 'P001',
          model: 'Modelo activo',
          brand: 'BRAND',
          revenue: 130,
          grossProfit: 39,
          quantity: 13,
          customers: new Set(['C001']),
        },
      ],
      [
        'P002',
        {
          id: 'P002',
          model: 'Modelo perdido',
          brand: 'BRAND',
          revenue: 30,
          grossProfit: 9,
          quantity: 3,
          customers: new Set(['C002']),
        },
      ],
    ]),
    periods: new Map([
      [
        '2026-04',
        {
          id: '2026-04',
          year: 2026,
          month: 4,
          periodStart: '2026-04-01',
          periodEnd: '2026-04-30',
          revenue: 30,
          grossProfit: 9,
          quantity: 3,
          documents: 1,
          customers: new Set(['C002']),
          brands: new Set(['BRAND']),
          products: new Set(['P002']),
        },
      ],
      [
        '2026-05',
        {
          id: '2026-05',
          year: 2026,
          month: 5,
          periodStart: '2026-05-01',
          periodEnd: '2026-05-31',
          revenue: 70,
          grossProfit: 21,
          quantity: 7,
          documents: 1,
          customers: new Set(['C001']),
          brands: new Set(['BRAND']),
          products: new Set(['P001']),
        },
      ],
      [
        '2026-06',
        {
          id: '2026-06',
          year: 2026,
          month: 6,
          periodStart: '2026-06-01',
          periodEnd: '2026-06-30',
          revenue: 100,
          grossProfit: 30,
          quantity: 10,
          documents: 2,
          customers: new Set([
            'C001',
            'C002',
          ]),
          brands: new Set(['BRAND']),
          products: new Set([
            'P001',
            'P002',
          ]),
        },
      ],
      [
        '2026-07',
        {
          id: '2026-07',
          year: 2026,
          month: 7,
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          revenue: 60,
          grossProfit: 18,
          quantity: 6,
          documents: 1,
          customers: new Set(['C001']),
          brands: new Set(['BRAND']),
          products: new Set(['P001']),
        },
      ],
    ]),
    documentNumbers: new Set([
      'D001',
      'D002',
      'D003',
    ]),
    locations: new Set(['CDMX']),
    salesRepresentatives: new Set(),
    currencies: new Set(['MXN']),
    processedRows: 3,
    ignoredRows: 0,
  }
}

describe(
  'BrandDecisionEngine',
  () => {
    it(
      'builds a consolidated brand decision model',
      () => {
        const repository =
          new BusinessRepository(
            createModel(),
          )

        const engine =
          new BrandDecisionEngine(
            repository,
          )

        const decision = engine.evaluate(
          'BRAND',
          '2026-07',
        )

        expect(decision).toBeDefined()
        expect(decision?.brandName).toBe(
          'Marca Demo',
        )
        expect(
          decision?.previousPeriodId,
        ).toBe('2026-06')
        expect(
          decision?.lostCustomers,
        ).toEqual([
          expect.objectContaining({
            customerId: 'C002',
            customerName:
              'Cliente perdido',
            previousRevenue: 30,
          }),
        ])
        expect(
          decision?.lostProducts,
        ).toEqual([
          {
            productId: 'P002',
            productModel:
              'Modelo perdido',
          },
        ])
        expect(decision?.lossEvaluation).toEqual({
          basePeriodId: '2026-04',
          inactivityPeriodIds: ['2026-05', '2026-06'],
          completedPeriodsOnly: true,
        })
        expect(
          decision?.priority.score,
        ).toBeGreaterThan(0)
        expect(
          decision?.priority.reasons
            .map((reason) => reason.code),
        ).toContain('lost-customers')
        expect(
          decision?.executiveBrief.summary,
        ).not.toHaveLength(0)
        expect(
          decision?.risks.map(
            (risk) => risk.code,
          ),
        ).toContain('lost-customers-risk')
        expect(
          decision?.opportunities.map(
            (opportunity) => opportunity.code,
          ),
        ).toContain('recover-lost-customers')
        expect(
          decision?.recommendedActions.map(
            (action) => action.code,
          ),
        ).toContain('contact-lost-customers')
      },
    )

    it(
      'rejects an invalid period identifier',
      () => {
        const engine =
          new BrandDecisionEngine(
            new BusinessRepository(
              createModel(),
            ),
          )

        expect(() =>
          engine.evaluate(
            'BRAND',
            'July-2026',
          ),
        ).toThrow(
          'Invalid business period id',
        )
      },
    )

    it(
      'maps the decision model to a presentation-ready workspace view model',
      () => {
        const repository =
          new BusinessRepository(
            createModel(),
          )
        const decision =
          new BrandDecisionEngine(
            repository,
          ).evaluate(
            'BRAND',
            '2026-07',
          )

        expect(decision).toBeDefined()

        const workspace =
          buildBrandWorkspaceViewModel(
            decision!,
          )

        expect(workspace.header.brandName).toBe(
          'Marca Demo',
        )
        expect(workspace.cards).toHaveLength(5)
        expect(
          workspace.charts.comparison,
        ).toHaveLength(2)
        expect(
          workspace.charts.comparison[1],
        ).toEqual(
          expect.objectContaining({
            periodId: '2026-07',
            revenueLabel: expect.any(String),
            revenueWidth: expect.any(Number),
            grossProfitLabel: expect.any(String),
          }),
        )
        expect(
          workspace.tables.lostCustomers[0],
        ).toEqual(
          expect.objectContaining({
            id: 'C002',
            customerName: 'Cliente perdido',
          }),
        )
        expect(
          workspace.priority.label,
        ).not.toHaveLength(0)
        expect(
          decision?.executiveScore.score,
        ).toBeGreaterThanOrEqual(0)
        expect(
          decision?.executiveScore.score,
        ).toBeLessThanOrEqual(100)
        expect(
          decision?.aiSummary.headline,
        ).toContain('Marca Demo')
        expect(
          decision?.prioritizedActions[0]?.rank,
        ).toBe(1)
        expect(
          workspace.executiveIntelligence.score,
        ).toBe(decision?.executiveScore.score)
        expect(
          decision?.actionCenter.agenda.length,
        ).toBeGreaterThan(0)
        expect(
          workspace.actionCenter.dailyBrief.greeting,
        ).toContain('Marca Demo')
        expect(
          workspace.actionCenter.agenda[0]?.rank,
        ).toBe(1)
      },
    )

  },
)

