import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedInventoryRow,
} from '../../../features/data-center/importers/inventory/inventoryTypes'

import type {
  NormalizedProductMasterRow,
} from '../../../features/data-center/importers/products/productMasterTypes'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import {
  buildBusinessDataModel,
} from '../builders'

import {
  ForecastDataQueries,
} from '../repository/forecastDataQueries'

function salesRow(
  date: string,
  productName: string,
  revenue: number,
  quantity: number,
): NormalizedSalesRow {
  return {
    date,
    brand: 'UNV',
    revenue,
    grossProfit: revenue * 0.25,
    customerId: 'C-1',
    customerName: 'Cliente Uno',
    productName,
    productCode: productName,
    model: productName,
    quantity,
    documentNumber: `${productName}-${date}`,
    location: 'CDMX',
    salesRep: null,
    currency: 'MXN',
  }
}

function productMasterRow(
  name: string,
  overrides: Partial<NormalizedProductMasterRow> = {},
): NormalizedProductMasterRow {
  return {
    erpInternalId: name,
    name,
    code: name,
    model: name,
    brand: 'UNV',
    vendorCode: null,
    vendorName: null,
    description: null,
    classification: null,
    commercialStatus: 'A',
    trend: null,
    category: null,
    subcategory1: null,
    subcategory2: null,
    createdAt: null,
    updatedAt: null,
    averageCostUsd: null,
    totalValue: null,
    currency: 'MXN',
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
    inactiveForPurchases: false,
    showOnPortal: true,
    supersededBy: null,
    blockPurchaseRequests: false,
    directSubstitute: null,
    benchmarkS: null,
    benchmarkT: null,
    benchmarkO: null,
    ...overrides,
  }
}

function inventoryRow(
  productName: string,
  available: number,
  overrides: Partial<NormalizedInventoryRow> = {},
): NormalizedInventoryRow {
  return {
    snapshotDate: '2026-03-13',
    productName,
    productCode: productName,
    brand: 'UNV',
    model: productName,
    location: 'CDMX',
    onHand: available,
    available,
    committed: 0,
    inTransit: 0,
    onOrder: 0,
    unitCost: 100,
    inventoryValue: available * 100,
    currency: 'MXN',
    ...overrides,
  }
}

function buildModelWithInventory() {
  return buildBusinessDataModel(
    [
      salesRow('2026-01-30', 'P-1', 100, 10),
      salesRow('2026-02-27', 'P-1', 120, 12),
      salesRow('2026-03-13', 'P-1', 100, 10),
      salesRow('2026-01-30', 'P-OLD', 100, 10),
      salesRow('2026-02-27', 'P-OLD', 100, 10),
      salesRow('2026-03-13', 'P-OLD', 20, 2),
    ],
    {
      brandTargets: [
        {
          brandId: 'UNV',
          periodId: '2026-03',
          targetRevenue: 500,
          workingDays: 22,
        },
      ],
      productMaster: [
        productMasterRow('P-1'),
        productMasterRow('P-OLD', {
          commercialStatus: 'D',
          supersededBy: 'P-NEW',
          directSubstitute: 'P-NEW',
        }),
        productMasterRow('P-NEW'),
        productMasterRow('P-IDLE'),
      ],
      inventory: [
        inventoryRow('P-1', 5, {
          onHand: 5,
          inTransit: 10,
          inventoryValue: 500,
        }),
        inventoryRow('P-OLD', 0, {
          onHand: 0,
          onOrder: 3,
          inventoryValue: 0,
        }),
        inventoryRow('P-NEW', 8, {
          onHand: 8,
          inventoryValue: 800,
        }),
        inventoryRow('P-IDLE', 20, {
          onHand: 20,
          inventoryValue: 2000,
        }),
      ],
    },
  )
}

