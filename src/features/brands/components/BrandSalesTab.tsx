// MB-001: "Ventas" tab. One call (/api/brands/:brand/sales) brings month vs
// month, year vs year, the 24-month series and the first page of documents;
// later pages of documents are their own call. Missing values are "—" and
// gross profit / margin are never shown as $0 when the cost is hidden.

import {
  useState,
} from 'react'

import {
  Download,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  loadBrandSales,
  loadBrandSalesExport,
} from '../api/brandsApi'

import type {
  BrandDocuments,
  BrandHeaderResponse,
  BrandMonthOverMonth,
  BrandSalesResponse,
  BrandSeriesMonth,
  BrandVariation,
} from '../api/brandsTypes'

import {
  EXPORT_COST_NOTE,
  EXPORT_TRUNCATED_NOTICE,
  downloadBrandDetail,
} from '../export/exportBrandDetail'

import {
  COST_HIDDEN_NOTE,
  describeDates,
  marginPointsText,
  shortMonthLabel,
  variationText,
} from '../format/brandsFormat'

import {
  EMPTY_VALUE,
  formatDate,
  formatInteger,
  formatMoney,
  formatPercent,
} from '../../my-day/format/myDayFormat'

import {
  ACTION_PRIORITY_LABELS,
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

import type {
  MyDayActionPriority,
} from '../../my-day/api/myDayTypes'

import {
  useBrandContext,
} from './brandContext'

import {
  YearComparison,
} from './BrandYearComparison'

const DOCUMENT_PAGE = 50

// -- Indicators and open actions ---------------------------------------------------

function Indicator({
  title,
  value,
  note,
  toneClass = 'text-slate-950',
  dataKey,
}: {
  title: string
  value: string
  note?: string | null
  toneClass?: string
  dataKey: string
}) {
  return (
    <article
      data-brand-indicator={dataKey}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </article>
  )
}

export function BrandIndicators({ header }: { header: BrandHeaderResponse }) {
  const brand = header.brand

  if (!brand) {
    return (
      <p data-brand-no-data="true" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No hay ventas importadas para mostrar esta marca.
      </p>
    )
  }

  const tone = paceTone(brand.projectedAttainment)
  const noCost = header.costHidden

  return (
    <section aria-label="Indicadores de la marca" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${LIFECYCLE_CLASSES[brand.lifecycleStatus]}`}>
          {LIFECYCLE_LABELS[brand.lifecycleStatus]}
        </span>
        <span className={`text-xs font-medium ${TREND_CLASSES[brand.trendStatus]}`}>
          {TREND_LABELS[brand.trendStatus]}
        </span>
        {header.hasSalesInPeriod === false ? (
          <span data-brand-no-sales="true" className="text-xs font-medium text-amber-700">
            Sin ventas en el periodo
          </span>
        ) : null}
        {brand.attentionReason ? (
          <span className="text-xs text-slate-600">{brand.attentionReason}</span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicator
          dataKey="revenue"
          title="Venta del periodo"
          value={formatMoney(brand.revenue)}
          note={brand.target?.revenue != null
            ? `${formatPercent(brand.attainment)} de la cuota de ${formatMoney(brand.target.revenue)}`
            : 'Sin cuota registrada'}
        />

        <Indicator
          dataKey="projected"
          title="Cierre por ritmo"
          value={formatMoney(brand.projectedRevenue)}
          note={brand.projectedAttainment !== null
            ? `${formatPercent(brand.projectedAttainment)} de la cuota`
            : 'Sin cuota o sin ritmo para proyectar'}
          toneClass={tone === 'none' ? 'text-slate-950' : PACE_TONE_CLASSES[tone].split(' ').find((name) => name.startsWith('text-')) ?? 'text-slate-950'}
        />

        <Indicator
          dataKey="gross-profit"
          title="Utilidad bruta"
          value={noCost ? EMPTY_VALUE : formatMoney(brand.grossProfit)}
          note={noCost ? COST_HIDDEN_NOTE : `Margen ${formatPercent(brand.grossMargin)}`}
        />

        <Indicator
          dataKey="customers"
          title="Clientes y productos"
          value={`${formatInteger(brand.customers)} · ${formatInteger(brand.products)}`}
          note={`Clientes por recuperar: ${formatInteger(brand.lostCustomers)}`}
        />
      </div>
    </section>
  )
}

export function BrandOpenActions({ header }: { header: BrandHeaderResponse }) {
  const actions = header.actions

  if (!actions) {
    return null
  }

  return (
    <MyDayBlock
      title="Acciones abiertas"
      subtitle={`${formatInteger(actions.total)} abiertas · ${formatInteger(actions.overdue)} vencidas`}
      status={actions.rows.length === 0 ? 'empty' : 'ready'}
      emptyMessage="La marca no tiene acciones abiertas."
      footer={<Link to="/actions" className="text-blue-700 hover:underline">Ver todas en Acciones</Link>}
    >
      <ul className="flex flex-col divide-y divide-slate-100">
        {actions.rows.map((action) => (
          <li key={action.id} data-brand-action={action.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
            <span className="font-medium text-slate-900">{action.title}</span>
            <span className="text-xs text-slate-500">
              {ACTION_PRIORITY_LABELS[action.priority as MyDayActionPriority] ?? action.priority}
              {' · '}
              {action.dueDate ? `Vence ${formatDate(action.dueDate)}` : 'Sin fecha'}
              {action.daysOverdue > 0 ? ` · ${formatInteger(action.daysOverdue)} d de atraso` : ''}
              {action.ownerName ? ` · ${action.ownerName}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </MyDayBlock>
  )
}

// -- Month against month -------------------------------------------------------------

function amountText(value: number | null | undefined, hidden: boolean, money = true): string {
  if (hidden || value === null || value === undefined) {
    return EMPTY_VALUE
  }

  return money ? formatMoney(value) : formatInteger(value)
}

export function MonthComparison({ data }: { data: BrandMonthOverMonth | undefined }) {
  if (!data || !data.available || !data.current || !data.previous || !data.variations) {
    return (
      <p className="py-4 text-center text-sm text-slate-500">
        No hay una ventana comparable para este periodo.
      </p>
    )
  }

  const { current, previous, variations } = data
  const hidden = data.costHidden
  const rows: Array<[string, string, string, BrandVariation | null, string?]> = [
    ['Venta', formatMoney(current.revenue), formatMoney(previous.revenue), variations.revenue],
    ['Utilidad bruta', amountText(current.grossProfit, hidden), amountText(previous.grossProfit, hidden), hidden ? null : variations.grossProfit],
    ['Margen', hidden ? EMPTY_VALUE : formatPercent(current.grossMargin), hidden ? EMPTY_VALUE : formatPercent(previous.grossMargin), null, hidden ? EMPTY_VALUE : marginPointsText(variations.grossMarginPoints)],
    ['Clientes', formatInteger(current.customers), formatInteger(previous.customers), variations.customers],
    ['Productos', formatInteger(current.products), formatInteger(previous.products), variations.products],
    ['Documentos', formatInteger(current.documents), formatInteger(previous.documents), variations.documents],
  ]

  return (
    <MyDayTable minWidth="min-w-[720px]">
      <thead>
        <tr>
          <th className={TH}>Concepto</th>
          <th className={`${TH} text-right`}>
            Periodo actual
            <div className="font-normal normal-case text-slate-400">{describeDates(current.dateFrom, current.dateTo, current.workingDays)}</div>
          </th>
          <th className={`${TH} text-right`}>
            Periodo anterior
            <div className="font-normal normal-case text-slate-400">{describeDates(previous.dateFrom, previous.dateTo, previous.workingDays)}</div>
          </th>
          <th className={`${TH} text-right`}>Variación</th>
          <th className={`${TH} text-right`}>%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, now, before, variation, points]) => (
          <tr key={label}>
            <td className={`${TD} font-medium text-slate-900`}>{label}</td>
            <td className={TD_NUMBER}>{now}</td>
            <td className={TD_NUMBER}>{before}</td>
            <td className={TD_NUMBER}>
              {points ?? (variation && variation.amount !== null
                ? (label === 'Venta' || label === 'Utilidad bruta' ? formatMoney(variation.amount) : formatInteger(variation.amount))
                : EMPTY_VALUE)}
            </td>
            <td className={TD_NUMBER}>{points ? EMPTY_VALUE : variationText(variation)}</td>
          </tr>
        ))}
      </tbody>
    </MyDayTable>
  )
}

