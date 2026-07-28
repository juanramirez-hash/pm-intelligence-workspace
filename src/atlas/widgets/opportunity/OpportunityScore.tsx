interface OpportunityScoreProps {
  score: number
  compact?: boolean
}

export function OpportunityScore({
  score,
  compact = false,
}: OpportunityScoreProps) {
  const normalized = Math.min(100, Math.max(0, score))

  return (
    <div
      aria-label={`Opportunity score ${normalized} de 100`}
      className={compact ? 'min-w-24' : 'min-w-32'}
      data-atlas-component="opportunity-score"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Score
        </span>
        <span className="text-sm font-bold text-slate-900">
          {normalized}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  )
}
