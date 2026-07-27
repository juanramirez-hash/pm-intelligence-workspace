import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from 'react'

import {
  SemanticColors,
  SemanticRadius,
  SemanticShadows,
  SemanticSpacing,
} from '../../tokens'

export type AtlasCardVariant =
  | 'default'
  | 'subtle'
  | 'elevated'
  | 'interactive'
  | 'critical'
  | 'intelligence'

export type AtlasCardPadding =
  | 'none'
  | 'compact'
  | 'default'
  | 'spacious'

type AtlasCardProps = {
  children: ReactNode
  className?: string
  variant?: AtlasCardVariant
  padding?: AtlasCardPadding
} & HTMLAttributes<HTMLElement>

const variantClasses: Record<AtlasCardVariant, string> = {
  default: SemanticShadows.card,
  subtle: 'shadow-none',
  elevated: SemanticShadows.panel,
  interactive: [
    SemanticShadows.card,
    'cursor-pointer transition-[box-shadow,transform,border-color] duration-200',
    `hover:${SemanticShadows.cardHover}`,
    'hover:-translate-y-0.5',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
  ].join(' '),
  critical: SemanticShadows.card,
  intelligence: SemanticShadows.card,
}

const paddingClasses: Record<AtlasCardPadding, string> = {
  none: '',
  compact: 'p-4',
  default: 'p-6',
  spacious: 'p-8',
}

function getVariantStyle(
  variant: AtlasCardVariant,
): CSSProperties {
  const base: CSSProperties = {
    backgroundColor: SemanticColors.surface.default,
    borderColor: SemanticColors.border.default,
    borderRadius: SemanticRadius.card,
  }

  switch (variant) {
    case 'subtle':
      return {
        ...base,
        backgroundColor: SemanticColors.surface.subtle,
        borderColor: SemanticColors.border.subtle,
      }

    case 'critical':
      return {
        ...base,
        backgroundColor: SemanticColors.status.critical.surface,
        borderColor: SemanticColors.status.critical.border,
      }

    case 'intelligence':
      return {
        ...base,
        backgroundColor: SemanticColors.status.intelligence.surface,
        borderColor: SemanticColors.status.intelligence.border,
      }

    default:
      return base
  }
}

export function AtlasCard({
  children,
  className = '',
  variant = 'default',
  padding = 'none',
  style,
  ...props
}: AtlasCardProps) {
  return (
    <section
      data-atlas-component="card"
      data-variant={variant}
      className={[
        'border',
        variantClasses[variant],
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...getVariantStyle(variant),
        padding:
          padding === 'compact'
            ? SemanticSpacing.card.compact
            : padding === 'default'
              ? SemanticSpacing.card.default
              : padding === 'spacious'
                ? SemanticSpacing.card.spacious
                : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </section>
  )
}
