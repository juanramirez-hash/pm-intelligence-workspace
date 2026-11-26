// MD-003: "Productos por agotarse" and "Productos agotados" from
// /api/my-day/stock-alerts (always at the data cutoff, not by period), and
// the full paged list (/api/my-day/stock-alerts/:kind).

import {
  useState,
} from 'react'

import {
  loadMyDayStockAlertList,
} from '../api/myDayApi'

import type {
  MyDayStockAlertKind,
  MyDayStockAlertRow,
  MyDayStockAlertsResponse,
  MyDayView,
} from '../api/myDayTypes'

import {
  formatDate,
  formatDays,
  formatInteger,
  formatUnits,
} from '../format/myDayFormat'

import {
  ARRIVAL_STATUS_CLASSES,
  ARRIVAL_STATUS_LABELS,
  INCOMPLETE_INVENTORY_WARNING,
  reasonMessage,
  sourceLabel,
  sourceWarning,
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

export const LOW_STOCK_NOTE = '30 días de cobertura o menos · venta promedio de 3 meses'
export const OUT_OF_STOCK_NOTE = 'Todos los artículos DE LINEA con existencia total en 0'
export const AT_CUTOFF_NOTE = 'Al corte · no depende del periodo'
const PAGE_SIZE = 50

/** "3 dic 2026 · Programada", or just the status ("Sin PO"). */
export function NextArrivalCell({ row }: { row: Pick<MyDayStockAlertRow, 'arrivalStatus' | 'nextArrival'> }) {
  const label = ARRIVAL_STATUS_LABELS[row.arrivalStatus]
  const arrival = row.nextArrival

  return (
    <div className="flex flex-col">
      <span className={`text-xs font-semibold ${ARRIVAL_STATUS_CLASSES[row.arrivalStatus]}`}>
        {arrival?.date ? `${formatDate(arrival.date)} · ${label}` : label}
      </span>
      {arrival ? (
        <span className="text-xs text-slate-500">
          {arrival.purchaseOrderNumber}
          {arrival.shipmentStatus ? ` · ${arrival.shipmentStatus}` : ''}
        </span>
      ) : null}
    </div>
  )
}

function LowStockRows({ rows }: { rows: readonly MyDayStockAlertRow[] }) {
  return (
    <MyDayTable minWidth="min-w-[640px]">
      <thead>
        <tr>
          <th className={TH}>Modelo</th>
          <th className={TH}>Marca</th>
          <th className={`${TH} text-right`}>Existencia</th>
          <th className={`${TH} text-right`}>Cobertura</th>
          <th className={`${TH} text-right`}>Por recibir</th>
          <th className={TH}>Próxima llegada</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.itemKey}>
            <td className={`${TD} font-medium text-slate-900`}>{row.itemCode}</td>
            <td className={TD}>{row.brandLabel ?? '—'}</td>
            <td className={TD_NUMBER}>{formatInteger(row.onHand)}</td>
            <td className={TD_NUMBER}>{formatDays(row.coverageDays)}</td>
            <td className={TD_NUMBER}>{formatInteger(row.pendingReceiptUnits)}</td>
            <td className={TD}><NextArrivalCell row={row} /></td>
          </tr>
        ))}
      </tbody>
    </MyDayTable>
  )
}

function OutOfStockRows({ rows }: { rows: readonly MyDayStockAlertRow[] }) {
  return (
    <MyDayTable minWidth="min-w-[640px]">
      <thead>
        <tr>
          <th className={TH}>Modelo</th>
          <th className={TH}>Marca</th>
          <th className={`${TH} text-right`}>Venta prom. mensual</th>
          <th className={TH}>Última venta</th>
          <th className={`${TH} text-right`}>Por recibir</th>
          <th className={TH}>Próxima llegada</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.itemKey} data-my-day-out-of-stock={row.itemKey}>
            <td className={`${TD} font-medium text-slate-900`}>{row.itemCode}</td>
            <td className={TD}>{row.brandLabel ?? '—'}</td>
            <td className={TD_NUMBER}>{formatUnits(row.avgMonthlyUnits)}</td>
            <td className={TD}>{formatDate(row.lastSaleDate)}</td>
            <td className={TD_NUMBER}>{formatInteger(row.pendingReceiptUnits)}</td>
            <td className={TD}><NextArrivalCell row={row} /></td>
          </tr>
        ))}
      </tbody>
    </MyDayTable>
  )
}

