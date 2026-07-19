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
  ShoppingCart,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const workspaceNavigation = [
  {
    label: 'Executive Workspace',
    path: '/',
    icon: Gauge,
  },
  {
    label: 'Sales Workspace',
    path: '/sales',
    icon: ChartNoAxesCombined,
  },
  {
    label: 'Brand Workspace',
    path: '/brands',
    icon: Building2,
  },
  {
    label: 'Customer Workspace',
    path: '/customers',
    icon: Users,
  },
  {
    label: 'Product Workspace',
    path: '/products',
    icon: Package,
  },
  {
    label: 'Pricing Workspace',
    path: '/pricing',
    icon: DollarSign,
  },
  {
    label: 'Forecast Workspace',
    path: '/forecast',
    icon: Crosshair,
  },
  {
    label: 'Inventory Workspace',
    path: '/inventory',
    icon: PackageSearch,
  },
  {
    label: 'Purchasing Workspace',
    path: '/purchasing',
    icon: ShoppingCart,
  },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-slate-950 lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500 text-white">
          <Boxes size={21} strokeWidth={2.2} />
        </div>

        <div>
          <p className="font-semibold tracking-tight text-white">
            PM Intelligence
          </p>

          <p className="text-xs text-slate-400">
            Business Operating System
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Workspaces
        </p>

        <div className="space-y-1">
          {workspaceNavigation.map(
            ({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-950/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{label}</span>
              </NavLink>
            ),
          )}
        </div>

        <div className="my-5 border-t border-white/10" />

        <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Administración
        </p>

        <NavLink
          to="/data-center"
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
              isActive
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-950/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            ].join(' ')
          }
        >
          <Database size={19} strokeWidth={1.9} />
          <span>Data Center</span>
        </NavLink>
      </nav>

      <div className="border-t border-white/10 p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            ].join(' ')
          }
        >
          <Settings size={19} />
          Settings
        </NavLink>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">
            Juan Ramírez
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Product Management
          </p>
        </div>
      </div>
    </aside>
  )
}