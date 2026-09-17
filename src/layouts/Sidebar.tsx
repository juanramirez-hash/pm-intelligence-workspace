// TECNO-TOP-MENU-20260917
import { useEffect, useRef } from 'react'

import {
  Boxes,
  Building2,
  ChartNoAxesCombined,
  Crosshair,
  Database,
  DollarSign,
  Gauge,
  Package,
  PackageSearch,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import {
  useAuth,
} from '../features/auth/useAuth'

import {
  canAccessWorkspace,
  type WorkspaceAccessId,
} from '../features/auth/workspaceAccess'

const workspaceNavigation: {
  label: string
  path: string
  icon: typeof Gauge
  workspaceId: WorkspaceAccessId
}[] = [
  {
    label: 'Executive Workspace',
    path: '/',
    icon: Gauge,
    workspaceId: 'executive',
  },
  {
    label: 'Sales Workspace',
    path: '/sales',
    icon: ChartNoAxesCombined,
    workspaceId: 'sales',
  },
  {
    label: 'Brand Workspace',
    path: '/brands',
    icon: Building2,
    workspaceId: 'brands',
  },
  {
    label: 'Customer Workspace',
    path: '/customers',
    icon: Users,
    workspaceId: 'customers',
  },
  {
    label: 'Product Workspace',
    path: '/products',
    icon: Package,
    workspaceId: 'products',
  },
  {
    label: 'Pricing Laboratory',
    path: '/pricing',
    icon: DollarSign,
    workspaceId: 'pricing',
  },
  {
    label: 'Forecast Workspace',
    path: '/forecast',
    icon: Crosshair,
    workspaceId: 'forecast',
  },
  {
    label: 'Inventory Workspace',
    path: '/inventory',
    icon: PackageSearch,
    workspaceId: 'inventory',
  },
  {
    label: 'Purchasing Workspace',
    path: '/purchasing',
    icon: ShoppingCart,
    workspaceId: 'purchasing',
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const noop = () => {}

export function Sidebar({
  mobileOpen = false,
  onMobileClose = noop,
}: SidebarProps = {}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!mobileOpen) {
      return
    }

    const dialog = dialogRef.current
    const desktop = window.matchMedia('(min-width: 64rem)')

    if (!dialog || desktop.matches) {
      onMobileClose()
      return
    }

    // The native modal contains keyboard focus and restores it on close.
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'

    const handleBreakpoint = () => {
      if (desktop.matches) {
        onMobileClose()
      }
    }

    desktop.addEventListener('change', handleBreakpoint)

    return () => {
      desktop.removeEventListener('change', handleBreakpoint)
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen, onMobileClose])

  const {
    user,
  } = useAuth()

  const visibleWorkspaceNavigation =
    workspaceNavigation.filter(
      (item) =>
        canAccessWorkspace(
          user,
          item.workspaceId,
        ),
    )

  const canAccessDataCenter =
    canAccessWorkspace(
      user,
      'data-center',
    )

  const canAccessProductQuality =
    canAccessWorkspace(
      user,
      'product-quality',
    )

  const canAccessSettings =
    canAccessWorkspace(
      user,
      'settings',
    )

  const hasAdministrationAccess =
    canAccessDataCenter ||
    canAccessProductQuality

  // Keep the same route order and access rules on desktop and mobile.
  const desktopNavigation = [
    ...visibleWorkspaceNavigation,
    ...(canAccessDataCenter
      ? [{ label: 'Data Center', path: '/data-center', icon: Database }]
      : []),
    ...(canAccessProductQuality
      ? [{ label: 'Calidad de producto', path: '/data-quality/products', icon: ShieldCheck }]
      : []),
    ...(canAccessSettings
      ? [{ label: 'Settings', path: '/settings', icon: Settings }]
      : []),
  ]

  const content = (
    <>
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-blue-100 px-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Boxes
            size={21}
            strokeWidth={2.2}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-tight text-blue-950">
            PM Intelligence
          </p>

          <p className="truncate text-xs text-blue-700">
            Business Operating System
          </p>
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Cerrar navegación"
          className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-xl text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-400 lg:hidden"
        >
          <X size={22} />
        </button>
      </div>

      <nav aria-label="Workspaces y administración" className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Workspaces
        </p>

        <div className="space-y-1">
          {visibleWorkspaceNavigation.map(
            ({
              label,
              path,
              icon: Icon,
            }) => (
              <NavLink
                onClick={onMobileClose}
                key={path}
                to={path}
                end={path === '/'}
                className={({
                  isActive,
                }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-600',
                    isActive
                      ? 'bg-[#F58220] text-blue-950 shadow-sm'
                      : 'text-blue-800 hover:bg-blue-50 hover:text-blue-950',
                  ].join(' ')
                }
              >
                <Icon
                  size={19}
                  strokeWidth={1.9}
                />

                <span>
                  {label}
                </span>
              </NavLink>
            ),
          )}
        </div>

        {hasAdministrationAccess && (
          <>
            <div className="my-5 border-t border-blue-100" />

            <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Administración
            </p>

            {canAccessDataCenter && (
              <NavLink
                onClick={onMobileClose}
                to="/data-center"
                className={({
                  isActive,
                }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-600',
                    isActive
                      ? 'bg-[#F58220] text-blue-950 shadow-sm'
                      : 'text-blue-800 hover:bg-blue-50 hover:text-blue-950',
                  ].join(' ')
                }
              >
                <Database
                  size={19}
                  strokeWidth={1.9}
                />

                <span>
                  Data Center
                </span>
              </NavLink>
            )}

            {canAccessProductQuality && (
              <NavLink
                onClick={onMobileClose}
                to="/data-quality/products"
                className={({
                  isActive,
                }) =>
                  [
                    'mt-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-600',
                    isActive
                      ? 'bg-[#F58220] text-blue-950 shadow-sm'
                      : 'text-blue-800 hover:bg-blue-50 hover:text-blue-950',
                  ].join(' ')
                }
              >
                <ShieldCheck
                  size={19}
                  strokeWidth={1.9}
                />

                <span>
                  Calidad de producto
                </span>
              </NavLink>
            )}
          </>
        )}
      </nav>

      <div className="shrink-0 border-t border-blue-100 p-4">
        {canAccessSettings && (
          <NavLink
                onClick={onMobileClose}
            to="/settings"
            className={({
              isActive,
            }) =>
              [
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-600',
                isActive
                  ? 'bg-[#F58220] text-blue-950 shadow-sm'
                  : 'text-blue-800 hover:bg-blue-50 hover:text-blue-950',
              ].join(' ')
            }
          >
            <Settings size={19} />

            <span>
              Settings
            </span>
          </NavLink>
        )}

        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-950">
            {user.name ?? user.email}
          </p>

          <p className="mt-1 text-xs text-blue-700">
            {user.roleName}
          </p>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div
        data-print-hidden="true"
        className="hidden border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50 px-8 py-2 lg:block lg:px-10"
      >
        <nav
          aria-label="Navegación principal"
          className="mx-auto grid w-full max-w-[1600px] grid-cols-6 gap-1.5 xl:grid-cols-12"
        >
          {desktopNavigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => [
                'flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-2 text-center text-[11px] font-semibold leading-4 transition focus-visible:outline-2 focus-visible:outline-blue-600',
                isActive
                  ? 'border-orange-400 bg-[#F58220] text-blue-950 shadow-sm'
                  : 'border-transparent text-blue-800 hover:border-blue-200 hover:bg-blue-100',
              ].join(' ')}
            >
              <Icon size={20} strokeWidth={1.9} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <dialog
        ref={dialogRef}
        id="mobile-workspace-navigation"
        aria-label="Menú de navegación"
        data-print-hidden="true"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-slate-950 backdrop:bg-slate-950/50"
        onCancel={(event) => {
          event.preventDefault()
          onMobileClose()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onMobileClose()
          }
        }}
      >
        <aside
          className="flex h-full w-80 max-w-[90vw] flex-col overflow-hidden bg-white shadow-2xl"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {content}
        </aside>
      </dialog>
    </>
  )
}
