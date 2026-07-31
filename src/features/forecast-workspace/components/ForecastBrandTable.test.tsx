import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ForecastBrandTable,
} from './ForecastBrandTable'

describe('FW-005 ForecastBrandTable', () => {
  it('expone proyección, cobertura, riesgo y navegación por marca', () => {
    const markup = renderToStaticMarkup(
      <ForecastBrandTable
        rows={[
          {
            brandId: 'UNV',
            label: 'UNV',
            actual: {
              revenue: 800,
              grossProfit: 200,
              quantity: 8,
            },
            projected: {
              revenue: 1_200,
              grossProfit: 300,
              quantity: 12,
            },
            projectedGrossMargin: 0.25,
            targetRevenue: 1_000,
            targetAttainment: 1.2,
            revenueGap: 0,
            targetStatus: 'ahead',
            confidenceScore: 85,
            confidenceLevel: 'high',
            productsAnalyzed: 5,
            criticalProducts: 1,
            highPriorityProducts: 1,
            stockoutProducts: 1,
            shortageProducts: 0,
            lowCoverageProducts: 1,
            excessProducts: 2,
            noDemandProducts: 0,
            averageAvailableCoverageMonths: 1.8,
            riskScore: 90,
            navigation: {
              entityType: 'brand',
              entityId: 'UNV',
              label: 'UNV',
              href: '/brands/UNV',
            },
          },
        ]}
      />,
    )

    expect(markup).toContain('data-forecast-component="brand-table"')
    expect(markup).toContain('UNV')
    expect(markup).toContain('120%')
    expect(markup).toContain('/brands/UNV')
    expect(markup).toContain('1 agotados')
  })
})
