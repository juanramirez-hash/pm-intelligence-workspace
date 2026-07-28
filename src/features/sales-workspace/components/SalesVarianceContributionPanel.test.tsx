import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  SalesVarianceContributionAnalysis,
} from '../types'

import {
  SalesVarianceContributionPanel,
} from './SalesVarianceContributionPanel'

const analysis: SalesVarianceContributionAnalysis = {
  available: true,
  unavailableReason: null,
  comparisonPeriodId: '2026-02',
  comparisonLabel: 'Periodo anterior',
  revenue: {
    current: 1_200,
    comparison: 1_000,
    absoluteVariation: 200,
    percentageVariation: 20,
  },
  grossProfit: {
    current: 300,
    comparison: 250,
    absoluteVariation: 50,
    percentageVariation: 20,
  },
  quantity: {
    current: 12,
    comparison: 10,
    absoluteVariation: 2,
    percentageVariation: 20,
  },
  documents: {
    current: 6,
    comparison: 5,
    absoluteVariation: 1,
    percentageVariation: 20,
  },
  grossMargin: {
    current: 25,
    comparison: 25,
    pointVariation: 0,
  },
  netRevenueVariation: 200,
  positiveRevenueContribution: 300,
  negativeRevenueContribution: 100,
  brands: {
    dimension: 'brand',
    positiveContribution: 300,
    negativeContribution: 100,
    stableCount: 0,
    positive: [
      {
        id: 'UNV',
        label: 'UNV',
        currentRevenue: 800,
        comparisonRevenue: 500,
        revenueVariation: 300,
        revenueVariationPercentage: 60,
        currentGrossProfit: 200,
        comparisonGrossProfit: 120,
        grossProfitVariation: 80,
        currentQuantity: 8,
        comparisonQuantity: 5,
        quantityVariation: 3,
        currentDocuments: 4,
        comparisonDocuments: 2,
        documentsVariation: 2,
        currentParticipation: 66.7,
        comparisonParticipation: 50,
        mixVariationPoints: 16.7,
        movementShare: 75,
        direction: 'positive',
      },
    ],
    negative: [],
  },
  customers: {
    dimension: 'customer',
    positiveContribution: 300,
    negativeContribution: 100,
    stableCount: 0,
    positive: [],
    negative: [],
  },
  products: {
    dimension: 'product',
    positiveContribution: 300,
    negativeContribution: 100,
    stableCount: 0,
    positive: [],
    negative: [],
  },
  customerMovements: {
    newCount: 1,
    recoveredCount: 1,
    growingCount: 2,
    decliningCount: 1,
    lostCount: 1,
    stableCount: 0,
    newRevenue: 100,
    recoveredRevenue: 150,
    lostRevenue: 80,
    decliningRevenue: 20,
    items: [
      {
        id: 'C2',
        label: 'C2 Cliente Recuperado',
        status: 'recovered',
        currentRevenue: 150,
        comparisonRevenue: 0,
        historicalRevenue: 200,
        revenueVariation: 150,
        revenueVariationPercentage: null,
      },
    ],
  },
}

describe('SW-004 SalesVarianceContributionPanel', () => {
  it('muestra variación, contribuciones y movimiento de clientes', () => {
    const markup =
      renderToStaticMarkup(
        <SalesVarianceContributionPanel
          analysis={analysis}
        />,
      )

    expect(markup).toContain(
      'data-atlas-component="sales-variance-contribution-panel"',
    )
    expect(markup).toContain(
      'Variance &amp; Contribution Analysis',
    )
    expect(markup).toContain('Qué explica el cambio de venta')
    expect(markup).toContain('Contribución positiva')
    expect(markup).toContain('Movimiento de clientes')
    expect(markup).toContain('Cliente Recuperado')
  })
})