// -- 24-month series --------------------------------------------------------------------

export function MonthlySeries({ months }: { months: BrandSeriesMonth[] | undefined }) {
  if (!months || months.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">Sin serie para mostrar.</p>
  }

  const peak = Math.max(
    1,
    ...months.map((month) => Math.max(month.revenue ?? 0, month.target?.revenue ?? 0)),
  )

  return (
    <ol data-brand-series="true" className="flex flex-col gap-1">
      {months.map((month) => (
        <li
          key={month.periodId}
          data-series-month={month.periodId}
          className="grid grid-cols-[52px_minmax(0,1fr)_96px_72px] items-center gap-2 text-xs"
        >
          <span className="text-slate-500">{shortMonthLabel(month.periodId)}</span>

          <div className="relative h-4 rounded bg-slate-100">
            {month.revenue !== null ? (
              <div
                className={`h-full rounded ${month.partial ? 'bg-blue-300' : 'bg-blue-600'}`}
                style={{ width: `${Math.max(0, Math.min(month.revenue / peak, 1)) * 100}%` }}
              />
            ) : null}
            {month.target?.revenue ? (
              <div
                title={`Cuota ${formatMoney(month.target.revenue)}`}
                className="absolute inset-y-0 w-0.5 bg-[#F58220]"
                style={{ left: `${Math.max(0, Math.min(month.target.revenue / peak, 1)) * 100}%` }}
              />
            ) : null}
          </div>

          <span className="text-right tabular-nums text-slate-800">
            {month.hasSales ? formatMoney(month.revenue) : EMPTY_VALUE}
          </span>

          <span className="text-right tabular-nums text-slate-500">
            {month.target?.revenue ? formatPercent(month.attainment) : 'Sin cuota'}
          </span>
        </li>
      ))}
      <li className="mt-1 text-[11px] text-slate-400">
        La barra es la venta del mes (clara = mes abierto al corte); la marca naranja es la cuota. Un mes sin ventas se muestra "—".
      </li>
    </ol>
  )
}

