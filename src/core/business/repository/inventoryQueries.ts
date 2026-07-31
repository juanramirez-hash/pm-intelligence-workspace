import type {
  BusinessDataModel,
} from '../models/businessDataModel'

import type {
  BusinessInventoryPosition,
} from '../entities/inventoryPosition'

import type {
  BusinessInventorySnapshot,
} from '../entities/inventorySnapshot'

import {
  buildInventoryIndexes,
} from './inventoryIndexes'

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

export class InventoryQueries {
  private readonly model: BusinessDataModel
  private readonly indexes: ReturnType<typeof buildInventoryIndexes>

  constructor(model: BusinessDataModel) {
    this.model = model
    this.indexes = buildInventoryIndexes(
      model.inventoryPositions ?? new Map(),
    )
  }

  getAll(): BusinessInventoryPosition[] {
    return [...(this.model.inventoryPositions ?? new Map()).values()]
  }

  getSnapshots(): BusinessInventorySnapshot[] {
    return [...(this.model.inventorySnapshots ?? new Map()).values()].sort(
      (left, right) =>
        (left.snapshotDate ?? '').localeCompare(right.snapshotDate ?? ''),
    )
  }

  getLatestSnapshotDate(): string | null {
    return this.indexes.latestSnapshotDate
  }

  /**
   * Returns the positions that represent the active inventory cut.
   *
   * Some NetSuite inventory exports do not contain a snapshot date. Those
   * rows are intentionally materialized with snapshotDate = null and indexed
   * under the internal NO_DATE key. They still represent a valid current cut
   * and must remain available to Inventory Workspace.
   */
  getLatestPositions(): BusinessInventoryPosition[] {
    const date = this.getLatestSnapshotDate()

    if (date) {
      return this.findBySnapshot(date)
    }

    return this.getAll().filter(
      (position) => position.snapshotDate === null,
    )
  }

  getLatestSnapshot(): BusinessInventorySnapshot | undefined {
    const date = this.getLatestSnapshotDate()

    if (date) {
      return this.model.inventorySnapshots?.get(date)
    }

    return this.model.inventorySnapshots?.get('NO_DATE')
  }

  findByProduct(productIdOrName: string): BusinessInventoryPosition[] {
    return [
      ...(this.indexes.byProduct.get(normalize(productIdOrName)) ?? []),
    ]
  }

  findLatestByProduct(productIdOrName: string): BusinessInventoryPosition[] {
    const normalizedIdentity = normalize(productIdOrName)
    const indexed = this.indexes.latestByProduct.get(normalizedIdentity)

    if (indexed) {
      return [...indexed]
    }

    return this.getLatestPositions().filter(
      (position) =>
        normalize(position.productId ?? position.productName) ===
          normalizedIdentity,
    )
  }

  findByLocation(locationId: string): BusinessInventoryPosition[] {
    return [
      ...(this.indexes.byLocation.get(normalize(locationId)) ?? []),
    ]
  }

  findByBrand(brandId: string): BusinessInventoryPosition[] {
    return [
      ...(this.indexes.byBrand.get(normalize(brandId)) ?? []),
    ]
  }

  findBySnapshot(snapshotDate: string): BusinessInventoryPosition[] {
    return [
      ...(this.indexes.bySnapshot.get(snapshotDate) ?? []),
    ]
  }

  findByProductAndLocation(
    productIdOrName: string,
    locationId: string,
  ): BusinessInventoryPosition[] {
    return [
      ...(this.indexes.byProductAndLocation.get(
        `${normalize(productIdOrName)}::${normalize(locationId)}`,
      ) ?? []),
    ]
  }

  getUnresolved(): BusinessInventoryPosition[] {
    return this.getAll().filter(
      (position) => position.identityStatus === 'unresolved',
    )
  }
}
