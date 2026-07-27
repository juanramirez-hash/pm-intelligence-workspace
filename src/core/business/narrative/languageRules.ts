import {
  formatBusinessNumber,
  formatBusinessPercent,
} from '../formatting'

export function formatNarrativePercent(
  value: number | null,
): string {
  return formatBusinessPercent(value)
}

export function formatNarrativeNumber(
  value: number | null,
): string {
  return formatBusinessNumber(value)
}

export function joinNarrativeSentences(
  sentences: readonly string[],
): string {
  return sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
    .join(' ')
}
