// MB-001: frame of the brand page (/brands/:brandId/<tab>): title, team,
// data cutoff, period selector and tabs. It loads the brand header once
// (/api/brands/:brand) and hands it to the tab through the outlet context;
// a 403 or 404 replaces the tab with the server message.

import type {
  ReactNode,
} from 'react'

import {
  ArrowLeft,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react'

import {
  Link,
  Outlet,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import {
  BrandsApiError,
  loadBrandHeader,
} from '../api/brandsApi'

import type {
  BrandHeaderResponse,
  BrandTabId,
} from '../api/brandsTypes'

import {
  BrandContext,
  tabOfPath,
} from './brandContext'

import {
  BRAND_TABS,
  FORECAST_TAB_BADGE,
  FORECAST_TAB_LABEL,
  brandForecastPath,
  brandTabPath,
  readPeriodParam,
} from '../format/brandsFormat'

import {
  capitalizeFirst,
  formatDate,
  formatPeriod,
} from '../../my-day/format/myDayFormat'

import {
  useMyDayBlock,
} from '../../my-day/hooks/useMyDayBlock'

export function BrandErrorState({
  error,
  onRetry,
}: {
  error: Error
  onRetry?: () => void
}) {
  const status = error instanceof BrandsApiError ? error.status : null
  const restricted = status === 403

  return (
    <div
      data-brand-error={status ?? 'unknown'}
      className="mx-auto flex max-w-xl flex-col items-center gap-3 py-16 text-center"
    >
      <ShieldAlert
        aria-hidden="true"
        className={restricted ? 'text-amber-500' : 'text-slate-400'}
        size={40}
      />

      <h1 className="text-xl font-semibold text-slate-900">
        {restricted ? 'Acceso restringido' : status === 404 ? 'Marca no encontrada' : 'No se pudo cargar la marca'}
      </h1>

      <p className="text-sm text-slate-600">
        {error.message}
      </p>

      <div className="flex gap-3">
        <Link
          to="/brands"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <ArrowLeft aria-hidden="true" size={15} />
          Volver a Marcas
        </Link>

        {onRetry && status !== 403 && status !== 404 ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  )
}

interface BrandFrameViewProps {
  routeBrand: string
  period: string | null
  header: BrandHeaderResponse | null
  activeTab: BrandTabId | null
  onPeriodChange: (period: string) => void
  children: ReactNode
}

/** Presentational frame: testable without a router state. */
export function BrandFrameView({
  routeBrand,
  period,
  header,
  activeTab,
  onPeriodChange,
  children,
}: BrandFrameViewProps) {
  const label = header?.brandLabel ?? null
  const selectedPeriod = period ?? header?.period ?? ''
  const periods = header?.periods ?? []
  const team = header?.team

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10">
        <Link
          to="/brands"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Volver a Marcas
        </Link>

        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F58220]">
              Ficha de marca
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {label ?? decodeURIComponent(routeBrand)}
            </h1>

            {team ? (
              <p data-brand-team="true" className="mt-1 text-sm text-slate-600">
                PM: {team.pms.length > 0 ? team.pms.map((member) => member.name).join(', ') : '—'}
                {team.assistants.length > 0
                  ? ` · Auxiliar: ${team.assistants.map((member) => member.name).join(', ')}`
                  : ''}
              </p>
            ) : null}

            {header ? (
              <p
                data-brand-cutoff="true"
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600"
              >
                <CalendarDays aria-hidden="true" className="text-blue-600" size={15} />
                Datos al corte: <strong className="font-semibold text-slate-900">{formatDate(header.dataCutoff)}</strong>
                {header.lastSaleDate ? ` · Última venta: ${formatDate(header.lastSaleDate)}` : ''}
              </p>
            ) : null}
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Periodo de venta
            <select
              value={selectedPeriod}
              disabled={periods.length === 0}
              onChange={(event) => onPeriodChange(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm disabled:opacity-50"
            >
              {periods.map((value) => (
                <option key={value} value={value}>
                  {capitalizeFirst(formatPeriod(value))}
                </option>
              ))}
            </select>
          </label>
        </header>

        <nav
          aria-label="Secciones de la marca"
          className="mt-5 flex flex-wrap gap-1 border-b border-slate-200"
        >
          {BRAND_TABS.map((tab) => (
            <Link
              key={tab.id}
              to={brandTabPath(routeBrand, label, tab.id, period)}
              data-brand-tab={tab.id}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </Link>
          ))}

          <Link
            to={brandForecastPath(routeBrand, label)}
            data-brand-tab="pronostico"
            className="-mb-px inline-flex items-center gap-2 border-b-2 border-transparent px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            {FORECAST_TAB_LABEL}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {FORECAST_TAB_BADGE}
            </span>
          </Link>
        </nav>

        <div className="mt-6">
          {children}
        </div>
      </div>
    </main>
  )
}

/**
 * Route element of the ungated tabs (ventas, clientes, productos): an Outlet
 * with the loaded header. The Inteligencia tab uses BrandFrame with children.
 */
export function BrandFrame({
  children,
}: {
  children?: ReactNode
}) {
  const { brandId = '' } = useParams<{ brandId: string }>()
  const { pathname } = useLocation()
  const activeTab = tabOfPath(pathname)
  const [searchParams, setSearchParams] = useSearchParams()
  const period = readPeriodParam(searchParams.get('period'))
  const block = useMyDayBlock<BrandHeaderResponse>(
    `${brandId}|${period ?? ''}`,
    (signal) => loadBrandHeader(brandId, period, signal),
  )

  const changePeriod = (next: string) => {
    const params = new URLSearchParams(searchParams)

    params.set('period', next)
    setSearchParams(params)
  }

  if (block.status === 'error' && block.error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10">
          <BrandErrorState error={block.error} onRetry={block.reload} />
        </div>
      </main>
    )
  }

  const header = block.data

  return (
    <BrandFrameView
      routeBrand={brandId}
      period={period}
      header={header}
      activeTab={activeTab}
      onPeriodChange={changePeriod}
    >
      {header ? (
        <BrandContext.Provider value={{ routeBrand: brandId, period, header }}>
          {children ?? <Outlet />}
        </BrandContext.Provider>
      ) : (
        <p className="py-10 text-center text-sm text-slate-400">Cargando…</p>
      )}
    </BrandFrameView>
  )
}
