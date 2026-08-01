import type { ImportPlugin } from '../../engine/importPlugin'
import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import type { ReportDetectionResult } from '../../types/reportDetectionTypes'
import {
  OPTIONAL_PROJECT_BILLING_FIELDS,
  RECOMMENDED_PROJECT_BILLING_FIELDS,
  REQUIRED_PROJECT_BILLING_FIELDS,
} from './projectBillingSchema'
import {
  validateProjectBillingHeaders,
  type ProjectBillingValidationResult,
} from './projectBillingValidator'
import { normalizeProjectBillingRows } from './projectBillingNormalizer'
import {
  buildProjectBillingBusinessModel,
  type ProjectBillingBusinessModel,
} from './projectBillingBusinessModel'
import type {
  NormalizedProjectBillingRow,
  ProjectBillingDatasetSummary,
} from './projectBillingTypes'

const PROJECT_BILLING_REPORT_TYPE = 'project-billing' as const

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
): ProjectBillingDatasetSummary {
  return {
    periodStart: null,
    periodEnd: null,
    totalLines: 0,
    uniqueDocuments: 0,
    uniqueProjects: 0,
    invoiceDocuments: 0,
    creditNoteDocuments: 0,
    otherDocuments: 0,
    voidedDocuments: 0,
    duplicateSourceLines: 0,
    documentsMissingCurrency: 0,
    documentsMissingProject: 0,
    sourceAmountMxn: 0,
    sourceAmountUsd: 0,
    currencies: [],
    processedRows: 0,
    ignoredRows,
  }
}

export const projectBillingImportPlugin: ImportPlugin<
  SpreadsheetRow,
  NormalizedProjectBillingRow,
  ProjectBillingBusinessModel,
  ProjectBillingDatasetSummary,
  ProjectBillingValidationResult
> = {
  reportType: PROJECT_BILLING_REPORT_TYPE,

  detect(headers): ReportDetectionResult {
    const validation = validateProjectBillingHeaders(headers)
    const required = REQUIRED_PROJECT_BILLING_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )
    const recommended = RECOMMENDED_PROJECT_BILLING_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )
    const optional = OPTIONAL_PROJECT_BILLING_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )

    return {
      reportType: PROJECT_BILLING_REPORT_TYPE,
      valid: validation.valid,
      confidence: Math.round(
        (required.length / REQUIRED_PROJECT_BILLING_FIELDS.length) * 70 +
        (recommended.length / RECOMMENDED_PROJECT_BILLING_FIELDS.length) * 25 +
        (optional.length / OPTIONAL_PROJECT_BILLING_FIELDS.length) * 5,
      ),
      matchedRequiredFields: required,
      missingRequiredFields: validation.missingRequiredFields,
      matchedRecommendedFields: recommended,
      matchedOptionalFields: optional,
    }
  },

  extractHeaders,
  validate: validateProjectBillingHeaders,
  normalize: normalizeProjectBillingRows,
  buildBusinessModel: buildProjectBillingBusinessModel,
  process: (businessModel) => businessModel.summary,
  createEmptySummary,
}
