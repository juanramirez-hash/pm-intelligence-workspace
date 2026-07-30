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
  NormalizedProductMasterRow,
} from '../../data-center/importers/products/productMasterTypes'

import type {
  NormalizedSalesRow,
} from '../../data-center/importers/sales/salesTypes'

import {
  buildSalesWorkspace,
} from './buildSalesWorkspace'

function createProductMaster(
  code: string,
  brand: string,
  model: string,
): NormalizedProductMasterRow {
  return {
    erpInternalId: code,
    name: code,
    code,
    model,
    brand,
    vendorCode: null,
    vendorName: null,
    description: model,
    classification: null,
    commercialStatus: 'A',
    trend: null,
    category: null,
    subcategory1: null,
    subcategory2: null,
    createdAt: null,
    updatedAt: null,
    averageCostUsd: null,
    totalValue: null,
    currency: 'MXN',
    inventoryValueMxn: null,
    inventoryValueUsd: null,
    lastPurchaseDate: null,
    lastSaleDate: null,
    unitsSoldLast90Days: null,
    preferredVendor: null,
    productClass: null,
    secondaryCategory1: null,
    secondaryCategory2: null,
    quantityPricingSchedule: null,
    formulaText: null,
    onHand: null,
    onOrder: null,
    catalogStatus: 'Activo',
    inactiveForPurchases: false,
    showOnPortal: true,
    supersededBy: null,
    blockPurchaseRequests: false,
    directSubstitute: null,
    benchmarkS: null,
    benchmarkT: null,
    benchmarkO: null,
  }
}

function createSale(
  date: string,
  brand: string,
  productCode: string,
  model: string,
  customerId: string,
  customerName: string,
  revenue: number,
  grossProfit: number,
  quantity: number,
  documentNumber: string,
): NormalizedSalesRow {
  return {
    date,
    brand,
    revenue,
    grossProfit,
    customerId,
    customerName,
    productCode,
    model,
    productStatus: 'A',
    quantity,
    documentNumber,
    location: 'CDMX',
    salesRep: 'VENDEDOR 1',
    currency: 'MXN',
  }
}

function createRepository() {
  const sales = [
    createSale(
      '2025-03-10',
      'UNV',
      'P-UNV',
      'IPC-A',
      'C1',
      'Cliente Uno',
      100,
      20,
      1,
      'D-2025-03',
    ),
    createSale(
      '2026-02-10',
      'UNV',
      'P-UNV',
      'IPC-A',
      'C1',
      'Cliente Uno',
      300,
      60,
      3,
      'D-2026-02',
    ),
    createSale(
      '2026-03-05',
      'UNV',
      'P-UNV',
      'IPC-A',
      'C1',
      'Cliente Uno',
      300,
      90,
      3,
      'D-2026-03-1',
    ),
    createSale(
      '2026-03-12',
      'UNV',
      'P-UNV',
      'IPC-A',
      'C2',
      'Cliente Dos',
      100,
      30,
      1,
      'D-2026-03-2',
    ),
    createSale(
      '2026-03-18',
      'TP-LINK',
      'P-TPL',
      'SW-8P',
      'C2',
      'Cliente Dos',
      200,
      30,
      2,
      'D-2026-03-3',
    ),
  ]

  const productMaster = [
    createProductMaster(
      'P-UNV',
      'UNV',
      'IPC-A',
    ),
    createProductMaster(
      'P-TPL',
      'TP-LINK',
      'SW-8P',
    ),
  ]

  return new BusinessRepository(
    buildBusinessDataModel(
      sales,
      {
        productMaster,
      },
    ),
  )
}

describe('SW-001 Sales Workspace engine', () => {
  it('selecciona el último periodo y construye KPIs y rankings', () => {
    const workspace =
      buildSalesWorkspace(
        createRepository(),
        {
          periodId: null,
          comparisonMode:
            'previous-period',
        },
      )

    expect(workspace.available).toBe(true)
    expect(workspace.selectedPeriodId).toBe('2026-03')
    expect(workspace.current?.revenue).toBe(600)
    expect(workspace.current?.grossProfit).toBe(150)
    expect(workspace.current?.grossMargin).toBe(25)
    expect(workspace.comparison.revenueVariation).toBe(100)
    expect(workspace.topBrands[0]?.label).toBe('UNV')
    expect(workspace.topBrands[0]?.revenue).toBe(400)
    expect(workspace.topProducts[0]?.label).toBe('IPC-A')
    expect(workspace.reconciliation.matchRate).toBe(100)
  })

  it('compara contra el mismo mes del año anterior', () => {
    const workspace =
      buildSalesWorkspace(
        createRepository(),
        {
          periodId: '2026-03',
          comparisonMode:
            'previous-year',
        },
      )

    expect(
      workspace.comparison.previousPeriodId,
    ).toBe('2025-03')
    expect(
      workspace.comparison.revenueVariation,
    ).toBe(500)
  })

  it('respeta un periodo histórico seleccionado', () => {
    const workspace =
      buildSalesWorkspace(
        createRepository(),
        {
          periodId: '2026-02',
          comparisonMode:
            'previous-period',
        },
      )

    expect(workspace.selectedPeriodId).toBe('2026-02')
    expect(workspace.current?.revenue).toBe(300)
    expect(workspace.trend.at(-1)?.periodId).toBe('2026-02')
  })

  it('devuelve un estado vacío cuando no existe repositorio', () => {
    const workspace =
      buildSalesWorkspace(
        null,
        {
          periodId: null,
          comparisonMode:
            'previous-period',
        },
      )

    expect(workspace.available).toBe(false)
    expect(workspace.periodOptions).toEqual([])
    expect(workspace.current).toBeNull()
  })
})
