import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedProductMasterRow,
} from '../../../features/data-center/importers/products/productMasterTypes'

import {
  buildProductSalesReconciliationIndex,
  reconcileSalesProduct,
} from './productSalesReconciliation'

function createProduct(
  overrides: Partial<NormalizedProductMasterRow> = {},
): NormalizedProductMasterRow {
  return {
    erpInternalId: '1001',
    code: 'CI-IPC-A',
    model: 'IPC-A',
    brand: 'UNV',
    vendorCode: null,
    description: null,
    commercialStatus: 'A',
    trend: null,
    averageCostUsd: null,
    totalValue: null,
    currency: null,
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
    ...overrides,
  }
}

describe('PMC-005 Product Sales Reconciliation', () => {
  it('prioriza una coincidencia única por código ERP', () => {
    const index = buildProductSalesReconciliationIndex([
      createProduct(),
    ])

    const result = reconcileSalesProduct(
      {
        productCode: ' ci-ipc-a ',
        brand: 'Otra marca',
        model: 'Otro modelo',
      },
      index,
    )

    expect(result.status).toBe('matched')
    expect(result.strategy).toBe('erp_code')
    expect(result.product?.code).toBe('CI-IPC-A')
  })

  it('usa marca y modelo cuando el código no existe', () => {
    const index = buildProductSalesReconciliationIndex([
      createProduct(),
    ])

    const result = reconcileSalesProduct(
      {
        productCode: 'CODIGO-ANTERIOR',
        brand: ' unv ',
        model: ' ipc-a ',
      },
      index,
    )

    expect(result.status).toBe('matched')
    expect(result.strategy).toBe('brand_model')
    expect(result.product?.code).toBe('CI-IPC-A')
  })

  it('detecta una combinación ambigua de marca y modelo', () => {
    const index = buildProductSalesReconciliationIndex([
      createProduct(),
      createProduct({
        erpInternalId: '1002',
        code: 'CI-IPC-A-ALT',
      }),
    ])

    const result = reconcileSalesProduct(
      {
        productCode: null,
        brand: 'UNV',
        model: 'IPC-A',
      },
      index,
    )

    expect(result.status).toBe('ambiguous')
    expect(result.strategy).toBe('brand_model')
    expect(result.candidateCodes).toEqual([
      'CI-IPC-A',
      'CI-IPC-A-ALT',
    ])
  })

  it('detecta códigos ERP duplicados como ambiguos', () => {
    const index = buildProductSalesReconciliationIndex([
      createProduct(),
      createProduct({
        erpInternalId: '1002',
        model: 'IPC-B',
      }),
    ])

    const result = reconcileSalesProduct(
      {
        productCode: 'CI-IPC-A',
        brand: 'UNV',
        model: 'IPC-A',
      },
      index,
    )

    expect(result.status).toBe('ambiguous')
    expect(result.strategy).toBe('erp_code')
    expect(result.reason).toBe('ambiguous_erp_code')
  })

  it('clasifica productos no encontrados y filas sin identidad', () => {
    const index = buildProductSalesReconciliationIndex([])

    expect(
      reconcileSalesProduct(
        {
          productCode: null,
          brand: 'UNV',
          model: 'NO-EXISTE',
        },
        index,
      ).reason,
    ).toBe('product_not_found')

    expect(
      reconcileSalesProduct(
        {
          productCode: null,
          brand: 'UNV',
          model: null,
        },
        index,
      ).reason,
    ).toBe('missing_product_identity')
  })
})
