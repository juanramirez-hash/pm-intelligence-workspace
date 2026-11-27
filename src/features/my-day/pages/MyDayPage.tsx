// MD-003: "Mi día", the PM's entry page. It only reads /api/my-day/* and
// /api/actions: no /api/data/* dataset is downloaded (the route is outside
// DataHydrationGate). Each block loads and fails on its own.

import {
  useState,
} from 'react'

import {
  ShieldAlert,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  useAuth,
} from '../../auth/useAuth'

import type {
  AuthenticatedUser,
} from '../../auth/authTypes'

import {
  accessibleScreens,
} from '../../../layouts/navigation/navigationConfig'

import {
  resolveActionBrandKeys,
} from '../actions/selectPriorityActions'

import {
  loadMyDayArrivals,
  loadMyDayLostCustomers,
  loadMyDayOpenActions,
  loadMyDayStockAlerts,
  loadMyDaySummary,
} from '../api/myDayApi'

import type {
  MyDayArrivalTab,
  MyDaySummaryResponse,
  MyDayView,
} from '../api/myDayTypes'

import {
  formatInteger,
  formatPeriod,
} from '../format/myDayFormat'

import {
  NOT_AVAILABLE_FOR_ACCESS,
  reasonMessage,
} from '../format/myDayLabels'

import {
  MY_DAY_SUMMARY_LIMITS,
} from '../format/myDaySummary'

import {
  useMyDayBlock,
  type MyDayBlockState,
} from '../hooks/useMyDayBlock'

import {
  MyDayArrivals,
} from '../components/MyDayArrivals'

import {
  MyDayBlock,
} from '../components/MyDayBlock'

import {
  MyDayBrandTable,
} from '../components/MyDayBrandTable'

import {
  MyDayHeader,
} from '../components/MyDayHeader'

import {
  MyDayKpis,
} from '../components/MyDayKpis'

import {
  MyDayLostCustomers,
} from '../components/MyDayLostCustomers'

import {
  MyDayPriorityActions,
} from '../components/MyDayPriorityActions'

import {
  MyDayLowStock,
  MyDayOutOfStock,
} from '../components/MyDayStockBlocks'

import {
  blockErrorMessage,
  blockStatus,
  isAccessDenied,
} from '../components/blockState'

