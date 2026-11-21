import type {
  BusinessDataModel,
} from '../models/businessDataModel'

import {
  buildPurchasingAnalytics,
} from '../analytics/purchasing'

import type {
  PurchasingAgingBucket,
  PurchasingAgingSummary,
  PurchasingAmountsByCurrency,
  PurchasingAnalyticsGroup,
  PurchasingAnalyticsReport,
  PurchasingStatusSummary,
} from '../analytics/purchasing'

// The report is shared: callers get their own amounts (PUR-001).
function copyAmountsByCurrency(
  amounts: PurchasingAmountsByCurrency,
): PurchasingAmountsByCurrency {
  return Object.fromEntries(
    Object.entries(amounts).map(
      ([currency, amount]) => [
        currency,
        { ...amount },
      ],
    ),
  )
}

function normalizeLimit(
  limit: number,
): number {
  if (
    !Number.isFinite(limit) ||
    limit <= 0
  ) {
    return 0
  }

  return Math.floor(limit)
}

export class PurchasingAnalyticsQueries {
  private readonly report:
    PurchasingAnalyticsReport

  constructor(
    model: BusinessDataModel,
    referenceDate?: string,
  ) {
    this.report =
      buildPurchasingAnalytics({
        orders: [
          ...(
            model.purchaseOrders ??
            new Map()
          ).values(),
        ],

        lines: [
          ...(
            model.purchaseOrderLines ??
            new Map()
          ).values(),
        ],

        requests: [
          ...(
            model.purchaseRequests ??
            new Map()
          ).values(),
        ],

        referenceDate,
      })
  }

  getReport():
    PurchasingAnalyticsReport {
    return {
      ...this.report,

      totals: {
        ...this.report.totals,
        amountsByCurrency:
          copyAmountsByCurrency(
            this.report.totals.amountsByCurrency,
          ),
        currencies: [
          ...this.report.totals.currencies,
        ],
      },

      linkage: {
        ...this.report.linkage,
      },

      cycle: {
        ...this.report.cycle,
      },

      bySupplier:
        this.report.bySupplier.map(
          (group) => ({
            ...group,
            amountsByCurrency:
              copyAmountsByCurrency(
                group.amountsByCurrency,
              ),
          }),
        ),

      byBuyer:
        this.report.byBuyer.map(
          (group) => ({
            ...group,
            amountsByCurrency:
              copyAmountsByCurrency(
                group.amountsByCurrency,
              ),
          }),
        ),

      byBrand:
        this.report.byBrand.map(
          (group) => ({
            ...group,
            amountsByCurrency:
              copyAmountsByCurrency(
                group.amountsByCurrency,
              ),
          }),
        ),

      byItem:
        this.report.byItem.map(
          (group) => ({
            ...group,
            amountsByCurrency:
              copyAmountsByCurrency(
                group.amountsByCurrency,
              ),
          }),
        ),

      byStatus:
        this.report.byStatus.map(
          (summary) => ({
            ...summary,
            amountsByCurrency:
              copyAmountsByCurrency(
                summary.amountsByCurrency,
              ),
          }),
        ),

      aging:
        this.report.aging.map(
          (summary) => ({
            ...summary,
            amountsByCurrency:
              copyAmountsByCurrency(
                summary.amountsByCurrency,
              ),
          }),
        ),
    }
  }

  getTotals() {
    return {
      ...this.report.totals,
      amountsByCurrency:
        copyAmountsByCurrency(
          this.report.totals.amountsByCurrency,
        ),
      currencies: [
        ...this.report.totals.currencies,
      ],
    }
  }

  getLinkage() {
    return {
      ...this.report.linkage,
    }
  }

  getCycle() {
    return {
      ...this.report.cycle,
    }
  }

  getBySupplier():
    PurchasingAnalyticsGroup[] {
    return this.report.bySupplier.map(
      (group) => ({
        ...group,
        amountsByCurrency:
          copyAmountsByCurrency(
            group.amountsByCurrency,
          ),
      }),
    )
  }

  getByBuyer():
    PurchasingAnalyticsGroup[] {
    return this.report.byBuyer.map(
      (group) => ({
        ...group,
        amountsByCurrency:
          copyAmountsByCurrency(
            group.amountsByCurrency,
          ),
      }),
    )
  }

  getByBrand():
    PurchasingAnalyticsGroup[] {
    return this.report.byBrand.map(
      (group) => ({
        ...group,
        amountsByCurrency:
          copyAmountsByCurrency(
            group.amountsByCurrency,
          ),
      }),
    )
  }

  getByItem():
    PurchasingAnalyticsGroup[] {
    return this.report.byItem.map(
      (group) => ({
        ...group,
        amountsByCurrency:
          copyAmountsByCurrency(
            group.amountsByCurrency,
          ),
      }),
    )
  }

  getTopSuppliers(
    limit = 10,
  ):
    PurchasingAnalyticsGroup[] {
    return this.report.bySupplier
      .slice(
        0,
        normalizeLimit(limit),
      )
      .map(
        (group) => ({
          ...group,
          amountsByCurrency:
            copyAmountsByCurrency(
              group.amountsByCurrency,
            ),
        }),
      )
  }

  getTopBuyers(
    limit = 10,
  ):
    PurchasingAnalyticsGroup[] {
    return this.report.byBuyer
      .slice(
        0,
        normalizeLimit(limit),
      )
      .map(
        (group) => ({
          ...group,
          amountsByCurrency:
            copyAmountsByCurrency(
              group.amountsByCurrency,
            ),
        }),
      )
  }

  getTopBrands(
    limit = 10,
  ):
    PurchasingAnalyticsGroup[] {
    return this.report.byBrand
      .slice(
        0,
        normalizeLimit(limit),
      )
      .map(
        (group) => ({
          ...group,
          amountsByCurrency:
            copyAmountsByCurrency(
              group.amountsByCurrency,
            ),
        }),
      )
  }

  getTopItems(
    limit = 10,
  ):
    PurchasingAnalyticsGroup[] {
    return this.report.byItem
      .slice(
        0,
        normalizeLimit(limit),
      )
      .map(
        (group) => ({
          ...group,
          amountsByCurrency:
            copyAmountsByCurrency(
              group.amountsByCurrency,
            ),
        }),
      )
  }

  getStatus():
    PurchasingStatusSummary[] {
    return this.report.byStatus.map(
      (summary) => ({
        ...summary,
        amountsByCurrency:
          copyAmountsByCurrency(
            summary.amountsByCurrency,
          ),
      }),
    )
  }

  getAging():
    PurchasingAgingSummary[] {
    return this.report.aging.map(
      (summary) => ({
        ...summary,
        amountsByCurrency:
          copyAmountsByCurrency(
            summary.amountsByCurrency,
          ),
      }),
    )
  }

  findAging(
    bucket: PurchasingAgingBucket,
  ):
    PurchasingAgingSummary |
    undefined {
    const summary =
      this.report.aging.find(
        (candidate) =>
          candidate.bucket === bucket,
      )

    return summary
      ? {
          ...summary,
          amountsByCurrency:
            copyAmountsByCurrency(
              summary.amountsByCurrency,
            ),
        }
      : undefined
  }
}