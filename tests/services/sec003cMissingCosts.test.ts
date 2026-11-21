// SEC-003C: missing costs (NULL) are excluded from totals and counted,
// never added as 0. "PM" data hides HIKVISION costs, as the API does for a
// PM assigned to UNV; "no access" data hides every cost.

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  buildPurchasingAnalytics,
} from '../../src/core/business/analytics/purchasing/purchasingAnalytics'
import {
  buildBusinessDataModel,
} from '../../src/core/business/builders'
import {
  BusinessRepository,
} from '../../src/core/business/repository'
import {
  buildInventoryBusinessModel,
} from '../../src/features/data-center/importers/inventory/inventoryBusinessModel'
import type {
  NormalizedInventoryRow,
} from '../../src/features/data-center/importers/inventory/inventoryTypes'
import type {
  NormalizedPurchaseOrderRow,
} from '../../src/features/data-center/importers/purchases/purchaseOrderTypes'
import {
  buildForecastWorkspace,
} from '../../src/features/forecast-workspace/engine/buildForecastWorkspace'
import {
  buildInventoryCatalogSummary,
  enrichInventoryPositions,
} from '../../src/features/inventory-workspace/engine/inventoryCatalogEnrichment'

import {
  LATEST_SNAPSHOT,
  REFERENCE_DATE,
  completeInventory,
  completeProductMaster,
  completePurchaseOrders,
  completeSales,
} from './fixtures/sec003cCompleteData'

function hideInventoryCosts(
  hidden: (row: NormalizedInventoryRow) => boolean,
): NormalizedInventoryRow[] {
  return completeInventory.map((row) =>
    hidden(row)
      ? { ...row, unitCost: null, inventoryValue: null }
      : row,
  )
}

function hidePurchaseOrderAmounts(
  hidden: (row: NormalizedPurchaseOrderRow) => boolean,
): NormalizedPurchaseOrderRow[] {
  return completePurchaseOrders.map((row) =>
    hidden(row)
      ? { ...row, amountForeignCurrency: null }
      : row,
  )
}

const isHikvision = (row: { brand: string | null }) =>
  row.brand === 'HIKVISION'
const always = () => true

function buildScenario(
  inventory: NormalizedInventoryRow[],
  purchaseOrders: NormalizedPurchaseOrderRow[] = completePurchaseOrders,
) {
  const model = buildBusinessDataModel(
    completeSales,
    {
      productMaster: completeProductMaster,
      inventory,
      purchaseOrders,
    },
  )
  const repository = new BusinessRepository(model)
  const positions = [
    ...(model.inventoryPositions ?? new Map()).values(),
  ]
  const products = [...model.products.values()]

  return {
    model,
    repository,
    analytics: repository.inventoryAnalytics.getReport(),
    risks: repository.inventoryRiskOpportunity.getReport(),
    forecast: buildForecastWorkspace(repository),
    catalog: buildInventoryCatalogSummary(
      enrichInventoryPositions(
        positions.filter(
          (position) => position.snapshotDate === LATEST_SNAPSHOT,
        ),
        {
          findById: (id) =>
            products.find((product) => product.id === id),
          findByName: (name) =>
            products.find((product) => product.name === name),
          findByCode: (code) =>
            products.find((product) => product.code === code),
        },
      ),
    ),
    purchasing: buildPurchasingAnalytics({
      orders: [...(model.purchaseOrders ?? new Map()).values()],
      lines: [...(model.purchaseOrderLines ?? new Map()).values()],
      requests: [],
      referenceDate: REFERENCE_DATE,
    }),
  }
}

