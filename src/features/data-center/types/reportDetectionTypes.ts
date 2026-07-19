import type { ReportType } from './reportTypes'

export interface ReportDetectionResult {
  reportType: ReportType

  valid: boolean

  confidence: number

  matchedRequiredFields: string[]

  missingRequiredFields: string[]

  matchedRecommendedFields: string[]

  matchedOptionalFields: string[]
}

export interface ReportDetectionSummary {
  detectedReportType: ReportType | null

  confidence: number

  candidates: ReportDetectionResult[]
}