import type {
  AuthenticatedUser,
  AuthenticatedUserRole,
} from './authTypes'

export type WorkspaceAccessId =
  | 'my-day'
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
      'my-day',
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
      'my-day',
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
      'my-day',
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

    // NAV-002: the PM screens of Inicio, Mi trabajo and Análisis, without
    // Gerencia (Panorama ejecutivo, Pricing Lab, Compras) nor Administración.
    assistant: [
      'my-day',
      'sales',
      'brands',
      'customers',
      'products',
      'forecast',
      'inventory',
      'actions',
    ],

    engineering: [
      'my-day',
      'sales',
      'brands',
      'customers',
      'products',
      'inventory',
      'actions',
    ],

    analyst: [
      'my-day',
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
      'my-day',
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