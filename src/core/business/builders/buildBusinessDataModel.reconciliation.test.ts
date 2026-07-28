import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedProductMasterRow,
} from '../../../features/data-center/importers/products/productMasterTypes'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import {
  BusinessRepository,
} from '../repository'

import {
  buildBusinessDataModel,
} from './buildBusinessDataModel'

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

function createSale(
  overrides: Partial<NormalizedSalesRow> = {},
): NormalizedSalesRow {
  return {
    date: '2026-06-20',
    brand: 'UNV',
    revenue: 100,
    grossProfit: 25,
    customerId: '100001',
    customerName: 'Cliente Uno',
    productCode: null,
    model: 'IPC-A',
    quantity: 1,
    documentNumber: 'F001',
    location: 'CDMX',
    salesRep: 'Ana',
    currency: 'MXN',
    ...overrides,
  }
}

describe('PMC-005 buildBusinessDataModel reconciliation', () => {
  it('consolida ventas por código ERP antes que por marca y modelo', () => {
    const model = buildBusinessDataModel(
      [
        createSale({
          productCode: 'CI-IPC-A',
          brand: 'Marca escrita diferente',
          model: 'Modelo escrito diferente',
        }),
      ],
      {
        productMaster: [createProduct()],
      },
    )

    expect(model.products.get('CI-IPC-A')?.revenue).toBe(100)
    expect(model.products.get('CI-IPC-A')?.identitySource).toBe('product_master')
    expect(model.productPeriods.get('2026-06::CI-IPC-A')?.revenue).toBe(100)
    expect(model.productReconciliation).toMatchObject({
      totalRows: 1,
      matchedRows: 1,
      matchedByErpCode: 1,
      matchedByBrandAndModel: 0,
      ambiguousRows: 0,
      unmatchedRows: 0,
      matchRate: 1,
    })
  })

  it('registra coincidencias por marca y modelo y productos sin catálogo', () => {
    const model = buildBusinessDataModel(
      [
        createSale(),
        createSale({
          date: '2026-06-21',
          documentNumber: 'F002',
          model: 'SIN-CATALOGO',
          revenue: 50,
        }),
      ],
      {
        productMaster: [createProduct()],
      },
    )

    expect(model.products.get('CI-IPC-A')?.revenue).toBe(100)
    expect(model.products.get('SIN-CATALOGO')?.identitySource).toBe('sales_fallback')
    expect(model.productReconciliation).toMatchObject({
      totalRows: 2,
      matchedRows: 1,
      matchedByBrandAndModel: 1,
      unmatchedRows: 1,
      ambiguousRows: 0,
      matchRate: 0.5,
    })
  })

  it('separa ventas ambiguas de los productos maestros candidatos', () => {
    const model = buildBusinessDataModel(
      [createSale()],
      {
        productMaster: [
          createProduct(),
          createProduct({
            erpInternalId: '1002',
            code: 'CI-IPC-A-ALT',
          }),
        ],
      },
    )

    expect(model.products.get('CI-IPC-A')?.revenue).toBe(0)
    expect(model.products.get('CI-IPC-A-ALT')?.revenue).toBe(0)

    const ambiguous = [...model.products.values()].find(
      (product) => product.identitySource === 'ambiguous_match',
    )

    expect(ambiguous?.id).toBe('AMBIGUOUS::UNV::IPC-A')
    expect(ambiguous?.revenue).toBe(100)
    expect(model.productReconciliation).toMatchObject({
      totalRows: 1,
      matchedRows: 0,
      ambiguousRows: 1,
      ambiguousByBrandAndModel: 1,
      unmatchedRows: 0,
      matchRate: 0,
    })
  })

  it('evita mezclar fallbacks con el mismo modelo entre marcas', () => {
    const model = buildBusinessDataModel([
      createSale({
        brand: 'UNV',
        model: 'MODELO-COMPARTIDO',
      }),
      createSale({
        date: '2026-06-21',
        documentNumber: 'F002',
        brand: 'AJAX',
        model: 'MODELO-COMPARTIDO',
        revenue: 200,
      }),
    ])

    expect(model.products.size).toBe(2)
    expect(
      [...model.products.values()]
        .map((product) => product.revenue)
        .sort((left, right) => left - right),
    ).toEqual([100, 200])
  })

  it('expone el resumen mediante BusinessRepository', () => {
    const repository = new BusinessRepository(
      buildBusinessDataModel(
        [createSale()],
        { productMaster: [createProduct()] },
      ),
    )

    expect(
      repository.getProductReconciliationSummary(),
    ).toMatchObject({
      matchedRows: 1,
      matchedByBrandAndModel: 1,
      matchRate: 1,
    })
  })
})
