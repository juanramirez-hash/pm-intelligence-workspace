import { describe, expect, it } from 'vitest'

import { buildBusinessInventory } from './buildBusinessInventory'

import type { BusinessProduct } from '../entities/product'

const products = new Map<string, BusinessProduct>([
  ['P-1', {
    id: 'P-1',
    name: 'P-1',
    code: 'P-1',
    erpInternalId: '1',
    model: 'IPC-A',
    brandId: 'UNV',
    brand: 'UNV',
    description: null,
    classification: null,
    trend: null,
    vendorCode: null,
    vendorName: null,
    category: null,
    subcategory1: null,
    subcategory2: null,
    createdAt: null,
    updatedAt: null,
    identitySource: 'product_master',
    sku: 'P-1',
    commercialStatus: null,
    firstSale: null,
    lastSale: null,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
    activePeriods: new Set(),
    brands: new Set(['UNV']),
    customers: new Set(),
    locations: new Set(),
  }],
])

describe('IW-002 buildBusinessInventory', () => {
  it('consolida duplicados por fecha, Name y ubicacion', () => {
    const result = buildBusinessInventory([
      {
        snapshotDate: '2026-07-30',
        productName: 'P-1',
        productCode: null,
        brand: 'UNV',
        model: 'IPC-A',
        location: 'CDMX',
        onHand: 5,
        available: 4,
        committed: 1,
        inTransit: 2,
        onOrder: 3,
        unitCost: 10,
        inventoryValue: 50,
        currency: 'MXN',
      },
      {
        snapshotDate: '2026-07-30',
        productName: 'P-1',
        productCode: null,
        brand: 'UNV',
        model: 'IPC-A',
        location: 'CDMX',
        onHand: 2,
        available: 2,
        committed: 0,
        inTransit: 0,
        onOrder: 0,
        unitCost: 10,
        inventoryValue: 20,
        currency: 'MXN',
      },
    ], products)

    expect(result.positions).toHaveLength(1)
    expect(result.positions.values().next().value?.onHand).toBe(7)
    expect(result.positions.values().next().value?.sourceRows).toBe(2)
    expect(result.snapshots.get('2026-07-30')?.inventoryValue).toBe(70)
  })

  it('usa la identidad canonica resuelta como productCode cuando el export no trae codigo separado', () => {
    const result = buildBusinessInventory([
      {
        snapshotDate: null,
        productName: 'P-1',
        productCode: null,
        brand: 'UNV',
        model: 'IPC-A',
        location: 'CDMX',
        onHand: 5,
        available: 4,
        committed: 1,
        inTransit: 2,
        onOrder: 3,
        unitCost: 10,
        inventoryValue: 50,
        currency: 'MXN',
      },
    ], products)

    const position =
      result.positions.values().next().value

    expect(position?.productId).toBe('P-1')
    expect(position?.productCode).toBe('P-1')
    expect(position?.identityStatus).toBe('current_master')
  })

  it('mantiene visible una identidad de inventario no resuelta', () => {
    const result = buildBusinessInventory([
      {
        snapshotDate: '2026-07-30',
        productName: 'OLD-1',
        productCode: null,
        brand: 'UNV',
        model: 'OLD',
        location: 'QRO',
        onHand: 1,
        available: null,
        committed: null,
        inTransit: null,
        onOrder: null,
        unitCost: null,
        inventoryValue: null,
        currency: null,
      },
    ], products)

    expect(result.positions.values().next().value?.identityStatus)
      .toBe('unresolved')
    expect(result.snapshots.get('2026-07-30')?.unresolvedProducts.has('OLD-1'))
      .toBe(true)
  })
})