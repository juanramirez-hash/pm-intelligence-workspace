import type { ValidationResult } from '../types/commonTypes'
import type { ReportDetectionResult } from '../types/reportDetectionTypes'
import type { ReportType } from '../types/reportTypes'

export interface NormalizationResult<TNormalizedRow> {
  rows: TNormalizedRow[]

  ignoredRows: number
}

export interface DetectableImportPlugin {
  reportType: ReportType

  detect(headers: string[]): ReportDetectionResult
}

export interface ImportPlugin<
  TRawRow,
  TNormalizedRow,
  TBusinessModel,
  TSummary,
  TValidation extends ValidationResult = ValidationResult,
> extends DetectableImportPlugin {
  extractHeaders(rows: TRawRow[]): string[]

  validate(headers: string[]): TValidation

  normalize(
    rows: TRawRow[],
    validation: TValidation,
  ): NormalizationResult<TNormalizedRow>

  buildBusinessModel(
    rows: TNormalizedRow[],
    ignoredRows: number,
  ): TBusinessModel

  process(
    businessModel: TBusinessModel,
  ): TSummary

  createEmptySummary(
    ignoredRows: number,
  ): TSummary
}