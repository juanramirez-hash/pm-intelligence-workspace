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
  buildInventoryCatalogSummary,
  enrichInventoryPositions,
} from './inventoryCatalogEnrichment'

function inventoryPosition(
  overrides: Partial<BusinessInventoryPosition>,
): BusinessInventoryPosition {
  return {
    id: '2026-07-30::P-1::CDMX',
    snapshotDate: '2026-07-30',
    productId: 'P-1',
    productName: 'P-1',
    productCode: 'P-1',
    brandId: 'UNV',
    model: 'IPC-A',
    locationId: 'CDMX',
    identityStatus: 'current_master',
    onHand: 10,
    available: 6,
    committed: 4,
    inTransit: 0,
    onOrder: 0,
    unitCost: 100,
    inventoryValue: 1000,
    currency: 'MXN',
    sourceRows: 1,
    ...overrides,
  }
}

function product(
  overrides: Partial<BusinessProduct>,
): BusinessProduct {
  return {
    id: 'P-1',
    name: 'P-1',
    code: 'P-1',
    model: 'IPC-A',
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

describe('IW-006.1 Inventory catalog enrichment', () => {
  it('cruza categoría, Superseded y sustituto directo por Name', () => {
    const products = new Map<string, BusinessProduct>([
      ['P-1', product({})],
      ['P-2', product({
        id: 'P-2',
        name: 'P-2',
        code: 'P-2',
        model: 'IPC-B',
        commercialStatus: 'A',
        supersededBy: null,
        directSubstitute: null,
      })],
    ])

    const resolver = {
      findById: (id: string) => products.get(id),
      findByName: (name: string) => products.get(name),
      findByCode: (code: string) => products.get(code),
    }

    const enriched = enrichInventoryPositions(
      [
        inventoryPosition({}),
        inventoryPosition({
          id: '2026-07-30::P-2::QRO',
          productId: 'P-2',
          productName: 'P-2',
          productCode: 'P-2',
          model: 'IPC-B',
          locationId: 'QRO',
          onHand: 8,
          available: 7,
          committed: 1,
          inventoryValue: 800,
        }),
      ],
      resolver,
    )

    expect(enriched[0]).toMatchObject({
      commercialStatus: 'D',
      supersededBy: 'P-2',
      directSubstitute: 'P-2',
      replacementStatus: 'both',
      supersededByAvailable: 7,
      directSubstituteAvailable: 7,
      catalogResolved: true,
    })

    expect(buildInventoryCatalogSummary(enriched)).toMatchObject({
      classifiedProducts: 2,
      productsWithSuperseded: 1,
      productsWithDirectSubstitute: 1,
      productsWithBoth: 1,
      supersededInventoryValue: 1000,
    })
  })
})
