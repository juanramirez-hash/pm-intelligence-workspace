interface OpportunityConfidenceProps {
  confidence: number
}

export function OpportunityConfidence({
  confidence,
}: OpportunityConfidenceProps) {
  const normalized = Math.min(100, Math.max(0, confidence))

  return (
    <span
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm"
      data-atlas-component="opportunity-confidence"
    >
      Confianza {normalized}%
    </span>
  )
}
