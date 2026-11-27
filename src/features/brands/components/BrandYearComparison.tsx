// MB-001: "Año contra año" panel (Mes equivalente / Acumulado YTD / Cierre anual).
// Shared by the Ventas tab of the brand page and, since MB-001C, by the
// portfolio comparison of the Marcas directory: the same component and the
// same response shape (yearOverYear). A missing value is "—", never 0, and the
// gross profit and margin are "—" when the cost is hidden.

import {
  useState,
} from 'react'

import type {
  BrandAnnualTarget,
  BrandYearOverYear,
  BrandYearSlots,
  BrandYearVariationSet,
  BrandYearWindow,
} from '../api/brandsTypes'

import {
  annualTargetNote,
  describeDates,
  marginPointsText,
  variationText,
} from '../format/brandsFormat'

import {
  EMPTY_VALUE,
  formatInteger,
  formatMoney,
  formatPercent,
} from '../../my-day/format/myDayFormat'

import {
  MyDayTable,
  TD,
  TD_NUMBER,
  TH,
} from '../../my-day/components/MyDayBlock'

type YearMode = 'monthly' | 'ytd' | 'annual'

const YEAR_MODES: Array<{ id: YearMode, label: string }> = [
  { id: 'monthly', label: 'Mes equivalente' },
  { id: 'ytd', label: 'Acumulado YTD' },
  { id: 'annual', label: 'Cierre anual' },
]

function windowCell(window: BrandYearWindow | null, pick: (item: BrandYearWindow) => string): string {
  return window ? pick(window) : EMPTY_VALUE
}

function WindowHead({ label, window }: { label: string, window: BrandYearWindow | null }) {
  return (
    <th className={`${TH} text-right`}>
      {label}
      <div className="font-normal normal-case text-slate-400">
        {window ? describeDates(window.dateFrom, window.dateTo, window.workingDays) : 'Sin ventas ese año'}
      </div>
    </th>
  )
}

function variationOf(set: BrandYearVariationSet | null | undefined, key: 'revenue' | 'grossProfit' | 'customers' | 'products'): string {
  return set ? variationText(set[key]) : EMPTY_VALUE
}

