import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ForecastScenarioSelector,
} from './ForecastScenarioSelector'

describe('FW-010 ForecastScenarioSelector', () => {
  it('identifica el escenario activo y expone las proyecciones', () => {
    const markup = renderToStaticMarkup(
      <ForecastScenarioSelector
        onChange={() => undefined}
        options={[
          {
            id: 'conservative',
            label: 'Conservador',
            purpose: 'Protege el downside.',
            selected: false,
            portfolioRevenue: 900,
            portfolioGrossProfit: 220,
            portfolioQuantity: 8,
            portfolioGrossMargin: 0.2444,
            targetAttainment: 0.9,
            official: true,
          },
          {
            id: 'expected',
            label: 'Esperado',
            purpose: 'Escenario central.',
            selected: true,
            portfolioRevenue: 1_000,
            portfolioGrossProfit: 250,
            portfolioQuantity: 10,
            portfolioGrossMargin: 0.25,
            targetAttainment: 1,
            official: true,
          },
        ]}
      />,
    )

    expect(markup).toContain('data-forecast-component="scenario-selector"')
    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain('Esperado')
    expect(markup).toContain('Activo')
  })
})
