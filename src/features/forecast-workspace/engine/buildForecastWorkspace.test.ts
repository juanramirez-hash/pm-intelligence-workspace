import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedInventoryRow,
} from '../../data-center/importers/inventory/inventoryTypes'

import type {
  NormalizedProductMasterRow,
} from '../../data-center/importers/products/productMasterTypes'

import type {
  NormalizedSalesRow,
} from '../../data-center/importers/sales/salesTypes'

import {
  buildBusinessDataModel,
} from '../../../core/business/builders'

import {
  BusinessRepository,
} from '../../../core/business/repository'

import {
  DEFAULT_FORECAST_WORKSPACE_FILTERS,
} from '../types/forecastWorkspaceTypes'

import {
  buildForecastWorkspace,
} from './buildForecastWorkspace'

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

function createRepository(): BusinessRepository {
  const model = buildBusinessDataModel(
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

  return new BusinessRepository(model)
}

describe('FW-004 Forecast Workspace Model', () => {
  it('compone resumen ejecutivo, marcas y rankings navegables', () => {
    const workspace = buildForecastWorkspace(createRepository())

    expect(workspace.available).toBe(true)
    expect(workspace.scenarioId).toBe('expected')
    expect(
      workspace.scenarios.find((scenario) => scenario.selected)?.id,
    ).toBe('expected')
    expect(workspace.period.currentPeriodId).toBe('2026-03')
    expect(workspace.portfolio.projected.revenue).toBeGreaterThan(
      workspace.portfolio.actual.revenue,
    )
    expect(workspace.inventory.filteredProducts).toBe(4)
    expect(workspace.inventory.coverage).toMatchObject({
      stockout: 1,
      shortage: 1,
      noDemand: 2,
    })
    expect(workspace.brands[0]?.brandId).toBe('UNV')
    expect(workspace.brands[0]?.navigation.href).toBe('/brands/UNV')
    expect(workspace.riskRanking[0]?.productId).toBe('P-OLD')
    expect(workspace.riskRanking[0]?.navigation.href).toBe(
      '/products/P-OLD',
    )
    expect(
      workspace.opportunityRanking.map((item) => item.productId),
    ).toEqual(expect.arrayContaining(['P-OLD', 'P-1']))
    expect(
      workspace.opportunityRanking.find(
        (item) => item.productId === 'P-OLD',
      )?.replacementNavigation?.href,
    ).toBe('/products/P-NEW')
  })

  it('cambia el escenario sin recalcular fórmulas dentro del Workspace', () => {
    const repository = createRepository()
    const expected = buildForecastWorkspace(repository)
    const accelerated = buildForecastWorkspace(repository, {
      scenarioId: 'accelerated',
    })

    expect(accelerated.portfolio.projected.revenue).toBeGreaterThan(
      expected.portfolio.projected.revenue,
    )
    expect(accelerated.inventory.expectedDemandUnits).toBeGreaterThan(
      expected.inventory.expectedDemandUnits,
    )
    expect(
      accelerated.scenarios.find((scenario) => scenario.selected)?.id,
    ).toBe('accelerated')
  })

  it('aplica filtros a inventario y rankings sin alterar el portafolio oficial', () => {
    const repository = createRepository()
    const portfolioRevenue = buildForecastWorkspace(repository)
      .portfolio.projected.revenue
    const workspace = buildForecastWorkspace(repository, {
      filters: {
        ...DEFAULT_FORECAST_WORKSPACE_FILTERS,
        coverage: 'stockout',
      },
    })

    expect(workspace.inventory.filteredProducts).toBe(1)
    expect(workspace.riskRanking).toHaveLength(1)
    expect(workspace.riskRanking[0]?.productId).toBe('P-OLD')
    expect(workspace.portfolio.projected.revenue).toBe(portfolioRevenue)
    expect(workspace.limitations.some((message) =>
      message.includes('resumen comercial de portafolio'),
    )).toBe(true)
  })

  it('devuelve un contrato vacío cuando no existe Business Repository', () => {
    const workspace = buildForecastWorkspace(null)

    expect(workspace.available).toBe(false)
    expect(workspace.status).toBe('unavailable')
    expect(workspace.brands).toEqual([])
    expect(workspace.riskRanking).toEqual([])
    expect(workspace.unavailableReason).toContain(
      'Business Repository',
    )
  })
})
