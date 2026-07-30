import { describe, expect, it } from 'vitest'

import { InventoryRiskOpportunityQueries } from './inventoryRiskOpportunityQueries'

import type { BusinessDataModel } from '../models/businessDataModel'

const model = {
  generatedAt: '2026-07-30T00:00:00.000Z',
  periodStart: null,
  periodEnd: null,
  periods: new Map(),
  brands: new Map(),
  customers: new Map(),
  products: new Map(),
  inventoryPositions: new Map([
    [
      'I-1',
      {
        id: 'I-1',
        snapshotDate: '2026-07-30',
        productId: 'P-1',
        productName: 'P-1',
        productCode: 'P-1',
        brandId: 'UNV',
        model: 'IPC-A',
        locationId: 'CDMX',
        identityStatus: 'current_master',
        onHand: 0,
        available: 0,
        committed: 2,
        inTransit: 0,
        onOrder: 0,
        unitCost: 100,
        inventoryValue: 0,
        currency: 'MXN',
        sourceRows: 1,
      },
    ],
  ]),
  inventorySnapshots: new Map([
    [
      '2026-07-30',
      {
        snapshotDate: '2026-07-30',
      },
    ],
  ]),
} as unknown as BusinessDataModel

describe('InventoryRiskOpportunityQueries', () => {
  it('expone riesgos y oportunidades priorizadas', () => {
    const queries = new InventoryRiskOpportunityQueries(model)

    expect(queries.getTopRisks(1)[0]?.type).toBe('out_of_stock')
    expect(
      queries.findOpportunitiesByType('purchase_review'),
    ).toHaveLength(1)
  })
})
