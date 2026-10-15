// TECNO-TOP-MENU-20261001
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Bell,
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
  useNavigate,
} from 'react-router-dom'

import {
  useGlobalSearch,
} from '../features/global-search/useGlobalSearch'

import type {
  GlobalSearchResult,
  GlobalSearchResultType,
} from '../features/global-search/repositories/globalSearchRepository'

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
  '/actions': 'Centro de Acciones',
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

const searchTypeLabels: Record<
  GlobalSearchResultType,
  string
> = {
  brand: 'Marca',
  customer: 'Cliente',
  product: 'Producto',
}

function getWorkspaceTitle(
  pathname: string,
): string {
  const exact =
    workspaceTitles[pathname]

  if (exact) {
    return exact
  }

  if (pathname.startsWith('/brands/')) {
    return 'Brand Workspace'
  }

  if (pathname.startsWith('/customers/')) {
    return 'Customer Workspace'
  }

  if (pathname.startsWith('/products/')) {
    return 'Product Workspace'
  }

  if (pathname.startsWith('/actions/')) {
    return 'Centro de Acciones'
  }

  return 'PM Intelligence'
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
  const navigate = useNavigate()

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false)

  const [
    activeResultIndex,
    setActiveResultIndex,
  ] = useState(-1)

  const searchRootRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const workspaceTitle =
    getWorkspaceTitle(
      location.pathname,
    )

  const initials =
    getUserInitials(
      user.name,
      user.email,
    )

  const normalizedQuery =
  searchQuery.trim()

