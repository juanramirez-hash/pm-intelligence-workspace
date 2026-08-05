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
  OPTIONAL_PURCHASE_ORDER_FIELDS,
  RECOMMENDED_PURCHASE_ORDER_FIELDS,
  REQUIRED_PURCHASE_ORDER_FIELDS,
} from './purchaseOrderSchema'
import {
  validatePurchaseOrderHeaders,
  type PurchaseOrderValidationResult,
} from './purchaseOrderValidator'
import {
  normalizePurchaseOrderRows,
} from './purchaseOrderNormalizer'
import {
  buildPurchaseOrderBusinessModel,
  type PurchaseOrderBusinessModel,
} from './purchaseOrderBusinessModel'
import type {
  NormalizedPurchaseOrderRow,
  PurchaseOrderDatasetSummary,
} from './purchaseOrderTypes'

const PURCHASE_ORDER_REPORT_TYPE =
  'purchases' as const

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
): PurchaseOrderDatasetSummary {
  return {
    periodStart: null,
    periodEnd: null,

    totalOrders: 0,
    totalLines: 0,

    productLines: 0,
    taxLines: 0,
    discountLines: 0,
    adjustmentLines: 0,

    duplicateSourceLines: 0,
    ordersMissingSupplier: 0,
    ordersMissingCurrency: 0,
    ordersWithHeaderConflicts: 0,
    linesMissingAmount: 0,

    statuses: [],
    amountsByCurrency: [],

    processedRows: 0,
    ignoredRows,
  }
}

export const purchaseOrderImportPlugin:
  ImportPlugin<
    SpreadsheetRow,
    NormalizedPurchaseOrderRow,
    PurchaseOrderBusinessModel,
    PurchaseOrderDatasetSummary,
    PurchaseOrderValidationResult
  > = {
  reportType:
    PURCHASE_ORDER_REPORT_TYPE,

  detect(
    headers,
  ): ReportDetectionResult {
    const validation =
      validatePurchaseOrderHeaders(
        headers,
      )

    const required =
      REQUIRED_PURCHASE_ORDER_FIELDS.filter(
        (field) =>
          Boolean(
            validation.columnMap[field],
          ),
      )

    const recommended =
      RECOMMENDED_PURCHASE_ORDER_FIELDS.filter(
        (field) =>
          Boolean(
            validation.columnMap[field],
          ),
      )

    const optional =
      OPTIONAL_PURCHASE_ORDER_FIELDS.filter(
        (field) =>
          Boolean(
            validation.columnMap[field],
          ),
      )

    return {
      reportType:
        PURCHASE_ORDER_REPORT_TYPE,
      valid:
        validation.valid,
      confidence:
        Math.round(
          (
            required.length /
            REQUIRED_PURCHASE_ORDER_FIELDS.length
          ) *
            70 +
          (
            recommended.length /
            RECOMMENDED_PURCHASE_ORDER_FIELDS.length
          ) *
            25 +
          (
            optional.length /
            OPTIONAL_PURCHASE_ORDER_FIELDS.length
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
    validatePurchaseOrderHeaders,
  normalize:
    normalizePurchaseOrderRows,
  buildBusinessModel:
    buildPurchaseOrderBusinessModel,
  process:
    (businessModel) =>
      businessModel.summary,
  createEmptySummary,
}