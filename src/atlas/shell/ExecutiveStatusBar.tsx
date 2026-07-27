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
  type SemanticStatus,
} from '../../tokens'

export type ExecutiveStatusBarDensity =
  | 'compact'
  | 'default'

export type ExecutiveStatusBarVariant =
  | 'default'
  | 'subtle'

export type ExecutiveStatusItem = {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  tone?: SemanticStatus
}

type ExecutiveStatusBarProps = {
  items: readonly ExecutiveStatusItem[]
  leading?: ReactNode
  trailing?: ReactNode
  density?: ExecutiveStatusBarDensity
  variant?: ExecutiveStatusBarVariant
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'children'>

function getContainerStyle(
  density: ExecutiveStatusBarDensity,
  variant: ExecutiveStatusBarVariant,
): CSSProperties {
  return {
    backgroundColor:
      variant === 'subtle'
        ? SemanticColors.surface.subtle
        : SemanticColors.surface.default,
    borderColor: SemanticColors.border.subtle,
    borderRadius: SemanticRadius.panel,
    paddingInline:
      density === 'compact'
        ? SemanticSpacing.card.compact
        : SemanticSpacing.card.default,
    paddingBlock:
      density === 'compact'
        ? SemanticSpacing.control.compact
        : SemanticSpacing.card.compact,
  }
}

function ExecutiveStatusValue({
  item,
}: {
  item: ExecutiveStatusItem
}) {
  const tone = item.tone
  const toneColors = tone
    ? SemanticColors.status[tone]
    : undefined

  return (
    <dd
      className="mt-1 flex min-w-0 items-center font-semibold"
      style={{
        gap: SemanticSpacing.control.groupGap,
        color:
          toneColors?.foreground ??
          SemanticColors.text.primary,
      }}
    >
      {item.icon && (
        <span
          aria-hidden="true"
          className="flex size-4 shrink-0 items-center justify-center"
        >
          {item.icon}
        </span>
      )}

      {toneColors && (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: toneColors.foreground }}
        />
      )}

      <span className="min-w-0 truncate">{item.value}</span>
    </dd>
  )
}

export function ExecutiveStatusBar({
  items,
  leading,
  trailing,
  density = 'default',
  variant = 'default',
  className = '',
  style,
  ...props
}: ExecutiveStatusBarProps) {
  const containerStyle: CSSProperties = {
    ...getContainerStyle(density, variant),
    ...style,
  }

  return (
    <section
      data-atlas-component="executive-status-bar"
      data-density={density}
      data-variant={variant}
      className={[
        'flex flex-col border lg:flex-row lg:items-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...containerStyle,
        gap: SemanticSpacing.card.contentGap,
      }}
      {...props}
    >
      {leading && (
        <div className="shrink-0">{leading}</div>
      )}

      <dl
        className="grid min-w-0 flex-1 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        style={{ gap: SemanticSpacing.card.contentGap }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="min-w-0 border-l pl-4 first:border-l-0 first:pl-0"
            style={{ borderColor: SemanticColors.border.subtle }}
          >
            <dt
              className={SemanticTypography.navigation.metadata}
              style={{ color: SemanticColors.text.muted }}
            >
              {item.label}
            </dt>

            <ExecutiveStatusValue item={item} />
          </div>
        ))}
      </dl>

      {trailing && (
        <div className="shrink-0">{trailing}</div>
      )}
    </section>
  )
}
