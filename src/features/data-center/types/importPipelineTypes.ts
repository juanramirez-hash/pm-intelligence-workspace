import type { ValidationResult } from './commonTypes'
import type { ReportType } from './reportTypes'

export interface ImportPipelineResult<TSummary> {
  reportType: ReportType

  valid: boolean

  validation: ValidationResult

  processedRows: number

  ignoredRows: number

  summary: TSummary
}

export interface ImportEngineResult<
  TSummary,
  TNormalizedRow,
  TBusinessModel,
> extends ImportPipelineResult<TSummary> {
  normalizedRows: TNormalizedRow[]

  businessModel: TBusinessModel | null
}

export interface ImportPipeline<
  TRawRow,
  TNormalizedRow,
  TSummary,
> {
  validate(headers: string[]): ValidationResult

  normalize(
    rows: TRawRow[],
  ): TNormalizedRow[]

  process(
    rows: TNormalizedRow[],
  ): TSummary
}