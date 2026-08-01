import type { ImportPlugin } from '../../engine/importPlugin'
import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import type { ReportDetectionResult } from '../../types/reportDetectionTypes'
import {
  OPTIONAL_EXCHANGE_RATE_FIELDS,
  RECOMMENDED_EXCHANGE_RATE_FIELDS,
  REQUIRED_EXCHANGE_RATE_FIELDS,
} from './exchangeRateSchema'
import {
  validateExchangeRateHeaders,
  type ExchangeRateValidationResult,
} from './exchangeRateValidator'
import { normalizeExchangeRateRows } from './exchangeRateNormalizer'
import {
  buildExchangeRateBusinessModel,
  type ExchangeRateBusinessModel,
} from './exchangeRateBusinessModel'
import type {
  ExchangeRateDatasetSummary,
  NormalizedExchangeRateRow,
} from './exchangeRateTypes'

const EXCHANGE_RATE_REPORT_TYPE = 'exchange-rates' as const

function extractHeaders(rows: SpreadsheetRow[]): string[] {
  const headers = new Set<string>()

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (key.trim()) {
        headers.add(key)
      }
    }
  }

  return [...headers]
}

function createEmptySummary(
  ignoredRows: number,
): ExchangeRateDatasetSummary {
  return {
    periodStart: null,
    periodEnd: null,
    totalRates: 0,
    currencyPairs: 0,
    invalidRates: 0,
    processedRows: 0,
    ignoredRows,
  }
}

export const exchangeRateImportPlugin: ImportPlugin<
  SpreadsheetRow,
  NormalizedExchangeRateRow,
  ExchangeRateBusinessModel,
  ExchangeRateDatasetSummary,
  ExchangeRateValidationResult
> = {
  reportType: EXCHANGE_RATE_REPORT_TYPE,

  detect(headers): ReportDetectionResult {
    const validation = validateExchangeRateHeaders(headers)
    const required = REQUIRED_EXCHANGE_RATE_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )
    const recommended = RECOMMENDED_EXCHANGE_RATE_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )
    const optional = OPTIONAL_EXCHANGE_RATE_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )

    return {
      reportType: EXCHANGE_RATE_REPORT_TYPE,
      valid: validation.valid,
      confidence: Math.round(
        (required.length / REQUIRED_EXCHANGE_RATE_FIELDS.length) * 75 +
        (recommended.length / RECOMMENDED_EXCHANGE_RATE_FIELDS.length) * 20 +
        (optional.length / OPTIONAL_EXCHANGE_RATE_FIELDS.length) * 5,
      ),
      matchedRequiredFields: required,
      missingRequiredFields: validation.missingRequiredFields,
      matchedRecommendedFields: recommended,
      matchedOptionalFields: optional,
    }
  },

  extractHeaders,
  validate: validateExchangeRateHeaders,
  normalize: normalizeExchangeRateRows,
  buildBusinessModel: buildExchangeRateBusinessModel,
  process: (businessModel) => businessModel.summary,
  createEmptySummary,
}
