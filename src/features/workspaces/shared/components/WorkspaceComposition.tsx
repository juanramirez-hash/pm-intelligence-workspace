import type { ReactNode } from 'react'

import {
  ExecutiveShell,
  type ExecutiveShellWidth,
} from '../../../../atlas/shell'

export interface WorkspaceCompositionProps {
  breadcrumbs?: ReactNode
  hero: ReactNode
  brief?: ReactNode
  opportunity?: ReactNode
  kpis?: ReactNode
  directory?: ReactNode
  panels?: ReactNode
  width?: ExecutiveShellWidth
}

export function WorkspaceComposition({
  breadcrumbs,
  hero,
  brief,
  opportunity,
  kpis,
  directory,
  panels,
  width = 'wide',
}: WorkspaceCompositionProps) {
  return (
    <ExecutiveShell
      beforeContent={breadcrumbs}
      header={hero}
      width={width}
    >
      {brief && <div>{brief}</div>}
      {opportunity && <div>{opportunity}</div>}
      {kpis && <div>{kpis}</div>}
      {directory && <div>{directory}</div>}
      {panels && <div>{panels}</div>}
    </ExecutiveShell>
  )
}
