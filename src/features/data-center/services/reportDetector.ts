import { importPluginRegistry } from '../engine/importPluginRegistry'
import type {
  ReportDetectionResult,
  ReportDetectionSummary,
} from '../types/reportDetectionTypes'

const MINIMUM_DETECTION_CONFIDENCE = 60

function compareCandidates(
  firstCandidate: ReportDetectionResult,
  secondCandidate: ReportDetectionResult,
): number {
  if (
    firstCandidate.valid !==
    secondCandidate.valid
  ) {
    return firstCandidate.valid ? -1 : 1
  }

  return (
    secondCandidate.confidence -
    firstCandidate.confidence
  )
}

export function detectReportType(
  headers: string[],
): ReportDetectionSummary {
  const cleanHeaders = headers
    .map((header) => String(header).trim())
    .filter(Boolean)

  if (cleanHeaders.length === 0) {
    return {
      detectedReportType: null,
      confidence: 0,
      candidates: [],
    }
  }

  const candidates = importPluginRegistry
    .map((plugin) => plugin.detect(cleanHeaders))
    .sort(compareCandidates)

  const bestCandidate = candidates.find(
    (candidate) =>
      candidate.valid &&
      candidate.confidence >=
        MINIMUM_DETECTION_CONFIDENCE,
  )

  return {
    detectedReportType:
      bestCandidate?.reportType ?? null,

    confidence:
      bestCandidate?.confidence ?? 0,

    candidates,
  }
}