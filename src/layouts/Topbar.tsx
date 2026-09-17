// TECNO-TOP-MENU-20260917
import {
  Bell,
  Boxes,
  LogOut,
  Menu,
  Search,
  Sparkles,
} from 'lucide-react'
import {
  Button,
} from '@heroui/react'
import {
  useLocation,
} from 'react-router-dom'

interface TopbarUser {
  email: string
  name: string | null
  roleName?: string
}

interface TopbarProps {
  user: TopbarUser
  onMenuOpen: () => void
  navigationOpen: boolean
}

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
  '/data-quality/products': 'Calidad de producto',
}

function getUserInitials(
  name: string | null,
  email: string,
) {
  const source =
    name?.trim() ||
    email.split('@')[0] ||
    ''

  const parts = source
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${parts[0][0]}${parts[1][0]}`
    .toUpperCase()
}

export function Topbar({
  user,
  onMenuOpen,
  navigationOpen,
}: TopbarProps) {
  const location = useLocation()

  const workspaceTitle =
    workspaceTitles[location.pathname] ??
    'PM Intelligence'

  const initials =
    getUserInitials(
      user.name,
      user.email,
    )

  const handleLogout = async () => {
    try {
      await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
          credentials: 'include',
        },
      )
    } finally {
      window.location.href = '/'
    }
  }

  return (
    <header
      data-print-hidden="true"
      className="border-t-[3px] border-t-[#F58220] border-b border-b-blue-100 bg-white px-3 sm:px-8 lg:px-10"
    >
      <div className="mx-auto flex min-h-20 w-full max-w-[1600px] items-center justify-between gap-2 py-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onMenuOpen}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600 lg:hidden"
            aria-label="Abrir navegación"
            aria-controls="mobile-workspace-navigation"
            aria-expanded={navigationOpen}
            aria-haspopup="dialog"
          >
            <Menu size={20} />
          </button>

          <div className="hidden shrink-0 items-center gap-3 border-r border-blue-100 pr-5 lg:flex">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Boxes size={21} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-semibold tracking-tight text-blue-950">PM Intelligence</p>
              <p className="text-xs text-blue-700">Business Operating System</p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600 sm:text-xs">
              Workspace
            </p>
            <h1
              className="truncate text-sm font-semibold text-blue-950 sm:text-lg"
              title={workspaceTitle}
            >
              {workspaceTitle}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button
            type="button"
            className="hidden h-11 items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 text-left text-sm text-blue-600 2xl:flex"
          >
            <Search size={17} />
            Buscar marcas, productos o clientes
          </button>

          <Button
            variant="secondary"
            aria-label="Copilot"
            className="size-11 min-w-11 shrink-0 border border-blue-100 bg-blue-50 px-0 text-blue-700 sm:w-auto sm:px-3"
          >
            <Sparkles size={17} />
            <span className="hidden sm:inline">Copilot</span>
          </Button>

          <button
            type="button"
            className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 transition hover:bg-blue-50"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white"
              title={[user.name ?? user.email, user.roleName].filter(Boolean).join(' · ')}
            >
              {initials}
            </div>
            <div className="hidden max-w-36 2xl:block">
              <p className="truncate text-xs font-semibold text-blue-950">{user.name ?? user.email}</p>
              {user.roleName && <p className="truncate text-xs text-blue-700">{user.roleName}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  )
}
