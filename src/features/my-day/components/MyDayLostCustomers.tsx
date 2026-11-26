// MD-003: "Clientes por recuperar": the first 5 and the full list, paged,
// in a panel inside the same block.

import {
  useState,
} from 'react'

import {
  loadMyDayLostCustomers,
} from '../api/myDayApi'

import type {
  MyDayLostCustomer,
  MyDayLostCustomersResponse,
  MyDayView,
} from '../api/myDayTypes'

import {
  formatDate,
  formatMoney,
  formatPeriod,
} from '../format/myDayFormat'

import {
  reasonMessage,
} from '../format/myDayLabels'

import {
  useMyDayBlock,
  type MyDayBlockState,
} from '../hooks/useMyDayBlock'

import {
  MyDayBlock,
  MyDayTable,
  Pager,
  TD,
  TD_NUMBER,
  TH,
} from './MyDayBlock'

import {
  blockErrorMessage,
  blockStatus,
} from './blockState'

export const LOST_CUSTOMERS_NOTE = 'Compraban la marca y llevan 2 meses sin comprar'
const PAGE_SIZE = 50

function LostCustomerRows({ rows }: { rows: readonly MyDayLostCustomer[] }) {
  return (
    <MyDayTable minWidth="min-w-[560px]">
      <thead>
        <tr>
          <th className={TH}>Cliente</th>
          <th className={TH}>Marca</th>
          <th className={`${TH} text-right`}>Venta base</th>
          <th className={`${TH} text-right`}>Prom. mensual</th>
          <th className={TH}>Última compra</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.brandKey}-${row.customerId}`}>
            <td className={`${TD} max-w-[220px] truncate font-medium text-slate-900`} title={row.customerName ?? row.customerId}>
              {row.customerName ?? row.customerId}
            </td>
            <td className={TD}>{row.brandLabel}</td>
            <td className={TD_NUMBER}>{formatMoney(row.baseRevenue)}</td>
            <td className={TD_NUMBER}>{formatMoney(row.avgMonthlyRevenue)}</td>
            <td className={TD}>{formatDate(row.lastSaleDate)}</td>
          </tr>
        ))}
      </tbody>
    </MyDayTable>
  )
}

function LostCustomersPanel({ view, period }: { view: MyDayView, period: string | null }) {
  const [offset, setOffset] = useState(0)
  const state = useMyDayBlock(
    `lost-customers-panel|${view}|${period ?? ''}|${offset}`,
    (signal) => loadMyDayLostCustomers({ view, period, limit: PAGE_SIZE, offset }, signal),
  )

  return (
    <div data-my-day-panel="lost-customers" className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {state.status === 'loading' ? <p className="text-xs text-slate-400">Cargando…</p> : null}
      {state.status === 'error' ? <p className="text-xs text-rose-700">{blockErrorMessage(state.error)}</p> : null}
      {state.data ? (
        <>
          <LostCustomerRows rows={state.data.rows} />
          <Pager offset={offset} limit={PAGE_SIZE} hasMore={state.data.hasMore} onChange={setOffset} />
        </>
      ) : null}
    </div>
  )
}

interface MyDayLostCustomersProps {
  state: MyDayBlockState<MyDayLostCustomersResponse>
  view: MyDayView
  period: string | null
}

export function MyDayLostCustomers({
  state,
  view,
  period,
}: MyDayLostCustomersProps) {
  const [showAll, setShowAll] = useState(false)
  const data = state.data
  const window = data?.window

  return (
    <MyDayBlock
      title="Clientes por recuperar"
      note={LOST_CUSTOMERS_NOTE}
      sourceLine={window
        ? `Compraron en ${formatPeriod(window.baseFrom)} y no en ${formatPeriod(window.inactiveFrom)}–${formatPeriod(window.inactiveTo)}`
        : null}
      status={blockStatus(state, (value) => value.rows.length === 0)}
      errorMessage={blockErrorMessage(state.error)}
      emptyMessage={reasonMessage(data?.reason) ?? 'Sin clientes por recuperar en el periodo.'}
      onRetry={state.reload}
      footer={data && data.rows.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="font-medium text-blue-700 hover:underline"
        >
          {showAll ? 'Ocultar lista completa' : 'Ver lista completa'}
        </button>
      ) : null}
    >
      {data ? <LostCustomerRows rows={data.rows} /> : null}
      {showAll ? <LostCustomersPanel view={view} period={period} /> : null}
    </MyDayBlock>
  )
}
