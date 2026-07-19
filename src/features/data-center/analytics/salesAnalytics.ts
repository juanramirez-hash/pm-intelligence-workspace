import type {
  SalesAggregate,
  SalesBusinessModel,
} from '../importers/sales/salesBusinessModel'

function calculateGrossMargin(
  sales: number,
  grossProfit: number,
): number {
  if (sales === 0) {
    return 0
  }

  return (grossProfit / sales) * 100
}

function mapAggregate(
  aggregate: SalesAggregate,
) {
  return {
    ...aggregate,
    grossMargin: calculateGrossMargin(
      aggregate.totalSales,
      aggregate.totalGrossProfit,
    ),
  }
}

export function getTotalSales(
  model: SalesBusinessModel,
): number {
  return model.totals.totalSales
}

export function getTotalGrossProfit(
  model: SalesBusinessModel,
): number {
  return model.totals.totalGrossProfit
}

export function getGrossMargin(
  model: SalesBusinessModel,
): number {
  return calculateGrossMargin(
    model.totals.totalSales,
    model.totals.totalGrossProfit,
  )
}

export function getTotalQuantity(
  model: SalesBusinessModel,
): number {
  return model.totals.totalQuantity
}

export function getUniqueCustomers(
  model: SalesBusinessModel,
): number {
  return model.customerIds.size
}

export function getUniqueProducts(
  model: SalesBusinessModel,
): number {
  return model.productIds.size
}

export function getUniqueDocuments(
  model: SalesBusinessModel,
): number {
  return model.documentNumbers.size
}

export function getActiveBrands(
  model: SalesBusinessModel,
): number {
  return model.brands.size
}

export function getActiveLocations(
  model: SalesBusinessModel,
): number {
  return model.locations.size
}

export function getSalesByBrand(
  model: SalesBusinessModel,
) {
  return [...model.brands.values()]
    .map(mapAggregate)
    .sort(
      (a, b) =>
        b.totalSales - a.totalSales,
    )
}

export function getSalesByMonth(
  model: SalesBusinessModel,
) {
  return [...model.months.values()]
    .map(mapAggregate)
    .sort((a, b) =>
      a.key.localeCompare(b.key),
    )
}

export function getSalesByLocation(
  model: SalesBusinessModel,
) {
  return [...model.locations.values()]
    .map(mapAggregate)
    .sort(
      (a, b) =>
        b.totalSales - a.totalSales,
    )
}