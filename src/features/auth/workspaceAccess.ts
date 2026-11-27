import type {
  AuthenticatedUser,
  AuthenticatedUserRole,
} from './authTypes'

export type WorkspaceAccessId =
  | 'my-day'
  | 'executive'
  | 'brands'
  | 'customers'
  | 'products'
  | 'pricing'
  | 'forecast'
  | 'inventory'
  | 'purchasing'
  | 'actions'
  | 'data-center'
  | 'product-quality'
  | 'settings'

const ROLE_WORKSPACE_ACCESS:
  Record<
    AuthenticatedUserRole,
    readonly WorkspaceAccessId[]
  > = {
    admin: [
      'my-day',
      'executive',
      'brands',
      'customers',
      'products',
      'pricing',
      'forecast',
      'inventory',
      'purchasing',
      'actions',
      'data-center',
      'product-quality',
      'settings',
    ],

    manager: [
      'my-day',
      'executive',
      'brands',
      'customers',
      'products',
      'pricing',
      'forecast',
      'inventory',
      'purchasing',
      'actions',
      'data-center',
      'product-quality',
    ],

    pm: [
      'my-day',
      'executive',
      'brands',
      'customers',
      'products',
      'pricing',
      'forecast',
      'inventory',
      'purchasing',
      'actions',
    ],

    // NAV-002: the PM screens of Inicio, Mi trabajo and Análisis, without
    // Gerencia (Panorama ejecutivo, Pricing Lab, Compras) nor Administración.
    assistant: [
      'my-day',
      'brands',
      'customers',
      'products',
      'forecast',
      'inventory',
      'actions',
    ],

    engineering: [
      'my-day',
      'brands',
      'customers',
      'products',
      'inventory',
      'actions',
    ],
  }

// NAV-002B: a role without an entry (for example a removed legacy role) has
// no access; it never breaks the application.
function workspacesOf(
  user: AuthenticatedUser,
): readonly WorkspaceAccessId[] {
  return (
    ROLE_WORKSPACE_ACCESS as Partial<
      Record<
        AuthenticatedUserRole,
        readonly WorkspaceAccessId[]
      >
    >
  )[user.role] ?? []
}

export function canAccessWorkspace(
  user: AuthenticatedUser,
  workspaceId: WorkspaceAccessId,
): boolean {
  return workspacesOf(user).includes(
    workspaceId,
  )
}

export function getAccessibleWorkspaces(
  user: AuthenticatedUser,
): readonly WorkspaceAccessId[] {
  return workspacesOf(user)
}