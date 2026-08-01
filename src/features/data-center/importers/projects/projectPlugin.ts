import type { ImportPlugin } from '../../engine/importPlugin'
import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import type { ReportDetectionResult } from '../../types/reportDetectionTypes'
import {
  OPTIONAL_PROJECT_FIELDS,
  RECOMMENDED_PROJECT_FIELDS,
  REQUIRED_PROJECT_FIELDS,
} from './projectSchema'
import {
  validateProjectHeaders,
  type ProjectValidationResult,
} from './projectValidator'
import { normalizeProjectRows } from './projectNormalizer'
import {
  buildProjectBusinessModel,
  type ProjectBusinessModel,
} from './projectBusinessModel'
import type {
  NormalizedProjectRow,
  ProjectDatasetSummary,
} from './projectTypes'

const PROJECT_REPORT_TYPE = 'projects' as const

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
): ProjectDatasetSummary {
  return {
    periodStart: null,
    periodEnd: null,
    totalProjects: 0,
    activeProjects: 0,
    matureProjects: 0,
    potentialProjects: 0,
    earlyProjects: 0,
    realizedProjects: 0,
    cancelledProjects: 0,
    duplicateProjects: 0,
    projectsMissingBillingDate: 0,
    projectsMissingAmountToClose: 0,
    projectsMissingCurrency: 0,
    matureAmountToCloseUsd: 0,
    potentialAmountToCloseUsd: 0,
    currencies: [],
    processedRows: 0,
    ignoredRows,
  }
}

export const projectImportPlugin: ImportPlugin<
  SpreadsheetRow,
  NormalizedProjectRow,
  ProjectBusinessModel,
  ProjectDatasetSummary,
  ProjectValidationResult
> = {
  reportType: PROJECT_REPORT_TYPE,

  detect(headers): ReportDetectionResult {
    const validation = validateProjectHeaders(headers)
    const required = REQUIRED_PROJECT_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )
    const recommended = RECOMMENDED_PROJECT_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )
    const optional = OPTIONAL_PROJECT_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )

    return {
      reportType: PROJECT_REPORT_TYPE,
      valid: validation.valid,
      confidence: Math.round(
        (required.length / REQUIRED_PROJECT_FIELDS.length) * 65 +
        (recommended.length / RECOMMENDED_PROJECT_FIELDS.length) * 30 +
        (optional.length / OPTIONAL_PROJECT_FIELDS.length) * 5,
      ),
      matchedRequiredFields: required,
      missingRequiredFields: validation.missingRequiredFields,
      matchedRecommendedFields: recommended,
      matchedOptionalFields: optional,
    }
  },

  extractHeaders,
  validate: validateProjectHeaders,
  normalize: normalizeProjectRows,
  buildBusinessModel: buildProjectBusinessModel,
  process: (businessModel) => businessModel.summary,
  createEmptySummary,
}
