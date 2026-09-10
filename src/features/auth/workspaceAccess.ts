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
    ],

    engineering: [
      'sales',
      'brands',
      'customers',
      'products',
      'inventory',
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