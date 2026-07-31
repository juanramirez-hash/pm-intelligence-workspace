import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ForecastPriorityList,
} from './ForecastPriorityList'

describe('FW-005 ForecastPriorityList', () => {
  it('muestra evidencia, acción y ruta al sustituto', () => {
    const markup = renderToStaticMarkup(
      <ForecastPriorityList
        items={[
          {
            id: 'risk::P-OLD',
            category: 'risk',
            signalType: 'stockout',
            priority: 'critical',
            score: 98,
            title: 'Riesgo de agotamiento',
            rationale: 'Existe demanda sin inventario disponible.',
            recommendedAction: 'Revisar disponibilidad del sustituto.',
            productId: 'P-OLD',
            productName: 'Producto anterior',
            model: 'OLD-1',
            brandId: 'UNV',
            confidenceLevel: 'high',
            expectedDemandUnits: 10,
            remainingDemandUnits: 6,
            availableUnits: 0,
            inboundUnits: 0,
            availableCoverageMonths: 0,
            supplyCoverageMonths: 0,
            inventoryValue: 0,
            isSuperseded: true,
            navigation: {
              entityType: 'product',
              entityId: 'P-OLD',
              label: 'Producto anterior',
              href: '/products/P-OLD',
            },
            replacementNavigation: {
              entityType: 'product',
              entityId: 'P-NEW',
              label: 'Producto nuevo',
              href: '/products/P-NEW',
            },
          },
        ]}
        kind="risk"
      />,
    )

    expect(markup).toContain('data-forecast-component="risk-ranking"')
    expect(markup).toContain('Riesgo de agotamiento')
    expect(markup).toContain('Superseded')
    expect(markup).toContain('/products/P-OLD')
    expect(markup).toContain('/products/P-NEW')
  })
})
