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

export type ExecutiveHeaderTone =
  | 'default'
  | 'intelligence'

export type ExecutiveHeaderSize =
  | 'compact'
  | 'default'

type ExecutiveHeaderProps = {
  title: string
  eyebrow?: string
  subtitle?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  status?: ReactNode
  metadata?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  tone?: ExecutiveHeaderTone
  size?: ExecutiveHeaderSize
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'>

function getToneStyle(
  tone: ExecutiveHeaderTone,
): CSSProperties {
  if (tone === 'intelligence') {
    return {
      backgroundColor: SemanticColors.status.intelligence.surface,
      borderColor: SemanticColors.status.intelligence.border,
    }
  }

  return {
    backgroundColor: SemanticColors.surface.default,
    borderColor: SemanticColors.border.default,
  }
}

export function ExecutiveHeader({
  title,
  eyebrow,
  subtitle,
  description,
  icon,
  status,
  metadata,
  actions,
  children,
  tone = 'default',
  size = 'default',
  className = '',
  style,
  ...props
}: ExecutiveHeaderProps) {
  const titleClass =
    size === 'compact'
      ? SemanticTypography.executive.sectionTitle
      : SemanticTypography.executive.title

  const headerStyle: CSSProperties = {
    ...getToneStyle(tone),
    borderRadius: SemanticRadius.hero,
    padding:
      size === 'compact'
        ? SemanticSpacing.card.default
        : SemanticSpacing.card.spacious,
    ...style,
  }

  return (
    <header
      data-atlas-component="executive-header"
      data-tone={tone}
      data-size={size}
      className={[
        'border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={headerStyle}
      {...props}
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {icon && (
            <div
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center"
              style={{
                backgroundColor: SemanticColors.surface.default,
                border: `1px solid ${SemanticColors.border.subtle}`,
                borderRadius: SemanticRadius.card,
                color:
                  tone === 'intelligence'
                    ? SemanticColors.accent.intelligence
                    : SemanticColors.accent.primary,
              }}
            >
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              {eyebrow && (
                <p
                  className="text-sm font-semibold"
                  style={{
                    color:
                      tone === 'intelligence'
                        ? SemanticColors.accent.intelligence
                        : SemanticColors.accent.primary,
                  }}
                >
                  {eyebrow}
                </p>
              )}

              {status}
            </div>

            <h1
              className={[
                eyebrow ? 'mt-1' : '',
                titleClass,
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ color: SemanticColors.text.primary }}
            >
              {title}
            </h1>

            {subtitle && (
              <div
                className="mt-2 text-lg font-medium"
                style={{ color: SemanticColors.text.secondary }}
              >
                {subtitle}
              </div>
            )}

            {description && (
              <div
                className="mt-3 max-w-4xl text-base leading-7"
                style={{ color: SemanticColors.text.secondary }}
              >
                {description}
              </div>
            )}

            {metadata && (
              <div
                className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
                style={{ color: SemanticColors.text.muted }}
              >
                {metadata}
              </div>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div
          className="mt-6 border-t pt-6"
          style={{ borderColor: SemanticColors.border.subtle }}
        >
          {children}
        </div>
      )}
    </header>
  )
}
