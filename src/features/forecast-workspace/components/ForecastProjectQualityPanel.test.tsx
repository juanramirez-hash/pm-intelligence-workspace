import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ForecastProjectQualityPanel,
} from './ForecastProjectQualityPanel'

describe('FW-010 ForecastProjectQualityPanel', () => {
  it('publica bloqueos, cobertura e incidencias auditables', () => {
    const markup = renderToStaticMarkup(
      <ForecastProjectQualityPanel
        pipeline={{
          status: 'blocked',
          officialAvailable: false,
          summary: {
            matureProjects: 1,
            matureIncludedProjects: 0,
            matureBlockedProjects: 1,
            matureRevenueMxn: 0,
            matureEstimatedGrossProfitMxn: 0,
            potentialProjects: 0,
            potentialAvailableProjects: 0,
            potentialRevenueMxn: 0,
            potentialWeightedRevenueMxn: 0,
            potentialEstimatedGrossProfitMxn: 0,
            missingExchangeRates: 1,
            grossProfitEstimateCoverage: 0,
            quantityAvailable: false,
          },
          contributions: [],
          quality: {
            issues: [
              {
                code: 'MISSING_EXCHANGE_RATE',
                severity: 'blocking',
                message: 'Falta tipo de cambio USD a MXN para 2026-07.',
                periodId: '2026-07',
                projectId: 'PROY-1',
                documentNumber: null,
                brandId: 'UNV',
              },
            ],
            blockingIssues: 1,
            warnings: 0,
            information: 0,
            reconciliationCoverage: 0.95,
            historicalReconciliationCoverage: 0.961,
            currentPeriodId: '2026-07',
            pendingCutoffDocuments: 3,
            salesDataCutoff: '2026-07-21',
            projectBillingDataCutoff: '2026-07-31',
            matureProjectsEvaluated: 1,
            matureProjectsIncluded: 0,
            matureProjectsBlocked: 1,
            potentialProjectsEvaluated: 0,
            potentialProjectsAvailable: 0,
            missingExchangeRates: 1,
            grossProfitEstimateCoverage: 0,
          },
        }}
      />,
    )

    expect(markup).toContain('Cobertura periodo actual')
    expect(markup).toContain('95%')
    expect(markup).toContain('96.1%')
    expect(markup).toContain('Pendientes por corte')
    expect(markup).toContain('MISSING_EXCHANGE_RATE')
    expect(markup).toContain('PROY-1')
  })
})
