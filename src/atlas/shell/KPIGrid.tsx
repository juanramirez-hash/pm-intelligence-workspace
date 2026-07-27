import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from 'react'

import {
  SemanticSpacing,
} from '../../tokens'

export type KPIGridColumns =
  | 2
  | 3
  | 4
  | 6
  | 'auto'

export type KPIGridGap =
  | 'compact'
  | 'default'
  | 'spacious'

export type KPIGridAlign =
  | 'stretch'
  | 'start'

export type KPIGridProps = {
  children: ReactNode
  columns?: KPIGridColumns
  gap?: KPIGridGap
  align?: KPIGridAlign
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

const columnClasses: Record<KPIGridColumns, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  6: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6',
  auto: 'grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]',
}

const gapValues: Record<KPIGridGap, CSSProperties['gap']> = {
  compact: SemanticSpacing.control.groupGap,
  default: SemanticSpacing.card.contentGap,
  spacious: SemanticSpacing.section.contentGap,
}

const alignClasses: Record<KPIGridAlign, string> = {
  stretch: 'items-stretch [&>*]:h-full',
  start: 'items-start',
}

export function KPIGrid({
  children,
  columns = 4,
  gap = 'default',
  align = 'stretch',
  className = '',
  style,
  ...props
}: KPIGridProps) {
  const gridStyle: CSSProperties = {
    gap: gapValues[gap],
    ...style,
  }

  return (
    <div
      data-atlas-component="kpi-grid"
      data-columns={columns}
      data-gap={gap}
      data-align={align}
      className={[
        'grid w-full',
        columnClasses[columns],
        alignClasses[align],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={gridStyle}
      {...props}
    >
      {children}
    </div>
  )
}
