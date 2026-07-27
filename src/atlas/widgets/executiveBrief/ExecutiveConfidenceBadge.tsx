interface ExecutiveConfidenceBadgeProps {
  confidence: number
  label?: string
}

function normalizeConfidence(
  confidence: number,
): number {
  if (!Number.isFinite(confidence)) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(confidence),
    ),
  )
}

export function ExecutiveConfidenceBadge({
  confidence,
  label = 'Confianza',
}: ExecutiveConfidenceBadgeProps) {
  const normalizedConfidence =
    normalizeConfidence(confidence)

  return (
    <span
      aria-label={`${label}: ${normalizedConfidence}%`}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm"
      data-atlas-component="executive-confidence-badge"
    >
      <span>{label}</span>
      <span className="text-slate-900">
        {normalizedConfidence}%
      </span>
    </span>
  )
}
