import type { ProductCommercialStatus } from '../../../../core/business/entities/product'
import type { NormalizationResult } from '../../engine/importPlugin'
import type { RawProductMasterRow, NormalizedProductMasterRow } from './productMasterTypes'
import type { ProductMasterValidationResult } from './productMasterValidator'
import type { ProductMasterField } from './productMasterColumnAliases'

function getValue(
  row: RawProductMasterRow,
  validation: ProductMasterValidationResult,
  field: ProductMasterField,
): unknown {
  const column = validation.columnMap[field]
  return column ? row[column] : null
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim().replace(/\s+/g, ' ')
  return normalized || null
}

function identifier(value: unknown): string | null {
  const valueText = text(value)
  return valueText ? valueText.toLocaleUpperCase('es-MX') : null
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const valueText = text(value)
  if (!valueText) return null
  const normalized = valueText.replace(/[$,]/g, '').replace(/\s/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function booleanValue(value: unknown): boolean | null {
  const normalized = identifier(value)
  if (!normalized) return null
  if (['T', 'TRUE', 'SI', 'SÍ', 'YES', '1'].includes(normalized)) return true
  if (['F', 'FALSE', 'NO', '0'].includes(normalized)) return false
  return null
}

function statusValue(value: unknown): ProductCommercialStatus | null {
  const normalized = identifier(value)
  return normalized && ['A', 'B', 'C', 'D', 'E'].includes(normalized)
    ? normalized as ProductCommercialStatus
    : null
}

function dateValue(value: unknown): string | null {
  const valueText = text(value)
  if (!valueText) return null
  const date = new Date(valueText)
  return Number.isNaN(date.getTime()) ? valueText : date.toISOString().slice(0, 10)
}

export function normalizeProductMasterRows(
  rows: RawProductMasterRow[],
  validation: ProductMasterValidationResult,
): NormalizationResult<NormalizedProductMasterRow> {
  const normalizedRows: NormalizedProductMasterRow[] = []
  let ignoredRows = 0

  for (const row of rows) {
    const name = identifier(getValue(row, validation, 'name'))
    const explicitCode = identifier(getValue(row, validation, 'code'))
    const model = text(getValue(row, validation, 'model'))
    const brand = text(getValue(row, validation, 'brand'))

    if (!name || !model || !brand) {
      ignoredRows += 1
      continue
    }

    const preferredVendor =
      text(getValue(row, validation, 'preferredVendor'))

    const productClass =
      text(getValue(row, validation, 'productClass'))

    const secondaryCategory1 =
      text(getValue(row, validation, 'secondaryCategory1'))

    const secondaryCategory2 =
      text(getValue(row, validation, 'secondaryCategory2'))

    normalizedRows.push({
      erpInternalId: identifier(getValue(row, validation, 'erpInternalId')),
      name,
      code: explicitCode ?? name,
      model,
      brand,
      vendorCode: text(getValue(row, validation, 'vendorCode')),
      vendorName:
        text(getValue(row, validation, 'vendorName')) ??
        preferredVendor,
      description: text(getValue(row, validation, 'description')),
      classification:
        text(getValue(row, validation, 'classification')) ??
        productClass,
      commercialStatus: statusValue(getValue(row, validation, 'commercialStatus')),
      trend: text(getValue(row, validation, 'trend')),
      category:
        text(getValue(row, validation, 'category')) ??
        productClass,
      subcategory1:
        text(getValue(row, validation, 'subcategory1')) ??
        secondaryCategory1,
      subcategory2:
        text(getValue(row, validation, 'subcategory2')) ??
        secondaryCategory2,
      createdAt: dateValue(getValue(row, validation, 'createdAt')),
      updatedAt: dateValue(getValue(row, validation, 'updatedAt')),
      averageCostUsd: numberValue(getValue(row, validation, 'averageCostUsd')),
      totalValue: numberValue(getValue(row, validation, 'totalValue')),
      currency: identifier(getValue(row, validation, 'currency')),
      inventoryValueMxn: numberValue(getValue(row, validation, 'inventoryValueMxn')),
      inventoryValueUsd: numberValue(getValue(row, validation, 'inventoryValueUsd')),
      lastPurchaseDate: dateValue(getValue(row, validation, 'lastPurchaseDate')),
      lastSaleDate: dateValue(getValue(row, validation, 'lastSaleDate')),
      unitsSoldLast90Days: numberValue(getValue(row, validation, 'unitsSoldLast90Days')),
      preferredVendor,
      productClass,
      secondaryCategory1,
      secondaryCategory2,
      quantityPricingSchedule: text(getValue(row, validation, 'quantityPricingSchedule')),
      formulaText: text(getValue(row, validation, 'formulaText')),
      onHand: numberValue(getValue(row, validation, 'onHand')),
      onOrder: numberValue(getValue(row, validation, 'onOrder')),
      catalogStatus: text(getValue(row, validation, 'catalogStatus')),
      inactiveForPurchases: booleanValue(getValue(row, validation, 'inactiveForPurchases')),
      showOnPortal: booleanValue(getValue(row, validation, 'showOnPortal')),
      supersededBy: identifier(getValue(row, validation, 'supersededBy')),
      blockPurchaseRequests: booleanValue(getValue(row, validation, 'blockPurchaseRequests')),
      directSubstitute: identifier(getValue(row, validation, 'directSubstitute')),
      benchmarkS: text(getValue(row, validation, 'benchmarkS')),
      benchmarkT: text(getValue(row, validation, 'benchmarkT')),
      benchmarkO: text(getValue(row, validation, 'benchmarkO')),
    })
  }

  return { rows: normalizedRows, ignoredRows }
}
