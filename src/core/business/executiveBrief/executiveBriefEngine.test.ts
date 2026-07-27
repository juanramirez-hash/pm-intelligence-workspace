import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BrandIntelligenceSummary,
} from '../../analytics/brands'

import {
  ExecutiveBriefEngine,
} from './executiveBriefEngine'

function createSummary(
  overrides: Partial<BrandIntelligenceSummary> = {},
): BrandIntelligenceSummary {
  return {
    analysisDate: '2026-07-31T12:00:00.000Z',
    currentPeriodId: '2026-07',
    currentPeriodStart: '2026-07-01',
    currentPeriodEnd: '2026-07-31',
    previousPeriodId: '2026-06',
    previousPeriodStart: '2026-06-01',
    previousPeriodEnd: '2026-06-30',
    totalBrands: 53,
    activeBrands: 41,
    newBrands: 0,
    recoveredBrands: 0,
    inactiveBrands: 8,
    lostBrands: 4,
    growingBrands: 4,
    decliningBrands: 39,
    stableBrands: 0,
    brandsWithoutComparison: 10,
    brandsRequiringAttention: 48,
    currentPeriodRevenue: 19_375_777,
    previousPeriodRevenue: 44_355_621,
    revenueVariation: -24_979_844,
    revenueVariationPercentage: -0.5632,
    brands: [],
    attentionBrands: [],
    topGrowingBrands: [],
    topDecliningBrands: [],
    topRevenueBrands: [],
    ...overrides,
  }
}

describe('ExecutiveBriefEngine', () => {
  it('construye un brief determinístico para Brand Workspace', () => {
    const result = new ExecutiveBriefEngine()
      .buildForBrandWorkspace(
        createSummary(),
        '2026-07-31T18:00:00.000Z',
      )

    expect(result).toMatchObject({
      id: '2026-07::brand-workspace::executive-brief',
      entityType: 'brand-workspace',
      periodId: '2026-07',
      generatedAt: '2026-07-31T18:00:00.000Z',
      locale: 'es-MX',
      health: {
        score: null,
        status: 'not-available',
      },
    })

    expect(result.summary).toContain(
      'La venta consolidada del periodo',
    )
    expect(result.summary).toContain(
      '39 marcas están en descenso',
    )

    expect(
      result.risks.map((item) => item.id),
    ).toContain(
      'executive-brief.risk.portfolio-deterioration',
    )

    expect(
      result.recommendations.map((item) => item.id),
    ).toContain(
      'executive-brief.recommendation.recover-before-expand',
    )

    expect(
      result.recommendations.every(
        (item) =>
          item.confidence >= 0 &&
          item.confidence <= 100 &&
          item.explanation.ruleId.length > 0,
      ),
    ).toBe(true)
  })

  it('no inventa un score consolidado', () => {
    const result = new ExecutiveBriefEngine()
      .buildForBrandWorkspace(createSummary())

    expect(result.health.score).toBeNull()
    expect(result.health.label).toContain('Pendiente')
  })

  it('genera una recomendación de monitoreo cuando no hay señales materiales', () => {
    const result = new ExecutiveBriefEngine()
      .buildForBrandWorkspace(
        createSummary({
          totalBrands: 10,
          activeBrands: 10,
          growingBrands: 0,
          decliningBrands: 0,
          stableBrands: 10,
          brandsWithoutComparison: 0,
          brandsRequiringAttention: 0,
          inactiveBrands: 0,
          lostBrands: 0,
          revenueVariation: 0,
          revenueVariationPercentage: 0,
        }),
      )

    expect(result.recommendations).toHaveLength(1)
    expect(result.recommendations[0]?.id).toBe(
      'executive-brief.recommendation.maintain-monitoring',
    )
  })

  it('rechaza coberturas inconsistentes', () => {
    expect(() =>
      new ExecutiveBriefEngine()
        .buildForBrandWorkspace(
          createSummary({
            totalBrands: 5,
            activeBrands: 6,
          }),
        ),
    ).toThrow(/inconsistent brand coverage/i)
  })
})
