import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ForecastOriginBreakdown,
} from './ForecastOriginBreakdown'

import type {
  ForecastWorkspacePortfolioSummary,
  ForecastWorkspaceProjectPipeline,
} from '../types/forecastWorkspaceTypes'

const portfolio: ForecastWorkspacePortfolioSummary = {
  available: true,
  officialAvailable: true,
  actual: { revenue: 800, grossProfit: 200, quantity: 80 },
  projected: { revenue: 1_000, grossProfit: 250, quantity: 90 },
  projectedGrossMargin: 0.25,
  targetRevenue: 1_100,
  targetAttainment: 1_000 / 1_100,
  revenueGap: 100,
  requiredDailyRevenue: 100,
  targetStatus: 'behind',
  confidenceScore: 80,
  confidenceLevel: 'high',
  origin: {
    actualTotal: { revenue: 800, grossProfit: 200, quantity: 80, documents: 8 },
    actualTransactional: { revenue: 600, grossProfit: 150, quantity: 60, documents: 6 },
    actualProjectBilling: { revenue: 200, grossProfit: 50, quantity: 20, documents: 2 },
    projectedTransactional: { revenue: 700, grossProfit: 175, quantity: 70 },
    projectBillingActual: { revenue: 200, grossProfit: 50, quantity: 20 },
    maturePipeline: { revenue: 100, grossProfit: 25, quantity: 0 },
    combined: { revenue: 1_000, grossProfit: 250, quantity: 90 },
  },
  explainability: [],
  limitations: [],
}

const pipeline: ForecastWorkspaceProjectPipeline = {
  status: 'ready',
  officialAvailable: true,
  summary: {
    matureProjects: 1,
    matureIncludedProjects: 1,
    matureBlockedProjects: 0,
    matureRevenueMxn: 100,
    matureEstimatedGrossProfitMxn: 25,
    potentialProjects: 0,
    potentialAvailableProjects: 0,
    potentialRevenueMxn: 0,
    potentialWeightedRevenueMxn: 0,
    potentialEstimatedGrossProfitMxn: 0,
    missingExchangeRates: 0,
    grossProfitEstimateCoverage: 1,
    quantityAvailable: false,
  },
  contributions: [],
  quality: {
    issues: [],
    blockingIssues: 0,
    warnings: 0,
    information: 0,
    reconciliationCoverage: 1,
    historicalReconciliationCoverage: 1,
    currentPeriodId: '2026-07',
    pendingCutoffDocuments: 0,
    salesDataCutoff: '2026-07-21',
    projectBillingDataCutoff: '2026-07-31',
    matureProjectsEvaluated: 1,
    matureProjectsIncluded: 1,
    matureProjectsBlocked: 0,
    potentialProjectsEvaluated: 0,
    potentialProjectsAvailable: 0,
    missingExchangeRates: 0,
    grossProfitEstimateCoverage: 1,
  },
}

describe('FW-010 ForecastOriginBreakdown', () => {
  it('publica los cuatro componentes del cierre', () => {
    const markup = renderToStaticMarkup(
      <ForecastOriginBreakdown
        portfolio={portfolio}
        projectPipeline={pipeline}
      />,
    )

    expect(markup).toContain('Forecast transaccional')
    expect(markup).toContain('Proyectos facturados')
    expect(markup).toContain('Pipeline maduro pendiente')
    expect(markup).toContain('Forecast combinado')
  })
})
