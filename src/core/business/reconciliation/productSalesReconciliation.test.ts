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
    name: 'CI-IPC-A',
    code: 'LEGACY-CI-IPC-A',
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

describe('IQ-002 Name-Based Product Reconciliation', () => {
  it('prioriza Name y valida Marca y Modelo como atributos', () => {
    const index = buildProductSalesReconciliationIndex([
      createProduct(),
    ])

    const result = reconcileSalesProduct(
      {
        productName: ' ci-ipc-a ',
        productCode: null,
        brand: 'Otra marca',
        model: 'Otro modelo',
      },
      index,
    )

    expect(result.status).toBe('matched')
    expect(result.strategy).toBe('name')
    expect(result.reason).toBe(
      'matched_by_name_with_attribute_warning',
    )
    expect(result.product?.name).toBe('CI-IPC-A')
    expect(result.attributeWarnings).toEqual([
      'brand_mismatch',
      'model_mismatch',
    ])
  })

  it('concilia por Name sin advertencias cuando los atributos coinciden', () => {
    const index = buildProductSalesReconciliationIndex([
      createProduct(),
    ])

    const result = reconcileSalesProduct(
      {
        productName: 'CI-IPC-A',
        productCode: null,
        brand: 'UNV',
        model: 'IPC-A',
      },
      index,
    )

    expect(result.reason).toBe('matched_by_name')
    expect(result.attributeWarnings).toEqual([])
  })

  it('mantiene codigo alterno como fallback secundario', () => {
    const index = buildProductSalesReconciliationIndex([
      createProduct(),
    ])

    const result = reconcileSalesProduct(
      {
        productName: null,
        productCode: 'legacy-ci-ipc-a',
        brand: 'Otra marca',
        model: 'Otro modelo',
      },
      index,
    )

    expect(result.status).toBe('matched')
    expect(result.strategy).toBe('erp_code')
    expect(result.product?.name).toBe('CI-IPC-A')
  })

  it('usa marca y modelo cuando Name y codigo no encuentran producto', () => {
    const index = buildProductSalesReconciliationIndex([
      createProduct(),
    ])

    const result = reconcileSalesProduct(
      {
        productName: 'NAME-ANTERIOR',
        productCode: 'CODIGO-ANTERIOR',
        brand: ' unv ',
        model: ' ipc-a ',
      },
      index,
    )

    expect(result.status).toBe('matched')
    expect(result.strategy).toBe('brand_model')
    expect(result.product?.name).toBe('CI-IPC-A')
  })

  it('detecta Names duplicados como ambiguos', () => {
    const index = buildProductSalesReconciliationIndex([
      createProduct(),
      createProduct({
        erpInternalId: '1002',
        code: 'OTRO-CODIGO',
        model: 'IPC-B',
      }),
    ])

    const result = reconcileSalesProduct(
      {
        productName: 'CI-IPC-A',
        productCode: null,
        brand: 'UNV',
        model: 'IPC-A',
      },
      index,
    )

    expect(result.status).toBe('ambiguous')
    expect(result.strategy).toBe('name')
    expect(result.reason).toBe('ambiguous_name')
    expect(result.candidateNames).toEqual([
      'CI-IPC-A',
      'CI-IPC-A',
    ])
  })


  it('reconoce por Name una identidad historica ausente del catalogo vigente', () => {
    const index = buildProductSalesReconciliationIndex([])

    const result = reconcileSalesProduct(
      {
        productName: 'PRODUCTO-DESCONTINUADO',
        productCode: null,
        brand: 'UNV',
        model: 'MODELO-ANTERIOR',
      },
      index,
    )

    expect(result.status).toBe('matched')
    expect(result.strategy).toBe('name')
    expect(result.reason).toBe('historical_unlisted')
    expect(result.product).toBeNull()
  })


  it('clasifica productos no encontrados y filas sin identidad', () => {
    const index = buildProductSalesReconciliationIndex([])

    expect(
      reconcileSalesProduct(
        {
          productName: 'NO-EXISTE',
          productCode: null,
          brand: 'UNV',
          model: 'NO-EXISTE',
        },
        index,
      ).reason,
    ).toBe('historical_unlisted')

    expect(
      reconcileSalesProduct(
        {
          productName: null,
          productCode: null,
          brand: 'UNV',
          model: null,
        },
        index,
      ).reason,
    ).toBe('missing_product_identity')
  })
})
