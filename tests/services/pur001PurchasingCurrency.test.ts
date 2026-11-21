// PUR-001: Purchasing amounts by currency, never converted nor added
// across currencies.
//
// pur001UsdBaseline.json was generated with the pre-PUR-001 code from
// USD_ONLY_LINES (fixtures/pur001PurchasingData.ts). Do not regenerate it
// to make this test pass.

import { readFileSync } from 'node:fs'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildPurchasingAnalytics,
  defaultPurchasingCurrency,
  normalizePurchasingCurrency,
  selectPurchasingCurrencyView,
  type PurchasingAnalyticsReport,
} from '../../src/core/business/analytics/purchasing'
import {
  formatCostTotal,
  formatCostValue,
} from '../../src/features/auth/costPresentation'
import {
  formatPurchasingAmount,
} from '../../src/features/purchasing-workspace/engine/purchasingWorkspaceModel'

import {
  buildDataset,
  PUR001_REFERENCE_DATE,
  USD_ONLY_LINES,
  USD_ONLY_REQUESTS,
  type LineSpec,
} from './fixtures/pur001PurchasingData'

interface BaselineAmounts {
  orderedAmountForeignCurrency: number | null
  linesWithoutAmount?: number
  purchaseOrders: number
}

interface BaselineGroup extends BaselineAmounts {
  key: string
  orderedQuantity: number
  overduePurchaseOrders: number
}

interface Baseline {
  totals: BaselineAmounts & { linesWithoutAmount: number }
  bySupplier: BaselineGroup[]
  byBrand: BaselineGroup[]
  byItem: BaselineGroup[]
  byStatus: Array<BaselineAmounts & { status: string }>
  aging: Array<BaselineAmounts & { bucket: string }>
}

const USD_BASELINE = JSON.parse(
  readFileSync(
    new URL('./fixtures/pur001UsdBaseline.json', import.meta.url),
    'utf8',
  ),
) as Baseline

function analyze(
  specs: readonly LineSpec[],
  requests = USD_ONLY_REQUESTS,
): PurchasingAnalyticsReport {
  const { orders, lines } = buildDataset(specs)

  return buildPurchasingAnalytics({
    orders,
    lines,
    requests,
    referenceDate: PUR001_REFERENCE_DATE,
  })
}

const line = (
  po: string,
  supplier: string | null,
  currency: string | null,
  brand: string,
  amount: number | null,
  expected = '2026-08-20',
): LineSpec => ({
  po,
  supplier,
  currency,
  status: 'Pending Receipt',
  expected,
  brand,
  item: `${brand}-1`,
  quantity: 1,
  amount,
})

// USD, MXN and an order without currency. S1 buys in both currencies;
// " usd " normalizes to USD; MXN has hidden or missing amounts.
const MIXED_LINES: LineSpec[] = [
  line('PO-U1', 'S1', 'USD', 'UNV', 1000),
  line('PO-U2', 'S2', 'USD', 'HIKVISION', 500),
  line('PO-UL', 'S2', ' usd ', 'STREAMAX', 30),
  line('PO-M1', 'S3', 'MXN', 'UNV', 20000),
  line('PO-M1', 'S3', 'MXN', 'STREAMAX', null),
  line('PO-M2', 'S1', 'MXN', 'HIKVISION', 3000, '2026-06-15'),
  line('PO-M3', 'S3', 'MXN', 'HIKVISION', null),
  line('PO-N1', 'S4', null, 'UNV', 70),
]

const amountsOf = (
  groups: ReadonlyArray<{ key: string, amount: number | null }>,
) => groups.map((group) => [group.key, group.amount])

