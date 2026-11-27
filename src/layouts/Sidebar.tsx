// TECNO-TOP-MENU-20260917
// NAV-001: menu by sections and role, from navigation/navigationConfig.ts.

import {
  useEffect,
  useRef,
} from 'react'

import {
  X,
} from 'lucide-react'

import {
  NavLink,
} from 'react-router-dom'

import {
  useAuth,
} from '../features/auth/useAuth'

import {
  NAVIGATION_BRAND,
  buildNavigation,
  type NavigationItem,
} from './navigation/navigationConfig'

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const noop = () => {}

function navLinkClasses(isActive: boolean, child = false): string {
  return [
    'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-600',
    child ? 'pl-9 pr-3' : 'px-3',
    isActive
      ? 'bg-[#F58220] text-blue-950 shadow-sm'
      : 'text-blue-800 hover:bg-blue-50 hover:text-blue-950',
  ].join(' ')
}

function SidebarLink({
  item,
  onNavigate,
}: {
  item: NavigationItem
  onNavigate: () => void
}) {
  const Icon = item.icon

  return (
    <NavLink
      onClick={onNavigate}
      to={item.path}
      end={item.end}
      data-navigation-item={item.id}
      className={({ isActive }) => navLinkClasses(isActive, item.child)}
    >
      <Icon
        size={item.child ? 17 : 19}
        strokeWidth={1.9}
      />

      <span className="min-w-0">
        {item.label}
      </span>
    </NavLink>
  )
}

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

  const sections = buildNavigation(user)
  const BrandIcon = NAVIGATION_BRAND.icon

  const content = (
    <>
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-blue-100 px-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <BrandIcon
            size={21}
            strokeWidth={2.2}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-tight text-blue-950">
            {NAVIGATION_BRAND.name}
          </p>

          <p className="truncate text-xs text-blue-700">
            {NAVIGATION_BRAND.tagline}
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
        aria-label="Menú principal"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((section, index) => (
          <div
            key={section.id}
            data-navigation-section={section.id}
          >
            {index > 0 ? (
              <div className="my-4 border-t border-blue-100" />
            ) : null}

            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {section.label}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarLink
                  key={item.id}
                  item={item}
                  onNavigate={onMobileClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-blue-100 p-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
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
