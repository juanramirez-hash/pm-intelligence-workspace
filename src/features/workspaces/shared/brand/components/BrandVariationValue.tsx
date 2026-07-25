import {
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react'

import {
  formatBrandPercentage,
} from '../utils/brandFormatters'

interface BrandVariationValueProps {
  value: number | null
}

export function BrandVariationValue({
  value,
}: BrandVariationValueProps) {
  if (value === null) {
    return (
      <span className="text-xs font-medium text-slate-400">
        Sin comparación
      </span>
    )
  }

  const isPositive =
    value >= 0

  return (
    <span
      className={[
        'inline-flex items-center gap-1 text-xs font-semibold',

        isPositive
          ? 'text-emerald-700'
          : 'text-rose-700',
      ].join(' ')}
    >
      {isPositive ? (
        <ArrowUpRight size={13} />
      ) : (
        <ArrowDownRight size={13} />
      )}

      {formatBrandPercentage(
        value,
      )}
    </span>
  )
}