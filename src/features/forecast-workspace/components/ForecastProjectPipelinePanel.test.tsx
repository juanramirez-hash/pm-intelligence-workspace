import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ForecastProjectPipelinePanel,
} from './ForecastProjectPipelinePanel'

describe('FW-010 ForecastProjectPipelinePanel', () => {
  it('muestra monto convertido, tratamiento e incidencias del proyecto', () => {
    const markup = renderToStaticMarkup(
      <ForecastProjectPipelinePanel
        contributions={[
          {
            id: 'PROY-1::2026-07',
            projectId: 'PROY-1',
            projectName: 'Proyecto Uno',
            brandId: 'UNV',
            statusCode: '05',
            statusLabel: '05 Esperando OC',
            forecastStage: 'mature',
            contributionStatus: 'included',
            estimatedBillingDate: '2026-07-31',
            periodId: '2026-07',
            closingProbability: 1,
            sourceCurrency: 'USD',
            sourceAmount: 1_000,
            exchangeRate: 18.75,
            convertedAmountMxn: 18_750,
            weightedAmountMxn: 18_750,
            conversionStatus: 'converted',
            estimatedGrossMargin: 0.25,
            estimatedGrossProfitMxn: 4_687.5,
            marginSource: 'historical-project-brand',
            issueCodes: [],
          },
        ]}
      />,
    )

    expect(markup).toContain('data-forecast-component="project-pipeline"')
    expect(markup).toContain('Proyecto Uno')
    expect(markup).toContain('Incluido')
    expect(markup).toMatch(/\$18\.8\s+k/)
    expect(markup).toContain('Sin incidencias')
  })
})