describe('PUR-001 purchase amounts by currency', () => {
  describe('USD only: same amounts as before PUR-001', () => {
    const report = analyze(USD_ONLY_LINES)
    const usd = selectPurchasingCurrencyView(report, 'USD')

    it('keeps the total and its missing lines', () => {
      expect(report.totals.currencies).toEqual(['USD'])
      expect(report.totals.amountsByCurrency.USD).toMatchObject({
        amount: USD_BASELINE.totals.orderedAmountForeignCurrency,
        linesWithoutAmount: USD_BASELINE.totals.linesWithoutAmount,
        purchaseOrders: USD_BASELINE.totals.purchaseOrders,
      })
      expect(report.totals.linesWithoutAmount).toBe(
        USD_BASELINE.totals.linesWithoutAmount,
      )
      expect(usd.purchaseOrdersInOtherCurrencies).toBe(0)
    })

    it.each(['bySupplier', 'byBrand', 'byItem'] as const)(
      'keeps %s amounts and order',
      (dimension) => {
        const expected = USD_BASELINE[dimension].map((group) => ({
          key: group.key,
          amount: group.orderedAmountForeignCurrency,
          purchaseOrders: group.purchaseOrders,
          orderedQuantity: group.orderedQuantity,
          overduePurchaseOrders: group.overduePurchaseOrders,
        }))

        expect(
          usd[dimension].map((group) => ({
            key: group.key,
            amount: group.amount,
            purchaseOrders: group.purchaseOrders,
            orderedQuantity: group.orderedQuantity,
            overduePurchaseOrders: group.overduePurchaseOrders,
          })),
        ).toEqual(expected)
        // The base report keeps the previous order too.
        expect(report[dimension].map((group) => group.key)).toEqual(
          USD_BASELINE[dimension].map((group) => group.key),
        )
      },
    )

    it('keeps status and aging amounts', () => {
      expect(
        usd.byStatus.map((summary) => [summary.status, summary.amount]),
      ).toEqual(
        USD_BASELINE.byStatus
          .filter((summary) => summary.purchaseOrders > 0)
          .map((summary) => [
            summary.status,
            summary.orderedAmountForeignCurrency,
          ]),
      )
      expect(
        usd.aging.map((summary) => [
          summary.bucket,
          summary.amount,
          summary.purchaseOrders,
        ]),
      ).toEqual(
        USD_BASELINE.aging.map((summary) => [
          summary.bucket,
          summary.orderedAmountForeignCurrency,
          summary.purchaseOrders,
        ]),
      )
    })
  })

  describe('USD and MXN', () => {
    const report = analyze(MIXED_LINES, [])

    it('totals each currency on its own', () => {
      expect(report.totals.currencies).toEqual(['USD', 'MXN', 'SIN_MONEDA'])
      expect(report.totals.amountsByCurrency).toEqual({
        USD: expect.objectContaining({
          amount: 1530,
          linesWithoutAmount: 0,
          purchaseOrders: 3,
        }),
        MXN: expect.objectContaining({
          amount: 23000,
          linesWithoutAmount: 2,
          purchaseOrders: 3,
        }),
        SIN_MONEDA: expect.objectContaining({
          amount: 70,
          linesWithoutAmount: 0,
          purchaseOrders: 1,
        }),
      })
    })

    it('never adds currencies together anywhere in the report', () => {
      const crossCurrencySums = new Set([
        1530 + 23000,
        1530 + 70,
        23000 + 70,
        1530 + 23000 + 70,
      ])
      const numbers: number[] = []

      JSON.stringify(report, (_key, value: unknown) => {
        if (typeof value === 'number') {
          numbers.push(value)
        }

        return value
      })

      expect(numbers.filter((value) => crossCurrencySums.has(value))).toEqual([])
      expect(report.totals).not.toHaveProperty('orderedAmountForeignCurrency')
    })

    it('ranks USD without MXN orders and MXN without USD orders', () => {
      const usd = selectPurchasingCurrencyView(report, 'USD')
      const mxn = selectPurchasingCurrencyView(report, 'MXN')

      expect(amountsOf(usd.bySupplier)).toEqual([
        ['S1', 1000],
        ['S2', 530],
      ])
      expect(amountsOf(mxn.bySupplier)).toEqual([
        ['S3', 20000],
        ['S1', 3000],
      ])
      // S1 counts only its order in each currency.
      expect(usd.bySupplier[0]?.purchaseOrders).toBe(1)
      expect(mxn.bySupplier[1]?.purchaseOrders).toBe(1)
      expect(usd.purchaseOrdersInOtherCurrencies).toBe(4)
      expect(mxn.purchaseOrdersInOtherCurrencies).toBe(4)

      expect(amountsOf(usd.byBrand)).toEqual([
        ['UNV', 1000],
        ['HIKVISION', 500],
        ['STREAMAX', 30],
      ])
      expect(
        mxn.aging
          .filter((summary) => summary.purchaseOrders > 0)
          .map((summary) => [summary.bucket, summary.amount]),
      ).toEqual([
        ['current', 20000],
        ['31_plus_days', 3000],
      ])
      expect(
        usd.aging.find((summary) => summary.bucket === '31_plus_days'),
      ).toMatchObject({ amount: 0, purchaseOrders: 0 })
    })

    it('defaults to USD and otherwise to the first currency', () => {
      expect(defaultPurchasingCurrency(report.totals.currencies)).toBe('USD')
      expect(defaultPurchasingCurrency(['MXN', 'SIN_MONEDA'])).toBe('MXN')
      expect(defaultPurchasingCurrency([])).toBeNull()
    })
  })

  describe('orders without currency', () => {
    it('go to "Sin moneda" and are counted', () => {
      const report = analyze(
        [
          line('PO-1', 'S1', 'USD', 'UNV', 10),
          line('PO-2', 'S1', null, 'UNV', 20),
          line('PO-3', 'S2', '   ', 'UNV', 30),
        ],
        [],
      )

      expect(normalizePurchasingCurrency(' m x n ')).toBe('MXN')
      expect(report.totals.purchaseOrdersWithoutCurrency).toBe(2)
      expect(report.totals.amountsByCurrency.SIN_MONEDA).toMatchObject({
        amount: 50,
        purchaseOrders: 2,
      })
      expect(
        amountsOf(
          selectPurchasingCurrencyView(report, 'SIN_MONEDA').bySupplier,
        ),
      ).toEqual([
        ['S2', 30],
        ['S1', 20],
      ])
      expect(formatPurchasingAmount(1234.4, 'SIN_MONEDA')).toBe(
        'Sin moneda 1,234',
      )
    })
  })

  describe('with hidden costs (SEC-003C)', () => {
    const report = analyze(MIXED_LINES, [])
    const mxn = selectPurchasingCurrencyView(report, 'MXN')
    const streamax = mxn.byBrand.find((group) => group.key === 'STREAMAX')
    const hikvision = mxn.byBrand.find((group) => group.key === 'HIKVISION')

    it('keeps NULL, never 0, when a currency has no visible amount', () => {
      expect(streamax).toMatchObject({ amount: null, linesWithoutAmount: 1 })
      // Missing values go last in the ranking.
      expect(mxn.byBrand.at(-1)?.key).toBe('STREAMAX')
      expect(hikvision).toMatchObject({ amount: 3000, linesWithoutAmount: 1 })
    })

    it('formats each amount with its own currency or the cost label', () => {
      const format = (value: number) => formatPurchasingAmount(value, 'MXN')
      const assigned = {
        mode: 'assigned' as const,
        brandKeys: ['UNV', 'HIKVISION'],
      }

      expect(
        formatCostValue(hikvision?.amount, assigned, 'HIKVISION', format),
      ).toBe('MXN $3,000')
      expect(
        formatCostValue(streamax?.amount, assigned, 'STREAMAX', format),
      ).toBe('Sin acceso a costo')
      expect(
        formatCostValue(streamax?.amount, { mode: 'all' }, 'STREAMAX', format),
      ).toBe('Sin dato')
      expect(
        formatCostTotal(mxn.aging[0]?.amount, { mode: 'none' }, format),
      ).toBe('Sin acceso a costo')
      expect(formatPurchasingAmount(1234567, 'USD')).toBe('USD $1,234,567')
    })
  })
})
