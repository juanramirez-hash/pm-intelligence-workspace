import type {
  BusinessDataModel,
} from '../models/businessDataModel'

import {
  buildInventoryAnalytics,
} from '../analytics/inventory'

import type {
  InventoryAnalyticsGroup,
  InventoryAnalyticsReport,
  InventoryStockStatus,
  InventoryStockStatusSummary,
} from '../analytics/inventory'

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 0
  }

  return Math.floor(limit)
}

function getLatestSnapshotDate(model: BusinessDataModel): string | null {
  return [...(model.inventorySnapshots ?? new Map()).values()]
    .map((snapshot) => snapshot.snapshotDate)
    .filter((date): date is string => Boolean(date))
    .sort((left, right) => right.localeCompare(left))[0] ?? null
}

export class InventoryAnalyticsQueries {
  private readonly report: InventoryAnalyticsReport

  constructor(model: BusinessDataModel) {
    const snapshotDate = getLatestSnapshotDate(model)

    this.report = buildInventoryAnalytics(
      [...(model.inventoryPositions ?? new Map()).values()],
      snapshotDate,
    )
  }

  getReport(): InventoryAnalyticsReport {
    return {
      ...this.report,
      totals: { ...this.report.totals },
      byBrand: this.report.byBrand.map((group) => ({ ...group })),
      byLocation: this.report.byLocation.map((group) => ({ ...group })),
      byProduct: this.report.byProduct.map((group) => ({ ...group })),
      stockStatus: this.report.stockStatus.map((summary) => ({
        ...summary,
      })),
    }
  }

  getTotals() {
    return { ...this.report.totals }
  }

  getByBrand(): InventoryAnalyticsGroup[] {
    return this.report.byBrand.map((group) => ({ ...group }))
  }

  getByLocation(): InventoryAnalyticsGroup[] {
    return this.report.byLocation.map((group) => ({ ...group }))
  }

  getTopProducts(limit = 10): InventoryAnalyticsGroup[] {
    return this.report.byProduct
      .slice(0, normalizeLimit(limit))
      .map((group) => ({ ...group }))
  }

  getStockStatus(): InventoryStockStatusSummary[] {
    return this.report.stockStatus.map((summary) => ({ ...summary }))
  }

  findStockStatus(
    status: InventoryStockStatus,
  ): InventoryStockStatusSummary | undefined {
    const summary = this.report.stockStatus.find(
      (candidate) => candidate.status === status,
    )

    return summary ? { ...summary } : undefined
  }
}
