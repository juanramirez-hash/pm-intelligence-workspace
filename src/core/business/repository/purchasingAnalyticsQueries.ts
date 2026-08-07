import type {
  BusinessDataModel,
} from '../models/businessDataModel'

import {
  buildPurchasingAnalytics,
} from '../analytics/purchasing'

import type {
  PurchasingAgingBucket,
  PurchasingAgingSummary,
  PurchasingAnalyticsGroup,
  PurchasingAnalyticsReport,
  PurchasingStatusSummary,
} from '../analytics/purchasing'

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
          }),
        ),

      byBuyer:
        this.report.byBuyer.map(
          (group) => ({
            ...group,
          }),
        ),

      byBrand:
        this.report.byBrand.map(
          (group) => ({
            ...group,
          }),
        ),

      byItem:
        this.report.byItem.map(
          (group) => ({
            ...group,
          }),
        ),

      byStatus:
        this.report.byStatus.map(
          (summary) => ({
            ...summary,
          }),
        ),

      aging:
        this.report.aging.map(
          (summary) => ({
            ...summary,
          }),
        ),
    }
  }

  getTotals() {
    return {
      ...this.report.totals,
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
      }),
    )
  }

  getByBuyer():
    PurchasingAnalyticsGroup[] {
    return this.report.byBuyer.map(
      (group) => ({
        ...group,
      }),
    )
  }

  getByBrand():
    PurchasingAnalyticsGroup[] {
    return this.report.byBrand.map(
      (group) => ({
        ...group,
      }),
    )
  }

  getByItem():
    PurchasingAnalyticsGroup[] {
    return this.report.byItem.map(
      (group) => ({
        ...group,
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
        }),
      )
  }

  getStatus():
    PurchasingStatusSummary[] {
    return this.report.byStatus.map(
      (summary) => ({
        ...summary,
      }),
    )
  }

  getAging():
    PurchasingAgingSummary[] {
    return this.report.aging.map(
      (summary) => ({
        ...summary,
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
        }
      : undefined
  }
}