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
})
