import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../builders'

import {
  BusinessRepository,
} from './businessRepository'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

const rows: NormalizedSalesRow[] = [
  '2026-01-15',
  '2026-02-15',
  '2026-03-15',
].map((date) => ({
  date,
  brand: 'UNV',
  revenue: 100,
  grossProfit: 25,
  customerId: 'C-1',
  customerName: 'Cliente Uno',
  productName: 'CI111UNI21',
  productCode: 'CI111UNI21',
  model: 'IPC-A',
  quantity: 1,
  documentNumber: `F-${date}`,
  location: 'CDMX',
  salesRep: null,
  currency: 'MXN',
}))

describe('FW-001 BusinessRepository integration', () => {
  it('expone repository.forecast como API del Business Core', () => {
    const repository = new BusinessRepository(
      buildBusinessDataModel(rows),
    )

    expect(repository.forecast.getFoundation().status).toBe(
      'ready',
    )
    expect(repository.forecast.getHistoricalPeriodIds()).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ])
  })
})
