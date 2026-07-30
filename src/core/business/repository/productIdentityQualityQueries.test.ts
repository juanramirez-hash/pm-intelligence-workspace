import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../builders'

import {
  ProductIdentityQualityQueries,
} from './productIdentityQualityQueries'

import type {
  NormalizedProductMasterRow,
} from '../../../features/data-center/importers/products/productMasterTypes'

const productMaster: NormalizedProductMasterRow[] = [
  {
    erpInternalId: '1',
    name: 'P-1',
    code: 'P-1',
    model: 'IPC-A',
    brand: 'UNV',
    vendorCode: null,
    description: null,
    commercialStatus: null,
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
    catalogStatus: null,
    inactiveForPurchases: null,
    showOnPortal: null,
    supersededBy: null,
    blockPurchaseRequests: null,
    directSubstitute: null,
    benchmarkS: null,
    benchmarkT: null,
    benchmarkO: null,
  },
]

describe('ProductIdentityQualityQueries', () => {
  it('expone cobertura vigente e historica por Name', () => {
    const model = buildBusinessDataModel(
      [
        {
          date: '2026-07-01',
          brand: 'UNV',
          revenue: 100,
          grossProfit: 30,
          customerId: 'C1',
          customerName: 'Cliente Uno',
          productName: 'P-1',
          productCode: null,
          model: 'IPC-A',
          quantity: 1,
          documentNumber: 'F1',
          location: 'CDMX',
          salesRep: 'REP-1',
          currency: 'MXN',
        },
        {
          date: '2026-07-02',
          brand: 'UNV',
          revenue: 900,
          grossProfit: 100,
          customerId: 'C2',
          customerName: 'Cliente Dos',
          productName: 'P-X',
          productCode: null,
          model: 'IPC-X',
          quantity: 2,
          documentNumber: 'F2',
          location: 'CDMX',
          salesRep: 'REP-1',
          currency: 'MXN',
        },
      ],
      { productMaster },
    )

    const queries = new ProductIdentityQualityQueries(model)
    const report = queries.getReport()

    expect(report.totalRows).toBe(2)
    expect(report.matchedRows).toBe(2)
    expect(report.matchedByNameRows).toBe(2)
    expect(report.historicalUnlistedRows).toBe(1)
    expect(report.historicalUnlistedSalesValue).toBe(900)
    expect(report.rowCoverage).toBe(1)
    expect(report.valueCoverage).toBe(1)
    expect(report.exceptionRows).toBe(0)
    expect(queries.isGatePassed()).toBe(true)
    expect(queries.getTopIssues(1)).toHaveLength(0)
    expect(
      report.reasonSummaries.find(
        (summary) => summary.reason === 'historical_unlisted',
      )?.rows,
    ).toBe(1)
  })
})
