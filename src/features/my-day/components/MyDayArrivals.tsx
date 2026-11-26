// MD-003: "PO's por llegar (14 días)" from /api/my-day/arrivals, always at
// the data cutoff. Amounts by currency, never converted; a hidden cost reads
// "Sin acceso a costo", never $0.

import type {
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
  offset: number
  onOffsetChange: (offset: number) => void
}

export function MyDayArrivals({
  state,
  offset,
  onOffsetChange,
}: MyDayArrivalsProps) {
  const data = state.data
  const summary = data?.summary

  return (
    <MyDayBlock
      className="lg:col-span-2"
      title="PO's por llegar (14 días)"
      subtitle={summary
        ? `${formatInteger(summary.upcoming)} por llegar · ${formatInteger(summary.overdue)} atrasadas`
        : undefined}
      sourceLine={data
        ? `${sourceLabel('purchases', data.sources.purchases)} · ${AT_CUTOFF_NOTE}${data.window ? ` · del ${formatDate(data.window.from)} al ${formatDate(data.window.to)}` : ''}`
        : AT_CUTOFF_NOTE}
      note="Montos por moneda, sin convertir"
      warnings={[data ? sourceWarning('purchases', data.sources.purchases) : null]}
      status={blockStatus(state, (value) => value.rows.length === 0)}
      errorMessage={blockErrorMessage(state.error)}
      emptyMessage={reasonMessage(data?.reason) ?? "Sin PO's por llegar en los próximos 14 días."}
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