describe('FW-003 Forecast Inventory Intelligence', () => {
  it('calcula cobertura, brecha e inbound recovery sin fechas inventadas', () => {
    const queries = new ForecastDataQueries(
      buildModelWithInventory(),
    )
    const insight = queries.findProductInventoryInsight('P-1')

    expect(insight).toBeDefined()
    expect(insight?.demand.expectedQuantity).toBe(17.61)
    expect(insight?.demand.remainingExpectedQuantity).toBe(7.61)
    expect(insight?.inventory).toMatchObject({
      available: 5,
      inTransit: 10,
      inbound: 10,
      availableAfterRemainingDemand: -2.61,
      supplyAfterRemainingDemand: 7.39,
    })
    expect(insight?.coverage.availableStatus).toBe('shortage')
    expect(insight?.coverage.availableMonths).toBe(0.2839)
    expect(
      insight?.signals.map((signal) => signal.type),
    ).toEqual(expect.arrayContaining([
      'current-period-shortage',
      'inbound-recovery',
    ]))
    expect(insight?.limitations).toContain(
      'In transit y On order se consideran como entrada agregada sin fecha; Purchasing aún no está conectado.',
    )
  })

  it('detecta stockout, sustituto disponible e inventario sin baseline', () => {
    const queries = new ForecastDataQueries(
      buildModelWithInventory(),
    )
    const oldProduct = queries.findProductInventoryInsight('P-OLD')
    const idleProduct = queries.findProductInventoryInsight('P-IDLE')
    const report = queries.getInventoryIntelligenceReport()

    expect(
      oldProduct?.signals.map((signal) => signal.type),
    ).toEqual(expect.arrayContaining([
      'stockout',
      'superseded-inventory',
      'replacement-recovery',
    ]))
    expect(oldProduct?.replacement).toMatchObject({
      referenceType: 'direct-substitute',
      reference: 'P-NEW',
      resolved: true,
      productId: 'P-NEW',
      available: 8,
      locations: 1,
    })
    expect(
      idleProduct?.signals.map((signal) => signal.type),
    ).toContain('no-projected-demand')
    expect(idleProduct?.demand.expectedQuantity).toBeNull()
    expect(report.quality.inventoryProductsWithoutProjection).toBe(2)
    expect(report.summary.replacementRecoveries).toBe(1)
    expect(report.summary.supersededInventoryProducts).toBe(1)
    expect(report.summary.noProjectedDemandProducts).toBe(2)
  })


  it('identifica inventario excedente frente a la demanda esperada', () => {
    const model = buildBusinessDataModel(
      [
        salesRow('2026-01-30', 'P-EXCESS', 100, 10),
        salesRow('2026-02-27', 'P-EXCESS', 120, 12),
        salesRow('2026-03-13', 'P-EXCESS', 100, 10),
      ],
      {
        brandTargets: [
          {
            brandId: 'UNV',
            periodId: '2026-03',
            targetRevenue: 300,
            workingDays: 22,
          },
        ],
        productMaster: [productMasterRow('P-EXCESS')],
        inventory: [inventoryRow('P-EXCESS', 100)],
      },
    )
    const insight = new ForecastDataQueries(model)
      .findProductInventoryInsight('P-EXCESS')

    expect(insight?.coverage.availableStatus).toBe('excess')
    expect(insight?.coverage.availableMonths).toBeGreaterThan(3)
    expect(
      insight?.signals.map((signal) => signal.type),
    ).toContain('excess-stock')
  })

  it('no interpreta la ausencia global de inventario como stock cero', () => {
    const model = buildBusinessDataModel(
      [
        salesRow('2026-01-30', 'P-1', 100, 10),
        salesRow('2026-02-27', 'P-1', 120, 12),
        salesRow('2026-03-13', 'P-1', 100, 10),
      ],
      {
        brandTargets: [
          {
            brandId: 'UNV',
            periodId: '2026-03',
            targetRevenue: 300,
            workingDays: 22,
          },
        ],
        productMaster: [productMasterRow('P-1')],
      },
    )
    const queries = new ForecastDataQueries(model)
    const report = queries.getInventoryIntelligenceReport()
    const insight = queries.findProductInventoryInsight('P-1')

    expect(report.status).toBe('partial')
    expect(insight?.coverage.availableStatus).toBe('unavailable')
    expect(
      insight?.signals.some((signal) => signal.type === 'stockout'),
    ).toBe(false)
  })

  it('devuelve clones y consultas priorizadas desde repository.forecast', () => {
    const queries = new ForecastDataQueries(
      buildModelWithInventory(),
    )
    const report = queries.getInventoryIntelligenceReport()
    report.items[0]?.signals.splice(0)

    const fresh = queries.getInventoryIntelligenceReport()

    expect(fresh.items[0]?.signals.length).toBeGreaterThan(0)
    expect(queries.getTopInventoryIntelligence(2)).toHaveLength(2)
    expect(
      queries.findInventoryInsightsByCoverage('stockout')
        .map((item) => item.productId),
    ).toContain('P-OLD')
  })
})
