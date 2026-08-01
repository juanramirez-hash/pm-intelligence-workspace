import {
  Bell,
  Menu,
  Search,
  Sparkles,
} from 'lucide-react'
import { Button } from '@heroui/react'
import { useLocation } from 'react-router-dom'

const workspaceTitles: Record<string, string> = {
  '/': 'Executive Workspace',
  '/sales': 'Sales Workspace',
  '/brands': 'Brand Workspace',
  '/customers': 'Customer Workspace',
  '/products': 'Product Workspace',
  '/pricing': 'Pricing Laboratory',
  '/forecast': 'Forecast Workspace',
  '/inventory': 'Inventory Workspace',
  '/purchasing': 'Purchasing Workspace',
  '/data-center': 'Data Center',
  '/settings': 'Settings',
}

export function Topbar() {
  const location = useLocation()

  const workspaceTitle =
    workspaceTitles[location.pathname] ?? 'PM Intelligence'

  return (
    <header data-print-hidden="true" className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur sm:px-8 lg:px-10">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
          aria-label="Abrir navegación"
        >
          <Menu size={20} />
        </button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <h1 className="text-lg font-semibold text-slate-950">
            {workspaceTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="hidden h-10 min-w-64 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-400 md:flex"
        >
          <Search size={17} />
          Buscar marcas, productos o clientes
        </button>

        <Button variant="secondary">
          <Sparkles size={17} />
          Copilot
        </Button>

        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          aria-label="Notificaciones"
        >
          <Bell size={18} />

          <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
        </button>

        <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
          JR
        </div>
      </div>
    </header>
  )
}