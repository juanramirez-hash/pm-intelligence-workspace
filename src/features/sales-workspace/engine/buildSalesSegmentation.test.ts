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
  NormalizedSalesRow,
} from '../../data-center/importers/sales/salesTypes'

import {
  buildSalesWorkspace,
} from './buildSalesWorkspace'

function sale(
  overrides: Partial<NormalizedSalesRow>,
): NormalizedSalesRow {
  return {
    date: '2026-03-10',
    brand: 'UNV',
    revenue: 100,
    grossProfit: 25,
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

function createRepository() {
  return new BusinessRepository(
    buildBusinessDataModel([
      sale({
        date: '2026-02-10',
        revenue: 80,
        documentNumber: 'F1',
      }),
      sale({}),
      sale({
        brand: 'TP-LINK',
        customerId: 'C2',
        customerName: 'Cliente Dos',
        model: 'SW-8P',
        revenue: 200,
        grossProfit: 40,
        quantity: 2,
        documentNumber: 'D2',
        location: 'QRO',
        salesRep: 'VENDEDOR 2',
      }),
    ]),
  )
}

describe('SW-003 Sales Workspace segmentation', () => {
  it('recalcula KPIs, comparación, tendencia y rankings', () => {
    const workspace =
      buildSalesWorkspace(
        createRepository(),
        {
          periodId: '2026-03',
          comparisonMode: 'previous-period',
          brandIds: ['UNV'],
        },
      )

    expect(workspace.current?.revenue).toBe(100)
    expect(workspace.comparison.revenueVariation).toBe(25)
    expect(workspace.trend).toHaveLength(2)
    expect(workspace.topBrands).toHaveLength(1)
    expect(workspace.detailRows).toHaveLength(1)
    expect(workspace.activeFilters[0]?.label).toBe('UNV')
  })

  it('desactiva objetivos cuando la cuota no puede atribuirse al segmento', () => {
    const workspace =
      buildSalesWorkspace(
        createRepository(),
        {
          periodId: '2026-03',
          comparisonMode: 'previous-period',
          customerIds: ['C1'],
        },
      )

    expect(workspace.performance.available).toBe(false)
    expect(workspace.performance.unavailableReason).toContain(
      'objetivos mensuales están definidos por marca',
    )
  })
})
