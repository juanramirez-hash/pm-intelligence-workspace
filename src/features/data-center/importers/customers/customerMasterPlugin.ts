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
  buildCustomerMasterBusinessModel,
  type CustomerMasterBusinessModel,
} from './customerMasterBusinessModel'

import {
  normalizeCustomerMasterRows,
} from './customerMasterNormalizer'

import {
  OPTIONAL_CUSTOMER_MASTER_FIELDS,
  RECOMMENDED_CUSTOMER_MASTER_FIELDS,
  REQUIRED_CUSTOMER_MASTER_FIELDS,
} from './customerMasterSchema'

import type {
  CustomerMasterDatasetSummary,
  NormalizedCustomerMasterRow,
} from './customerMasterTypes'

import {
  validateCustomerMasterHeaders,
  type CustomerMasterValidationResult,
} from './customerMasterValidator'

const CUSTOMER_MASTER_REPORT_TYPE =
  'customers' as const

function extractHeaders(
  rows: SpreadsheetRow[],
): string[] {
  const headers =
    new Set<string>()

  for (const row of rows) {
    for (
      const key of
        Object.keys(row)
    ) {
      const cleanKey =
        key.trim()

      if (cleanKey) {
        headers.add(cleanKey)
      }
    }
  }

  return [...headers]
}

function calculateConfidence(
  validation:
    CustomerMasterValidationResult,
): number {
  const required =
    REQUIRED_CUSTOMER_MASTER_FIELDS
      .filter(
        (field) =>
          Boolean(
            validation
              .columnMap[field],
          ),
      )
      .length

  const recommended =
    RECOMMENDED_CUSTOMER_MASTER_FIELDS
      .filter(
        (field) =>
          Boolean(
            validation
              .columnMap[field],
          ),
      )
      .length

  const optional =
    OPTIONAL_CUSTOMER_MASTER_FIELDS
      .filter(
        (field) =>
          Boolean(
            validation
              .columnMap[field],
          ),
      )
      .length

  return Math.round(
    (
      required /
      REQUIRED_CUSTOMER_MASTER_FIELDS.length
    ) * 65 +
    (
      recommended /
      RECOMMENDED_CUSTOMER_MASTER_FIELDS.length
    ) * 25 +
    (
      optional /
      OPTIONAL_CUSTOMER_MASTER_FIELDS.length
    ) * 10,
  )
}

function createEmptySummary(
  ignoredRows: number,
): CustomerMasterDatasetSummary {
  return {
    totalCustomers: 0,
    duplicateCustomers: 0,

    customersWithSalesRep: 0,
    customersWithKam: 0,
    customersWithEmail: 0,
    customersWithPhone: 0,

    inactiveCustomers: 0,

    uniqueCategories: 0,
    uniqueLocations: 0,
    uniqueSalesReps: 0,
    uniquePriceLevels: 0,

    processedRows: 0,
    ignoredRows,
  }
}

export const customerMasterImportPlugin:
  ImportPlugin<
    SpreadsheetRow,
    NormalizedCustomerMasterRow,
    CustomerMasterBusinessModel,
    CustomerMasterDatasetSummary,
    CustomerMasterValidationResult
  > = {
    reportType:
      CUSTOMER_MASTER_REPORT_TYPE,

    detect(
      headers,
    ): ReportDetectionResult {
      const validation =
        validateCustomerMasterHeaders(
          headers,
        )

      return {
        reportType:
          CUSTOMER_MASTER_REPORT_TYPE,

        valid:
          validation.valid,

        confidence:
          calculateConfidence(
            validation,
          ),

        matchedRequiredFields:
          REQUIRED_CUSTOMER_MASTER_FIELDS
            .filter(
              (field) =>
                Boolean(
                  validation
                    .columnMap[field],
                ),
            ),

        missingRequiredFields:
          validation
            .missingRequiredFields,

        matchedRecommendedFields:
          RECOMMENDED_CUSTOMER_MASTER_FIELDS
            .filter(
              (field) =>
                Boolean(
                  validation
                    .columnMap[field],
                ),
            ),

        matchedOptionalFields:
          OPTIONAL_CUSTOMER_MASTER_FIELDS
            .filter(
              (field) =>
                Boolean(
                  validation
                    .columnMap[field],
                ),
            ),
      }
    },

    extractHeaders,

    validate:
      validateCustomerMasterHeaders,

    normalize:
      normalizeCustomerMasterRows,

    buildBusinessModel:
      buildCustomerMasterBusinessModel,

    process:
      (businessModel) =>
        businessModel.summary,

    createEmptySummary,
  }