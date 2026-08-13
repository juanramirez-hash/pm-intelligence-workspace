import type {
  BusinessInventoryPosition,
} from '../../entities/inventoryPosition'

import type {
  BusinessPurchaseOrderLine,
} from '../../entities/purchaseOrder'

import type {
  BusinessPurchaseRequest,
} from '../../entities/purchaseRequest'

import {
  isClosedPurchaseOrderStatus,
} from '../purchasing/purchaseOrderStatus'

export interface PurchasingInventoryAnalyticsInput {
  inventoryPositions:
    readonly BusinessInventoryPosition[]
  purchaseOrderLines:
    readonly BusinessPurchaseOrderLine[]
  purchaseRequests:
    readonly BusinessPurchaseRequest[]
  snapshotDate: string | null
  referenceDate?: string
}

export interface PurchasingInventoryItemInventory {
  positions: number
  locations: number
  onHand: number
  available: number
  committed: number
  inTransit: number
  onOrder: number
  inboundUnits: number
  inventoryValue: number
}

export interface PurchasingInventoryItemPurchasing {
  purchaseOrderLines: number
  openPurchaseOrderLines: number
  openPurchaseOrders: number
  openPurchaseOrderQuantity: number
  overduePurchaseOrders: number
  dueNext7DaysPurchaseOrders: number

  purchaseRequests: number
  purchaseRequestsWithPurchaseOrder: number
  purchaseRequestsWithoutPurchaseOrder: number
  requestedQuantity: number
  requestedQuantityWithoutPurchaseOrder: number

  suppliers: readonly string[]
  buyers: readonly string[]
}

export interface PurchasingInventoryItem {
  itemCode: string
  productId: string | null
  productName: string | null
  brandId: string | null
  snapshotDate: string | null

  hasInventory: boolean
  hasPurchasing: boolean

  inventory: PurchasingInventoryItemInventory
  purchasing: PurchasingInventoryItemPurchasing
}

export interface PurchasingInventoryAnalyticsSummary {
  items: number
  itemsWithInventory: number
  itemsWithPurchasing: number

  itemsWithNoAvailableStock: number
  itemsWithOpenPurchaseOrders: number
  itemsWithOverduePurchaseOrders: number

  itemsWithNoAvailableStockAndNoOpenPurchaseOrder:
    number

  itemsWithNoAvailableStockAndOpenPurchaseOrder:
    number

  itemsWithNoAvailableStockAndOverduePurchaseOrder:
    number
}

export interface PurchasingInventoryDataQuality {
  inventoryPositionsWithoutProductCode: number
  purchaseOrderLinesWithoutItemCode: number
  purchaseRequestsWithoutItemCode: number
}

export interface PurchasingInventoryAnalyticsReport {
  generatedAt: string
  snapshotDate: string | null
  referenceDate: string
  summary: PurchasingInventoryAnalyticsSummary
  quality: PurchasingInventoryDataQuality
  items: PurchasingInventoryItem[]
}

interface MutablePurchasingInventoryItem {
  itemCode: string
  productId: string | null
  productName: string | null
  brandId: string | null

  inventoryPositionIds: Set<string>
  locationIds: Set<string>
  onHand: number
  available: number
  committed: number
  inTransit: number
  onOrder: number
  inventoryValue: number

  purchaseOrderLineIds: Set<string>
  openPurchaseOrderLineIds: Set<string>
  openPurchaseOrderNumbers: Set<string>
  overduePurchaseOrderNumbers: Set<string>
  dueNext7DaysPurchaseOrderNumbers: Set<string>
  openPurchaseOrderQuantity: number

  purchaseRequestIds: Set<string>
  purchaseRequestsWithPurchaseOrder: Set<string>
  purchaseRequestsWithoutPurchaseOrder: Set<string>
  requestedQuantity: number
  requestedQuantityWithoutPurchaseOrder: number

  suppliers: Set<string>
  buyers: Set<string>
}

function normalizeItemCode(
  value: string | null | undefined,
): string | null {
  const normalized =
    value
      ?.trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

  return normalized || null
}

function normalizeText(
  value: string | null | undefined,
): string | null {
  const normalized =
    value
      ?.trim()
      .replace(/\s+/g, ' ')

  return normalized || null
}

function toDateOnlyIso(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null
  }

  const normalized =
    value.slice(0, 10)

  const date =
    new Date(
      `${normalized}T00:00:00Z`,
    )

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : normalized
}

