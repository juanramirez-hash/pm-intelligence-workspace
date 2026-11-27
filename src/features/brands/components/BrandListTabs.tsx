// MB-001: "Clientes" and "Productos" tabs of the brand page. Each filter is
// its own server call (/api/brands/:brand/customers | products), 50 rows per
// page. Gross profit is "—" without cost access; missing stock is "—".

import {
  useState,
} from 'react'

import type {
  BrandCustomerFilter,
  BrandCustomerRow,
  BrandCustomersResponse,
  BrandProductFilter,
  BrandProductRow,
  BrandProductsResponse,
} from '../api/brandsTypes'

import {
  loadBrandCustomers,
  loadBrandProducts,
} from '../api/brandsApi'

import {
  COST_HIDDEN_NOTE,
  brandReasonMessage,
  describeDates,
  variationText,
} from '../format/brandsFormat'

import {
  EMPTY_VALUE,
  formatDate,
  formatInteger,
  formatMoney,
  formatUnits,
} from '../../my-day/format/myDayFormat'

import {
  useMyDayBlock,
} from '../../my-day/hooks/useMyDayBlock'

import {
  MyDayBlock,
  MyDayTable,
  Pager,
  TD,
  TD_NUMBER,
  TH,
} from '../../my-day/components/MyDayBlock'

import {
  useBrandContext,
} from './brandContext'

const PAGE_SIZE = 50

interface FilterOption<T extends string> {
  id: T
  label: string
}

const CUSTOMER_FILTERS: ReadonlyArray<FilterOption<BrandCustomerFilter>> = [
  { id: 'activos', label: 'Activos' },
  { id: 'por-recuperar', label: 'Por recuperar' },
  { id: 'suben', label: 'Suben' },
  { id: 'bajan', label: 'Bajan' },
]

const PRODUCT_FILTERS: ReadonlyArray<FilterOption<BrandProductFilter>> = [
  { id: 'vendidos', label: 'Vendidos' },
  { id: 'por-recuperar', label: 'Por recuperar' },
  { id: 'agotados', label: 'Agotados' },
]

function FilterTabs<T extends string>({
  label,
  options,
  value,
  counts,
  onChange,
}: {
  label: string
  options: ReadonlyArray<FilterOption<T>>
  value: T
  counts?: Partial<Record<T, number>> | null
  onChange: (value: T) => void
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          data-brand-filter={option.id}
          onClick={() => onChange(option.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === option.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {option.label}
          {counts && typeof counts[option.id] === 'number'
            ? ` (${formatInteger(counts[option.id])})`
            : ''}
        </button>
      ))}
    </div>
  )
}

const noReason = brandReasonMessage

// -- Customers ------------------------------------------------------------------------

export function CustomersTable({
  rows,
  filter,
  hidden,
}: {
  rows: BrandCustomerRow[]
  filter: BrandCustomerFilter
  hidden: boolean
}) {
  if (filter === 'por-recuperar') {
    return (
      <MyDayTable minWidth="min-w-[760px]">
        <thead>
          <tr>
            <th className={TH}>Cliente</th>
            <th className={`${TH} text-right`}>Venta del mes base</th>
            <th className={`${TH} text-right`}>Promedio mensual</th>
            <th className={`${TH} text-right`}>Meses con venta</th>
            <th className={TH}>Última compra</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.customerId ?? `sin-id-${index}`}>
              <td className={`${TD} font-medium text-slate-900`}>{row.customerName ?? row.customerId ?? EMPTY_VALUE}</td>
              <td className={TD_NUMBER}>{formatMoney(row.baseRevenue)}</td>
              <td className={TD_NUMBER}>{formatMoney(row.avgMonthlyRevenue)}</td>
              <td className={TD_NUMBER}>{formatInteger(row.activeMonths)}</td>
              <td className={TD}>{formatDate(row.lastSaleDate)}</td>
            </tr>
          ))}
        </tbody>
      </MyDayTable>
    )
  }

  return (
    <MyDayTable minWidth="min-w-[860px]">
      <thead>
        <tr>
          <th className={TH}>Cliente</th>
          <th className={`${TH} text-right`}>Venta</th>
          <th className={`${TH} text-right`}>Periodo anterior</th>
          <th className={`${TH} text-right`}>Variación</th>
          <th className={`${TH} text-right`}>%</th>
          <th className={`${TH} text-right`}>Utilidad bruta</th>
          <th className={`${TH} text-right`}>Documentos</th>
          <th className={TH}>Última compra</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.customerId ?? `sin-id-${index}`}>
            <td className={`${TD} font-medium text-slate-900`}>{row.customerName ?? row.customerId ?? EMPTY_VALUE}</td>
            <td className={TD_NUMBER}>{formatMoney(row.revenue)}</td>
            <td className={TD_NUMBER}>{formatMoney(row.previousRevenue)}</td>
            <td className={TD_NUMBER}>{formatMoney(row.variation)}</td>
            <td className={TD_NUMBER}>{variationText({ amount: row.variation ?? null, percentage: row.variationPercentage ?? null })}</td>
            <td className={TD_NUMBER}>{hidden ? EMPTY_VALUE : formatMoney(row.grossProfit)}</td>
            <td className={TD_NUMBER}>{formatInteger(row.documents)}</td>
            <td className={TD}>{formatDate(row.lastSaleDate)}</td>
          </tr>
        ))}
      </tbody>
    </MyDayTable>
  )
}

