import type { ImportStatus } from './importTypes'
import type { ReportType } from './reportTypes'

export interface ImportError {
  row?: number
  column?: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ImportError[]
  warnings: string[]
}

export interface ImportResult<T = unknown> {
  reportType: ReportType
  status: ImportStatus
  summary?: T
  validation: ValidationResult
}

export interface FileMetadata {
  fileName: string
  fileSize: number
  extension: string
  sheetName?: string
  totalRows?: number
  totalColumns?: number
}