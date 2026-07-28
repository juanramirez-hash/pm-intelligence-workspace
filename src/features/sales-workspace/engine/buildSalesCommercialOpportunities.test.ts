import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../../../core/business/builders'

import {
  BusinessRepository,
} from '../../../core/business/repository'

import type {
  BusinessBrandTargetInput,
} from '../../../core/business/targets'

import type {
  NormalizedSalesRow,
} from '../../data-center/importers/sales/salesTypes'

import {
  buildSalesWorkspace,
} from './buildSalesWorkspace'

function sale(
  overrides: Partial<NormalizedSalesRow>,
): NormalizedSalesRow {
  return {
    date: '2026-03-18',
    brand: 'UNV',
    revenue: 500,
    grossProfit: 100,
    customerId: 'C1',
    customerName: 'Cliente Uno',
    productCode: null,
    model: 'IPC-A',
    productStatus: 'A',
    quantity: 1,
    documentNumber: 'D1',
    location: 'CDMX',
    salesRep: 'VENDEDOR 1',
    currency: 'MXN',
    ...overrides,
  }
}

const targets: BusinessBrandTargetInput[] = [
  {
    brandId: 'UNV',
    periodId: '2026-03',
    targetRevenue: 1_200,
    targetGrossProfit: 360,
    targetGrossMargin: 0.30,
    workingDays: 22,
  },
  {
    brandId: 'TP-LINK',
    periodId: '2026-03',
    targetRevenue: 1_000,
    targetGrossProfit: 250,
    targetGrossMargin: 0.25,
    workingDays: 22,
  },
]

function createRepository() {
  return new BusinessRepository(
    buildBusinessDataModel(
      [
        sale({
          date: '2026-02-10',
          revenue: 1_000,
          grossProfit: 300,
          documentNumber: 'F1',
        }),
        sale({
          date: '2026-02-12',
          customerId: 'C2',
          customerName: 'Cliente Dos',
          model: 'IPC-B',
          revenue: 500,
          grossProfit: 150,
          documentNumber: 'F2',
        }),
        sale({
          date: '2026-02-15',
          brand: 'TP-LINK',
          customerId: 'C3',
          customerName: 'Cliente Tres',
          model: 'SW-8P',
          revenue: 200,
          grossProfit: 50,
          documentNumber: 'F3',
        }),
        sale({}),
        sale({
          brand: 'TP-LINK',
          customerId: 'C3',
          customerName: 'Cliente Tres',
          model: 'SW-8P',
          revenue: 400,
          grossProfit: 120,
          documentNumber: 'D2',
        }),
        sale({
          brand: 'TP-LINK',
          customerId: 'C4',
          customerName: 'Cliente Cuatro',
          model: 'EAP-NEW',
          revenue: 300,
          grossProfit: 90,
          documentNumber: 'D3',
        }),
      ],
      {
        brandTargets: targets,
      },
    ),
  )
}

function buildWorkspace() {
  return buildSalesWorkspace(
    createRepository(),
    {
      periodId: '2026-03',
      comparisonMode: 'previous-period',
    },
  )
}

describe('SW-005 Commercial Opportunity Engine', () => {
  it('prioriza brechas de cuota y protección de margen por marca', () => {
    const opportunities =
      buildWorkspace()
        .commercialOpportunities
        .opportunities

    expect(
      opportunities.some(
        (opportunity) =>
          opportunity.type === 'target-gap' &&
          opportunity.entityId === 'UNV',
      ),
    ).toBe(true)

    expect(
      opportunities.some(
        (opportunity) =>
          opportunity.type === 'margin-protection' &&
          opportunity.entityId === 'UNV',
      ),
    ).toBe(true)
  })

  it('detecta clientes recuperables y clientes con crecimiento', () => {
    const opportunities =
      buildWorkspace()
        .commercialOpportunities
        .opportunities

    expect(
      opportunities.some(
        (opportunity) =>
          opportunity.type === 'customer-recovery' &&
          opportunity.entityId === 'C2',
      ),
    ).toBe(true)

    expect(
      opportunities.some(
        (opportunity) =>
          opportunity.type === 'customer-growth' &&
          opportunity.entityId === 'C3',
      ),
    ).toBe(true)
  })

  it('detecta productos con tracción y calcula impacto acumulado', () => {
    const summary =
      buildWorkspace()
        .commercialOpportunities

    expect(
      summary.opportunities.some(
        (opportunity) =>
          opportunity.type === 'product-growth' &&
          opportunity.entityId !== null,
      ),
    ).toBe(true)
    expect(summary.totalImpact).toBeGreaterThan(0)
    expect(summary.totalCount).toBe(
      summary.opportunities.length,
    )
  })

  it('respeta el segmento activo y mantiene oportunidades accionables', () => {
    const workspace =
      buildSalesWorkspace(
        createRepository(),
        {
          periodId: '2026-03',
          comparisonMode: 'previous-period',
          customerIds: ['C3'],
        },
      )

    expect(
      workspace.commercialOpportunities
        .opportunities
        .every(
          (opportunity) =>
            opportunity.entityType !== 'customer' ||
            opportunity.entityId === 'C3',
        ),
    ).toBe(true)
  })
})
