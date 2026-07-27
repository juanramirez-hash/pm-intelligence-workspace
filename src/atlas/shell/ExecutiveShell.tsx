import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from 'react'

import {
  SemanticColors,
  SemanticSpacing,
} from '../../tokens'

export type ExecutiveShellWidth =
  | 'standard'
  | 'wide'
  | 'fluid'

type ExecutiveShellProps = {
  children: ReactNode
  header?: ReactNode
  beforeContent?: ReactNode
  width?: ExecutiveShellWidth
  className?: string
  contentClassName?: string
} & Omit<HTMLAttributes<HTMLElement>, 'children'>

const widthClasses: Record<ExecutiveShellWidth, string> = {
  standard: 'max-w-7xl',
  wide: 'max-w-[1600px]',
  fluid: 'max-w-none',
}

export function ExecutiveShell({
  children,
  header,
  beforeContent,
  width = 'wide',
  className = '',
  contentClassName = '',
  style,
  ...props
}: ExecutiveShellProps) {
  const shellStyle: CSSProperties = {
    backgroundColor: SemanticColors.canvas.background,
    color: SemanticColors.canvas.foreground,
    ...style,
  }

  const contentStyle: CSSProperties = {
    gap: SemanticSpacing.section.gap,
    paddingInline: SemanticSpacing.page.inline,
    paddingBlock: SemanticSpacing.page.block,
  }

  return (
    <main
      data-atlas-component="executive-shell"
      data-width={width}
      className={[
        'min-h-full w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={shellStyle}
      {...props}
    >
      <div
        className={[
          'mx-auto flex w-full flex-col',
          widthClasses[width],
          contentClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        style={contentStyle}
      >
        {beforeContent}
        {header}
        {children}
      </div>
    </main>
  )
}
