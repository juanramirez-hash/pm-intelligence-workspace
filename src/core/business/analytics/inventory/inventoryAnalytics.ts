import type {
  BusinessInventoryPosition,
} from '../../entities/inventoryPosition'
import {
  addCostValue,
  compareCostDescending,
  costShare,
  finalizeCostTotal,
} from '../costValues'

export type InventoryStockStatus =
  | 'available'
  | 'out_of_stock'
  | 'negative_stock'
  | 'overcommitted'
  | 'inbound_only'
  | 'no_available_stock'

export interface InventoryAnalyticsTotals {
  positions: number
  products: number
  locations: number
  unresolvedProducts: number

  onHand: number
  available: number
  committed: number
  inTransit: number
  onOrder: number
  inventoryValue: number | null
  positionsWithoutValue: number

  availableRate: number
  committedRate: number
  inboundUnits: number
}

export interface InventoryAnalyticsGroup {
  key: string
  label: string
  positions: number
  products: number
  locations: number

  onHand: number
  available: number
  committed: number
  inTransit: number
  onOrder: number
  inventoryValue: number | null
  positionsWithoutValue: number

  valueShare: number | null
  availableRate: number
}

export interface InventoryStockStatusSummary {
  status: InventoryStockStatus
  positions: number
  products: number
  inventoryValue: number | null
  positionsWithoutValue: number
  valueShare: number | null
}

export interface InventoryAnalyticsReport {
  generatedAt: string
  snapshotDate: string | null
  totals: InventoryAnalyticsTotals
  byBrand: InventoryAnalyticsGroup[]
  byLocation: InventoryAnalyticsGroup[]
  byProduct: InventoryAnalyticsGroup[]
  stockStatus: InventoryStockStatusSummary[]
}

interface MutableGroup {
  key: string
  label: string
  positions: number
  products: Set<string>
  locations: Set<string>
  onHand: number
  available: number
  committed: number
  inTransit: number
  onOrder: number
  inventoryValue: number | null
  positionsWithoutValue: number
}

interface MutableStatus {
  positions: number
  products: Set<string>
  inventoryValue: number | null
  positionsWithoutValue: number
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0
}

function productKey(position: BusinessInventoryPosition): string {
  return position.productId ?? position.productName
}

function classifyStockStatus(
  position: BusinessInventoryPosition,
): InventoryStockStatus {
  if (position.onHand < 0 || position.available < 0) {
    return 'negative_stock'
  }

  if (position.committed > position.onHand) {
    return 'overcommitted'
  }

  if (
    position.onHand <= 0 &&
    (position.inTransit > 0 || position.onOrder > 0)
  ) {
    return 'inbound_only'
  }

  if (position.onHand <= 0) {
    return 'out_of_stock'
  }

  if (position.available <= 0) {
    return 'no_available_stock'
  }

  return 'available'
}

function registerGroup(
  groups: Map<string, MutableGroup>,
  key: string,
  label: string,
  position: BusinessInventoryPosition,
): void {
  let group = groups.get(key)

  if (!group) {
    group = {
      key,
      label,
      positions: 0,
      products: new Set<string>(),
      locations: new Set<string>(),
      onHand: 0,
      available: 0,
      committed: 0,
      inTransit: 0,
      onOrder: 0,
      inventoryValue: null,
      positionsWithoutValue: 0,
    }

    groups.set(key, group)
  }

  group.positions += 1
  group.products.add(productKey(position))
  group.locations.add(position.locationId)
  group.onHand += position.onHand
  group.available += position.available
  group.committed += position.committed
  group.inTransit += position.inTransit
  group.onOrder += position.onOrder
  group.inventoryValue = addCostValue(
    group.inventoryValue,
    position.inventoryValue,
  )
  group.positionsWithoutValue +=
    position.inventoryValue === null ? 1 : 0
}

function finalizeGroups(
  groups: Map<string, MutableGroup>,
  totalInventoryValue: number | null,
): InventoryAnalyticsGroup[] {
  return [...groups.values()]
    .map((group) => ({
      key: group.key,
      label: group.label,
      positions: group.positions,
      products: group.products.size,
      locations: group.locations.size,
      onHand: group.onHand,
      available: group.available,
      committed: group.committed,
      inTransit: group.inTransit,
      onOrder: group.onOrder,
      inventoryValue: group.inventoryValue,
      positionsWithoutValue: group.positionsWithoutValue,
      valueShare: costShare(
        group.inventoryValue,
        totalInventoryValue,
      ),
      availableRate: safeRatio(group.available, group.onHand),
    }))
    .sort(
      (left, right) =>
        compareCostDescending(
          left.inventoryValue,
          right.inventoryValue,
        ) ||
        right.onHand - left.onHand ||
        left.label.localeCompare(right.label),
    )
}

