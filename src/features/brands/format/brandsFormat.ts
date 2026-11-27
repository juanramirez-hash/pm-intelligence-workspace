// MB-001: pure helpers of the brand page: tabs and their paths, period in
// the URL, comparison labels and the "N de 12 meses" quota note. A missing
// value is always "—", never 0.

import {
  EMPTY_VALUE,
  formatDate,
  formatInteger,
  formatPercent,
  formatSignedPercent,
} from '../../my-day/format/myDayFormat'

import {
  brandPageId,
} from '../../my-day/navigation/brandPagePath'

import type {
  BrandAnnualTarget,
  BrandTabId,
  BrandVariation,
  MyDayView,
} from '../api/brandsTypes'

export const BRAND_TABS: ReadonlyArray<{ id: BrandTabId, label: string }> = [
  { id: 'ventas', label: 'Ventas' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'productos', label: 'Productos' },
  { id: 'inteligencia', label: 'Inteligencia' },
]

export const FORECAST_TAB_LABEL = 'Pronóstico'
export const FORECAST_TAB_BADGE = 'MB-002'

export const COST_HIDDEN_NOTE =
  'No tienes acceso a costos de esta marca: la utilidad bruta y el margen no se muestran.'

// MB-001C: portfolio of brands (Mis marcas / Todas).
export const COST_HIDDEN_PORTFOLIO_NOTE =
  'No tienes acceso a costos de alguna de las marcas incluidas: la utilidad bruta y el margen no se muestran.'

/** Note of hidden costs for one brand or for a portfolio of brands. */
export function costHiddenNote(scope: 'brand' | 'portfolio'): string {
  return scope === 'portfolio' ? COST_HIDDEN_PORTFOLIO_NOTE : COST_HIDDEN_NOTE
}

/** Subtitle of the portfolio panel: Mis marcas (with the count) or Todas. */
export function portfolioSubtitle(
  view: MyDayView,
  brandCount: number | null | undefined,
): string {
  if (view === 'all') {
    return 'Todas las marcas (toda la venta, incluidas las marcas sin PM)'
  }

  return typeof brandCount === 'number'
    ? `Mis marcas · ${formatInteger(brandCount)} ${brandCount === 1 ? 'marca' : 'marcas'}`
    : 'Mis marcas'
}

export const PORTFOLIO_LOADING_ALL = 'Calculando comparativo de toda la cartera…'

/**
 * Request key of the portfolio panel; null = do not call. Mis marcas loads at
 * once; Todas (about 2 s) only after the user opens it. The key includes the
 * view and the period, so an open panel reloads when the period changes.
 */
export function portfolioRequestKey(
  view: MyDayView,
  expanded: boolean,
  period: string | null,
): string | null {
  return view === 'mine' || expanded
    ? `portfolio|${view}|${period ?? ''}`
    : null
}

export const BRAND_NOT_FOUND = 'Marca no encontrada'

const REASONS: Record<string, string> = {
  'no-brand-assignments': 'No tienes marcas asignadas.',
  'no-sales-data': 'No hay ventas cargadas.',
  'no-inventory-data': 'No hay inventario cargado: la existencia aparece como "—".',
  'catalog-status-missing': 'El inventario cargado no trae el estatus de catálogo: vuelve a cargarlo desde Data Center.',
  'no-comparison-window': 'No hay una ventana comparable para este periodo.',
}

/** Message of a server reason; null when there is none. */
export function brandReasonMessage(reason: string | null | undefined): string | null {
  return reason ? REASONS[reason] ?? 'Sin datos para mostrar.' : null
}

/** Marca identifier of the URL: the name when known (the old pages use it). */
export function brandSegment(
  routeBrand: string,
  brandLabel: string | null | undefined,
): string {
  return brandPageId(brandLabel) ?? routeBrand
}

export function brandTabPath(
  routeBrand: string,
  brandLabel: string | null | undefined,
  tab: BrandTabId,
  period?: string | null,
): string {
  const base = `/brands/${encodeURIComponent(brandSegment(routeBrand, brandLabel))}/${tab}`

  return period ? `${base}?period=${encodeURIComponent(period)}` : base
}

export function brandForecastPath(
  routeBrand: string,
  brandLabel: string | null | undefined,
): string {
  return `/forecast?brand=${encodeURIComponent(brandSegment(routeBrand, brandLabel))}`
}

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/

/** period of the URL; anything that is not YYYY-MM is ignored (server default). */
export function readPeriodParam(value: string | null): string | null {
  return value !== null && PERIOD.test(value) ? value : null
}

/** "1 nov 2026 – 24 nov 2026 · 17 días hábiles". */
export function describeDates(
  dateFrom: string | null | undefined,
  dateTo: string | null | undefined,
  workingDays?: number | null,
): string {
  if (!dateFrom || !dateTo) {
    return EMPTY_VALUE
  }

  const range = `${formatDate(dateFrom)} – ${formatDate(dateTo)}`

  return typeof workingDays === 'number'
    ? `${range} · ${formatInteger(workingDays)} ${workingDays === 1 ? 'día hábil' : 'días hábiles'}`
    : range
}

/** Percentage of a variation; "—" when the base is missing or zero. */
export function variationText(variation: BrandVariation | null | undefined): string {
  return variation ? formatSignedPercent(variation.percentage) : EMPTY_VALUE
}

/** Margin variation in percentage points: "+1.2 pp". */
export function marginPointsText(points: number | null | undefined): string {
  if (typeof points !== 'number' || !Number.isFinite(points)) {
    return EMPTY_VALUE
  }

  const sign = points > 0 ? '+' : ''

  return `${sign}${points.toFixed(1)} pp`
}

/** "Cuota anual · 10 de 12 meses con cuota" only when months are missing. */
export function annualTargetNote(target: BrandAnnualTarget | null | undefined): string | null {
  if (!target) {
    return null
  }

  return target.complete
    ? null
    : `Cuota de ${formatInteger(target.monthsWithTarget)} de ${formatInteger(target.monthsInYear)} meses`
}

export function attainmentText(value: number | null | undefined): string {
  return formatPercent(value)
}

/** Text of a count that may be missing. */
export const countText = (value: number | null | undefined): string => formatInteger(value)

/** The same number of months the server sends, as a short "ene 25" label. */
export function shortMonthLabel(periodId: string): string {
  const [year, month] = periodId.split('-')
  const names = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const name = names[Number(month) - 1]

  return name && year ? `${name} ${year.slice(2)}` : EMPTY_VALUE
}
