// TECNO-TOP-MENU-20260917

import {
  useEffect,
  useRef,
} from 'react'

import {
  Boxes,
  Building2,
  ChartNoAxesCombined,
  Crosshair,
  Database,
  DollarSign,
  Gauge,
  ListTodo,
  Package,
  PackageSearch,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'

import {
  NavLink,
} from 'react-router-dom'

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
  {
    label: 'Centro de Acciones',
    path: '/actions',
    icon: ListTodo,
    workspaceId: 'actions',
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

      <nav
        aria-label="Workspaces y administración"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
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
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-600',
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

                <span className="min-w-0">
                  {label}
                </span>
              </NavLink>
            ),
          )}
        </div>

        {hasAdministrationAccess && (
          <>
            <div className="my-5 border-t border-blue-100" />

            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
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
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-600',
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
                    'mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-600',
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

      <div className="shrink-0 border-t border-blue-100 p-3">
        {canAccessSettings && (
          <NavLink
            onClick={onMobileClose}
            to="/settings"
            className={({
              isActive,
            }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-600',
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

        <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-3">
          <p className="truncate text-sm font-medium text-blue-950">
            {user.name ?? user.email}
          </p>

          <p className="mt-1 truncate text-xs text-blue-700">
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
        className="hidden lg:sticky lg:top-0 lg:z-40 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:self-start lg:flex-col lg:overflow-hidden lg:border-r lg:border-blue-100 lg:bg-gradient-to-b lg:from-blue-50 lg:via-white lg:to-blue-50 lg:shadow-[4px_0_18px_rgba(15,23,42,0.04)]"
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
