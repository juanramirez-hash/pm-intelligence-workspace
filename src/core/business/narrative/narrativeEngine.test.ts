import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  BusinessHealthScoreEngine,
} from '../health'

import type {
  BusinessBrandSnapshot,
} from '../snapshots'

import {
  BusinessNarrativeEngine,
} from './narrativeEngine'

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

describe('BusinessNarrativeEngine', () => {
  it('construye un brief determinista desde Snapshot y Health Score', () => {
    const snapshot = createSnapshot()
    const healthScore =
      new BusinessHealthScoreEngine().calculate(
        snapshot,
        {
          benchmarks: {
            minimumCustomers: 10,
            minimumProducts: 20,
            revenueTrendRatio: 0.9,
          },
        },
      )

    const result =
      new BusinessNarrativeEngine()
        .buildExecutiveBrief(
          snapshot,
          healthScore,
        )

    expect(result).toMatchObject({
      id: '2026-07::BELDEN::executive-brief',
      snapshotId: '2026-07::BELDEN',
      healthScoreId:
        '2026-07::BELDEN::health',
      entityType: 'brand',
      generatedAt:
        '2026-07-26T12:00:00.000Z',
      locale: 'es-MX',
      title: 'Belden · 2026-07',
      health: {
        grade: 'healthy',
      },
    })

    expect(result.summary)
      .toContain('La venta acumula 60% del objetivo.')

    expect(
      result.highlights.map((item) => item.code),
    ).toContain('brief.forecast.target-reached')

    const riskCategories = result.risks.map(
      (item) => item.category,
    )

    expect(riskCategories).toContain('revenue')
    expect(riskCategories).not.toContain('gross-profit')

    expect(
      result.opportunities.map((item) => item.code),
    ).toContain(
      'brief.opportunity.inventory-readiness',
    )
  })

  it('no inventa una lectura saludable cuando no hay objetivos evaluables', () => {
    const snapshot: BusinessBrandSnapshot = {
      ...createSnapshot(),
      id: '2026-08::UNV',
      brand: {
        id: 'UNV',
        name: 'UNV',
      },
      periodId: '2026-08',
      hasTarget: false,
      target: {
        revenue: null,
        grossProfit: null,
        grossMargin: null,
        workingDays: null,
      },
      attainment: {
        ...createSnapshot().attainment,
        id: '2026-08::UNV',
        brandId: 'UNV',
        periodId: '2026-08',
        hasTarget: false,
        revenue: {
          actual: 600,
          target: null,
          variance: null,
          attainment: null,
        },
        grossProfit: {
          actual: 150,
          target: null,
          variance: null,
          attainment: null,
        },
        grossMargin: {
          actual: 0.25,
          target: null,
          variance: null,
          attainment: null,
        },
        revenuePace: {
          workingDays: null,
          elapsedWorkingDays: null,
          expectedToDate: null,
          varianceToPlan: null,
          attainmentToPlan: null,
          projectedPeriodEnd: null,
          status: 'not-evaluable',
        },
      },
    }

    const healthScore =
      new BusinessHealthScoreEngine().calculate(snapshot)

    const result =
      new BusinessNarrativeEngine()
        .buildExecutiveBrief(snapshot, healthScore)

    expect(result.health.score).toBeNull()
    expect(result.summary).toContain(
      'no puede evaluarse',
    )
    expect(
      result.risks.map((item) => item.code),
    ).toContain('brief.risk.missing-target')
  })

  it('rechaza Health Scores pertenecientes a otro Snapshot', () => {
    const snapshot = createSnapshot()
    const healthScore = {
      ...new BusinessHealthScoreEngine()
        .calculate(snapshot),
      snapshotId: '2026-07::OTHER',
    }

    expect(() =>
      new BusinessNarrativeEngine()
        .buildExecutiveBrief(
          snapshot,
          healthScore,
        ),
    ).toThrow(/context mismatch/i)
  })
})
