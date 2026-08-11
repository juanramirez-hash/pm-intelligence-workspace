import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  SalesWorkspaceViewModel,
} from '../types'

import {
  buildSalesExecutiveExport,
} from './buildSalesExecutiveExport'

function createWorkspace(): SalesWorkspaceViewModel {
  return {
    available: true,
    periodOptions: [],
    selectedPeriodId: '2026-03',
    selectedPeriodLabel: 'Marzo de 2026',
    current: {
      periodId: '2026-03',
      periodLabel: 'Marzo de 2026',
      revenue: 1000,
      grossProfit: 250,
      grossMargin: 25,
      quantity: 10,
      documents: 5,
      customerCount: 2,
      brandCount: 1,
      productCount: 2,
    },
    comparison: {
      mode: 'previous-period',
      label: 'Periodo anterior',
      previousPeriodId: '2026-02',
      previousPeriodLabel: 'Febrero de 2026',
      revenueVariation: 10,
      grossProfitVariation: 5,
      quantityVariation: 0,
      marginPointVariation: -1,
    },
    performance: {
      available: false,
      unavailableReason: null,
      revenue: {
        actual: 1000,
        target: null,
        variance: null,
        attainment: null,
      },
      grossProfit: {
        actual: 250,
        target: null,
        variance: null,
        attainment: null,
      },
      grossMargin: {
        actual: 25,
        target: null,
        variance: null,
        attainment: null,
      },
      pace: {
        status: 'not-evaluable',
        dataCutoff: null,
        workingDays: null,
        elapsedWorkingDays: null,
        remainingWorkingDays: null,
        currentDailyRevenue: null,
        requiredDailyRevenue: null,
        expectedToDate: null,
        varianceToPlan: null,
        attainmentToPlan: null,
        projectedPeriodEnd: null,
        projectedAttainment: null,
      },
      forecast: {
        available: false,
        officialAvailable: false,
        status: 'unavailable',
        periodId: null,
        dataCutoff: null,
        expectedRevenue: null,
        expectedGrossProfit: null,
        expectedAttainment: null,
        confidenceScore: null,
        confidenceLevel: null,
        unavailableReason: 'No existe una proyección Project-Aware disponible.',
      },
      coverage: {
        targetedBrands: 0,
        activeBrands: 1,
        coveredActiveBrands: 0,
        activeBrandsWithoutTarget: 1,
        coveragePercentage: 0,
      },
    },
    brandPerformance: [],
    commercialOpportunities: {
      available: false,
      unavailableReason: null,
      totalImpact: 0,
      totalCount: 0,
      criticalCount: 0,
      highCount: 0,
      requiredDailyRevenue: null,
      opportunities: [],
    },
    varianceContribution: {
      available: false,
      unavailableReason: null,
      comparisonPeriodId: null,
      comparisonLabel: 'Periodo anterior',
      revenue: {
        current: 0,
        comparison: 0,
        absoluteVariation: 0,
        percentageVariation: null,
      },
      grossProfit: {
        current: 0,
        comparison: 0,
        absoluteVariation: 0,
        percentageVariation: null,
      },
      quantity: {
        current: 0,
        comparison: 0,
        absoluteVariation: 0,
        percentageVariation: null,
      },
      documents: {
        current: 0,
        comparison: 0,
        absoluteVariation: 0,
        percentageVariation: null,
      },
      grossMargin: {
        current: 0,
        comparison: 0,
        pointVariation: 0,
      },
      netRevenueVariation: 0,
      positiveRevenueContribution: 0,
      negativeRevenueContribution: 0,
      brands: {
        dimension: 'brand',
        positiveContribution: 0,
        negativeContribution: 0,
        stableCount: 0,
        positive: [],
        negative: [],
      },
      customers: {
        dimension: 'customer',
        positiveContribution: 0,
        negativeContribution: 0,
        stableCount: 0,
        positive: [],
        negative: [],
      },
      products: {
        dimension: 'product',
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
    executiveSummary: {
      available: true,
      title: 'Resumen ejecutivo · Marzo de 2026',
      overview: 'Venta y margen del periodo.',
      outlook: 'Sin proyección disponible.',
      filterContext: 'Vista consolidada.',
      findings: [],
    },
    trend: [],
    topBrands: [],
    topCustomers: [],
    topProducts: [],
    reconciliation: {
      totalRows: 10,
      matchedRows: 10,
      ambiguousRows: 0,
      unmatchedRows: 0,
      matchRate: 100,
    },
    filterOptions: {
      brands: [],
      customers: [],
      products: [],
      locations: [],
      salesRepresentatives: [],
    },
    activeFilters: [],
    hasActiveSegmentationFilters: false,
    detailRows: [],
    detailTotalRows: 0,
    detailSourceRows: 0,
  }
}

describe('SW-006 Sales executive export', () => {
  it('construye un libro con resumen, KPIs y detalle', () => {
    const payload =
      buildSalesExecutiveExport(
        createWorkspace(),
        new Date('2026-03-31T12:00:00.000Z'),
      )

    expect(payload.fileName).toBe(
      'PM-Intelligence-Sales-2026-03.xlsx',
    )
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen ejecutivo',
      'KPIs',
      'Desempeño marcas',
      'Oportunidades',
      'Contribuciones',
      'Detalle',
      'Conciliación',
    ])
    expect(payload.sheets[0]?.rows).toContainEqual([
      'Periodo',
      'Marzo de 2026',
    ])
  })
})