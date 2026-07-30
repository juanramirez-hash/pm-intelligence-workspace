import type {
  BusinessInventoryPosition,
} from '../entities/inventoryPosition'

export interface InventoryIndexes {
  byProduct: Map<string, BusinessInventoryPosition[]>
  byLocation: Map<string, BusinessInventoryPosition[]>
  bySnapshot: Map<string, BusinessInventoryPosition[]>
  byProductAndLocation: Map<string, BusinessInventoryPosition[]>
  byBrand: Map<string, BusinessInventoryPosition[]>
  latestByProduct: Map<string, BusinessInventoryPosition[]>
  latestSnapshotDate: string | null
}

function append(
  index: Map<string, BusinessInventoryPosition[]>,
  key: string | null,
  position: BusinessInventoryPosition,
): void {
  if (!key) {
    return
  }

  const values = index.get(key) ?? []
  values.push(position)
  index.set(key, values)
}

function cloneSorted(
  values: readonly BusinessInventoryPosition[],
): BusinessInventoryPosition[] {
  return [...values].sort(
    (left, right) =>
      left.productName.localeCompare(right.productName) ||
      left.locationId.localeCompare(right.locationId),
  )
}

export function buildInventoryIndexes(
  positions: ReadonlyMap<string, BusinessInventoryPosition>,
): InventoryIndexes {
  const byProduct = new Map<string, BusinessInventoryPosition[]>()
  const byLocation = new Map<string, BusinessInventoryPosition[]>()
  const bySnapshot = new Map<string, BusinessInventoryPosition[]>()
  const byProductAndLocation =
    new Map<string, BusinessInventoryPosition[]>()
  const byBrand = new Map<string, BusinessInventoryPosition[]>()

  let latestSnapshotDate: string | null = null

  for (const position of positions.values()) {
    const snapshotKey = position.snapshotDate ?? 'NO_DATE'

    append(byProduct, position.productId ?? position.productName, position)
    append(byLocation, position.locationId, position)
    append(bySnapshot, snapshotKey, position)
    append(
      byProductAndLocation,
      `${position.productId ?? position.productName}::${position.locationId}`,
      position,
    )
    append(byBrand, position.brandId, position)

    if (
      position.snapshotDate &&
      (!latestSnapshotDate || position.snapshotDate > latestSnapshotDate)
    ) {
      latestSnapshotDate = position.snapshotDate
    }
  }

  const latestByProduct = new Map<string, BusinessInventoryPosition[]>()

  if (latestSnapshotDate) {
    for (const position of bySnapshot.get(latestSnapshotDate) ?? []) {
      append(
        latestByProduct,
        position.productId ?? position.productName,
        position,
      )
    }
  }

  for (const index of [
    byProduct,
    byLocation,
    bySnapshot,
    byProductAndLocation,
    byBrand,
    latestByProduct,
  ]) {
    for (const [key, values] of index) {
      index.set(key, cloneSorted(values))
    }
  }

  return {
    byProduct,
    byLocation,
    bySnapshot,
    byProductAndLocation,
    byBrand,
    latestByProduct,
    latestSnapshotDate,
  }
}
