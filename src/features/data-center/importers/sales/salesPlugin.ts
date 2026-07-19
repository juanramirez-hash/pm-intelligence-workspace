import type { ImportPlugin } from '../../engine/importPlugin'
import type { ReportDetectionResult } from '../../types/reportDetectionTypes'
import type {
  ReportType,
  SalesDatasetSummary,
} from '../../types/reportTypes'

import {
  buildSalesBusinessModel,
  type SalesBusinessModel,
} from './salesBusinessModel'
import {
  normalizeSalesRows,
  type RawSalesRow,
} from './salesNormalizer'
import { processSalesBusinessModel } from './salesProcessor'
import {
  OPTIONAL_SALES_FIELDS,
  RECOMMENDED_SALES_FIELDS,
  REQUIRED_SALES_FIELDS,
} from './salesSchema'
import type { NormalizedSalesRow } from './salesTypes'
import {
  validateSalesColumns,
  type SalesColumnMap,
  type SalesValidationResult,
} from './salesValidator'
import type { SalesField } from './salesColumnAliases'

const SALES_REPORT_TYPE = 'sales' as ReportType

const REQUIRED_FIELDS_WEIGHT = 60
const RECOMMENDED_FIELDS_WEIGHT = 30
const OPTIONAL_FIELDS_WEIGHT = 10

function extractSalesHeaders(
  rows: RawSalesRow[],
): string[] {
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

function getMatchedFields(
  fields: readonly SalesField[],
  columnMap: SalesColumnMap,
): SalesField[] {
  return fields.filter((field) => Boolean(columnMap[field]))
}

function calculateGroupScore(
  matchedFields: number,
  totalFields: number,
  weight: number,
): number {
  if (totalFields === 0) {
    return 0
  }

  return (matchedFields / totalFields) * weight
}

function detectSalesReport(
  headers: string[],
): ReportDetectionResult {
  const validation = validateSalesColumns(headers)

  const matchedRequiredFields = getMatchedFields(
    REQUIRED_SALES_FIELDS,
    validation.columnMap,
  )

  const matchedRecommendedFields = getMatchedFields(
    RECOMMENDED_SALES_FIELDS,
    validation.columnMap,
  )

  const matchedOptionalFields = getMatchedFields(
    OPTIONAL_SALES_FIELDS,
    validation.columnMap,
  )

  const requiredScore = calculateGroupScore(
    matchedRequiredFields.length,
    REQUIRED_SALES_FIELDS.length,
    REQUIRED_FIELDS_WEIGHT,
  )

  const recommendedScore = calculateGroupScore(
    matchedRecommendedFields.length,
    RECOMMENDED_SALES_FIELDS.length,
    RECOMMENDED_FIELDS_WEIGHT,
  )

  const optionalScore = calculateGroupScore(
    matchedOptionalFields.length,
    OPTIONAL_SALES_FIELDS.length,
    OPTIONAL_FIELDS_WEIGHT,
  )

  const confidence = Math.round(
    requiredScore +
      recommendedScore +
      optionalScore,
  )

  return {
    reportType: SALES_REPORT_TYPE,

    valid: validation.valid,

    confidence,

    matchedRequiredFields,

    missingRequiredFields:
      validation.missingRequiredFields,

    matchedRecommendedFields,

    matchedOptionalFields,
  }
}

function createEmptySalesSummary(
  ignoredRows: number,
): SalesDatasetSummary {
  return {
    periodStart: null,
    periodEnd: null,

    totalSales: 0,
    totalGrossProfit: 0,
    grossMargin: 0,
    totalQuantity: 0,

    uniqueCustomers: 0,
    uniqueProducts: 0,
    uniqueDocuments: 0,

    activeBrands: 0,
    activeLocations: 0,

    salesByBrand: [],
    salesByMonth: [],
    salesByLocation: [],

    processedRows: 0,
    ignoredRows,
  }
}

export const salesImportPlugin: ImportPlugin<
  RawSalesRow,
  NormalizedSalesRow,
  SalesBusinessModel,
  SalesDatasetSummary,
  SalesValidationResult
> = {
  reportType: SALES_REPORT_TYPE,

  detect: detectSalesReport,

  extractHeaders: extractSalesHeaders,

  validate: validateSalesColumns,

  normalize(rows, validation) {
    return normalizeSalesRows(
      rows,
      validation.columnMap,
    )
  },

  buildBusinessModel: buildSalesBusinessModel,

  process: processSalesBusinessModel,

  createEmptySummary: createEmptySalesSummary,
}