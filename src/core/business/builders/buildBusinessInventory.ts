import type {
  NormalizedInventoryRow,
} from '../../../features/data-center/importers/inventory/inventoryTypes'

import type {
  BusinessProduct,
} from '../entities/product'

import type {
  BusinessInventoryPosition,
} from '../entities/inventoryPosition'

import type {
  BusinessInventorySnapshot,
} from '../entities/inventorySnapshot'

export interface BusinessInventoryBuildResult {
  positions: Map<string, BusinessInventoryPosition>
  snapshots: Map<string, BusinessInventorySnapshot>
}

function normalizeIdentifier(
  value: string | null | undefined,
): string | null {
  const normalized = (value ?? '')
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')

  return normalized || null
}

function finite(value: number | null | undefined): number {
  return value !== null && value !== undefined && Number.isFinite(value)
    ? value
    : 0
}

function buildPositionId(
  snapshotDate: string | null,
  productName: string,
  locationId: string,
): string {
  return [
    snapshotDate ?? 'NO_DATE',
    productName,
    locationId,
  ].join('::')
}

function buildSnapshotId(snapshotDate: string | null): string {
  return snapshotDate ?? 'NO_DATE'
}

function createSnapshot(
  snapshotDate: string | null,
): BusinessInventorySnapshot {
  return {
    id: buildSnapshotId(snapshotDate),
    snapshotDate,
    positions: 0,
    products: new Set<string>(),
    unresolvedProducts: new Set<string>(),
    locations: new Set<string>(),
    onHand: 0,
    available: 0,
    committed: 0,
    inTransit: 0,
    onOrder: 0,
    inventoryValue: 0,
  }
}

export function buildBusinessInventory(
  rows: readonly NormalizedInventoryRow[],
  products: ReadonlyMap<string, BusinessProduct>,
): BusinessInventoryBuildResult {
  const positions = new Map<string, BusinessInventoryPosition>()
  const snapshots = new Map<string, BusinessInventorySnapshot>()

  for (const row of rows) {
    const productName = normalizeIdentifier(row.productName)
    const locationId = normalizeIdentifier(row.location)

    if (!productName || !locationId) {
      continue
    }

    const product = products.get(productName)
    const productId = product?.id ?? null
    const productCode =
      normalizeIdentifier(row.productCode) ??
      productId

    const positionId = buildPositionId(
      row.snapshotDate,
      productName,
      locationId,
    )

    let position = positions.get(positionId)

    if (!position) {
      position = {
        id: positionId,
        snapshotDate: row.snapshotDate,
        productId,
        productName,
        productCode,
        brandId:
          product?.brandId ?? normalizeIdentifier(row.brand),
        model:
          product?.model ?? normalizeIdentifier(row.model),
        locationId,
        identityStatus: product
          ? 'current_master'
          : 'unresolved',
        onHand: 0,
        available: 0,
        committed: 0,
        inTransit: 0,
        onOrder: 0,
        unitCost: row.unitCost,
        inventoryValue: 0,
        currency: normalizeIdentifier(row.currency),
        sourceRows: 0,
      }

      positions.set(positionId, position)
    }

    position.onHand += finite(row.onHand)
    position.available += finite(row.available)
    position.committed += finite(row.committed)
    position.inTransit += finite(row.inTransit)
    position.onOrder += finite(row.onOrder)
    position.inventoryValue += finite(row.inventoryValue)
    position.sourceRows += 1

    if (position.unitCost === null && row.unitCost !== null) {
      position.unitCost = row.unitCost
    }
  }

  for (const position of positions.values()) {
    const snapshotId = buildSnapshotId(position.snapshotDate)
    let snapshot = snapshots.get(snapshotId)

    if (!snapshot) {
      snapshot = createSnapshot(position.snapshotDate)
      snapshots.set(snapshotId, snapshot)
    }

    snapshot.positions += 1
    snapshot.locations.add(position.locationId)
    snapshot.onHand += position.onHand
    snapshot.available += position.available
    snapshot.committed += position.committed
    snapshot.inTransit += position.inTransit
    snapshot.onOrder += position.onOrder
    snapshot.inventoryValue += position.inventoryValue

    if (position.productId) {
      snapshot.products.add(position.productId)
    } else {
      snapshot.unresolvedProducts.add(position.productName)
    }
  }

  return { positions, snapshots }
}
