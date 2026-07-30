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

  getLatestSnapshot(): BusinessInventorySnapshot | undefined {
    const date = this.getLatestSnapshotDate()
    return date
      ? this.model.inventorySnapshots?.get(date)
      : undefined
  }

  findByProduct(productIdOrName: string): BusinessInventoryPosition[] {
    return [
      ...(this.indexes.byProduct.get(normalize(productIdOrName)) ?? []),
    ]
  }

  findLatestByProduct(productIdOrName: string): BusinessInventoryPosition[] {
    return [
      ...(this.indexes.latestByProduct.get(normalize(productIdOrName)) ?? []),
    ]
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
