import type {
  BusinessDataModel,
} from '../models/businessDataModel'

import {
  buildPurchasingInventoryAnalytics,
} from '../analytics/purchasingInventory'

import type {
  PurchasingInventoryAnalyticsReport,
  PurchasingInventoryItem,
} from '../analytics/purchasingInventory'

import {
  InventoryQueries,
} from './inventoryQueries'

function normalizeItemCode(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function cloneItem(
  item: PurchasingInventoryItem,
): PurchasingInventoryItem {
  return {
    ...item,
    inventory: {
      ...item.inventory,
    },
    purchasing: {
      ...item.purchasing,
      suppliers: [
        ...item.purchasing.suppliers,
      ],
      buyers: [
        ...item.purchasing.buyers,
      ],
    },
  }
}

export class PurchasingInventoryQueries {
  private readonly report:
    PurchasingInventoryAnalyticsReport

  constructor(
    model: BusinessDataModel,
    referenceDate?: string,
  ) {
    const inventory =
      new InventoryQueries(model)

    const snapshotDate =
      inventory.getLatestSnapshotDate()

    const inventoryPositions =
      inventory.getLatestPositions()

    this.report =
      buildPurchasingInventoryAnalytics({
        inventoryPositions,

        purchaseOrderLines: [
          ...(
            model.purchaseOrderLines ??
            new Map()
          ).values(),
        ],

        purchaseRequests: [
          ...(
            model.purchaseRequests ??
            new Map()
          ).values(),
        ],

        snapshotDate,

        ...(referenceDate
          ? {
              referenceDate,
            }
          : {}),
      })
  }

  getReport():
    PurchasingInventoryAnalyticsReport {
    return {
      ...this.report,

      summary: {
        ...this.report.summary,
      },

      quality: {
        ...this.report.quality,
      },

      items:
        this.report.items.map(
          cloneItem,
        ),
    }
  }

  getItems():
    PurchasingInventoryItem[] {
    return this.report.items.map(
      cloneItem,
    )
  }

  findByItemCode(
    itemCode: string,
  ):
    PurchasingInventoryItem |
    undefined {
    const normalized =
      normalizeItemCode(
        itemCode,
      )

    const item =
      this.report.items.find(
        (candidate) =>
          candidate.itemCode ===
          normalized,
      )

    return item
      ? cloneItem(item)
      : undefined
  }

  getNoAvailableStockWithoutOpenPurchaseOrder():
    PurchasingInventoryItem[] {
    return this.report.items
      .filter(
        (item) =>
          item.hasInventory &&
          item.inventory.available <=
            0 &&
          item.purchasing
            .openPurchaseOrders ===
            0,
      )
      .map(
        cloneItem,
      )
  }

  getNoAvailableStockWithOpenPurchaseOrder():
    PurchasingInventoryItem[] {
    return this.report.items
      .filter(
        (item) =>
          item.hasInventory &&
          item.inventory.available <=
            0 &&
          item.purchasing
            .openPurchaseOrders >
            0,
      )
      .map(
        cloneItem,
      )
  }

  getNoAvailableStockWithOverduePurchaseOrder():
    PurchasingInventoryItem[] {
    return this.report.items
      .filter(
        (item) =>
          item.hasInventory &&
          item.inventory.available <=
            0 &&
          item.purchasing
            .overduePurchaseOrders >
            0,
      )
      .map(
        cloneItem,
      )
  }
}