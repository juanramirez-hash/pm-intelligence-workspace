import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ForecastCoveragePanel,
} from './ForecastCoveragePanel'

describe('FW-005 ForecastCoveragePanel', () => {
  it('representa todos los estados de cobertura del contrato', () => {
    const markup = renderToStaticMarkup(
      <ForecastCoveragePanel
        inventory={{
          reportStatus: 'ready',
          productsAnalyzed: 12,
          filteredProducts: 10,
          productsWithProjectedDemand: 8,
          productsWithoutProjectedDemand: 2,
          criticalItems: 1,
          highPriorityItems: 2,
          availableUnits: 100,
          inboundUnits: 25,
          inventoryValue: 200_000,
          expectedDemandUnits: 80,
          remainingDemandUnits: 40,
          projectedAvailableAfterDemand: 60,
          projectedSupplyAfterDemand: 85,
          supersededInventoryProducts: 1,
          replacementRecoveries: 1,
          affectedInventoryValue: 50_000,
          coverage: {
            unavailable: 0,
            noDemand: 2,
            stockout: 1,
            shortage: 2,
            low: 1,
            balanced: 3,
            excess: 1,
          },
        }}
      />,
    )

    expect(markup).toContain('data-forecast-component="coverage-panel"')
    expect(markup).toContain('Agotados')
    expect(markup).toContain('Faltante al cierre')
    expect(markup).toContain('Sin demanda')
    expect(markup).toContain('Exceso')
  })
})