export function BrandCustomersTab() {
  const { routeBrand, period, header } = useBrandContext()
  const [filter, setFilter] = useState<BrandCustomerFilter>('activos')
  const [offset, setOffset] = useState(0)
  const block = useMyDayBlock<BrandCustomersResponse>(
    `${routeBrand}|${period ?? ''}|customers|${filter}|${offset}`,
    (signal) => loadBrandCustomers(routeBrand, { period, filter, limit: PAGE_SIZE, offset }, signal),
  )
  const data = block.data
  const status = block.status === 'success'
    ? (data?.rows.length ? 'ready' : 'empty')
    : block.status
  const hidden = header.costHidden

  return (
    <div className="flex flex-col gap-4" data-brand-tab-panel="clientes">
      {hidden ? (
        <p data-brand-cost-note="true" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {COST_HIDDEN_NOTE}
        </p>
      ) : null}

      <MyDayBlock
        title="Clientes de la marca"
        subtitle={data?.comparison ? `Periodo ${describeDates(data.comparison.currentFrom, data.comparison.currentTo)} contra ${describeDates(data.comparison.previousFrom, data.comparison.previousTo)}` : undefined}
        note={data?.lossWindow
          ? `Por recuperar: compraron entre ${formatDate(data.lossWindow.baseFrom)} y ${formatDate(data.lossWindow.baseTo)} y no compraron entre ${formatDate(data.lossWindow.inactiveFrom)} y ${formatDate(data.lossWindow.inactiveTo)}.`
          : undefined}
        warnings={[noReason(data?.reason)]}
        status={status}
        errorMessage={block.error?.message}
        onRetry={block.reload}
        emptyMessage="No hay clientes para este filtro en el periodo."
        toolbar={(
          <FilterTabs
            label="Filtro de clientes"
            options={CUSTOMER_FILTERS}
            value={filter}
            counts={data?.counts}
            onChange={(next) => { setFilter(next); setOffset(0) }}
          />
        )}
        footer={data && (data.hasMore || offset > 0) ? (
          <Pager offset={offset} limit={PAGE_SIZE} total={data.counts?.[filter] ?? null} hasMore={data.hasMore} onChange={setOffset} />
        ) : null}
      >
        {data ? <CustomersTable rows={data.rows} filter={filter} hidden={hidden} /> : null}
      </MyDayBlock>
    </div>
  )
}

// -- Products -------------------------------------------------------------------------

const stockText = (value: number | null | undefined) =>
  typeof value === 'number' ? formatUnits(value) : EMPTY_VALUE

