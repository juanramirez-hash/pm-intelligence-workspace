import type {
  ImportPlugin,
} from '../../engine/importPlugin'

import type {
  SpreadsheetRow,
} from '../../parsers/spreadsheetParser'

import type {
  ReportDetectionResult,
} from '../../types/reportDetectionTypes'

import {
  buildPricingBusinessModel,
  type PricingBusinessModel,
} from './pricingBusinessModel'

import {
  normalizePricingRows,
} from './pricingNormalizer'

import {
  OPTIONAL_PRICING_FIELDS,
  RECOMMENDED_PRICING_FIELDS,
  REQUIRED_PRICING_FIELDS,
} from './pricingSchema'

import type {
  NormalizedPricingRow,
  PricingDatasetSummary,
} from './pricingTypes'

import {
  validatePricingHeaders,
  type PricingValidationResult,
} from './pricingValidator'

const PRICING_REPORT_TYPE = 'pricing' as const

function extractHeaders(rows: SpreadsheetRow[]): string[] {
  const headers = new Set<string>()

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim()

      if (cleanKey) {
        headers.add(cleanKey)
      }
    }
  }

  return [...headers]
}

function calculateConfidence(
  validation: PricingValidationResult,
): number {
  const required = REQUIRED_PRICING_FIELDS.filter(
    (field) => Boolean(validation.columnMap[field]),
  ).length

  const channelScore = validation.hasMxnChannel && validation.hasUsdChannel
    ? 30
    : validation.hasCanonicalChannel ||
        validation.hasMxnChannel ||
        validation.hasUsdChannel
      ? 24
      : 0

  const sourceSignature = [
    validation.columnMap.costMxn,
    validation.columnMap.listPriceMxn,
    validation.columnMap.costUsd,
    validation.columnMap.costUsdFallback,
    validation.columnMap.listPriceUsd,
    validation.columnMap.quantityPricingSchedule,
  ].filter(Boolean).length

  return Math.min(
    100,
    Math.round(
      (required / REQUIRED_PRICING_FIELDS.length) * 60 +
      channelScore +
      Math.min(10, sourceSignature * 2),
    ),
  )
}

function createEmptySummary(
  ignoredRows: number,
): PricingDatasetSummary {
  return {
    sourceRows: ignoredRows,
    generatedPriceFacts: 0,
    uniqueProducts: 0,
    uniqueBrands: 0,
    uniqueCurrencies: 0,
    mxnPrices: 0,
    usdPrices: 0,
    otherCurrencyPrices: 0,
    dualCurrencySourceRows: 0,
    singleCurrencySourceRows: 0,
    skippedUsdCrossCurrencyRows: 0,
    pricesWithNegativeMargin: 0,
    pricesAboveList: 0,
    pricesWithoutEffectiveDate: 0,
    duplicatePriceRecords: 0,
    productMasterAvailable: false,
    reconciledPriceFacts: 0,
    pricesWithoutProduct: 0,
    priceBrandMismatches: 0,
    productCoverageRate: null,
    blockingIssues: 0,
    warningIssues: 0,
    periodStart: null,
    periodEnd: null,
    processedRows: 0,
    ignoredRows,
  }
}

export const pricingImportPlugin: ImportPlugin<
  SpreadsheetRow,
  NormalizedPricingRow,
  PricingBusinessModel,
  PricingDatasetSummary,
  PricingValidationResult
> = {
  reportType: PRICING_REPORT_TYPE,

  detect(headers): ReportDetectionResult {
    const validation = validatePricingHeaders(headers)

    const matchedRecommendedFields = RECOMMENDED_PRICING_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )

    return {
      reportType: PRICING_REPORT_TYPE,
      valid: validation.valid,
      confidence: calculateConfidence(validation),
      matchedRequiredFields: REQUIRED_PRICING_FIELDS.filter(
        (field) => Boolean(validation.columnMap[field]),
      ),
      missingRequiredFields: [
        ...validation.missingRequiredFields,
        ...(
          validation.hasCanonicalChannel ||
          validation.hasMxnChannel ||
          validation.hasUsdChannel
            ? []
            : ['pricingChannel']
        ),
      ],
      matchedRecommendedFields,
      matchedOptionalFields: OPTIONAL_PRICING_FIELDS.filter(
        (field) => Boolean(validation.columnMap[field]),
      ),
    }
  },

  extractHeaders,
  validate: validatePricingHeaders,
  normalize: normalizePricingRows,
  buildBusinessModel: buildPricingBusinessModel,
  process: (businessModel) => businessModel.summary,
  createEmptySummary,
}
