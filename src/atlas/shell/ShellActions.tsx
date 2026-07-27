import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

import {
  SemanticSpacing,
} from '../../tokens'

export type ShellActionsOrientation =
  | 'horizontal'
  | 'vertical'

export type ShellActionsAlign =
  | 'start'
  | 'end'
  | 'between'

export type ShellActionsProps = {
  children: ReactNode
  orientation?: ShellActionsOrientation
  align?: ShellActionsAlign
  wrap?: boolean
  ariaLabel?: string
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

const orientationClasses: Record<ShellActionsOrientation, string> = {
  horizontal: 'flex-row items-center',
  vertical: 'flex-col items-stretch',
}

const alignClasses: Record<ShellActionsAlign, string> = {
  start: 'justify-start',
  end: 'justify-end',
  between: 'justify-between',
}

export function ShellActions({
  children,
  orientation = 'horizontal',
  align = 'end',
  wrap = true,
  ariaLabel = 'Acciones del workspace',
  className = '',
  style,
  ...props
}: ShellActionsProps) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      data-atlas-component="shell-actions"
      data-orientation={orientation}
      data-align={align}
      data-wrap={wrap}
      className={[
        'flex w-full',
        orientationClasses[orientation],
        alignClasses[align],
        wrap ? 'flex-wrap' : 'flex-nowrap',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        gap: SemanticSpacing.control.default,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