describe('SEC-003C missing costs', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(`${REFERENCE_DATE}T12:00:00.000Z`))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('inventory analytics', () => {
    it('sums only present values and counts the missing positions', () => {
      const { analytics } = buildScenario(hideInventoryCosts(isHikvision))
      const byBrand = new Map(
        analytics.byBrand.map((group) => [group.key, group]),
      )

      expect(analytics.totals.inventoryValue).toBe(4000)
      expect(analytics.totals.positionsWithoutValue).toBe(3)
      expect(byBrand.get('UNV')).toMatchObject({
        inventoryValue: 4000,
        positionsWithoutValue: 0,
        valueShare: 1,
      })
      expect(byBrand.get('HIKVISION')).toMatchObject({
        inventoryValue: null,
        positionsWithoutValue: 3,
        valueShare: null,
      })
      // Missing values go last in value rankings.
      expect(analytics.byBrand.map((group) => group.key)).toEqual([
        'UNV',
        'HIKVISION',
      ])
    })

    it('returns NULL totals, never 0, when every value is missing', () => {
      const { analytics } = buildScenario(hideInventoryCosts(always))

      expect(analytics.totals.inventoryValue).toBeNull()
      expect(analytics.totals.positionsWithoutValue).toBe(8)

      for (const status of analytics.stockStatus) {
        expect(status.inventoryValue).toBeNull()
        expect(status.valueShare).toBeNull()
      }
    })
  })

  describe('inventory risks', () => {
    it('computes value concentration only over the present values', () => {
      const { risks } = buildScenario(hideInventoryCosts(isHikvision))
      const concentration = risks.risks
        .filter((risk) => risk.type === 'value_concentration')
        .map((risk) => [risk.productName, risk.evidence.valueShare])

      // P-IDLE 2000 / 4000 and P-NEW 800 / 4000 (the UNV value).
      expect(concentration).toEqual(
        expect.arrayContaining([
          ['P-IDLE', 0.5],
          ['P-NEW', 0.2],
        ]),
      )
      expect(concentration).toHaveLength(2)
    })

    it('adds +0 for positions without value', () => {
      const { risks } = buildScenario(hideInventoryCosts(isHikvision))
      const overcommitted = risks.risks.find(
        (risk) => risk.type === 'overcommitted',
      )

      // H-1 CDMX: base 80; with complete data it was 83.
      expect(overcommitted).toMatchObject({
        productName: 'H-1',
        score: 80,
        evidence: {
          inventoryValue: null,
          valueShare: null,
        },
      })
    })

    it('skips value concentration and weights when no value is present', () => {
      const { risks } = buildScenario(hideInventoryCosts(always))

      expect(
        risks.risks.some((risk) => risk.type === 'value_concentration'),
      ).toBe(false)
      expect(
        risks.risks.map((risk) => [risk.type, risk.score]),
      ).toEqual(
        expect.arrayContaining([
          ['overcommitted', 80],
          ['no_available_stock', 68],
        ]),
      )
      expect(risks.summary.affectedInventoryValue).toBeNull()
    })
  })

  describe('forecast workspace', () => {
    it('sums the inventory value of products with value and counts the rest', () => {
      const { forecast } = buildScenario(hideInventoryCosts(isHikvision))

      expect(forecast.inventory.inventoryValue).toBe(4000)
      expect(forecast.inventory.productsWithoutValue).toBe(2)
    })

    it('returns NULL inventory and affected values without any value', () => {
      const { forecast } = buildScenario(hideInventoryCosts(always))

      expect(forecast.inventory.inventoryValue).toBeNull()
      expect(forecast.inventory.affectedInventoryValue).toBeNull()

      for (const item of forecast.riskRanking) {
        expect(item.inventoryValue).toBeNull()
      }
    })
  })

  describe('inventory catalog', () => {
    it('keeps the superseded value NULL when it is missing', () => {
      const { catalog } = buildScenario(hideInventoryCosts(always))

      expect(catalog.productsWithSuperseded).toBe(1)
      expect(catalog.supersededInventoryValue).toBeNull()
      expect(catalog.supersededProductsWithoutValue).toBe(1)
    })
  })

  describe('purchasing analytics', () => {
    it('keeps the visible part of mixed-brand orders and counts the hidden lines', () => {
      const { model, purchasing } = buildScenario(
        completeInventory,
        hidePurchaseOrderAmounts(isHikvision),
      )
      const orders = new Map(
        [...(model.purchaseOrders ?? new Map()).values()].map(
          (order) => [order.purchaseOrderNumber, order],
        ),
      )
      const byBrand = new Map(
        purchasing.byBrand.map((group) => [group.key, group]),
      )

      expect(orders.get('PO-1')).toMatchObject({
        amountForeignCurrency: 1000,
        linesWithoutAmount: 1,
      })
      expect(orders.get('PO-2')).toMatchObject({
        amountForeignCurrency: null,
        linesWithoutAmount: 1,
      })
      // PUR-001: amounts by currency, never added across currencies.
      expect(purchasing.totals.amountsByCurrency).toEqual({
        USD: expect.objectContaining({
          amount: 1450,
          linesWithoutAmount: 2,
        }),
      })
      // Conservation against the pre-PUR-001 total (checked only here).
      expect(
        Object.values(purchasing.totals.amountsByCurrency).reduce(
          (total, entry) => total + (entry.amount ?? 0),
          0,
        ),
      ).toBe(1450)
      expect(purchasing.totals.linesWithoutAmount).toBe(2)
      expect(byBrand.get('HIKVISION')).toMatchObject({
        amountsByCurrency: {
          USD: expect.objectContaining({
            amount: null,
            linesWithoutAmount: 2,
          }),
        },
        linesWithoutAmount: 2,
      })
    })

    it('returns NULL amounts, never 0, without any amount', () => {
      const { purchasing } = buildScenario(
        completeInventory,
        hidePurchaseOrderAmounts(always),
      )

      expect(purchasing.totals.amountsByCurrency.USD?.amount).toBeNull()
      expect(
        purchasing.aging
          .filter((bucket) => bucket.purchaseOrders > 0)
          .every((bucket) =>
            Object.values(bucket.amountsByCurrency).every(
              (entry) => entry.amount === null,
            ),
          ),
      ).toBe(true)
    })
  })

  describe('Data Center inventory summary', () => {
    it('sums only rows with value and counts the rest', () => {
      const { summary } = buildInventoryBusinessModel(
        hideInventoryCosts(isHikvision),
        0,
      )

      expect(summary.totalInventoryValue).toBe(4700)
      expect(summary.rowsWithoutValue).toBe(4)
    })

    it('returns NULL without any value', () => {
      const { summary } = buildInventoryBusinessModel(
        hideInventoryCosts(always),
        0,
      )

      expect(summary.totalInventoryValue).toBeNull()
    })
  })
})
