import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessInventoryPosition,
} from '../../../core/business/entities/inventoryPosition'

import type {
  BusinessProduct,
} from '../../../core/business/entities/product'

import {
  buildProductCatalogReplacement,
} from './productCatalogReplacement'

function product(
  overrides: Partial<BusinessProduct>,
): BusinessProduct {
  return {
    id: 'P-1',
    name: 'P-1',
    code: 'P-1',
    model: 'MODELO UNO',
    sku: 'P-1',
    brandId: 'UNV',
    brand: 'UNV',
    commercialStatus: 'D',
    supersededBy: 'P-2',
    directSubstitute: 'P-2',
    firstSale: null,
    lastSale: null,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
    activePeriods: new Set(),
    brands: new Set(),
    customers: new Set(),
    locations: new Set(),
    ...overrides,
  }
}

function position(
  overrides: Partial<BusinessInventoryPosition>,
): BusinessInventoryPosition {
  return {
    id: 'NO_DATE::P-2::CDMX',
    snapshotDate: null,
    productId: 'P-2',
    productName: 'P-2',
    productCode: 'P-2',
    brandId: 'UNV',
    model: 'MODELO DOS',
    locationId: 'CDMX',
    identityStatus: 'current_master',
    onHand: 10,
    available: 8,
    committed: 2,
    inTransit: 0,
    onOrder: 0,
    unitCost: 100,
    inventoryValue: 1000,
    currency: 'MXN',
    sourceRows: 1,
    ...overrides,
  }
}

describe('PW-006.1 Product catalog replacement', () => {
  it('expone Superseded, sustituto directo e inventario del reemplazo', () => {
    const products = new Map<string, BusinessProduct>([
      ['P-1', product({})],
      ['P-2', product({
        id: 'P-2',
        name: 'P-2',
        code: 'P-2',
        model: 'MODELO DOS',
        supersededBy: null,
        directSubstitute: null,
      })],
    ])
    const positions = [
      position({}),
      position({
        id: 'NO_DATE::P-2::QRO',
        locationId: 'QRO',
        onHand: 4,
        available: 3,
      }),
    ]

    const result = buildProductCatalogReplacement(
      products.get('P-1')!,
      {
        findProductById: (id) => products.get(id),
        findProductByName: (name) => products.get(name),
        findProductByCode: (code) => products.get(code),
        findLatestInventoryByProduct: (productId) =>
          productId === 'P-2' ? positions : [],
      },
    )

    expect(result).toMatchObject({
      status: 'superseded_with_direct',
      shortLabel: 'Con sustituto directo',
    })
    expect(result.supersededBy).toMatchObject({
      reference: 'P-2',
      productId: 'P-2',
      model: 'MODELO DOS',
      onHand: 14,
      available: 11,
      locations: 2,
      resolved: true,
    })
    expect(result.directSubstitute).toMatchObject({
      reference: 'P-2',
      available: 11,
    })
  })

  it('distingue un Superseded sin sustituto directo', () => {
    const current = product({
      directSubstitute: null,
    })

    const result = buildProductCatalogReplacement(
      current,
      {
        findProductById: () => undefined,
        findProductByName: () => undefined,
        findProductByCode: () => undefined,
        findLatestInventoryByProduct: () => [],
      },
    )

    expect(result.status).toBe(
      'superseded_without_direct',
    )
    expect(result.tone).toBe('critical')
    expect(result.supersededBy).toMatchObject({
      reference: 'P-2',
      resolved: false,
      available: 0,
    })
    expect(result.directSubstitute).toBeNull()
  })

  it('identifica un producto vigente sin ruta de sustitución', () => {
    const current = product({
      supersededBy: null,
      directSubstitute: null,
    })

    const result = buildProductCatalogReplacement(
      current,
      {
        findProductById: () => undefined,
        findProductByName: () => undefined,
        findProductByCode: () => undefined,
        findLatestInventoryByProduct: () => [],
      },
    )

    expect(result).toMatchObject({
      status: 'current',
      statusLabel: 'Producto vigente',
      shortLabel: 'Sin sustitución',
      supersededBy: null,
      directSubstitute: null,
    })
  })
})
