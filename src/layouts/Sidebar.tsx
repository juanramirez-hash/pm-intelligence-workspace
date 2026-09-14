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

  const content = (
    <>
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
          <Boxes
            size={21}
            strokeWidth={2.2}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-tight text-white">
            PM Intelligence
          </p>

          <p className="truncate text-xs text-slate-400">
            Business Operating System
          </p>
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Cerrar navegación"
          className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-blue-400 lg:hidden"
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
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-950/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
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
            <div className="my-5 border-t border-white/10" />

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
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-950/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
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
                    'mt-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-950/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
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

      <div className="shrink-0 border-t border-white/10 p-4">
        {canAccessSettings && (
          <NavLink
                onClick={onMobileClose}
            to="/settings"
            className={({
              isActive,
            }) =>
              [
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
              ].join(' ')
            }
          >
            <Settings size={19} />

            <span>
              Settings
            </span>
          </NavLink>
        )}

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">
            {user.name ?? user.email}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {user.roleName}
          </p>
        </div>
      </div>
    </>
  )

  return (
    <>
      <aside
        data-print-hidden="true"
        className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-slate-950 lg:flex"
      >
        {content}
      </aside>

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
          className="flex h-full w-80 max-w-[90vw] flex-col overflow-hidden bg-slate-950 shadow-2xl"
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