const {
  groups: searchGroups,
  loading: searchLoading,
  error: searchError,
} = useGlobalSearch(
  searchQuery,
)
  const flatSearchResults =
    useMemo(
      () =>
        searchGroups.flatMap(
          (group) =>
            group.items,
        ),
      [searchGroups],
    )

  useEffect(() => {
    if (
      !searchOpen ||
      flatSearchResults.length === 0
    ) {
      setActiveResultIndex(-1)
      return
    }

    setActiveResultIndex(0)
  }, [
    searchOpen,
    searchQuery,
    flatSearchResults.length,
  ])

  useEffect(() => {
    const handlePointerDown = (
      event: MouseEvent,
    ) => {
      const target =
        event.target

      if (
        target instanceof Node &&
        searchRootRef.current &&
        !searchRootRef.current.contains(
          target,
        )
      ) {
        setSearchOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handlePointerDown,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown,
      )
    }
  }, [])

  useEffect(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [location.pathname])

  const handleSelectResult = (
    result: GlobalSearchResult,
  ) => {
    setSearchOpen(false)
    setSearchQuery('')
    setActiveResultIndex(-1)
    navigate(result.route)
  }

  const handleSearchKeyDown = (
    event:
      React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      event.key === 'Escape'
    ) {
      setSearchOpen(false)
      setActiveResultIndex(-1)
      return
    }

    if (
      flatSearchResults.length === 0
    ) {
      return
    }

    if (
      event.key === 'ArrowDown'
    ) {
      event.preventDefault()
      setSearchOpen(true)
      setActiveResultIndex(
        (current) =>
          current < 0
            ? 0
            : (
                current + 1
              ) %
              flatSearchResults.length,
      )
      return
    }

    if (
      event.key === 'ArrowUp'
    ) {
      event.preventDefault()
      setSearchOpen(true)
      setActiveResultIndex(
        (current) =>
          current <= 0
            ? flatSearchResults.length -
              1
            : current - 1,
      )
      return
    }

    if (
      event.key === 'Enter' &&
      activeResultIndex >= 0
    ) {
      event.preventDefault()

      const result =
        flatSearchResults[
          activeResultIndex
        ]

      if (result) {
        handleSelectResult(
          result,
        )
      }
    }
  }

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
          <div
            ref={searchRootRef}
            className="relative hidden xl:block xl:w-80 2xl:w-[30rem]"
          >
            <div
              className={[
                'flex h-11 items-center gap-3 rounded-xl border bg-blue-50/50 px-4 transition',
                searchOpen
                  ? 'border-blue-300 bg-white shadow-sm ring-2 ring-blue-100'
                  : 'border-blue-100',
              ].join(' ')}
            >
              <Search
                size={17}
                className="shrink-0 text-blue-600"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(
                  event,
                ) => {
                  setSearchQuery(
                    event.target.value,
                  )
                  setSearchOpen(true)
                }}
                onFocus={() =>
                  setSearchOpen(true)
                }
                onKeyDown={
                  handleSearchKeyDown
                }
               placeholder={
                searchLoading
                  ? 'Buscando...'
                  : 'Buscar marcas, productos o clientes'
              }
                aria-label="Buscar marcas, productos o clientes"
                aria-expanded={
                  searchOpen
                }
                aria-controls="global-search-results"
                aria-autocomplete="list"
                className="min-w-0 flex-1 bg-transparent text-sm text-blue-950 outline-none placeholder:text-blue-500 disabled:cursor-not-allowed"
              />
            </div>

            {searchOpen && (
              <div
                id="global-search-results"
                role="listbox"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[70vh] w-full min-w-[24rem] overflow-y-auto rounded-2xl border border-blue-100 bg-white p-2 shadow-xl"
              >
                  {normalizedQuery.length <
                  2 ? (
                    <div className="px-3 py-4 text-sm text-slate-500">
                      Escribe al menos 2
                      caracteres para buscar.
                    </div>
                  ) : searchError ? (
                    <div className="px-3 py-4 text-sm text-red-600">
                      {searchError}
                    </div>
                  ) : searchLoading ? (
                    <div className="px-3 py-4 text-sm text-slate-500">
                      Buscando...
                    </div>
                  ) : flatSearchResults.length ===
                    0 ? (
                  <div className="px-3 py-4 text-sm text-slate-500">
                    No se encontraron
                    coincidencias.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchGroups.map(
                      (group) => (
                        <section
                          key={
                            group.type
                          }
                        >
                          <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                            {
                              group.label
                            }
                          </div>

                          <div className="space-y-1">
                            {group.items.map(
                              (
                                result,
                              ) => {
                                const resultIndex =
                                  flatSearchResults.findIndex(
                                    (
                                      candidate,
                                    ) =>
                                      candidate.type ===
                                        result.type &&
                                      candidate.id ===
                                        result.id,
                                  )

                                const isActive =
                                  resultIndex ===
                                  activeResultIndex

                                return (
                                  <button
                                    key={`${result.type}:${result.id}`}
                                    type="button"
                                    role="option"
                                    aria-selected={
                                      isActive
                                    }
                                    onMouseEnter={() =>
                                      setActiveResultIndex(
                                        resultIndex,
                                      )
                                    }
                                    onClick={() =>
                                      handleSelectResult(
                                        result,
                                      )
                                    }
                                    className={[
                                      'flex w-full items-start justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition',
                                      isActive
                                        ? 'bg-blue-50'
                                        : 'hover:bg-slate-50',
                                    ].join(
                                      ' ',
                                    )}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-slate-950">
                                        {
                                          result.primary
                                        }
                                      </p>

                                      {result.secondary && (
                                        <p className="mt-0.5 truncate text-xs text-slate-500">
                                          {
                                            result.secondary
                                          }
                                        </p>
                                      )}
                                    </div>

                                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                      {
                                        searchTypeLabels[
                                          result.type
                                        ]
                                      }
                                    </span>
                                  </button>
                                )
                              },
                            )}
                          </div>
                        </section>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            aria-label="Copilot"
            className="size-11 min-w-11 shrink-0 border border-blue-100 bg-blue-50 px-0 text-blue-700 sm:w-auto sm:px-3"
          >
            <Sparkles size={17} />
            <span className="hidden sm:inline">
              Copilot
            </span>
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
              title={[
                user.name ??
                  user.email,
                user.roleName,
              ]
                .filter(Boolean)
                .join(' · ')}
            >
              {initials}
            </div>

            <div className="hidden max-w-36 2xl:block">
              <p className="truncate text-xs font-semibold text-blue-950">
                {user.name ??
                  user.email}
              </p>

              {user.roleName && (
                <p className="truncate text-xs text-blue-700">
                  {
                    user.roleName
                  }
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">
              Cerrar sesión
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
