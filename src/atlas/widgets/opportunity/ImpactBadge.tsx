interface ImpactBadgeProps {
  impact: number
  locale?: string
  currency?: string
}

export function ImpactBadge({
  impact,
  locale = 'es-MX',
  currency = 'MXN',
}: ImpactBadgeProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: Math.abs(impact) >= 1_000_000 ? 'compact' : 'standard',
  }).format(impact)

  return (
    <span
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm"
      data-atlas-component="opportunity-impact-badge"
    >
      Impacto {formatted}
    </span>
  )
}
