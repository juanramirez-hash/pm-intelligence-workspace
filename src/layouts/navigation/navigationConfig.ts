// NAV-001: the menu, by sections. Pure data plus one filter, so the menu of
// each role is tested without rendering.
//
// The menu does not change permissions: an entry is shown only when the role
// can open that workspace (workspaceAccess.ts) and, for Gerencia, only to
// admin and manager. A PM can still open Pricing, Compras or the Panorama
// ejecutivo by URL or from internal links.

import {
  Boxes,
  Building2,
  Crosshair,
  Database,
  DollarSign,
  FolderKanban,
  Gauge,
  ListTodo,
  Package,
  PackageSearch,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react'

import type {
  AuthenticatedUser,
  AuthenticatedUserRole,
} from '../../features/auth/authTypes'

import {
  canAccessWorkspace,
  type WorkspaceAccessId,
} from '../../features/auth/workspaceAccess'

export type NavigationSectionId =
  | 'home'
  | 'my-work'
  | 'analysis'
  | 'management'
  | 'administration'

export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  workspaceId: WorkspaceAccessId
  // Exact match for the active state (only "/").
  end?: boolean
  // Shown indented under the previous entry (Calidad de producto).
  child?: boolean
  // Temporary entries: removed when MB-001 / PR-001 merge them.
  temporary?: boolean
  // Reserved for a future module: kept here, never shown.
  reserved?: boolean
}

export interface NavigationSection {
  id: NavigationSectionId
  label: string
  // Menu visibility only (not a permission). Undefined = every role.
  menuRoles?: readonly AuthenticatedUserRole[]
  items: readonly NavigationItem[]
}

// Placeholder workspace id of reserved entries (never checked).
const RESERVED_WORKSPACE: WorkspaceAccessId = 'executive'

export const NAVIGATION: readonly NavigationSection[] = [
  {
    id: 'home',
    label: 'Inicio',
    items: [
      { id: 'my-day', label: 'Mi día', path: '/', icon: Sun, workspaceId: 'my-day', end: true },
    ],
  },
  {
    id: 'my-work',
    label: 'Mi trabajo',
    items: [
      { id: 'brands', label: 'Marcas', path: '/brands', icon: Building2, workspaceId: 'brands' },
      { id: 'customers', label: 'Clientes', path: '/customers', icon: Users, workspaceId: 'customers' },
      { id: 'products', label: 'Productos', path: '/products', icon: Package, workspaceId: 'products' },
      { id: 'actions', label: 'Acciones', path: '/actions', icon: ListTodo, workspaceId: 'actions' },
    ],
  },
  {
    id: 'analysis',
    label: 'Análisis',
    items: [
      { id: 'forecast', label: 'Pronóstico', path: '/forecast', icon: Crosshair, workspaceId: 'forecast', temporary: true },
      { id: 'inventory', label: 'Inventario', path: '/inventory', icon: PackageSearch, workspaceId: 'inventory', temporary: true },
    ],
  },
  {
    id: 'management',
    label: 'Gerencia',
    menuRoles: ['admin', 'manager'],
    items: [
      { id: 'executive', label: 'Panorama ejecutivo', path: '/executive', icon: Gauge, workspaceId: 'executive' },
      { id: 'pricing', label: 'Pricing Lab', path: '/pricing', icon: DollarSign, workspaceId: 'pricing' },
      { id: 'purchasing', label: 'Compras', path: '/purchasing', icon: ShoppingCart, workspaceId: 'purchasing' },
      {
        id: 'projects',
        label: 'Proyectos',
        path: '/projects',
        icon: FolderKanban,
        workspaceId: RESERVED_WORKSPACE,
        reserved: true,
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administración',
    items: [
      { id: 'data-center', label: 'Centro de datos', path: '/data-center', icon: Database, workspaceId: 'data-center' },
      {
        id: 'product-quality',
        label: 'Calidad de producto',
        path: '/data-quality/products',
        icon: ShieldCheck,
        workspaceId: 'product-quality',
        child: true,
      },
      { id: 'settings', label: 'Configuración', path: '/settings', icon: Settings, workspaceId: 'settings' },
    ],
  },
]

// Brand of the menu header.
export const NAVIGATION_BRAND = Object.freeze({
  name: 'PM Intelligence',
  tagline: 'Inteligencia comercial',
  icon: Boxes,
})

/** Sections and entries the user sees; empty sections are dropped. */
export function buildNavigation(
  user: AuthenticatedUser,
  sections: readonly NavigationSection[] = NAVIGATION,
): NavigationSection[] {
  return sections
    .filter((section) => !section.menuRoles || section.menuRoles.includes(user.role))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        !item.reserved && canAccessWorkspace(user, item.workspaceId),
      ),
    }))
    .filter((section) => section.items.length > 0)
}

/** Every screen the user can open (not only the menu), for links. */
export function accessibleScreens(
  user: AuthenticatedUser,
  sections: readonly NavigationSection[] = NAVIGATION,
): NavigationItem[] {
  return sections
    .flatMap((section) => section.items)
    .filter((item) => !item.reserved && canAccessWorkspace(user, item.workspaceId))
}

/**
 * Title of each screen for the top bar and the browser tab, longest prefix
 * first so detail pages ("/brands/X") get their own title.
 */
const SCREEN_TITLES: ReadonlyArray<[prefix: string, title: string]> = [
  ['/executive/attention/', 'Cola de atención'],
  ['/executive', 'Panorama ejecutivo'],
  ['/brands/', 'Ficha de marca'],
  ['/brands', 'Marcas'],
  ['/customers/', 'Ficha de cliente'],
  ['/customers', 'Clientes'],
  ['/products/', 'Ficha de producto'],
  ['/products', 'Productos'],
  ['/actions', 'Acciones'],
  ['/sales', 'Ventas'],
  ['/forecast', 'Pronóstico'],
  ['/inventory', 'Inventario'],
  ['/pricing', 'Pricing Lab'],
  ['/purchasing', 'Compras'],
  ['/data-center', 'Centro de datos'],
  ['/data-quality/products', 'Calidad de producto'],
  ['/settings', 'Configuración'],
]

export function screenTitle(pathname: string): string {
  if (pathname === '/' || pathname === '') {
    return 'Mi día'
  }

  for (const [prefix, title] of SCREEN_TITLES) {
    if (prefix.endsWith('/') ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return title
    }
  }

  return NAVIGATION_BRAND.name
}
