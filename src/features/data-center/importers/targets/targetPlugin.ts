import type { ImportPlugin } from '../../engine/importPlugin'
import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import type { ReportDetectionResult } from '../../types/reportDetectionTypes'
import type { ReportType } from '../../types/reportTypes'
import {
  OPTIONAL_TARGET_FIELDS,
  RECOMMENDED_TARGET_FIELDS,
  REQUIRED_TARGET_FIELDS,
} from './targetSchema'
import {
  validateTargetColumns,
  type TargetValidationResult,
} from './targetValidator'
import { normalizeTargetRows } from './targetNormalizer'
import {
  buildTargetBusinessModel,
  type TargetBusinessModel,
} from './targetBusinessModel'
import type {
  NormalizedTargetRow,
  TargetDatasetSummary,
} from './targetTypes'

const TARGET_REPORT_TYPE = 'quota' as ReportType

function extractHeaders(rows: SpreadsheetRow[]): string[] {
  const headers = new Set<string>()

  for (const row of rows) {
    Object.keys(row).forEach((key) => {
      const cleanKey = key.trim()

      if (cleanKey) {
        headers.add(cleanKey)
      }
    })
  }

  return [...headers]
}

export const targetImportPlugin: ImportPlugin<
  SpreadsheetRow,
  NormalizedTargetRow,
  TargetBusinessModel,
  TargetDatasetSummary,
  TargetValidationResult
> = {
  reportType: TARGET_REPORT_TYPE,

  detect(headers): ReportDetectionResult {
    const validation = validateTargetColumns(headers)
    const requiredMatched = REQUIRED_TARGET_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )
    const recommendedMatched = RECOMMENDED_TARGET_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )
    const optionalMatched = OPTIONAL_TARGET_FIELDS.filter(
      (field) => Boolean(validation.columnMap[field]),
    )

    const confidence = Math.round(
      (requiredMatched.length / REQUIRED_TARGET_FIELDS.length) * 65 +
      (recommendedMatched.length / RECOMMENDED_TARGET_FIELDS.length) * 30 +
      (optionalMatched.length / OPTIONAL_TARGET_FIELDS.length) * 5,
    )

    return {
      reportType: TARGET_REPORT_TYPE,
      valid: validation.valid,
      confidence,
      matchedRequiredFields: requiredMatched,
      missingRequiredFields: validation.missingRequiredFields,
      matchedRecommendedFields: recommendedMatched,
      matchedOptionalFields: optionalMatched,
    }
  },

  extractHeaders,
  validate: validateTargetColumns,
  normalize: normalizeTargetRows,
  buildBusinessModel: buildTargetBusinessModel,
  process: (businessModel) => businessModel.summary,
  createEmptySummary: (ignoredRows) => ({
    periodStart: null,
    periodEnd: null,
    totalTargets: 0,
    uniqueBrands: 0,
    totalRevenueTarget: 0,
    totalGrossProfitTarget: 0,
    averageGrossMarginTarget: null,
    periods: 0,
    rowsWithWorkingDays: 0,
    processedRows: 0,
    ignoredRows,
  }),
}
