import { describe, expect, it } from 'vitest'

import { InventoryQueries } from './inventoryQueries'

import type { BusinessDataModel } from '../models/businessDataModel'

function model(): BusinessDataModel {
  return {
    generatedAt: '2026-07-30T00:00:00.000Z',
    periodStart: null,
    periodEnd: null,
    totals: { revenue: 0, grossProfit: 0, quantity: 0, documents: 0 },
    customers: new Map(),
    customerPeriods: new Map(),
    customerBrandPeriods: new Map(),
    brands: new Map(),
    brandPeriods: new Map(),
    brandTargets: new Map(),
    products: new Map(),
    productPeriods: new Map(),
    periods: new Map(),
    documentNumbers: new Set(),
    locations: new Set(),
    salesRepresentatives: new Set(),
    currencies: new Set(),
    processedRows: 0,
    ignoredRows: 0,
    inventoryPositions: new Map([
      ['2026-07-30::P-1::CDMX', {
        id: '2026-07-30::P-1::CDMX',
        snapshotDate: '2026-07-30',
        productId: 'P-1',
        productName: 'P-1',
        productCode: null,
        brandId: 'UNV',
        model: 'IPC-A',
        locationId: 'CDMX',
        identityStatus: 'current_master',
        onHand: 10,
        available: 8,
        committed: 2,
        inTransit: 3,
        onOrder: 4,
        unitCost: 100,
        inventoryValue: 1000,
        currency: 'MXN',
        sourceRows: 1,
      }],
    ]),
    inventorySnapshots: new Map([
      ['2026-07-30', {
        id: '2026-07-30',
        snapshotDate: '2026-07-30',
        positions: 1,
        products: new Set(['P-1']),
        unresolvedProducts: new Set(),
        locations: new Set(['CDMX']),
        onHand: 10,
        available: 8,
        committed: 2,
        inTransit: 3,
        onOrder: 4,
        inventoryValue: 1000,
      }],
    ]),
  }
}

describe('IW-002 InventoryQueries', () => {
  it('consulta ultimo corte, producto, marca y ubicacion', () => {
    const queries = new InventoryQueries(model())

    expect(queries.getLatestSnapshotDate()).toBe('2026-07-30')
    expect(queries.findLatestByProduct('p-1')).toHaveLength(1)
    expect(queries.findByBrand('unv')).toHaveLength(1)
    expect(queries.findByLocation('cdmx')).toHaveLength(1)
    expect(queries.getLatestSnapshot()?.inventoryValue).toBe(1000)
  })
})
