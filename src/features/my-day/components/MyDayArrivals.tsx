// MD-003: "PO's por llegar (14 días)" from /api/my-day/arrivals, always at
// the data cutoff. Amounts by currency, never converted; a hidden cost reads
// "Sin acceso a costo", never $0.
//
// MD-003-HOTFIX1: "Por llegar" (cutoff to cutoff + 14 days, soonest first)
// and "Atrasadas" (before the cutoff, most recent first) are separate tabs,
// each one paged by the server (status=upcoming|overdue), so the overdue
// orders no longer bury the ones arriving soon.

import type {
  MyDayArrivalTab,
  MyDayArrivalsResponse,
} from '../api/myDayTypes'

import {
  EMPTY_VALUE,
  formatAmountsByCurrency,
  formatDate,
  formatInteger,
} from '../format/myDayFormat'

import {
  reasonMessage,
  sourceLabel,
  sourceWarning,
} from '../format/myDayLabels'

import type {
  MyDayBlockState,
} from '../hooks/useMyDayBlock'

import {
  AT_CUTOFF_NOTE,
} from './MyDayStockBlocks'

import {
  MyDayBlock,
  MyDayTable,
  Pager,
  TD,
  TH,
} from './MyDayBlock'

import {
  blockErrorMessage,
  blockStatus,
} from './blockState'

interface MyDayArrivalsProps {
  state: MyDayBlockState<MyDayArrivalsResponse>
  tab: MyDayArrivalTab
  onTabChange: (tab: MyDayArrivalTab) => void
  offset: number
  onOffsetChange: (offset: number) => void
}

const EMPTY_MESSAGES: Record<MyDayArrivalTab, string> = {
  upcoming: "Sin PO's por llegar en los próximos 14 días.",
  overdue: "Sin PO's atrasadas.",
}

function ArrivalTabs({
  tab,
  onTabChange,
  summary,
}: {
  tab: MyDayArrivalTab
  onTabChange: (tab: MyDayArrivalTab) => void
  summary: MyDayArrivalsResponse['summary'] | undefined
}) {
  const count = (value: number | undefined) =>
    typeof value === 'number' ? ` (${formatInteger(value)})` : ''
  const tabs: Array<{ value: MyDayArrivalTab, label: string }> = [
    { value: 'upcoming', label: `Por llegar${count(summary?.upcoming)}` },
    { value: 'overdue', label: `Atrasadas${count(summary?.overdue)}` },
  ]

  return (
    <div role="tablist" aria-label="PO's por estatus" className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
      {tabs.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={tab === item.value}
          data-my-day-arrival-tab={item.value}
          onClick={() => onTabChange(item.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            tab === item.value
              ? item.value === 'overdue' ? 'bg-white text-rose-700 shadow-sm' : 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function MyDayArrivals({
  state,
  tab,
  onTabChange,
  offset,
  onOffsetChange,
}: MyDayArrivalsProps) {
  const data = state.data

  return (
    <MyDayBlock
      className="lg:col-span-2"
      title="PO's por llegar (14 días)"
      sourceLine={data
        ? `${sourceLabel('purchases', data.sources.purchases)} · ${AT_CUTOFF_NOTE}${data.window ? ` · del ${formatDate(data.window.from)} al ${formatDate(data.window.to)}` : ''}`
        : AT_CUTOFF_NOTE}
      note={tab === 'overdue'
        ? 'Fecha estimada anterior al corte · de la más reciente a la más antigua · montos por moneda, sin convertir'
        : 'Fecha estimada entre el corte y 14 días después · de la más próxima a la más lejana · montos por moneda, sin convertir'}
      warnings={[data ? sourceWarning('purchases', data.sources.purchases) : null]}
      // Hidden only when the server explains why there is no data.
      toolbar={data?.reason
        ? null
        : <ArrivalTabs tab={tab} onTabChange={onTabChange} summary={data?.summary} />}
      status={blockStatus(state, (value) => value.rows.length === 0)}
      errorMessage={blockErrorMessage(state.error)}
      emptyMessage={reasonMessage(data?.reason) ?? EMPTY_MESSAGES[tab]}
      onRetry={state.reload}
      footer={data && data.total > data.limit ? (
        <Pager
          offset={offset}
          limit={data.limit}
          total={data.total}
          hasMore={data.hasMore}
          onChange={onOffsetChange}
        />
      ) : null}
    >
      {data ? (
        <MyDayTable minWidth="min-w-[960px]">
          <thead>
            <tr>
              <th className={TH}>PO</th>
              <th className={TH}>Proveedor</th>
              <th className={TH}>Marcas</th>
              <th className={TH}>Estatus de embarque</th>
              <th className={TH}>Llegada estimada</th>
              <th className={TH}>Atrasada</th>
              <th className={`${TH} text-right`}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.purchaseOrderNumber} data-my-day-arrival={row.purchaseOrderNumber}>
                <td className={`${TD} font-medium text-slate-900`}>{row.purchaseOrderNumber}</td>
                <td className={`${TD} max-w-[220px] truncate`} title={row.supplierName ?? undefined}>
                  {row.supplierName ?? EMPTY_VALUE}
                </td>
                <td className={`${TD} max-w-[200px] whitespace-normal`}>
                  {row.brands.map((brand) => brand.brandLabel ?? brand.brandKey ?? EMPTY_VALUE).join(', ') || EMPTY_VALUE}
                </td>
                <td className={TD}>{row.shipmentStatuses.join(', ') || EMPTY_VALUE}</td>
                <td className={TD}>{formatDate(row.expectedReceiptDate)}</td>
                <td className={TD}>
                  {row.overdue
                    ? <span className="font-semibold text-rose-700">Sí</span>
                    : 'No'}
                </td>
                <td className={`${TD} text-right tabular-nums`}>
                  {formatAmountsByCurrency(row.amountsByCurrency).map((amount) => (
                    <div key={amount}>{amount}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </MyDayTable>
      ) : null}
    </MyDayBlock>
  )
}
