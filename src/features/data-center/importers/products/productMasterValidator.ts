import type { ValidationResult } from '../../types/commonTypes'
import { PRODUCT_MASTER_COLUMN_ALIASES, type ProductMasterField } from './productMasterColumnAliases'

export interface ProductMasterValidationResult extends ValidationResult {
  columnMap: Partial<Record<ProductMasterField, string>>
  missingRequiredFields: ProductMasterField[]
  unknownColumns: string[]
}

export function normalizeProductMasterHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLocaleLowerCase('es-MX')
    .replace(/[\s_/()-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function validateProductMasterHeaders(headers: string[]): ProductMasterValidationResult {
  const normalizedHeaders = new Map(headers.map((header) => [normalizeProductMasterHeader(header), header]))
  const columnMap: Partial<Record<ProductMasterField, string>> = {}

  for (const [field, aliases] of Object.entries(PRODUCT_MASTER_COLUMN_ALIASES) as [ProductMasterField, readonly string[]][]) {
    for (const alias of aliases) {
      const sourceHeader = normalizedHeaders.get(normalizeProductMasterHeader(alias))
      if (sourceHeader) {
        columnMap[field] = sourceHeader
        break
      }
    }
  }

  const requiredFields: ProductMasterField[] = ['brand', 'code', 'model']
  const missingRequiredFields = requiredFields.filter((field) => !columnMap[field])
  const mappedHeaders = new Set(Object.values(columnMap))
  const unknownColumns = headers.filter((header) => !mappedHeaders.has(header))
  const errors = missingRequiredFields.map((field) => ({
    column: field,
    message: `Falta la columna obligatoria del catálogo: ${field}.`,
  }))

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    columnMap,
    missingRequiredFields,
    unknownColumns,
  }
}
