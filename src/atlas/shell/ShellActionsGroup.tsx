import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

import {
  SemanticColors,
  SemanticRadius,
  SemanticSpacing,
} from '../../tokens'

export type ShellActionsGroupVariant =
  | 'plain'
  | 'segmented'

export type ShellActionsGroupProps = {
  children: ReactNode
  label?: string
  variant?: ShellActionsGroupVariant
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

export function ShellActionsGroup({
  children,
  label,
  variant = 'plain',
  className = '',
  style,
  ...props
}: ShellActionsGroupProps) {
  return (
    <div
      role={label ? 'group' : undefined}
      aria-label={label}
      data-atlas-component="shell-actions-group"
      data-variant={variant}
      className={[
        'flex min-w-0 flex-wrap items-center',
        variant === 'segmented' ? 'border p-1' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        gap: SemanticSpacing.control.groupGap,
        borderColor:
          variant === 'segmented'
            ? SemanticColors.border.subtle
            : undefined,
        borderRadius:
          variant === 'segmented'
            ? SemanticRadius.control
            : undefined,
        backgroundColor:
          variant === 'segmented'
            ? SemanticColors.surface.subtle
            : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