const ROWS_BY_KIND: Record<MyDayStockAlertKind, typeof LowStockRows> = {
  'low-stock': LowStockRows,
  'out-of-stock': OutOfStockRows,
}

function StockAlertListPanel({ kind, view }: { kind: MyDayStockAlertKind, view: MyDayView }) {
  const [offset, setOffset] = useState(0)
  const state = useMyDayBlock(
    `stock-alert-list|${kind}|${view}|${offset}`,
    (signal) => loadMyDayStockAlertList(kind, { view, limit: PAGE_SIZE, offset }, signal),
  )
  const Rows = ROWS_BY_KIND[kind]

  return (
    <div data-my-day-panel={kind} className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {state.status === 'loading' ? <p className="text-xs text-slate-400">Cargando…</p> : null}
      {state.status === 'error' ? <p className="text-xs text-rose-700">{blockErrorMessage(state.error)}</p> : null}
      {state.data ? (
        <>
          <Rows rows={state.data.rows} />
          <Pager
            offset={offset}
            limit={PAGE_SIZE}
            total={state.data.total}
            hasMore={state.data.hasMore}
            onChange={setOffset}
          />
        </>
      ) : null}
    </div>
  )
}

interface StockBlockProps {
  state: MyDayBlockState<MyDayStockAlertsResponse>
  view: MyDayView
}

function stockWarnings(data: MyDayStockAlertsResponse | null, withPurchases: boolean) {
  return [
    data?.inventoryCoverage && !data.inventoryCoverage.complete ? INCOMPLETE_INVENTORY_WARNING : null,
    data ? sourceWarning('inventory', data.sources.inventory) : null,
    data ? sourceWarning('sales', data.sources.sales) : null,
    data && withPurchases ? sourceWarning('purchases', data.sources.purchases) : null,
  ]
}

function stockSourceLine(data: MyDayStockAlertsResponse | null): string {
  return data
    ? `${sourceLabel('inventory', data.sources.inventory)} · ${AT_CUTOFF_NOTE}`
    : AT_CUTOFF_NOTE
}

function ViewAllButton({ open, total, onToggle }: { open: boolean, total: number, onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="font-medium text-blue-700 hover:underline">
      {open ? 'Ocultar lista completa' : `Ver todos (${formatInteger(total)})`}
    </button>
  )
}

export function MyDayLowStock({ state, view }: StockBlockProps) {
  const [showAll, setShowAll] = useState(false)
  const data = state.data
  const page = data?.lowStock

  return (
    <MyDayBlock
      title="Productos por agotarse"
      subtitle={page ? `${formatInteger(page.total)} artículos` : undefined}
      sourceLine={stockSourceLine(data)}
      note={LOW_STOCK_NOTE}
      warnings={stockWarnings(data, true)}
      status={blockStatus(state, (value) => value.lowStock.rows.length === 0)}
      errorMessage={blockErrorMessage(state.error)}
      emptyMessage={reasonMessage(data?.reason) ?? 'Ningún artículo con 30 días de cobertura o menos.'}
      onRetry={state.reload}
      footer={page && page.total > page.rows.length ? (
        <ViewAllButton open={showAll} total={page.total} onToggle={() => setShowAll((value) => !value)} />
      ) : null}
    >
      {page ? <LowStockRows rows={page.rows} /> : null}
      {showAll ? <StockAlertListPanel kind="low-stock" view={view} /> : null}
    </MyDayBlock>
  )
}

export function MyDayOutOfStock({ state, view }: StockBlockProps) {
  const [showAll, setShowAll] = useState(false)
  const data = state.data
  const page = data?.outOfStock

  return (
    <MyDayBlock
      title="Productos agotados"
      subtitle={page ? `${formatInteger(page.total)} artículos` : undefined}
      sourceLine={stockSourceLine(data)}
      note={OUT_OF_STOCK_NOTE}
      warnings={stockWarnings(data, true)}
      status={blockStatus(state, (value) => value.outOfStock.rows.length === 0)}
      errorMessage={blockErrorMessage(state.error)}
      emptyMessage={reasonMessage(data?.reason) ?? 'Ningún artículo DE LINEA agotado.'}
      onRetry={state.reload}
      footer={page && page.total > 0 ? (
        <ViewAllButton open={showAll} total={page.total} onToggle={() => setShowAll((value) => !value)} />
      ) : null}
    >
      {page ? <OutOfStockRows rows={page.rows} /> : null}
      {showAll ? <StockAlertListPanel kind="out-of-stock" view={view} /> : null}
    </MyDayBlock>
  )
}
