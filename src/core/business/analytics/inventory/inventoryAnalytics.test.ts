import { describe, expect, it } from 'vitest'

import { buildInventoryAnalytics } from './inventoryAnalytics'

import type {
  BusinessInventoryPosition,
} from '../../entities/inventoryPosition'

function position(
  overrides: Partial<BusinessInventoryPosition>,
): BusinessInventoryPosition {
  return {
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
    available: 7,
    committed: 3,
    inTransit: 2,
    onOrder: 4,
    unitCost: 100,
    inventoryValue: 1000,
    currency: 'MXN',
    sourceRows: 1,
    ...overrides,
  }
}

describe('IW-003 buildInventoryAnalytics', () => {
  it('calcula totales y segmentaciones del ultimo corte', () => {
    const report = buildInventoryAnalytics([
      position({}),
      position({
        id: '2026-07-30::P-2::QRO',
        productId: 'P-2',
        productName: 'P-2',
        brandId: 'ZKTECO',
        locationId: 'QRO',
        onHand: 5,
        available: 5,
        committed: 0,
        inTransit: 0,
        onOrder: 1,
        inventoryValue: 500,
      }),
      position({
        id: '2026-06-30::P-OLD::CDMX',
        snapshotDate: '2026-06-30',
        productId: 'P-OLD',
        productName: 'P-OLD',
        inventoryValue: 9000,
      }),
    ], '2026-07-30')

    expect(report.totals.positions).toBe(2)
    expect(report.totals.products).toBe(2)
    expect(report.totals.locations).toBe(2)
    expect(report.totals.inventoryValue).toBe(1500)
    expect(report.totals.inboundUnits).toBe(7)
    expect(report.byBrand[0]?.key).toBe('UNV')
    expect(report.byBrand[0]?.valueShare).toBeCloseTo(2 / 3)
    expect(report.byLocation).toHaveLength(2)
  })

  it('clasifica posiciones criticas y productos no resueltos', () => {
    const report = buildInventoryAnalytics([
      position({
        id: 'NEG',
        productId: null,
        productName: 'OLD-1',
        identityStatus: 'unresolved',
        onHand: -2,
        available: -2,
        committed: 0,
        inventoryValue: 200,
      }),
      position({
        id: 'OUT',
        productId: 'P-2',
        productName: 'P-2',
        onHand: 0,
        available: 0,
        committed: 0,
        inTransit: 0,
        onOrder: 0,
        inventoryValue: 0,
      }),
      position({
        id: 'INBOUND',
        productId: 'P-3',
        productName: 'P-3',
        onHand: 0,
        available: 0,
        committed: 0,
        inTransit: 5,
        onOrder: 0,
        inventoryValue: 0,
      }),
    ], '2026-07-30')

    expect(report.totals.unresolvedProducts).toBe(1)
    expect(
      report.stockStatus.find(
        (summary) => summary.status === 'negative_stock',
      )?.positions,
    ).toBe(1)
    expect(
      report.stockStatus.find(
        (summary) => summary.status === 'out_of_stock',
      )?.positions,
    ).toBe(1)
    expect(
      report.stockStatus.find(
        (summary) => summary.status === 'inbound_only',
      )?.positions,
    ).toBe(1)
  })
})
