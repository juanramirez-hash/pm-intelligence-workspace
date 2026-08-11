import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildSalesExecutiveSummary,
} from './buildSalesExecutiveSummary'

const baseInput = {
  available: true,
  selectedPeriodLabel: 'Marzo de 2026',
  current: {
    periodId: '2026-03',
    periodLabel: 'Marzo de 2026',
    revenue: 1_000_000,
    grossProfit: 250_000,
    grossMargin: 25,
    quantity: 100,
    documents: 50,
    customerCount: 20,
    brandCount: 5,
    productCount: 40,
  },
  comparison: {
    mode: 'previous-period' as const,
    label: 'Periodo anterior',
    previousPeriodId: '2026-02',
    previousPeriodLabel: 'Febrero de 2026',
    revenueVariation: 10,
    grossProfitVariation: 8,
    quantityVariation: 5,
    marginPointVariation: -0.5,
  },
  performance: {
    available: true,
    unavailableReason: null,
    revenue: {
      actual: 1_000_000,
      target: 1_200_000,
      variance: -200_000,
      attainment: 83.333,
    },
    grossProfit: {
      actual: 250_000,
      target: 300_000,
      variance: -50_000,
      attainment: 83.333,
    },
    grossMargin: {
      actual: 25,
      target: 25,
      variance: 0,
      attainment: 100,
    },
    pace: {
      status: 'behind-plan' as const,
      dataCutoff: '2026-03-20',
      workingDays: 22,
      elapsedWorkingDays: 15,
      remainingWorkingDays: 7,
      currentDailyRevenue: 66_666.67,
      requiredDailyRevenue: 28_571.43,
      expectedToDate: 818_181.82,
      varianceToPlan: 181_818.18,
      attainmentToPlan: 122.22,
      projectedPeriodEnd: 1_466_666.67,
      projectedAttainment: 122.22,
    },
    forecast: {
      available: true,
      officialAvailable: true,
      status: 'ready' as const,
      periodId: '2026-03',
      dataCutoff: '2026-03-20',
      expectedRevenue: 1_350_000,
      expectedGrossProfit: 320_000,
      expectedAttainment: 112.5,
      confidenceScore: 0.88,
      confidenceLevel: 'high' as const,
      unavailableReason: null,
    },
    coverage: {
      targetedBrands: 5,
      activeBrands: 5,
      coveredActiveBrands: 5,
      activeBrandsWithoutTarget: 0,
      coveragePercentage: 100,
    },
  },
  varianceContribution: {
    available: true,
    unavailableReason: null,
    comparisonPeriodId: '2026-02',
    comparisonLabel: 'Periodo anterior',
    revenue: {
      current: 1_000_000,
      comparison: 900_000,
      absoluteVariation: 100_000,
      percentageVariation: 11.11,
    },
    grossProfit: {
      current: 250_000,
      comparison: 230_000,
      absoluteVariation: 20_000,
      percentageVariation: 8.69,
    },
    quantity: {
      current: 100,
      comparison: 95,
      absoluteVariation: 5,
      percentageVariation: 5.26,
    },
    documents: {
      current: 50,
      comparison: 48,
      absoluteVariation: 2,
      percentageVariation: 4.16,
    },
    grossMargin: {
      current: 25,
      comparison: 25.56,
      pointVariation: -0.56,
    },
    netRevenueVariation: 100_000,
    positiveRevenueContribution: 150_000,
    negativeRevenueContribution: 50_000,
    brands: {
      dimension: 'brand' as const,
      positiveContribution: 150_000,
      negativeContribution: 50_000,
      stableCount: 0,
      positive: [
        {
          id: 'UNV',
          label: 'UNV',
          currentRevenue: 500_000,
          comparisonRevenue: 400_000,
          revenueVariation: 100_000,
          revenueVariationPercentage: 25,
          currentGrossProfit: 125_000,
          comparisonGrossProfit: 100_000,
          grossProfitVariation: 25_000,
          currentQuantity: 50,
          comparisonQuantity: 40,
          quantityVariation: 10,
          currentDocuments: 25,
          comparisonDocuments: 20,
          documentsVariation: 5,
          currentParticipation: 50,
          comparisonParticipation: 44.44,
          mixVariationPoints: 5.56,
          movementShare: 66.67,
          direction: 'positive' as const,
        },
      ],
      negative: [],
    },
    customers: {
      dimension: 'customer' as const,
      positiveContribution: 0,
      negativeContribution: 0,
      stableCount: 0,
      positive: [],
      negative: [],
    },
    products: {
      dimension: 'product' as const,
      positiveContribution: 0,
      negativeContribution: 0,
      stableCount: 0,
      positive: [],
      negative: [],
    },
    customerMovements: {
      newCount: 0,
      recoveredCount: 0,
      growingCount: 0,
      decliningCount: 0,
      lostCount: 0,
      stableCount: 0,
      newRevenue: 0,
      recoveredRevenue: 0,
      lostRevenue: 0,
      decliningRevenue: 0,
      items: [],
    },
  },
  commercialOpportunities: {
    available: true,
    unavailableReason: null,
    totalImpact: 200_000,
    totalCount: 1,
    criticalCount: 1,
    highCount: 0,
    requiredDailyRevenue: 28_571.43,
    opportunities: [
      {
        id: 'target-gap-UNV',
        type: 'target-gap' as const,
        priority: 'critical' as const,
        entityType: 'brand' as const,
        entityId: 'UNV',
        entityLabel: 'UNV',
        title: 'Cerrar brecha de UNV',
        description: 'Brecha detectada.',
        recommendedAction: 'Activar plan de cierre.',
        impact: 200_000,
        score: 90,
        confidence: 90,
        effort: 60,
        currentRevenue: 500_000,
        comparisonRevenue: 400_000,
        variance: 100_000,
        variancePercentage: 25,
        dailyRevenueRequired: 28_571.43,
        evidence: [],
      },
    ],
  },
  reconciliation: {
    totalRows: 100,
    matchedRows: 95,
    ambiguousRows: 2,
    unmatchedRows: 3,
    matchRate: 95,
  },
  activeFilters: [],
}

describe('SW-006 Sales Executive Summary', () => {
  it('genera una lectura ejecutiva con desempeño e impulsores', () => {
    const summary =
      buildSalesExecutiveSummary(
        baseInput,
      )

    expect(summary.available).toBe(true)
    expect(summary.title).toContain('Marzo de 2026')
    expect(summary.overview).toContain('La venta del periodo')
    expect(summary.overview).toContain('creció')
    expect(summary.outlook).toContain('Forecast esperado')
    expect(summary.outlook).toContain('cierre por ritmo actual')
    expect(
      summary.findings.some(
        (finding) =>
          finding.id === 'positive-driver' &&
          finding.value === 'UNV',
      ),
    ).toBe(true)
  })

  it('explica el segmento activo y devuelve estado vacío sin datos', () => {
    const filtered =
      buildSalesExecutiveSummary({
        ...baseInput,
        activeFilters: [
          {
            dimension: 'brand',
            id: 'UNV',
            label: 'UNV',
          },
        ],
      })

    expect(filtered.filterContext).toContain('UNV')

    const empty =
      buildSalesExecutiveSummary({
        ...baseInput,
        available: false,
        current: null,
      })

    expect(empty.available).toBe(false)
    expect(empty.findings).toHaveLength(0)
  })
})