function resolveReferenceDate(
  referenceDate: string | undefined,
  snapshotDate: string | null,
): string {
  return (
    toDateOnlyIso(referenceDate) ??
    toDateOnlyIso(snapshotDate) ??
    new Date()
      .toISOString()
      .slice(0, 10)
  )
}

function diffDays(
  leftIso: string,
  rightIso: string,
): number {
  const left =
    new Date(
      `${leftIso}T00:00:00Z`,
    )

  const right =
    new Date(
      `${rightIso}T00:00:00Z`,
    )

  return Math.floor(
    (
      left.getTime() -
      right.getTime()
    ) /
      (
        24 *
        60 *
        60 *
        1000
      ),
  )
}

function isOverdueLine(
  line: BusinessPurchaseOrderLine,
  referenceDate: string,
): boolean {
  if (
    isClosedPurchaseOrderStatus(
      line.status,
    )
  ) {
    return false
  }

  const expectedReceiptDate =
    toDateOnlyIso(
      line.expectedReceiptDate,
    )

  if (!expectedReceiptDate) {
    return false
  }

  return (
    expectedReceiptDate <
    referenceDate
  )
}

function isDueNext7DaysLine(
  line: BusinessPurchaseOrderLine,
  referenceDate: string,
): boolean {
  if (
    isClosedPurchaseOrderStatus(
      line.status,
    )
  ) {
    return false
  }

  const expectedReceiptDate =
    toDateOnlyIso(
      line.expectedReceiptDate,
    )

  if (!expectedReceiptDate) {
    return false
  }

  const days =
    diffDays(
      expectedReceiptDate,
      referenceDate,
    )

  return (
    days >= 0 &&
    days <= 7
  )
}

function getOrCreateItem(
  items: Map<
    string,
    MutablePurchasingInventoryItem
  >,
  itemCode: string,
): MutablePurchasingInventoryItem {
  const existing =
    items.get(itemCode)

  if (existing) {
    return existing
  }

  const created:
    MutablePurchasingInventoryItem = {
      itemCode,
      productId: null,
      productName: null,
      brandId: null,

      inventoryPositionIds:
        new Set<string>(),
      locationIds:
        new Set<string>(),
      onHand: 0,
      available: 0,
      committed: 0,
      inTransit: 0,
      onOrder: 0,
      inventoryValue: 0,

      purchaseOrderLineIds:
        new Set<string>(),
      openPurchaseOrderLineIds:
        new Set<string>(),
      openPurchaseOrderNumbers:
        new Set<string>(),
      overduePurchaseOrderNumbers:
        new Set<string>(),
      dueNext7DaysPurchaseOrderNumbers:
        new Set<string>(),
      openPurchaseOrderQuantity: 0,

      purchaseRequestIds:
        new Set<string>(),
      purchaseRequestsWithPurchaseOrder:
        new Set<string>(),
      purchaseRequestsWithoutPurchaseOrder:
        new Set<string>(),
      requestedQuantity: 0,
      requestedQuantityWithoutPurchaseOrder:
        0,

      suppliers:
        new Set<string>(),
      buyers:
        new Set<string>(),
    }

  items.set(
    itemCode,
    created,
  )

  return created
}

function registerInventoryPosition(
  item:
    MutablePurchasingInventoryItem,
  position:
    BusinessInventoryPosition,
): void {
  if (
    item.inventoryPositionIds.has(
      position.id,
    )
  ) {
    return
  }

  item.inventoryPositionIds.add(
    position.id,
  )

  item.locationIds.add(
    position.locationId,
  )

  item.productId ??=
    position.productId

  item.productName ??=
    position.productName

  item.brandId ??=
    position.brandId

  item.onHand +=
    position.onHand

  item.available +=
    position.available

  item.committed +=
    position.committed

  item.inTransit +=
    position.inTransit

  item.onOrder +=
    position.onOrder

  item.inventoryValue +=
    position.inventoryValue
}

