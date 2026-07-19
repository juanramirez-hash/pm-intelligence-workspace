import type { NormalizedSalesRow } from './salesTypes'

export interface SalesAggregate {
  key: string
  label: string
  totalSales: number
  totalGrossProfit: number
  totalQuantity: number
  rowCount: number
}

export interface SalesBusinessTotals {
  totalSales: number
  totalGrossProfit: number
  totalQuantity: number
}

export interface SalesBusinessModel {
  periodStart: string | null
  periodEnd: string | null

  totals: SalesBusinessTotals

  customerIds: Set<string>
  productIds: Set<string>
  documentNumbers: Set<string>

  brands: Map<string, SalesAggregate>
  months: Map<string, SalesAggregate>
  locations: Map<string, SalesAggregate>

  processedRows: number
  ignoredRows: number
}

function normalizeDimensionKey(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function normalizeUniqueIdentifier(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue = value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')

  return normalizedValue || null
}

function getMonthKey(date: string): string | null {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  const year = parsedDate.getUTCFullYear()
  const month = String(
    parsedDate.getUTCMonth() + 1,
  ).padStart(2, '0')

  return `${year}-${month}`
}

function addToAggregate(
  collection: Map<string, SalesAggregate>,
  key: string,
  label: string,
  row: NormalizedSalesRow,
): void {
  const existingAggregate = collection.get(key)

  if (existingAggregate) {
    existingAggregate.totalSales += row.revenue
    existingAggregate.totalGrossProfit += row.grossProfit
    existingAggregate.totalQuantity += row.quantity
    existingAggregate.rowCount += 1

    return
  }

  collection.set(key, {
    key,
    label,
    totalSales: row.revenue,
    totalGrossProfit: row.grossProfit,
    totalQuantity: row.quantity,
    rowCount: 1,
  })
}

function updatePeriod(
  currentStart: string | null,
  currentEnd: string | null,
  date: string,
): {
  periodStart: string
  periodEnd: string
} {
  return {
    periodStart:
      !currentStart || date < currentStart
        ? date
        : currentStart,

    periodEnd:
      !currentEnd || date > currentEnd
        ? date
        : currentEnd,
  }
}

export function buildSalesBusinessModel(
  rows: NormalizedSalesRow[],
  ignoredRows = 0,
): SalesBusinessModel {
  const model: SalesBusinessModel = {
    periodStart: null,
    periodEnd: null,

    totals: {
      totalSales: 0,
      totalGrossProfit: 0,
      totalQuantity: 0,
    },

    customerIds: new Set<string>(),
    productIds: new Set<string>(),
    documentNumbers: new Set<string>(),

    brands: new Map<string, SalesAggregate>(),
    months: new Map<string, SalesAggregate>(),
    locations: new Map<string, SalesAggregate>(),

    processedRows: rows.length,
    ignoredRows,
  }

  for (const row of rows) {
    model.totals.totalSales += row.revenue
    model.totals.totalGrossProfit += row.grossProfit
    model.totals.totalQuantity += row.quantity

    const period = updatePeriod(
      model.periodStart,
      model.periodEnd,
      row.date,
    )

    model.periodStart = period.periodStart
    model.periodEnd = period.periodEnd

    const customerId = normalizeUniqueIdentifier(
      row.customerId,
    )

    if (customerId) {
      model.customerIds.add(customerId)
    }

    const productId = normalizeUniqueIdentifier(row.model)

    if (productId) {
      model.productIds.add(productId)
    }

    const documentNumber = normalizeUniqueIdentifier(
      row.documentNumber,
    )

    if (documentNumber) {
      model.documentNumbers.add(documentNumber)
    }

    const brandKey = normalizeDimensionKey(row.brand)

    addToAggregate(
      model.brands,
      brandKey,
      row.brand.trim(),
      row,
    )

    const monthKey = getMonthKey(row.date)

    if (monthKey) {
      addToAggregate(
        model.months,
        monthKey,
        monthKey,
        row,
      )
    }

    if (row.location) {
      const locationKey = normalizeDimensionKey(
        row.location,
      )

      if (locationKey) {
        addToAggregate(
          model.locations,
          locationKey,
          row.location.trim(),
          row,
        )
      }
    }
  }

  return model
}