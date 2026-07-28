import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  SalesCommercialOpportunityPanel,
} from './SalesCommercialOpportunityPanel'

describe('SW-005 SalesCommercialOpportunityPanel', () => {
  it('muestra impacto, prioridad y acción recomendada', () => {
    const markup =
      renderToStaticMarkup(
        <SalesCommercialOpportunityPanel
          summary={{
            available: true,
            unavailableReason: null,
            totalImpact: 250_000,
            totalCount: 1,
            criticalCount: 1,
            highCount: 0,
            requiredDailyRevenue: 25_000,
            opportunities: [
              {
                id: 'opportunity-1',
                type: 'target-gap',
                priority: 'critical',
                entityType: 'brand',
                entityId: 'UNV',
                entityLabel: 'UNV',
                title: 'Cerrar brecha de UNV',
                description: 'La marca se encuentra debajo del ritmo esperado.',
                recommendedAction: 'Activar plan de cierre por cartera y proyecto.',
                impact: 250_000,
                score: 91,
                confidence: 92,
                effort: 68,
                currentRevenue: 750_000,
                comparisonRevenue: null,
                variance: -100_000,
                variancePercentage: -25,
                dailyRevenueRequired: 25_000,
                evidence: [
                  {
                    label: 'Objetivo',
                    value: '$1,000,000',
                  },
                ],
              },
            ],
          }}
        />,
      )

    expect(markup).toContain(
      'data-atlas-component="sales-commercial-opportunity-panel"',
    )
    expect(markup).toContain('Commercial Opportunity Engine')
    expect(markup).toContain('Cerrar brecha de UNV')
    expect(markup).toContain('Prioridad Crítica')
    expect(markup).toContain('Acción recomendada')
  })
})