function registerPurchaseOrderLine(
  item:
    MutablePurchasingInventoryItem,
  line:
    BusinessPurchaseOrderLine,
  referenceDate: string,
): void {
  if (
    item.purchaseOrderLineIds.has(
      line.id,
    )
  ) {
    return
  }

  item.purchaseOrderLineIds.add(
    line.id,
  )

  item.brandId ??=
    line.brandId

  const supplier =
    normalizeText(
      line.supplierName ??
        line.supplierId,
    )

  if (supplier) {
    item.suppliers.add(
      supplier,
    )
  }

  const buyer =
    normalizeText(
      line.purchasingExecutive,
    )

  if (buyer) {
    item.buyers.add(
      buyer,
    )
  }

  if (
    isClosedPurchaseOrderStatus(
      line.status,
    )
  ) {
    return
  }

  item.openPurchaseOrderLineIds.add(
    line.id,
  )

  item.openPurchaseOrderNumbers.add(
    line.purchaseOrderNumber,
  )

  item.openPurchaseOrderQuantity +=
    line.quantity ?? 0

  if (
    isOverdueLine(
      line,
      referenceDate,
    )
  ) {
    item
      .overduePurchaseOrderNumbers
      .add(
        line.purchaseOrderNumber,
      )
  }

  if (
    isDueNext7DaysLine(
      line,
      referenceDate,
    )
  ) {
    item
      .dueNext7DaysPurchaseOrderNumbers
      .add(
        line.purchaseOrderNumber,
      )
  }
}

function registerPurchaseRequest(
  item:
    MutablePurchasingInventoryItem,
  request:
    BusinessPurchaseRequest,
): void {
  if (
    item.purchaseRequestIds.has(
      request.id,
    )
  ) {
    return
  }

  item.purchaseRequestIds.add(
    request.id,
  )

  item.brandId ??=
    request.brandId

  item.requestedQuantity +=
    request.quantity ?? 0

  if (
    request.relatedPurchaseOrderNumber
  ) {
    item
      .purchaseRequestsWithPurchaseOrder
      .add(
        request.id,
      )
  } else {
    item
      .purchaseRequestsWithoutPurchaseOrder
      .add(
        request.id,
      )

    item
      .requestedQuantityWithoutPurchaseOrder +=
      request.quantity ?? 0
  }

  const supplier =
    normalizeText(
      request.actualSupplierName ??
        request.preferredSupplierName,
    )

  if (supplier) {
    item.suppliers.add(
      supplier,
    )
  }

  const buyer =
    normalizeText(
      request.assignedBuyer,
    )

  if (buyer) {
    item.buyers.add(
      buyer,
    )
  }
}

function finalizeItem(
  item:
    MutablePurchasingInventoryItem,
  snapshotDate: string | null,
): PurchasingInventoryItem {
  const hasInventory =
    item.inventoryPositionIds.size >
    0

  const hasPurchasing =
    item.purchaseOrderLineIds.size >
      0 ||
    item.purchaseRequestIds.size >
      0

  return {
    itemCode:
      item.itemCode,
    productId:
      item.productId,
    productName:
      item.productName,
    brandId:
      item.brandId,
    snapshotDate,

    hasInventory,
    hasPurchasing,

    inventory: {
      positions:
        item.inventoryPositionIds
          .size,
      locations:
        item.locationIds.size,
      onHand:
        item.onHand,
      available:
        item.available,
      committed:
        item.committed,
      inTransit:
        item.inTransit,
      onOrder:
        item.onOrder,
      inboundUnits:
        item.inTransit +
        item.onOrder,
      inventoryValue:
        item.inventoryValue,
    },

    purchasing: {
      purchaseOrderLines:
        item.purchaseOrderLineIds
          .size,
      openPurchaseOrderLines:
        item.openPurchaseOrderLineIds
          .size,
      openPurchaseOrders:
        item.openPurchaseOrderNumbers
          .size,
      openPurchaseOrderQuantity:
        item.openPurchaseOrderQuantity,
      overduePurchaseOrders:
        item
          .overduePurchaseOrderNumbers
          .size,
      dueNext7DaysPurchaseOrders:
        item
          .dueNext7DaysPurchaseOrderNumbers
          .size,

      purchaseRequests:
        item.purchaseRequestIds.size,
      purchaseRequestsWithPurchaseOrder:
        item
          .purchaseRequestsWithPurchaseOrder
          .size,
      purchaseRequestsWithoutPurchaseOrder:
        item
          .purchaseRequestsWithoutPurchaseOrder
          .size,
      requestedQuantity:
        item.requestedQuantity,
      requestedQuantityWithoutPurchaseOrder:
        item
          .requestedQuantityWithoutPurchaseOrder,

      suppliers: [
        ...item.suppliers,
      ].sort(
        (left, right) =>
          left.localeCompare(
            right,
            'es-MX',
            {
              sensitivity:
                'base',
            },
          ),
      ),

      buyers: [
        ...item.buyers,
      ].sort(
        (left, right) =>
          left.localeCompare(
            right,
            'es-MX',
            {
              sensitivity:
                'base',
            },
          ),
      ),
    },
  }
}

