import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  MemoryRouter,
} from 'react-router-dom'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ExecutiveCommercialTrends as ExecutiveCommercialTrendsModel,
} from '../types/executiveWorkspaceTypes'

import {
  ExecutiveCommercialTrends,
} from './ExecutiveCommercialTrends'

const trends:
  ExecutiveCommercialTrendsModel = {
  monthlyRevenue: [
    {
      periodId: '2026-06',
      year: 2026,
      month: 6,
      revenue: 100000,
      grossProfit: 30000,
      grossMargin: 30,
      customerCount: 10,
      brandCount: 4,
      productCount: 15,
    },
    {
      periodId: '2026-07',
      year: 2026,
      month: 7,
      revenue: 120000,
      grossProfit: 36000,
      grossMargin: 30,
      customerCount: 12,
      brandCount: 5,
      productCount: 18,
    },
  ],
  topCustomers: [
    {
      customerId: '000001',
      customerName: 'Cliente Ejecutivo',
      revenue: 80000,
      grossProfit: 24000,
      grossMargin: 30,
      documents: 8,
      activePeriods: 2,
      revenueShare: 0.4,
    },
  ],
  totalCustomerRevenue: 200000,
  periodCount: 2,
}

describe(
  'ExecutiveCommercialTrends',
  () => {
    it('renders real monthly data and navigable customer links', () => {
      const markup =
        renderToStaticMarkup(
          <MemoryRouter>
            <ExecutiveCommercialTrends
              selectionLabel="Julio de 2026"
              trends={trends}
            />
          </MemoryRouter>,
        )

      expect(markup).toContain(
        'data-executive-component="commercial-trends"',
      )

      expect(markup).toContain(
        'Tendencia mensual de ventas',
      )

      expect(markup).toContain(
        'Cliente Ejecutivo',
      )

      expect(markup).toContain(
        'href="/sales"',
      )

      expect(markup).toContain(
        'href="/customers"',
      )

      expect(markup).toContain(
        'href="/customers/000001"',
      )

      expect(markup).not.toContain(
        'cuando conectemos el Business Model',
      )
    })
  },
)
