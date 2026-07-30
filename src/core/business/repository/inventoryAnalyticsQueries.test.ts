import { describe, expect, it } from 'vitest'

import { InventoryAnalyticsQueries } from './inventoryAnalyticsQueries'

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
      ['2026-07-30::P-2::QRO', {
        id: '2026-07-30::P-2::QRO',
        snapshotDate: '2026-07-30',
        productId: 'P-2',
        productName: 'P-2',
        productCode: null,
        brandId: 'ZKTECO',
        model: 'AC-A',
        locationId: 'QRO',
        identityStatus: 'current_master',
        onHand: 0,
        available: 0,
        committed: 0,
        inTransit: 0,
        onOrder: 0,
        unitCost: 50,
        inventoryValue: 0,
        currency: 'MXN',
        sourceRows: 1,
      }],
    ]),
    inventorySnapshots: new Map([
      ['2026-07-30', {
        id: '2026-07-30',
        snapshotDate: '2026-07-30',
        positions: 2,
        products: new Set(['P-1', 'P-2']),
        unresolvedProducts: new Set(),
        locations: new Set(['CDMX', 'QRO']),
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

describe('IW-003 InventoryAnalyticsQueries', () => {
  it('expone resumen, rankings y estatus del ultimo corte', () => {
    const queries = new InventoryAnalyticsQueries(model())

    expect(queries.getReport().snapshotDate).toBe('2026-07-30')
    expect(queries.getTotals().inventoryValue).toBe(1000)
    expect(queries.getByBrand()[0]?.key).toBe('UNV')
    expect(queries.getTopProducts(1)).toHaveLength(1)
    expect(queries.findStockStatus('out_of_stock')?.positions).toBe(1)
  })
})