export function buildPurchasingInventoryAnalytics(
  input:
    PurchasingInventoryAnalyticsInput,
): PurchasingInventoryAnalyticsReport {
  const referenceDate =
    resolveReferenceDate(
      input.referenceDate,
      input.snapshotDate,
    )

  const items =
    new Map<
      string,
      MutablePurchasingInventoryItem
    >()

  let inventoryPositionsWithoutProductCode =
    0

  let purchaseOrderLinesWithoutItemCode =
    0

  let purchaseRequestsWithoutItemCode =
    0

  for (
    const position of
    input.inventoryPositions
  ) {
    const itemCode =
      normalizeItemCode(
        position.productCode,
      )

    if (!itemCode) {
      inventoryPositionsWithoutProductCode +=
        1

      continue
    }

    registerInventoryPosition(
      getOrCreateItem(
        items,
        itemCode,
      ),
      position,
    )
  }

  for (
    const line of
    input.purchaseOrderLines
  ) {
    if (
      line.lineType !==
      'product'
    ) {
      continue
    }

    const itemCode =
      normalizeItemCode(
        line.itemCode,
      )

    if (!itemCode) {
      purchaseOrderLinesWithoutItemCode +=
        1

      continue
    }

    registerPurchaseOrderLine(
      getOrCreateItem(
        items,
        itemCode,
      ),
      line,
      referenceDate,
    )
  }

  for (
    const request of
    input.purchaseRequests
  ) {
    const itemCode =
      normalizeItemCode(
        request.itemCode,
      )

    if (!itemCode) {
      purchaseRequestsWithoutItemCode +=
        1

      continue
    }

    registerPurchaseRequest(
      getOrCreateItem(
        items,
        itemCode,
      ),
      request,
    )
  }

  const finalizedItems =
    [...items.values()]
      .map(
        (item) =>
          finalizeItem(
            item,
            input.snapshotDate,
          ),
      )
      .sort(
        (left, right) =>
          left.itemCode.localeCompare(
            right.itemCode,
          ),
      )

  const itemsWithInventory =
    finalizedItems.filter(
      (item) =>
        item.hasInventory,
    )

  const itemsWithPurchasing =
    finalizedItems.filter(
      (item) =>
        item.hasPurchasing,
    )

  const itemsWithNoAvailableStock =
    finalizedItems.filter(
      (item) =>
        item.hasInventory &&
        item.inventory.available <=
          0,
    )

  const itemsWithOpenPurchaseOrders =
    finalizedItems.filter(
      (item) =>
        item.purchasing
          .openPurchaseOrders >
        0,
    )

  const itemsWithOverduePurchaseOrders =
    finalizedItems.filter(
      (item) =>
        item.purchasing
          .overduePurchaseOrders >
        0,
    )

  return {
    generatedAt:
      new Date().toISOString(),
    snapshotDate:
      input.snapshotDate,
    referenceDate,

    summary: {
      items:
        finalizedItems.length,
      itemsWithInventory:
        itemsWithInventory.length,
      itemsWithPurchasing:
        itemsWithPurchasing.length,

      itemsWithNoAvailableStock:
        itemsWithNoAvailableStock.length,
      itemsWithOpenPurchaseOrders:
        itemsWithOpenPurchaseOrders.length,
      itemsWithOverduePurchaseOrders:
        itemsWithOverduePurchaseOrders.length,

      itemsWithNoAvailableStockAndNoOpenPurchaseOrder:
        itemsWithNoAvailableStock.filter(
          (item) =>
            item.purchasing
              .openPurchaseOrders ===
            0,
        ).length,

      itemsWithNoAvailableStockAndOpenPurchaseOrder:
        itemsWithNoAvailableStock.filter(
          (item) =>
            item.purchasing
              .openPurchaseOrders >
            0,
        ).length,

      itemsWithNoAvailableStockAndOverduePurchaseOrder:
        itemsWithNoAvailableStock.filter(
          (item) =>
            item.purchasing
              .overduePurchaseOrders >
            0,
        ).length,
    },

    quality: {
      inventoryPositionsWithoutProductCode,
      purchaseOrderLinesWithoutItemCode,
      purchaseRequestsWithoutItemCode,
    },

    items:
      finalizedItems,
  }
}