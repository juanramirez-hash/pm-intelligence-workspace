import type {
  CSSProperties,
  ReactNode,
} from 'react'

import {
  SemanticColors,
  SemanticSpacing,
  SemanticTypography,
} from '../../tokens'

export type PageHeaderSize = 'compact' | 'default'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  metadata?: ReactNode
  size?: PageHeaderSize
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  metadata,
  size = 'default',
  className = '',
}: PageHeaderProps) {
  const titleClass =
    size === 'compact'
      ? SemanticTypography.executive.sectionTitle
      : SemanticTypography.executive.title

  const headerStyle: CSSProperties = {
    gap: SemanticSpacing.section.contentGap,
  }

  return (
    <header
      data-atlas-component="page-header"
      data-size={size}
      className={[
        'flex flex-col justify-between xl:flex-row xl:items-end',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={headerStyle}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p
            className="text-sm font-semibold"
            style={{ color: SemanticColors.accent.primary }}
          >
            {eyebrow}
          </p>
        )}

        <h2
          className={[
            size === 'default' ? 'mt-1' : '',
            titleClass,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ color: SemanticColors.text.primary }}
        >
          {title}
        </h2>

        {description && (
          <p
            className="mt-3 max-w-3xl text-base leading-7"
            style={{ color: SemanticColors.text.secondary }}
          >
            {description}
          </p>
        )}

        {metadata && (
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            style={{ color: SemanticColors.text.muted }}
          >
            {metadata}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  )
}
