import {
  ShieldAlert,
} from 'lucide-react'

import {
  Outlet,
} from 'react-router-dom'

import {
  useAuth,
} from './useAuth'

import {
  canAccessWorkspace,
  type WorkspaceAccessId,
} from './workspaceAccess'

interface WorkspaceRouteGuardProps {
  workspaceId: WorkspaceAccessId
}

export function WorkspaceRouteGuard({
  workspaceId,
}: WorkspaceRouteGuardProps) {
  const {
    user,
  } = useAuth()

  const hasAccess =
    canAccessWorkspace(
      user,
      workspaceId,
    )

  if (hasAccess) {
    return <Outlet />
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <ShieldAlert
          className="text-amber-500"
          size={48}
          strokeWidth={1.8}
        />

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          Acceso restringido
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Tu rol no tiene acceso a este Workspace.
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {user.roleName}
        </p>
      </div>
    </div>
  )
}