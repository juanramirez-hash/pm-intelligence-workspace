// SEC-003C no-regression check: with complete cost data (no NULL) the
// inventory, risk, purchasing, forecast and Data Center outputs must stay
// identical to the ones produced before SEC-003C.
//
// The baseline was generated with the pre-SEC-003C code:
//   SEC003C_WRITE_BASELINE=1 npx vitest run tests/services/sec003cNoRegression.test.ts
// Do not regenerate it to make this test pass.

import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'

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

const BASELINE_PATH = new URL(
  './fixtures/sec003cBaseline.json',
  import.meta.url,
)

// Sets and Maps become sorted arrays; generatedAt is a timestamp.
function serialize(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (key, item) => {
      if (key === 'generatedAt') {
        return undefined
      }

      if (item instanceof Set) {
        return [...item].sort()
      }

      if (item instanceof Map) {
        return [...item.entries()]
      }

      return item
    }),
  )
}

function buildOutputs() {
  const model = buildBusinessDataModel(
    completeSales,
    {
      productMaster: completeProductMaster,
      inventory: completeInventory,
      purchaseOrders: completePurchaseOrders,
    },
  )
  const repository = new BusinessRepository(model)
  const positions = [
    ...(model.inventoryPositions ?? new Map()).values(),
  ]
  const products = [...model.products.values()]
  const enrichedPositions = enrichInventoryPositions(
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
  )
  const forecast = buildForecastWorkspace(repository)

  return serialize({
    inventoryAnalytics:
      repository.inventoryAnalytics.getReport(),
    inventoryRiskOpportunity:
      repository.inventoryRiskOpportunity.getReport(),
    inventoryCatalogSummary:
      buildInventoryCatalogSummary(enrichedPositions),
    purchasingAnalytics: buildPurchasingAnalytics({
      orders: [
        ...(model.purchaseOrders ?? new Map()).values(),
      ],
      lines: [
        ...(model.purchaseOrderLines ?? new Map()).values(),
      ],
      requests: [],
      referenceDate: REFERENCE_DATE,
    }),
    forecast: {
      inventory: forecast.inventory,
      riskRanking: forecast.riskRanking,
      opportunityRanking: forecast.opportunityRanking,
    },
    dataCenterInventorySummary:
      buildInventoryBusinessModel(
        completeInventory,
        0,
      ).summary,
  }) as Record<string, unknown>
}

describe('SEC-003C no regression with complete cost data', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(`${REFERENCE_DATE}T12:00:00.000Z`))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('produces deterministic outputs', () => {
    expect(buildOutputs()).toEqual(buildOutputs())
  })

  it('keeps every pre-SEC-003C value identical', () => {
    const outputs = buildOutputs()

    if (process.env.SEC003C_WRITE_BASELINE === '1') {
      writeFileSync(
        BASELINE_PATH,
        `${JSON.stringify(outputs, null, 2)}\n`,
      )
    }

    expect(existsSync(BASELINE_PATH)).toBe(true)

    const baseline = JSON.parse(
      readFileSync(BASELINE_PATH, 'utf8'),
    ) as Record<string, unknown>

    expect(Object.keys(outputs)).toEqual(Object.keys(baseline))

    // New fields (missing value counters) may be added; every value that
    // existed before must be unchanged.
    for (const [section, expected] of Object.entries(baseline)) {
      expect(outputs[section], section).toMatchObject(
        expected as Record<string, unknown>,
      )
    }
  })

  // PUR-001 removed orderedAmountForeignCurrency (a sum that ignored the
  // currency) from the baseline. The split by currency must conserve it:
  // this check adds currencies only inside the test; the app never does.
  it('splits the pre-PUR-001 purchase amounts by currency without losing any', () => {
    const purchasing = buildOutputs().purchasingAnalytics as {
      totals: AmountsHolder
      bySupplier: Array<AmountsHolder & { key: string }>
      byBrand: Array<AmountsHolder & { key: string }>
      byItem: Array<AmountsHolder & { key: string }>
      byStatus: Array<AmountsHolder & { status: string }>
      aging: Array<AmountsHolder & { bucket: string }>
    }
    const byField = <T extends AmountsHolder>(
      rows: T[],
      field: (row: T) => string,
    ) =>
      Object.fromEntries(
        rows.map((row) => [field(row), sumAcrossCurrencies(row)]),
      )

    expect(sumAcrossCurrencies(purchasing.totals)).toBe(
      PRE_PUR001_MIXED_AMOUNTS.totals,
    )
    expect(byField(purchasing.bySupplier, (row) => row.key)).toEqual(
      PRE_PUR001_MIXED_AMOUNTS.bySupplier,
    )
    expect(byField(purchasing.byBrand, (row) => row.key)).toEqual(
      PRE_PUR001_MIXED_AMOUNTS.byBrand,
    )
    expect(byField(purchasing.byItem, (row) => row.key)).toEqual(
      PRE_PUR001_MIXED_AMOUNTS.byItem,
    )
    expect(byField(purchasing.byStatus, (row) => row.status)).toEqual(
      PRE_PUR001_MIXED_AMOUNTS.byStatus,
    )
    expect(byField(purchasing.aging, (row) => row.bucket)).toEqual(
      PRE_PUR001_MIXED_AMOUNTS.aging,
    )
    // The fixture's purchase orders are all in USD.
    expect(Object.keys(purchasing.totals.amountsByCurrency)).toEqual([
      'USD',
    ])
  })
})

interface AmountsHolder {
  amountsByCurrency: Record<string, { amount: number | null }>
}

// Values of orderedAmountForeignCurrency in sec003cBaseline.json before
// PUR-001 (the sum of every currency).
const PRE_PUR001_MIXED_AMOUNTS = {
  totals: 3950,
  bySupplier: { 'SUP-2': 2000, 'SUP-1': 1950 },
  byBrand: { HIKVISION: 2500, UNV: 1450 },
  byItem: { 'H-1': 2500, 'P-1': 1000, 'P-NEW': 300, 'P-IDLE': 150 },
  byStatus: { 'PENDING RECEIPT': 3500, 'FULLY BILLED': 450 },
  aging: {
    current: 1950,
    '1_7_days': 0,
    '8_15_days': 0,
    '16_30_days': 0,
    '31_plus_days': 2000,
    undated: 0,
  },
}

/** USD + MXN + SIN_MONEDA: NULL only when every currency is NULL. */
function sumAcrossCurrencies(row: AmountsHolder): number | null {
  const amounts = Object.values(row.amountsByCurrency).map(
    (entry) => entry.amount,
  )

  if (amounts.length === 0) {
    return 0
  }

  return amounts.every((amount) => amount === null)
    ? null
    : amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0)
}
