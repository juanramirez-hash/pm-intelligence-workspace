import type {
  ImportError,
  ValidationResult,
} from '../../types/commonTypes'

import {
  PRICING_COLUMN_ALIASES,
  type PricingField,
} from './pricingColumnAliases'

import {
  ALL_PRICING_FIELDS,
  REQUIRED_PRICING_FIELDS,
} from './pricingSchema'

export type PricingSourceLayout =
  | 'canonical'
  | 'erp_dual_currency'
  | 'hybrid'

export interface PricingValidationResult
  extends ValidationResult {
  columnMap: Partial<Record<PricingField, string>>
  missingRequiredFields: PricingField[]
  unknownColumns: string[]
  sourceLayout: PricingSourceLayout
  hasCanonicalChannel: boolean
  hasMxnChannel: boolean
  hasUsdChannel: boolean
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function findMatchingColumn(
  headers: string[],
  aliases: readonly string[],
): string | undefined {
  const normalizedHeaders = new Map(
    headers.map((header) => [normalizeHeader(header), header]),
  )

  for (const alias of aliases) {
    const header = normalizedHeaders.get(normalizeHeader(alias))

    if (header) {
      return header
    }
  }

  return undefined
}

export function validatePricingHeaders(
  headers: string[],
): PricingValidationResult {
  const columnMap: Partial<Record<PricingField, string>> = {}

  for (const field of ALL_PRICING_FIELDS) {
    const column = findMatchingColumn(
      headers,
      PRICING_COLUMN_ALIASES[field],
    )

    if (column) {
      columnMap[field] = column
    }
  }

  const missingRequiredFields = REQUIRED_PRICING_FIELDS.filter(
    (field) => !columnMap[field],
  )

  const hasCanonicalChannel = Boolean(
    columnMap.canonicalCost &&
    columnMap.canonicalListPrice &&
    columnMap.canonicalCurrency,
  )

  const hasMxnChannel = Boolean(
    columnMap.costMxn && columnMap.listPriceMxn,
  )

  const hasUsdChannel = Boolean(
    (columnMap.costUsd || columnMap.costUsdFallback) &&
    columnMap.listPriceUsd,
  )

  const errors: ImportError[] = missingRequiredFields.map(
    (field) => ({
      column: field,
      message: `Falta una columna obligatoria para ${field}.`,
    }),
  )

  if (
    !hasCanonicalChannel &&
    !hasMxnChannel &&
    !hasUsdChannel
  ) {
    errors.push({
      column: 'pricingChannel',
      message:
        'Se requiere un canal completo de precio: Costo + Precio Lista + Moneda, Costo MXN + Precio Lista MXN o Costo USD + Precio Lista USD.',
    })
  }

  const recognizedColumns = new Set(
    Object.values(columnMap).filter(
      (column): column is string => Boolean(column),
    ),
  )

  const warnings: string[] = []

  if (!columnMap.effectiveDate) {
    warnings.push(
      'La fuente no declara fecha efectiva; los precios se conservarán como vigencia no fechada.',
    )
  }

  const hasAnySellingPrice = Boolean(
    columnMap.canonicalSellingPrice ||
    columnMap.sellingPriceMxn ||
    columnMap.sellingPriceUsd,
  )

  if (!hasAnySellingPrice) {
    warnings.push(
      'La fuente no declara precio de venta; se utilizará el precio de lista como escenario actual.',
    )
  }

  let sourceLayout: PricingSourceLayout = 'canonical'

  if ((hasMxnChannel || hasUsdChannel) && hasCanonicalChannel) {
    sourceLayout = 'hybrid'
  } else if (hasMxnChannel || hasUsdChannel) {
    sourceLayout = 'erp_dual_currency'
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    columnMap,
    missingRequiredFields,
    unknownColumns: headers.filter(
      (header) => !recognizedColumns.has(header),
    ),
    sourceLayout,
    hasCanonicalChannel,
    hasMxnChannel,
    hasUsdChannel,
  }
}
