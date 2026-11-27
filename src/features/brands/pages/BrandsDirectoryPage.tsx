// MB-001: "Marcas" directory (/brands), served by /api/brands. It does not
// download the /api/data/* datasets (the route is outside DataHydrationGate).
// Brands without sales in the period are listed with "—", never with $0.

import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  useAuth,
} from '../../auth/useAuth'

import {
  loadBrandDirectory,
} from '../api/brandsApi'

import type {
  BrandDirectoryResponse,
  BrandDirectoryRow,
  MyDayView,
} from '../api/brandsTypes'

import {
  BrandPortfolioPanel,
} from '../components/BrandPortfolioPanel'

import {
  brandReasonMessage,
  brandSegment,
} from '../format/brandsFormat'

import {
  EMPTY_VALUE,
  capitalizeFirst,
  formatDate,
  formatInteger,
  formatMoney,
  formatPercent,
  formatPeriod,
  formatSignedPercent,
} from '../../my-day/format/myDayFormat'

import {
  LIFECYCLE_CLASSES,
  LIFECYCLE_LABELS,
  PACE_TONE_CLASSES,
  TREND_CLASSES,
  TREND_LABELS,
  paceTone,
} from '../../my-day/format/myDayLabels'

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

const PAGE_SIZE = 50

type SalesFilter = '' | 'with' | 'without'
type SortKey = 'revenue' | 'name' | 'variation'

export function BrandsDirectoryTable({
  rows,
  costHidden = false,
}: {
  rows: readonly BrandDirectoryRow[]
  costHidden?: boolean
}) {
  return (
    <MyDayTable minWidth="min-w-[1100px]">
      <thead>
        <tr>
          <th className={TH}>Marca</th>
          <th className={TH}>Estado</th>
          <th className={`${TH} text-right`}>Venta</th>
          <th className={`${TH} text-right`}>Avance vs cuota</th>
          <th className={`${TH} text-right`}>Cierre por ritmo</th>
          <th className={`${TH} text-right`}>Variación</th>
          <th className={`${TH} text-right`}>Utilidad bruta</th>
          <th className={`${TH} text-right`}>Clientes</th>
          <th className={`${TH} text-right`}>Productos</th>
          <th className={TH}>Última venta</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const tone = paceTone(row.projectedAttainment)
          const noSales = !row.hasSalesInPeriod

          return (
            <tr key={row.brandKey} data-brand-row={row.brandKey}>
              <td className={`${TD} font-medium text-slate-900`}>
                <Link
                  to={`/brands/${encodeURIComponent(brandSegment(row.brandKey, row.brandLabel))}/ventas`}
                  className="text-blue-700 hover:underline"
                >
                  {row.brandLabel}
                </Link>
              </td>

              <td className={TD}>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${LIFECYCLE_CLASSES[row.lifecycleStatus]}`}>
                  {LIFECYCLE_LABELS[row.lifecycleStatus]}
                </span>
                <span className={`ml-2 text-xs font-medium ${TREND_CLASSES[row.trendStatus]}`}>
                  {TREND_LABELS[row.trendStatus]}
                </span>
              </td>

              <td className={TD_NUMBER}>{noSales ? EMPTY_VALUE : formatMoney(row.revenue)}</td>
              <td className={TD_NUMBER}>{noSales ? EMPTY_VALUE : formatPercent(row.attainment)}</td>

              <td className={TD_NUMBER}>
                {noSales || row.projectedAttainment === null ? EMPTY_VALUE : (
                  <span
                    data-pace-tone={tone}
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${PACE_TONE_CLASSES[tone]}`}
                  >
                    {formatPercent(row.projectedAttainment)}
                  </span>
                )}
              </td>

              <td className={`${TD_NUMBER} ${TREND_CLASSES[row.trendStatus]}`}>
                {noSales ? EMPTY_VALUE : formatSignedPercent(row.revenueVariationPercentage)}
              </td>

              <td className={TD_NUMBER}>
                {noSales || costHidden || row.grossProfit === null ? EMPTY_VALUE : formatMoney(row.grossProfit)}
              </td>
              <td className={TD_NUMBER}>{noSales ? EMPTY_VALUE : formatInteger(row.customers)}</td>
              <td className={TD_NUMBER}>{noSales ? EMPTY_VALUE : formatInteger(row.products)}</td>
              <td className={TD}>{formatDate(row.lastSaleDate)}</td>
            </tr>
          )
        })}
      </tbody>
    </MyDayTable>
  )
}