// NAV-001: until NAV-002 (assistant role), users without commercial scope
// land here after the login; they get links to the screens they can open.
function NotAvailableForAccess({ user }: { user: AuthenticatedUser }) {
  const screens = accessibleScreens(user).filter((screen) => screen.id !== 'my-day')

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <ShieldAlert aria-hidden="true" className="text-amber-500" size={44} strokeWidth={1.8} />
      <p className="mt-4 text-lg font-semibold text-slate-900">
        {NOT_AVAILABLE_FOR_ACCESS}
      </p>

      {screens.length > 0 ? (
        <>
          <p className="mt-2 text-sm text-slate-500">
            Puedes abrir:
          </p>
          <ul data-my-day-allowed-screens="true" className="mt-3 flex max-w-xl flex-wrap justify-center gap-2">
            {screens.map((screen) => (
              <li key={screen.id}>
                <Link
                  to={screen.path}
                  className="inline-flex rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  {screen.label}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

function periodLine(data: MyDaySummaryResponse | null): string | null {
  if (!data?.period) {
    return null
  }

  const status = data.periodStatus === 'open'
    ? 'mes abierto'
    : data.periodStatus === 'closed' ? 'mes cerrado' : null
  const days = data.workingDays
    ? `${formatInteger(data.workingDays.elapsed)} de ${formatInteger(data.workingDays.total)} días hábiles`
    : null

  return [formatPeriod(data.period), status, days].filter(Boolean).join(' · ')
}

function SummarySection({
  state,
  view,
}: {
  state: MyDayBlockState<MyDaySummaryResponse>
  view: MyDayView
}) {
  const data = state.data
  const title = view === 'all'
    ? 'Detalle ejecutivo de todas las marcas'
    : 'Detalle ejecutivo de mis marcas'
  const status = blockStatus(state, (value) => !value.portfolio || value.brands.length === 0)

  return (
    <>
      {status === 'ready' && data?.portfolio ? (
        <MyDayKpis
          portfolio={data.portfolio}
          workingDays={data.workingDays}
          periodStatus={data.periodStatus}
        />
      ) : null}

      <MyDayBlock
        title={title}
        sourceLine={periodLine(data)}
        note="Ordenado por venta · el cierre por ritmo usa días hábiles de lunes a viernes"
        status={status}
        errorMessage={blockErrorMessage(state.error)}
        emptyMessage={reasonMessage(data?.reason) ?? 'Sin marcas con venta o meta en el periodo.'}
        onRetry={state.reload}
      >
        {data ? <MyDayBrandTable brands={data.brands} /> : null}
      </MyDayBlock>
    </>
  )
}

export function MyDayPage() {
  const { user } = useAuth()
  const hasCommercialScope = user.scope === 'all' || user.scope === 'assigned'
  const canViewAll = user.scope === 'all'

  const [view, setView] = useState<MyDayView>('mine')
  const [period, setPeriod] = useState<string | null>(null)
  const [arrivalsTab, setArrivalsTab] = useState<MyDayArrivalTab>('upcoming')
  const [arrivalsOffset, setArrivalsOffset] = useState(0)

  const key = (...parts: Array<string | number | null>) =>
    hasCommercialScope ? parts.map((part) => part ?? '').join('|') : null

  const summary = useMyDayBlock(
    key('summary', view, period),
    (signal) => loadMyDaySummary({ view, period }, signal),
  )
  const lostCustomers = useMyDayBlock(
    key('lost-customers', view, period),
    (signal) => loadMyDayLostCustomers(
      { view, period, limit: MY_DAY_SUMMARY_LIMITS.lostCustomers },
      signal,
    ),
  )
  const stockAlerts = useMyDayBlock(
    key('stock-alerts', view),
    (signal) => loadMyDayStockAlerts({ view, limit: MY_DAY_SUMMARY_LIMITS.stockAlerts }, signal),
  )
  const arrivals = useMyDayBlock(
    key('arrivals', view, arrivalsTab, arrivalsOffset),
    (signal) => loadMyDayArrivals(
      { view, status: arrivalsTab, limit: MY_DAY_SUMMARY_LIMITS.arrivals, offset: arrivalsOffset },
      signal,
    ),
  )
  const actions = useMyDayBlock(
    key('actions'),
    (signal) => loadMyDayOpenActions(signal),
  )

  if (!hasCommercialScope || isAccessDenied(summary.error)) {
    return <NotAvailableForAccess user={user} />
  }

  const dataCutoff =
    summary.data?.dataCutoff ??
    stockAlerts.data?.dataCutoff ??
    arrivals.data?.dataCutoff ??
    null

  const changeView = (next: MyDayView) => {
    setView(next)
    setArrivalsOffset(0)
  }

  // Each tab pages on its own, from the first page.
  const changeArrivalsTab = (next: MyDayArrivalTab) => {
    setArrivalsTab(next)
    setArrivalsOffset(0)
  }

  return (
    <div data-my-day-page="true" className="flex flex-col gap-6">
      <MyDayHeader
        dataCutoff={dataCutoff}
        canViewAll={canViewAll}
        view={view}
        onViewChange={changeView}
        period={period}
        onPeriodChange={setPeriod}
      />

      <p className="-mt-3 text-xs text-slate-500">
        El periodo cambia los indicadores, las marcas y los clientes por recuperar. Inventario, productos por agotarse, agotados y PO's siempre van al corte.
      </p>

      <SummarySection state={summary} view={view} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MyDayPriorityActions
          state={actions}
          brandKeys={resolveActionBrandKeys(user, view)}
        />

        <MyDayLostCustomers
          state={lostCustomers}
          view={view}
          period={period}
        />

        <MyDayLowStock state={stockAlerts} view={view} />

        <MyDayOutOfStock state={stockAlerts} view={view} />

        <MyDayArrivals
          state={arrivals}
          tab={arrivalsTab}
          onTabChange={changeArrivalsTab}
          offset={arrivalsOffset}
          onOffsetChange={setArrivalsOffset}
        />
      </div>
    </div>
  )
}
