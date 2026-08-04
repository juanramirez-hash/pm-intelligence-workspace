import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const useExecutiveWorkspace =
  vi.hoisted(() => vi.fn())

vi.mock(
  './hooks/useExecutiveWorkspace',
  () => ({
    useExecutiveWorkspace,
  }),
)

vi.mock(
  './components/ExecutiveSalesPerformance',
  () => ({
    ExecutiveSalesPerformance: () => (
      <section data-order="sales" />
    ),
  }),
)

vi.mock(
  './components/ExecutiveAnalysisPeriod',
  () => ({
    ExecutiveAnalysisPeriod: () => (
      <section data-order="period" />
    ),
  }),
)

vi.mock(
  './components/ExecutiveAttentionCenter',
  () => ({
    ExecutiveAttentionCenter: () => (
      <section data-order="attention" />
    ),
  }),
)

vi.mock(
  './components/ExecutiveCommercialTrends',
  () => ({
    ExecutiveCommercialTrends: () => (
      <section data-order="trends" />
    ),
  }),
)

vi.mock(
  './components/ExecutiveBrandOverview',
  () => ({
    ExecutiveBrandOverview: () => (
      <section data-order="brands" />
    ),
  }),
)

vi.mock(
  './components/ExecutiveDomainReadinessPanel',
  () => ({
    ExecutiveDomainReadinessPanel: () => (
      <section data-order="readiness" />
    ),
  }),
)

vi.mock(
  './components/ExecutiveDataHealthSummary',
  () => ({
    ExecutiveDataHealthSummary: () => (
      <section data-order="health" />
    ),
  }),
)

import {
  ExecutiveWorkspacePage,
} from './ExecutiveWorkspacePage'

describe(
  'ExecutiveWorkspacePage layout',
  () => {
    it('places period second and readiness plus health at the end', () => {
      useExecutiveWorkspace.mockReturnValue({
        metrics: null,
        currentPeriodId: '2026-07',
        customers: null,
        brands: null,
        productAttention: null,
        commercialTrends: {
          monthlyRevenue: [],
          topCustomers: [],
          totalCustomerRevenue: 0,
          periodCount: 0,
        },
        domains: {},
        health: {
          systemReady: true,
          importStatus: 'completed',
          lastImportedAt: null,
        },
      })

      const markup =
        renderToStaticMarkup(
          <ExecutiveWorkspacePage />,
        )

      const order = [
        'sales',
        'period',
        'attention',
        'trends',
        'brands',
        'readiness',
        'health',
      ].map(
        (id) =>
          markup.indexOf(
            `data-order="${id}"`,
          ),
      )

      expect(
        order.every(
          (position) => position >= 0,
        ),
      ).toBe(true)

      expect(order).toEqual(
        [...order].sort(
          (left, right) => left - right,
        ),
      )
    })
  },
)