export function BrandsDirectoryPage() {
  const { user } = useAuth()
  const canViewAll = user.scope === 'all'
  const [view, setView] = useState<MyDayView>('mine')
  const [period, setPeriod] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [sales, setSales] = useState<SalesFilter>('')
  const [sort, setSort] = useState<SortKey>('revenue')
  const [offset, setOffset] = useState(0)

  // The search applies when the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(text)
      setOffset(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [text])

  const block = useMyDayBlock<BrandDirectoryResponse>(
    `${view}|${period ?? ''}|${query}|${sales}|${sort}|${offset}`,
    (signal) => loadBrandDirectory(
      { view, period, q: query, sales, sort, limit: PAGE_SIZE, offset },
      signal,
    ),
  )
  const data = block.data
  const periods = data?.periods ?? []
  const status = block.status === 'success'
    ? (data?.rows.length ? 'ready' : 'empty')
    : block.status
  const reset = () => setOffset(0)

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F58220]">
              Mi trabajo
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Marcas
            </h1>
            {data ? (
              <p data-brands-cutoff="true" className="mt-1 text-sm text-slate-600">
                Datos al corte: <strong className="font-semibold text-slate-900">{formatDate(data.dataCutoff)}</strong>
                {data.summary
                  ? ` · ${formatInteger(data.summary.brands)} marcas · ${formatInteger(data.summary.withSales)} con venta · ${formatInteger(data.summary.requiringAttention)} requieren atención`
                  : ''}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {canViewAll ? (
              <div role="group" aria-label="Marcas" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {([['mine', 'Mis marcas'], ['all', 'Todas']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={view === value}
                    onClick={() => { setView(value); reset() }}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      view === value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Periodo de venta
              <select
                value={period ?? data?.period ?? ''}
                disabled={periods.length === 0}
                onChange={(event) => { setPeriod(event.target.value); reset() }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm disabled:opacity-50"
              >
                {periods.map((value) => (
                  <option key={value} value={value}>{capitalizeFirst(formatPeriod(value))}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        {/* MB-001C: open by default; its own call, loading and error. */}
        <BrandPortfolioPanel view={view} period={period} />

        <MyDayBlock
          title="Directorio de marcas"
          subtitle={data ? `${formatInteger(data.total)} marcas` : undefined}
          warnings={[brandReasonMessage(data?.reason)]}
          status={status}
          errorMessage={block.error?.message}
          onRetry={block.reload}
          emptyMessage={brandReasonMessage(data?.reason) ?? 'No hay marcas que coincidan con el filtro.'}
          toolbar={(
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Buscar marca
                <input
                  type="search"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Nombre de la marca"
                  className="w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Venta en el periodo
                <select
                  value={sales}
                  onChange={(event) => { setSales(event.target.value as SalesFilter); reset() }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                >
                  <option value="">Todas</option>
                  <option value="with">Con venta</option>
                  <option value="without">Sin venta</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Ordenar por
                <select
                  value={sort}
                  onChange={(event) => { setSort(event.target.value as SortKey); reset() }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                >
                  <option value="revenue">Venta</option>
                  <option value="variation">Variación</option>
                  <option value="name">Nombre</option>
                </select>
              </label>
            </div>
          )}
          footer={data && (data.hasMore || offset > 0) ? (
            <Pager offset={offset} limit={PAGE_SIZE} total={data.total} hasMore={data.hasMore} onChange={setOffset} />
          ) : null}
        >
          {data ? <BrandsDirectoryTable rows={data.rows} costHidden={!user.costAccess} /> : null}
        </MyDayBlock>
      </div>
    </main>
  )
}
