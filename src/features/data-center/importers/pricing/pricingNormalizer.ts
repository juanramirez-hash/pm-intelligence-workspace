import type {
  NormalizationResult,
} from '../../engine/importPlugin'

import type {
  PricingField,
} from './pricingColumnAliases'

import type {
  NormalizedPricingRow,
  PricingSourceChannel,
  RawPricingRow,
} from './pricingTypes'

import type {
  PricingValidationResult,
} from './pricingValidator'

function getValue(
  row: RawPricingRow,
  validation: PricingValidationResult,
  field: PricingField,
): unknown {
  const column = validation.columnMap[field]
  return column ? row[column] : null
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value)
    .trim()
    .replace(/\s+/g, ' ')

  return normalized || null
}

function identifier(value: unknown): string | null {
  const normalized = text(value)

  return normalized
    ? normalized.toLocaleUpperCase('es-MX')
    : null
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const normalizedText = text(value)

  if (!normalizedText) {
    return null
  }

  const negativeByParentheses =
    normalizedText.startsWith('(') &&
    normalizedText.endsWith(')')

  const normalized = normalizedText
    .replace(/[()$€£¥,%]/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')

  const parsed = Number(normalized)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return negativeByParentheses ? -parsed : parsed
}

function dateValue(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30)
    return new Date(excelEpoch + value * 86_400_000)
      .toISOString()
      .slice(0, 10)
  }

  const normalized = text(value)

  if (!normalized) {
    return null
  }

  const isoMatch = normalized.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
  )

  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`
  }

  const latinMatch = normalized.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
  )

  if (latinMatch) {
    const [, day, month, year] = latinMatch
    return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`
  }

  const parsed = new Date(normalized)

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString().slice(0, 10)
}

function validChannel(
  cost: number | null,
  listPrice: number | null,
  sellingPrice: number | null,
): cost is number {
  return cost !== null &&
    cost >= 0 &&
    listPrice !== null &&
    listPrice > 0 &&
    sellingPrice !== null &&
    sellingPrice > 0
}

interface ChannelInput {
  channel: PricingSourceChannel
  currency: string | null
  cost: number | null
  listPrice: number | null
  sellingPrice: number | null
}

function createSourceReference(
  explicitReference: string | null,
  sourceRowNumber: number,
  channel: PricingSourceChannel,
): string {
  const rowReference = `ROW_${String(sourceRowNumber).padStart(6, '0')}`
  const prefix = explicitReference ?? rowReference
  return `${prefix}::${channel.toLocaleUpperCase('es-MX')}`
}

export function normalizePricingRows(
  rows: RawPricingRow[],
  validation: PricingValidationResult,
): NormalizationResult<NormalizedPricingRow> {
  const normalizedRows: NormalizedPricingRow[] = []
  let ignoredRows = 0

  rows.forEach((row, rowIndex) => {
    const sourceRowNumber = rowIndex + 2
    const productId = identifier(
      getValue(row, validation, 'productId'),
    )
    const brandId = identifier(
      getValue(row, validation, 'brandId'),
    )

    if (!productId || !brandId) {
      ignoredRows += 1
      return
    }

    const model = text(getValue(row, validation, 'model'))
    const purchaseCurrency = identifier(
      getValue(row, validation, 'purchaseCurrency'),
    )
    const effectiveDate = dateValue(
      getValue(row, validation, 'effectiveDate'),
    )
    const pricingGroupId = identifier(
      getValue(row, validation, 'pricingGroupId'),
    )
    const explicitReference = text(
      getValue(row, validation, 'sourceReference'),
    )
    const quantityPricingSchedule = text(
      getValue(row, validation, 'quantityPricingSchedule'),
    )

    const channels: ChannelInput[] = []

    if (validation.hasMxnChannel) {
      const listPrice = numberValue(
        getValue(row, validation, 'listPriceMxn'),
      )
      channels.push({
        channel: 'mxn',
        currency: 'MXN',
        cost: numberValue(
          getValue(row, validation, 'costMxn'),
        ),
        listPrice,
        sellingPrice:
          numberValue(
            getValue(row, validation, 'sellingPriceMxn'),
          ) ?? listPrice,
      })
    }

    const sourceDeclaresPurchaseCurrency = Boolean(
      validation.columnMap.purchaseCurrency,
    )
    const usdChannelAllowed =
      !sourceDeclaresPurchaseCurrency || purchaseCurrency === 'USD'
    const usdChannelSkippedForCurrencyMismatch =
      validation.hasUsdChannel && !usdChannelAllowed

    if (validation.hasUsdChannel && usdChannelAllowed) {
      const listPrice = numberValue(
        getValue(row, validation, 'listPriceUsd'),
      )
      channels.push({
        channel: 'usd',
        currency: 'USD',
        cost:
          numberValue(
            getValue(row, validation, 'costUsd'),
          ) ??
          numberValue(
            getValue(row, validation, 'costUsdFallback'),
          ),
        listPrice,
        sellingPrice:
          numberValue(
            getValue(row, validation, 'sellingPriceUsd'),
          ) ?? listPrice,
      })
    }

    if (validation.hasCanonicalChannel) {
      const listPrice = numberValue(
        getValue(row, validation, 'canonicalListPrice'),
      )
      channels.push({
        channel: 'canonical',
        currency: identifier(
          getValue(row, validation, 'canonicalCurrency'),
        ),
        cost: numberValue(
          getValue(row, validation, 'canonicalCost'),
        ),
        listPrice,
        sellingPrice:
          numberValue(
            getValue(row, validation, 'canonicalSellingPrice'),
          ) ?? listPrice,
      })
    }

    const generatedCurrencies = new Set<string>()
    let generated = 0

    for (const channel of channels) {
      const currency = channel.currency

      if (
        !currency ||
        generatedCurrencies.has(currency) ||
        !validChannel(
          channel.cost,
          channel.listPrice,
          channel.sellingPrice,
        )
      ) {
        continue
      }

      generatedCurrencies.add(currency)
      generated += 1

      normalizedRows.push({
        productId,
        brandId,
        currency,
        cost: channel.cost,
        listPrice: channel.listPrice!,
        sellingPrice: channel.sellingPrice!,
        pricingGroupId,
        effectiveDate,
        source: 'imported',
        sourceReference: createSourceReference(
          explicitReference,
          sourceRowNumber,
          channel.channel,
        ),
        sourceRowNumber,
        sourceChannel: channel.channel,
        model,
        purchaseCurrency,
        quantityPricingSchedule,
        usdChannelSkippedForCurrencyMismatch,
      })
    }

    if (generated === 0) {
      ignoredRows += 1
    }
  })

  return {
    rows: normalizedRows,
    ignoredRows,
  }
}
