import type { HTMLAttributes } from 'react'

export interface KpiSparklineProps extends Omit<HTMLAttributes<SVGSVGElement>, 'values'> {
  values: readonly number[]
  label?: string
}

function buildPoints(values: readonly number[]) {
  if (values.length === 0) return ''

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 100
  const height = 28

  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 4) - 2
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

export function KpiSparkline({ values, label = 'Tendencia del indicador', className = '', ...props }: KpiSparklineProps) {
  const points = buildPoints(values)

  if (!points) return null

  return (
    <svg
      aria-label={label}
      data-atlas-component="kpi-sparkline"
      role="img"
      viewBox="0 0 100 28"
      className={['h-8 w-full overflow-visible text-current', className].filter(Boolean).join(' ')}
      preserveAspectRatio="none"
      {...props}
    >
      <polyline
        fill="none"
        points={points}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
