import type {
  ElementType,
  PropsWithChildren,
} from 'react'

interface WorkspaceLayoutProps
  extends PropsWithChildren {
  as?: ElementType

  className?: string

  containerClassName?: string
}

export function WorkspaceLayout({
  as: Component = 'main',
  className = '',
  containerClassName = '',
  children,
}: WorkspaceLayoutProps) {
  return (
    <Component
      className={[
        'min-h-screen bg-slate-50',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10',
          containerClassName,
        ].join(' ')}
      >
        {children}
      </div>
    </Component>
  )
}