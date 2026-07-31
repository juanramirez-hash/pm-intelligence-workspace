import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  InventoryQueries,
} from './inventoryQueries'

import type {
  BusinessDataModel,
} from '../models/businessDataModel'

import type {
  BusinessInventoryPosition,
} from '../entities/inventoryPosition'

const position: BusinessInventoryPosition = {
  id: 'NO_DATE::P-1::CDMX',
  snapshotDate: null,
  productId: 'P-1',
  productName: 'P-1',
  productCode: null,
  brandId: 'BELDEN',
  model: 'CB02BBEL05',
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
}

function undatedModel(): BusinessDataModel {
  return {
    inventoryPositions: new Map([
      [position.id, position],
    ]),
    inventorySnapshots: new Map([
      ['NO_DATE', {
        id: 'NO_DATE',
        snapshotDate: null,
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
  } as unknown as BusinessDataModel
}

describe('IW-005 undated inventory snapshot', () => {
  it('expone como corte activo el inventario sin fecha de snapshot', () => {
    const queries = new InventoryQueries(undatedModel())

    expect(queries.getLatestSnapshotDate()).toBeNull()
    expect(queries.getLatestPositions()).toEqual([position])
    expect(queries.getLatestSnapshot()?.id).toBe('NO_DATE')
    expect(queries.findLatestByProduct('p-1')).toEqual([position])
  })
})