function SlotsTable({ slots, year, hidden }: { slots: BrandYearSlots, year: number, hidden: boolean }) {
  const { current, previousYear, twoYearsBack, variations } = slots
  const rows: Array<{ label: string, key: 'revenue' | 'grossProfit' | 'customers' | 'products' | 'margin', pick: (item: BrandYearWindow) => string }> = [
    { label: 'Venta', key: 'revenue', pick: (item) => formatMoney(item.revenue) },
    { label: 'Utilidad bruta', key: 'grossProfit', pick: (item) => (hidden ? EMPTY_VALUE : formatMoney(item.grossProfit)) },
    { label: 'Margen', key: 'margin', pick: (item) => (hidden ? EMPTY_VALUE : formatPercent(item.grossMargin)) },
    { label: 'Clientes', key: 'customers', pick: (item) => formatInteger(item.customers) },
    { label: 'Productos', key: 'products', pick: (item) => formatInteger(item.products) },
  ]

  return (
    <MyDayTable minWidth="min-w-[880px]">
      <thead>
        <tr>
          <th className={TH}>Concepto</th>
          <WindowHead label={String(year)} window={current} />
          <WindowHead label={String(year - 1)} window={previousYear} />
          <WindowHead label={String(year - 2)} window={twoYearsBack} />
          <th className={`${TH} text-right`}>vs {year - 1}</th>
          <th className={`${TH} text-right`}>vs {year - 2}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td className={`${TD} font-medium text-slate-900`}>{row.label}</td>
            <td className={TD_NUMBER}>{windowCell(current, row.pick)}</td>
            <td className={TD_NUMBER}>{windowCell(previousYear, row.pick)}</td>
            <td className={TD_NUMBER}>{windowCell(twoYearsBack, row.pick)}</td>
            {row.key === 'margin' ? (
              <>
                <td className={TD_NUMBER}>{hidden ? EMPTY_VALUE : marginPointsText(variations.vsPreviousYear?.grossMarginPoints)}</td>
                <td className={TD_NUMBER}>{hidden ? EMPTY_VALUE : marginPointsText(variations.vsTwoYearsBack?.grossMarginPoints)}</td>
              </>
            ) : (
              <>
                <td className={TD_NUMBER}>{row.key === 'grossProfit' && hidden ? EMPTY_VALUE : variationOf(variations.vsPreviousYear, row.key)}</td>
                <td className={TD_NUMBER}>{row.key === 'grossProfit' && hidden ? EMPTY_VALUE : variationOf(variations.vsTwoYearsBack, row.key)}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </MyDayTable>
  )
}

function AnnualTargetLine({ target }: { target: BrandAnnualTarget | null | undefined }) {
  if (!target) {
    return <p className="mt-2 text-xs text-slate-500">Sin cuota anual registrada.</p>
  }

  const note = annualTargetNote(target)

  return (
    <p data-brand-annual-target="true" className="mt-2 text-xs text-slate-600">
      Cuota anual {formatMoney(target.revenue)}
      {note ? ` (${note})` : ''}
      {' · '}Avance al corte {formatPercent(target.ytdAttainment)}
      {' · '}Cierre proyectado {formatPercent(target.projectedAttainment)}
    </p>
  )
}

export function AnnualClose({ data, hidden }: { data: NonNullable<BrandYearOverYear['annual']>, hidden: boolean }) {
  const { projection, previousYear, twoYearsBack, projectionVariations } = data
  const year = projection?.year ?? (previousYear ? previousYear.year + 1 : null)
  const columns: Array<{ label: string, window: { revenue: number, grossProfit: number | null, grossMargin: number | null } | null, missing: string }> = [
    { label: year ? `Proyección ${year}` : 'Proyección', window: projection, missing: 'Sin proyección' },
    { label: year ? `Cierre ${year - 1}` : 'Cierre año anterior', window: previousYear, missing: 'Sin ventas ese año' },
    { label: year ? `Cierre ${year - 2}` : 'Cierre hace 2 años', window: twoYearsBack, missing: 'Sin ventas ese año' },
  ]

  return (
    <>
      <MyDayTable minWidth="min-w-[760px]">
        <thead>
          <tr>
            <th className={TH}>Concepto</th>
            {columns.map((column) => (
              <th key={column.label} className={`${TH} text-right`}>
                {column.label}
                {column.window ? null : <div className="font-normal normal-case text-slate-400">{column.missing}</div>}
              </th>
            ))}
            <th className={`${TH} text-right`}>vs {year ? year - 1 : 'año anterior'}</th>
            <th className={`${TH} text-right`}>vs {year ? year - 2 : 'hace 2 años'}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${TD} font-medium text-slate-900`}>Venta</td>
            {columns.map((column) => (
              <td key={column.label} className={TD_NUMBER}>{column.window ? formatMoney(column.window.revenue) : EMPTY_VALUE}</td>
            ))}
            <td className={TD_NUMBER}>{variationOf(projectionVariations.vsPreviousYear, 'revenue')}</td>
            <td className={TD_NUMBER}>{variationOf(projectionVariations.vsTwoYearsBack, 'revenue')}</td>
          </tr>
          <tr>
            <td className={`${TD} font-medium text-slate-900`}>Utilidad bruta</td>
            {columns.map((column) => (
              <td key={column.label} className={TD_NUMBER}>{hidden || !column.window ? EMPTY_VALUE : formatMoney(column.window.grossProfit)}</td>
            ))}
            <td className={TD_NUMBER}>{hidden ? EMPTY_VALUE : variationOf(projectionVariations.vsPreviousYear, 'grossProfit')}</td>
            <td className={TD_NUMBER}>{hidden ? EMPTY_VALUE : variationOf(projectionVariations.vsTwoYearsBack, 'grossProfit')}</td>
          </tr>
          <tr>
            <td className={`${TD} font-medium text-slate-900`}>Margen</td>
            {columns.map((column) => (
              <td key={column.label} className={TD_NUMBER}>{hidden || !column.window ? EMPTY_VALUE : formatPercent(column.window.grossMargin)}</td>
            ))}
            <td className={TD_NUMBER}>{hidden ? EMPTY_VALUE : marginPointsText(projectionVariations.vsPreviousYear?.grossMarginPoints)}</td>
            <td className={TD_NUMBER}>{hidden ? EMPTY_VALUE : marginPointsText(projectionVariations.vsTwoYearsBack?.grossMarginPoints)}</td>
          </tr>
        </tbody>
      </MyDayTable>

      {projection ? (
        <p className="mt-2 text-xs text-slate-500">
          Proyección con el avance histórico de {projection.historicalYearsUsed.join(' y ')}
          {projection.historicalRevenueCompletionRatio !== null
            ? ` (el acumulado representó ${formatPercent(projection.historicalRevenueCompletionRatio)} del año)`
            : ''}.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          No hay años anteriores con ventas para proyectar el cierre.
        </p>
      )}

      <AnnualTargetLine target={data.target} />
    </>
  )
}

export function YearComparison({ data }: { data: BrandYearOverYear | undefined }) {
  const [mode, setMode] = useState<YearMode>('monthly')

  if (!data || !data.available) {
    return (
      <p className="py-4 text-center text-sm text-slate-500">
        {data?.description ?? 'No hay información para comparar contra años anteriores.'}
      </p>
    )
  }

  const hidden = data.costHidden

  return (
    <div>
      <div role="tablist" aria-label="Comparativo año contra año" className="mb-3 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {YEAR_MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={mode === option.id}
            data-year-mode={option.id}
            onClick={() => setMode(option.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              mode === option.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {mode === 'monthly' && data.monthly ? (
        <SlotsTable slots={data.monthly} year={data.currentYear} hidden={hidden} />
      ) : null}

      {mode === 'ytd' && data.ytd ? (
        <SlotsTable slots={data.ytd} year={data.currentYear} hidden={hidden} />
      ) : null}

      {mode === 'annual' && data.annual ? (
        <AnnualClose data={data.annual} hidden={hidden} />
      ) : null}

      {data.description ? <p className="mt-3 text-xs text-slate-500">{data.description}</p> : null}
    </div>
  )
}
