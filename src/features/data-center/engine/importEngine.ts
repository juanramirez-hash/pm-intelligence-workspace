import type { ValidationResult } from '../types/commonTypes'
import type { ImportEngineResult } from '../types/importPipelineTypes'
import type { ImportPlugin } from './importPlugin'

export function runImportEngine<
  TRawRow,
  TNormalizedRow,
  TBusinessModel,
  TSummary,
  TValidation extends ValidationResult,
>(
  plugin: ImportPlugin<
    TRawRow,
    TNormalizedRow,
    TBusinessModel,
    TSummary,
    TValidation
  >,
  rawRows: TRawRow[],
  extractedHeaders?: string[],
): ImportEngineResult<
  TSummary,
  TNormalizedRow,
  TBusinessModel
> {
  const headers =
    extractedHeaders ??
    plugin.extractHeaders(rawRows)

  const validation = plugin.validate(headers)

  if (!validation.valid) {
    return {
      reportType: plugin.reportType,
      valid: false,
      validation,
      processedRows: 0,
      ignoredRows: rawRows.length,
      normalizedRows: [],
      businessModel: null,
      summary: plugin.createEmptySummary(
        rawRows.length,
      ),
    }
  }

  const normalizationResult = plugin.normalize(
    rawRows,
    validation,
  )

  const businessModel =
    plugin.buildBusinessModel(
      normalizationResult.rows,
      normalizationResult.ignoredRows,
    )

  const summary = plugin.process(
    businessModel,
  )

  return {
    reportType: plugin.reportType,
    valid: true,
    validation,
    processedRows:
      normalizationResult.rows.length,
    ignoredRows:
      normalizationResult.ignoredRows,
    normalizedRows:
      normalizationResult.rows,
    businessModel,
    summary,
  }
}