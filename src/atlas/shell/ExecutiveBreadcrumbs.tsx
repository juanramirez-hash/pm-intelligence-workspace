import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

import {
  SemanticColors,
  SemanticRadius,
  SemanticSpacing,
  SemanticTypography,
} from '../../tokens'

export type ExecutiveBreadcrumbItem = {
  label: ReactNode
  href?: string
  icon?: ReactNode
}

type ExecutiveBreadcrumbsProps = {
  items: readonly ExecutiveBreadcrumbItem[]
  separator?: ReactNode
  ariaLabel?: string
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'children'>

function BreadcrumbContent({
  item,
}: {
  item: ExecutiveBreadcrumbItem
}) {
  return (
    <>
      {item.icon && (
        <span
          aria-hidden="true"
          className="flex size-4 shrink-0 items-center justify-center"
        >
          {item.icon}
        </span>
      )}

      <span className="truncate">{item.label}</span>
    </>
  )
}

export function ExecutiveBreadcrumbs({
  items,
  separator = '/',
  ariaLabel = 'Ruta de navegación',
  className = '',
  ...props
}: ExecutiveBreadcrumbsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <nav
      aria-label={ariaLabel}
      data-atlas-component="executive-breadcrumbs"
      className={className}
      {...props}
    >
      <ol
        className="flex min-w-0 flex-wrap items-center"
        style={{ gap: SemanticSpacing.control.groupGap }}
      >
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          const key = `${index}-${String(item.href ?? '')}`

          return (
            <li
              key={key}
              className="flex min-w-0 items-center"
              style={{ gap: SemanticSpacing.control.groupGap }}
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={SemanticTypography.navigation.metadata}
                  style={{ color: SemanticColors.text.muted }}
                >
                  {separator}
                </span>
              )}

              {item.href && !isCurrent ? (
                <a
                  href={item.href}
                  className="flex min-w-0 items-center font-medium transition-colors"
                  style={{
                    gap: SemanticSpacing.control.groupGap,
                    color: SemanticColors.text.secondary,
                    borderRadius: SemanticRadius.control,
                  }}
                >
                  <BreadcrumbContent item={item} />
                </a>
              ) : (
                <span
                  aria-current={isCurrent ? 'page' : undefined}
                  className="flex min-w-0 items-center font-semibold"
                  style={{
                    gap: SemanticSpacing.control.groupGap,
                    color: isCurrent
                      ? SemanticColors.text.primary
                      : SemanticColors.text.secondary,
                  }}
                >
                  <BreadcrumbContent item={item} />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
