import type {
  AuthenticatedUser,
  AuthenticatedUserRole,
} from './authTypes'

export type WorkspaceAccessId =
  | 'executive'
  | 'sales'
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
      'executive',
      'sales',
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
      'executive',
      'sales',
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
      'executive',
      'sales',
      'brands',
      'customers',
      'products',
      'pricing',
      'forecast',
      'inventory',
      'purchasing',
      'actions',
    ],

    engineering: [
      'sales',
      'brands',
      'customers',
      'products',
      'inventory',
      'actions',
    ],

    analyst: [
      'executive',
      'sales',
      'brands',
      'customers',
      'products',
      'pricing',
      'forecast',
      'inventory',
      'purchasing',
      'actions',
    ],

    viewer: [
      'executive',
      'sales',
      'brands',
      'customers',
      'products',
      'forecast',
      'inventory',
      'purchasing',
      'actions',
    ],
  }

export function canAccessWorkspace(
  user: AuthenticatedUser,
  workspaceId: WorkspaceAccessId,
): boolean {
  return ROLE_WORKSPACE_ACCESS[
    user.role
  ].includes(
    workspaceId,
  )
}

export function getAccessibleWorkspaces(
  user: AuthenticatedUser,
): readonly WorkspaceAccessId[] {
  return ROLE_WORKSPACE_ACCESS[
    user.role
  ]
}