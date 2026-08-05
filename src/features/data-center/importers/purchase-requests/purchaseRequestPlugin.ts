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
  OPTIONAL_PURCHASE_REQUEST_FIELDS,
  RECOMMENDED_PURCHASE_REQUEST_FIELDS,
  REQUIRED_PURCHASE_REQUEST_FIELDS,
} from './purchaseRequestSchema'
import {
  validatePurchaseRequestHeaders,
  type PurchaseRequestValidationResult,
} from './purchaseRequestValidator'
import {
  normalizePurchaseRequestRows,
} from './purchaseRequestNormalizer'
import {
  buildPurchaseRequestBusinessModel,
  type PurchaseRequestBusinessModel,
} from './purchaseRequestBusinessModel'
import type {
  NormalizedPurchaseRequestRow,
  PurchaseRequestDatasetSummary,
} from './purchaseRequestTypes'

const PURCHASE_REQUEST_REPORT_TYPE =
  'purchase-requests' as const

function extractHeaders(
  rows: SpreadsheetRow[],
): string[] {
  const headers = new Set<string>()

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      const header = key.trim()

      if (header) {
        headers.add(header)
      }
    }
  }

  return [...headers]
}

function createEmptySummary(
  ignoredRows: number,
): PurchaseRequestDatasetSummary {
  return {
    periodStart: null,
    periodEnd: null,

    totalRequests: 0,
    requestsWithPurchaseOrder: 0,
    requestsWithoutPurchaseOrder: 0,

    requestsMissingQuantity: 0,
    requestsMissingItemCode: 0,
    requestsWithProject: 0,
    requestsWithAssignedBuyer: 0,

    duplicateSourceRows: 0,
    statuses: [],

    processedRows: 0,
    ignoredRows,
  }
}

export const purchaseRequestImportPlugin:
  ImportPlugin<
    SpreadsheetRow,
    NormalizedPurchaseRequestRow,
    PurchaseRequestBusinessModel,
    PurchaseRequestDatasetSummary,
    PurchaseRequestValidationResult
  > = {
  reportType:
    PURCHASE_REQUEST_REPORT_TYPE,

  detect(
    headers,
  ): ReportDetectionResult {
    const validation =
      validatePurchaseRequestHeaders(
        headers,
      )

    const required =
      REQUIRED_PURCHASE_REQUEST_FIELDS.filter(
        (field) =>
          Boolean(
            validation.columnMap[field],
          ),
      )

    const recommended =
      RECOMMENDED_PURCHASE_REQUEST_FIELDS.filter(
        (field) =>
          Boolean(
            validation.columnMap[field],
          ),
      )

    const optional =
      OPTIONAL_PURCHASE_REQUEST_FIELDS.filter(
        (field) =>
          Boolean(
            validation.columnMap[field],
          ),
      )

    return {
      reportType:
        PURCHASE_REQUEST_REPORT_TYPE,
      valid:
        validation.valid,
      confidence:
        Math.round(
          (
            required.length /
            REQUIRED_PURCHASE_REQUEST_FIELDS.length
          ) *
            70 +
          (
            recommended.length /
            RECOMMENDED_PURCHASE_REQUEST_FIELDS.length
          ) *
            25 +
          (
            optional.length /
            OPTIONAL_PURCHASE_REQUEST_FIELDS.length
          ) *
            5,
        ),
      matchedRequiredFields:
        required,
      missingRequiredFields:
        validation.missingRequiredFields,
      matchedRecommendedFields:
        recommended,
      matchedOptionalFields:
        optional,
    }
  },

  extractHeaders,
  validate:
    validatePurchaseRequestHeaders,
  normalize:
    normalizePurchaseRequestRows,
  buildBusinessModel:
    buildPurchaseRequestBusinessModel,
  process:
    (businessModel) =>
      businessModel.summary,
  createEmptySummary,
}