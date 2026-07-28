import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../builders'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import {
  BusinessRepository,
} from './businessRepository'

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

function repository() {
  return new BusinessRepository(
    buildBusinessDataModel([
      sale({}),
      sale({
        revenue: 50,
        grossProfit: 10,
        documentNumber: 'D1',
      }),
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

describe('SW-003 SalesSegmentationQueries', () => {
  it('combina filtros y conserva documentos distintos', () => {
    const summary =
      repository().salesSegmentation.summarize({
        periodIds: ['2026-03'],
        brandIds: ['UNV'],
        customerIds: ['C1'],
        locationIds: ['CDMX'],
      })

    expect(summary.revenue).toBe(150)
    expect(summary.grossProfit).toBe(35)
    expect(summary.documents).toBe(1)
    expect(summary.rowCount).toBe(2)
    expect(summary.customerCount).toBe(1)
  })

  it('agrupa por dimensión y resuelve etiquetas', () => {
    const groups =
      repository().salesSegmentation.groupBy(
        'customer',
        { periodIds: ['2026-03'] },
      )

    expect(groups).toHaveLength(2)
    expect(groups[0]?.label).toContain('Cliente Dos')
    expect(groups[0]?.revenue).toBe(200)
  })

  it('busca por ID o nombre sin exponer filas normalizadas', () => {
    const rows =
      repository().salesSegmentation.getDetailRows({
        searchTerm: 'cliente uno',
      })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.customerId).toBe('C1')
    expect(rows[0]?.documents).toBe(1)
  })
})