export function ProductsTable({
  rows,
  filter,
  hidden,
}: {
  rows: BrandProductRow[]
  filter: BrandProductFilter
  hidden: boolean
}) {
  const stockCells = (row: BrandProductRow) => (
    <>
      <td className={TD_NUMBER}>{stockText(row.onHand)}</td>
      <td className={TD_NUMBER}>{stockText(row.pendingReceiptUnits)}</td>
      <td className={TD}>{row.catalogStatus ?? EMPTY_VALUE}</td>
    </>
  )
  const stockHead = (
    <>
      <th className={`${TH} text-right`}>Existencia</th>
      <th className={`${TH} text-right`}>Por recibir</th>
      <th className={TH}>Estatus de catálogo</th>
    </>
  )

  if (filter === 'vendidos') {
    return (
      <MyDayTable minWidth="min-w-[1100px]">
        <thead>
          <tr>
            <th className={TH}>Producto</th>
            <th className={TH}>Modelo</th>
            <th className={`${TH} text-right`}>Unidades</th>
            <th className={`${TH} text-right`}>Venta</th>
            <th className={`${TH} text-right`}>Periodo anterior</th>
            <th className={`${TH} text-right`}>%</th>
            <th className={`${TH} text-right`}>Utilidad bruta</th>
            {stockHead}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.itemKey}>
              <td className={`${TD} font-medium text-slate-900`}>{row.itemCode ?? row.itemKey}</td>
              <td className={TD}>{row.model ?? EMPTY_VALUE}</td>
              <td className={TD_NUMBER}>{formatInteger(row.quantity)}</td>
              <td className={TD_NUMBER}>{formatMoney(row.revenue)}</td>
              <td className={TD_NUMBER}>{formatMoney(row.previousRevenue)}</td>
              <td className={TD_NUMBER}>{variationText({ amount: row.variation ?? null, percentage: row.variationPercentage ?? null })}</td>
              <td className={TD_NUMBER}>{hidden ? EMPTY_VALUE : formatMoney(row.grossProfit)}</td>
              {stockCells(row)}
            </tr>
          ))}
        </tbody>
      </MyDayTable>
    )
  }

  if (filter === 'por-recuperar') {
    return (
      <MyDayTable minWidth="min-w-[960px]">
        <thead>
          <tr>
            <th className={TH}>Producto</th>
            <th className={TH}>Modelo</th>
            <th className={`${TH} text-right`}>Venta del mes base</th>
            <th className={`${TH} text-right`}>Unidades base</th>
            {stockHead}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.itemKey}>
              <td className={`${TD} font-medium text-slate-900`}>{row.itemCode ?? row.itemKey}</td>
              <td className={TD}>{row.model ?? EMPTY_VALUE}</td>
              <td className={TD_NUMBER}>{formatMoney(row.baseRevenue)}</td>
              <td className={TD_NUMBER}>{formatInteger(row.baseQuantity)}</td>
              {stockCells(row)}
            </tr>
          ))}
        </tbody>
      </MyDayTable>
    )
  }

  return (
    <MyDayTable minWidth="min-w-[860px]">
      <thead>
        <tr>
          <th className={TH}>Producto</th>
          {stockHead}
          <th className={`${TH} text-right`}>Promedio mensual</th>
          <th className={TH}>Última venta</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.itemKey}>
            <td className={`${TD} font-medium text-slate-900`}>{row.itemCode ?? row.itemKey}</td>
            {stockCells(row)}
            <td className={TD_NUMBER}>{stockText(row.avgMonthlyUnits)}</td>
            <td className={TD}>{formatDate(row.lastSaleDate)}</td>
          </tr>
        ))}
      </tbody>
    </MyDayTable>
  )
}

export function BrandProductsTab() {
  const { routeBrand, period, header } = useBrandContext()
  const [filter, setFilter] = useState<BrandProductFilter>('vendidos')
  const [offset, setOffset] = useState(0)
  const block = useMyDayBlock<BrandProductsResponse>(
    `${routeBrand}|${period ?? ''}|products|${filter}|${offset}`,
    (signal) => loadBrandProducts(routeBrand, { period, filter, limit: PAGE_SIZE, offset }, signal),
  )
  const data = block.data
  const status = block.status === 'success'
    ? (data?.rows.length ? 'ready' : 'empty')
    : block.status
  const hidden = header.costHidden

  return (
    <div className="flex flex-col gap-4" data-brand-tab-panel="productos">
      {hidden ? (
        <p data-brand-cost-note="true" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {COST_HIDDEN_NOTE}
        </p>
      ) : null}

      <MyDayBlock
        title="Productos de la marca"
        subtitle={data ? `${formatInteger(data.total)} en este filtro` : undefined}
        warnings={[
          noReason(data?.reason),
          data?.sources?.inventory?.status === 'stale' ? 'El inventario no está al día: la existencia puede haber cambiado.' : null,
        ]}
        status={status}
        errorMessage={block.error?.message}
        onRetry={block.reload}
        emptyMessage="No hay productos para este filtro en el periodo."
        toolbar={(
          <FilterTabs
            label="Filtro de productos"
            options={PRODUCT_FILTERS}
            value={filter}
            onChange={(next) => { setFilter(next); setOffset(0) }}
          />
        )}
        footer={data && (data.hasMore || offset > 0) ? (
          <Pager offset={offset} limit={PAGE_SIZE} total={data.total} hasMore={data.hasMore} onChange={setOffset} />
        ) : null}
      >
        {data ? <ProductsTable rows={data.rows} filter={filter} hidden={hidden} /> : null}
      </MyDayBlock>
    </div>
  )
}