// -- Documents and export -------------------------------------------------------------------

export function DocumentsTable({ documents, hidden }: { documents: BrandDocuments, hidden: boolean }) {
  return (
    <MyDayTable minWidth="min-w-[980px]">
      <thead>
        <tr>
          <th className={TH}>Fecha</th>
          <th className={TH}>Documento</th>
          <th className={TH}>Cliente</th>
          <th className={TH}>Vendedor</th>
          <th className={TH}>Ubicación</th>
          <th className={`${TH} text-right`}>Líneas</th>
          <th className={`${TH} text-right`}>Unidades</th>
          <th className={`${TH} text-right`}>Venta</th>
          <th className={`${TH} text-right`}>Utilidad bruta</th>
        </tr>
      </thead>
      <tbody>
        {documents.rows.map((row, index) => (
          <tr key={`${row.documentNumber ?? 'sin-doc'}-${row.saleDate}-${index}`}>
            <td className={TD}>{formatDate(row.saleDate)}</td>
            <td className={TD}>{row.documentNumber ?? 'Sin documento'}</td>
            <td className={TD}>{row.customerName ?? row.customerId ?? EMPTY_VALUE}</td>
            <td className={TD}>{row.salesRep ?? EMPTY_VALUE}</td>
            <td className={TD}>{row.location ?? EMPTY_VALUE}</td>
            <td className={TD_NUMBER}>{formatInteger(row.lines)}</td>
            <td className={TD_NUMBER}>{formatInteger(row.quantity)}</td>
            <td className={TD_NUMBER}>{formatMoney(row.revenue)}</td>
            <td className={TD_NUMBER}>{hidden ? EMPTY_VALUE : formatMoney(row.grossProfit)}</td>
          </tr>
        ))}
      </tbody>
    </MyDayTable>
  )
}

type ExportState =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'done', fileName: string, truncated: boolean, rows: number }
  | { status: 'error', message: string }

function ExportButton({ routeBrand, period, hidden }: { routeBrand: string, period: string | null, hidden: boolean }) {
  const [state, setState] = useState<ExportState>({ status: 'idle' })

  const run = async () => {
    setState({ status: 'working' })

    try {
      const response = await loadBrandSalesExport(routeBrand, period)
      const fileName = await downloadBrandDetail(response)

      setState({
        status: 'done',
        fileName,
        truncated: response.truncated === true,
        rows: response.rows.length,
      })
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'No se pudo exportar el detalle.',
      })
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        data-brand-export="true"
        disabled={state.status === 'working'}
        onClick={() => { void run() }}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
      >
        <Download aria-hidden="true" size={15} />
        {state.status === 'working' ? 'Preparando…' : 'Exportar detalle'}
      </button>

      {hidden ? <p className="text-xs text-slate-500">{EXPORT_COST_NOTE}</p> : null}

      {state.status === 'done' ? (
        <p data-brand-export-result="true" className="text-xs text-slate-600">
          {state.fileName} · {formatInteger(state.rows)} líneas
        </p>
      ) : null}

      {state.status === 'done' && state.truncated ? (
        <p data-brand-export-truncated="true" className="max-w-sm text-right text-xs font-medium text-amber-700">
          {EXPORT_TRUNCATED_NOTICE}
        </p>
      ) : null}

      {state.status === 'error' ? <p className="text-xs text-rose-700">{state.message}</p> : null}
    </div>
  )
}

