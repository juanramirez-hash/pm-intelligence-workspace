import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from 'react'

import {
  SemanticColors,
  SemanticRadius,
  SemanticSpacing,
  SemanticTypography,
} from '../../tokens'

export type KPIContainerPadding =
  | 'none'
  | 'compact'
  | 'default'
  | 'spacious'

export type KPIContainerWidth =
  | 'full'
  | 'standard'
  | 'wide'

export type KPIContainerVariant =
  | 'plain'
  | 'surface'
  | 'subtle'

export type KPIContainerProps = {
  children: ReactNode
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  padding?: KPIContainerPadding
  width?: KPIContainerWidth
  variant?: KPIContainerVariant
  className?: string
  contentClassName?: string
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'>

const widthClasses: Record<KPIContainerWidth, string> = {
  full: 'max-w-none',
  standard: 'max-w-7xl',
  wide: 'max-w-[1600px]',
}

const paddingValues: Record<KPIContainerPadding, CSSProperties['padding']> = {
  none: '0',
  compact: SemanticSpacing.card.compact,
  default: SemanticSpacing.card.default,
  spacious: SemanticSpacing.card.spacious,
}

function getVariantStyle(
  variant: KPIContainerVariant,
): CSSProperties {
  if (variant === 'surface') {
    return {
      backgroundColor: SemanticColors.surface.default,
      borderColor: SemanticColors.border.subtle,
    }
  }

  if (variant === 'subtle') {
    return {
      backgroundColor: SemanticColors.surface.subtle,
      borderColor: SemanticColors.border.subtle,
    }
  }

  return {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  }
}

export function KPIContainer({
  children,
  title,
  description,
  actions,
  padding = 'none',
  width = 'full',
  variant = 'plain',
  className = '',
  contentClassName = '',
  style,
  ...props
}: KPIContainerProps) {
  const hasHeader = Boolean(title || description || actions)

  const containerStyle: CSSProperties = {
    ...getVariantStyle(variant),
    borderRadius: SemanticRadius.panel,
    padding: paddingValues[padding],
    ...style,
  }

  return (
    <section
      data-atlas-component="kpi-container"
      data-padding={padding}
      data-width={width}
      data-variant={variant}
      className={[
        'mx-auto w-full',
        variant === 'plain' ? '' : 'border',
        widthClasses[width],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={containerStyle}
      {...props}
    >
      {hasHeader && (
        <div
          className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
          style={{ marginBottom: SemanticSpacing.section.contentGap }}
        >
          <div className="min-w-0">
            {title && (
              <h2
                className={SemanticTypography.executive.sectionTitle}
                style={{ color: SemanticColors.text.primary }}
              >
                {title}
              </h2>
            )}

            {description && (
              <div
                className="mt-1 max-w-4xl"
                style={{ color: SemanticColors.text.secondary }}
              >
                {description}
              </div>
            )}
          </div>

          {actions && (
            <div className="shrink-0">{actions}</div>
          )}
        </div>
      )}

      <div className={contentClassName}>{children}</div>
    </section>
  )
}