export function buildInventoryAnalytics(
  positions: readonly BusinessInventoryPosition[],
  snapshotDate: string | null,
): InventoryAnalyticsReport {
  const selectedPositions = positions.filter(
    (position) => position.snapshotDate === snapshotDate,
  )

  const products = new Set<string>()
  const locations = new Set<string>()
  const unresolvedProducts = new Set<string>()

  const totals: InventoryAnalyticsTotals = {
    positions: 0,
    products: 0,
    locations: 0,
    unresolvedProducts: 0,
    onHand: 0,
    available: 0,
    committed: 0,
    inTransit: 0,
    onOrder: 0,
    inventoryValue: null,
    positionsWithoutValue: 0,
    availableRate: 0,
    committedRate: 0,
    inboundUnits: 0,
  }

  const brandGroups = new Map<string, MutableGroup>()
  const locationGroups = new Map<string, MutableGroup>()
  const productGroups = new Map<string, MutableGroup>()
  const statuses = new Map<InventoryStockStatus, MutableStatus>()

  for (const position of selectedPositions) {
    const identity = productKey(position)
    const brandId = position.brandId ?? 'SIN MARCA'

    products.add(identity)
    locations.add(position.locationId)

    if (position.identityStatus === 'unresolved') {
      unresolvedProducts.add(position.productName)
    }

    totals.positions += 1
    totals.onHand += position.onHand
    totals.available += position.available
    totals.committed += position.committed
    totals.inTransit += position.inTransit
    totals.onOrder += position.onOrder
    totals.inventoryValue = addCostValue(
      totals.inventoryValue,
      position.inventoryValue,
    )
    totals.positionsWithoutValue +=
      position.inventoryValue === null ? 1 : 0

    registerGroup(brandGroups, brandId, brandId, position)
    registerGroup(
      locationGroups,
      position.locationId,
      position.locationId,
      position,
    )
    registerGroup(
      productGroups,
      identity,
      position.productName,
      position,
    )

    const status = classifyStockStatus(position)
    const currentStatus = statuses.get(status) ?? {
      positions: 0,
      products: new Set<string>(),
      inventoryValue: null,
      positionsWithoutValue: 0,
    }

    currentStatus.positions += 1
    currentStatus.products.add(identity)
    currentStatus.inventoryValue = addCostValue(
      currentStatus.inventoryValue,
      position.inventoryValue,
    )
    currentStatus.positionsWithoutValue +=
      position.inventoryValue === null ? 1 : 0
    statuses.set(status, currentStatus)
  }

  totals.products = products.size
  totals.locations = locations.size
  totals.unresolvedProducts = unresolvedProducts.size
  totals.availableRate = safeRatio(totals.available, totals.onHand)
  totals.committedRate = safeRatio(totals.committed, totals.onHand)
  totals.inboundUnits = totals.inTransit + totals.onOrder
  totals.inventoryValue = finalizeCostTotal(
    totals.inventoryValue,
    totals.positions,
  )

  const stockStatus = [...statuses.entries()]
    .map(([status, summary]) => ({
      status,
      positions: summary.positions,
      products: summary.products.size,
      inventoryValue: summary.inventoryValue,
      positionsWithoutValue: summary.positionsWithoutValue,
      valueShare: costShare(
        summary.inventoryValue,
        totals.inventoryValue,
      ),
    }))
    .sort(
      (left, right) =>
        compareCostDescending(
          left.inventoryValue,
          right.inventoryValue,
        ) ||
        right.positions - left.positions ||
        left.status.localeCompare(right.status),
    )

  return {
    generatedAt: new Date().toISOString(),
    snapshotDate,
    totals,
    byBrand: finalizeGroups(brandGroups, totals.inventoryValue),
    byLocation: finalizeGroups(locationGroups, totals.inventoryValue),
    byProduct: finalizeGroups(productGroups, totals.inventoryValue),
    stockStatus,
  }
}