function DocumentsBlock({
  initial,
  hidden,
  routeBrand,
  period,
}: {
  initial: BrandDocuments | undefined
  hidden: boolean
  routeBrand: string
  period: string | null
}) {
  const [offset, setOffset] = useState(0)
  const page = useMyDayBlock<BrandSalesResponse>(
    offset > 0 ? `${routeBrand}|${period ?? ''}|docs|${offset}` : null,
    (signal) => loadBrandSales(routeBrand, { period, sections: ['documents'], limit: DOCUMENT_PAGE, offset }, signal),
  )
  const documents = offset === 0 ? initial : page.data?.documents
  const status = offset > 0 && page.status === 'loading' && !documents
    ? 'loading'
    : offset > 0 && page.status === 'error'
      ? 'error'
      : !documents || documents.total === 0
        ? 'empty'
        : 'ready'

  return (
    <MyDayBlock
      title="Detalle de documentos"
      subtitle={documents ? `${formatInteger(documents.total)} documentos · ${formatInteger(documents.lines)} líneas · ${formatMoney(documents.revenue)}` : undefined}
      status={status}
      errorMessage={page.error?.message}
      onRetry={page.reload}
      emptyMessage="La marca no tiene documentos en este periodo."
      toolbar={<div className="flex justify-end"><ExportButton routeBrand={routeBrand} period={period} hidden={hidden} /></div>}
      footer={documents && documents.total > DOCUMENT_PAGE ? (
        <Pager offset={offset} limit={DOCUMENT_PAGE} total={documents.total} hasMore={documents.hasMore} onChange={setOffset} />
      ) : null}
    >
      {documents ? <DocumentsTable documents={documents} hidden={hidden} /> : null}
    </MyDayBlock>
  )
}

// -- Tab ---------------------------------------------------------------------------------------

export function BrandSalesTab() {
  const { routeBrand, period, header } = useBrandContext()
  const hidden = header.costHidden
  const main = useMyDayBlock<BrandSalesResponse>(
    `${routeBrand}|${period ?? ''}|sales`,
    (signal) => loadBrandSales(
      routeBrand,
      { period, sections: ['comparison', 'yoy', 'series', 'documents'], limit: DOCUMENT_PAGE },
      signal,
    ),
  )
  const status = main.status === 'success' ? 'ready' : main.status
  const noData = main.data?.reason === 'no-sales-data'

  return (
    <div className="flex flex-col gap-6" data-brand-tab-panel="ventas">
      <BrandIndicators header={header} />

      {hidden ? (
        <p data-brand-cost-note="true" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {COST_HIDDEN_NOTE}
        </p>
      ) : null}

      <BrandOpenActions header={header} />

      <MyDayBlock
        title="Mes contra mes"
        subtitle="Mismo número de días hábiles del periodo anterior"
        status={noData ? 'empty' : status}
        emptyMessage="No hay ventas importadas para comparar."
        errorMessage={main.error?.message}
        onRetry={main.reload}
      >
        <MonthComparison data={main.data?.monthOverMonth} />
      </MyDayBlock>

      <MyDayBlock
        title="Año contra año"
        subtitle="Mes equivalente, acumulado del año y cierre anual"
        status={noData ? 'empty' : status}
        emptyMessage="No hay ventas importadas para comparar."
        errorMessage={main.error?.message}
        onRetry={main.reload}
      >
        <YearComparison data={main.data?.yearOverYear} />
      </MyDayBlock>

      <MyDayBlock
        title="Serie de 24 meses"
        subtitle="Venta mensual contra cuota"
        status={noData ? 'empty' : status}
        emptyMessage="No hay ventas importadas para mostrar la serie."
        errorMessage={main.error?.message}
        onRetry={main.reload}
      >
        <MonthlySeries months={main.data?.series} />
      </MyDayBlock>

      {main.status === 'success' && !noData ? (
        <DocumentsBlock
          key={`${routeBrand}|${period ?? ''}`}
          initial={main.data?.documents}
          hidden={hidden}
          routeBrand={routeBrand}
          period={period}
        />
      ) : null}
    </div>
  )
}
