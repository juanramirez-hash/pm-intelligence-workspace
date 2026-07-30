import type {
  InventoryDatasetSummary,
  NormalizedInventoryRow,
} from './inventoryTypes'

export interface InventoryBusinessModel {
  positions: NormalizedInventoryRow[]
  summary: InventoryDatasetSummary
}

function finite(value: number | null): number {
  return value !== null && Number.isFinite(value) ? value : 0
}

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

export function buildInventoryBusinessModel(
  positions: NormalizedInventoryRow[],
  ignoredRows: number,
): InventoryBusinessModel {
  const products = new Set<string>()
  const locations = new Set<string>()
  const positionCounts = new Map<string, number>()
  const dates: string[] = []

  let totalOnHand = 0
  let totalAvailable = 0
  let totalCommitted = 0
  let totalInTransit = 0
  let totalOnOrder = 0
  let totalInventoryValue = 0
  let negativeStockRows = 0

  for (const position of positions) {
    products.add(normalize(position.productName))
    locations.add(normalize(position.location))

    if (position.snapshotDate) {
      dates.push(position.snapshotDate)
    }

    const key = [
      position.snapshotDate ?? 'NO_DATE',
      normalize(position.productName),
      normalize(position.location),
    ].join('::')
    positionCounts.set(key, (positionCounts.get(key) ?? 0) + 1)

    totalOnHand += finite(position.onHand)
    totalAvailable += finite(position.available)
    totalCommitted += finite(position.committed)
    totalInTransit += finite(position.inTransit)
    totalOnOrder += finite(position.onOrder)
    totalInventoryValue += finite(position.inventoryValue)

    if (position.onHand < 0) {
      negativeStockRows += 1
    }
  }

  dates.sort()

  return {
    positions,
    summary: {
      periodStart: dates[0] ?? null,
      periodEnd: dates.at(-1) ?? null,
      totalPositions: positionCounts.size,
      uniqueProducts: products.size,
      uniqueLocations: locations.size,
      totalOnHand,
      totalAvailable,
      totalCommitted,
      totalInTransit,
      totalOnOrder,
      totalInventoryValue,
      negativeStockRows,
      duplicatePositions: [...positionCounts.values()].filter(
        (count) => count > 1,
      ).length,
      processedRows: positions.length,
      ignoredRows,
    },
  }
}
