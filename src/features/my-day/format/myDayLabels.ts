// MD-003: Spanish labels, tones and the pace thresholds of "Mi día". The
// thresholds live only here.

import type {
  MyDayActionPriority,
  MyDayActionStatus,
  MyDayArrivalStatus,
  MyDayLifecycleStatus,
  MyDaySourceFreshness,
  MyDayTrendStatus,
} from '../api/myDayTypes'

import {
  capitalizeFirst,
  formatDate,
} from './myDayFormat'

/** Projected close against quota: green ≥ 100 %, amber 90–99.9 %, red < 90 %. */
export const PACE_THRESHOLDS = Object.freeze({
  onTrack: 1,
  atRisk: 0.9,
})

export type PaceTone = 'green' | 'amber' | 'red' | 'none'

export function paceTone(projectedAttainment: number | null | undefined): PaceTone {
  if (typeof projectedAttainment !== 'number' || !Number.isFinite(projectedAttainment)) {
    return 'none'
  }

  if (projectedAttainment >= PACE_THRESHOLDS.onTrack) {
    return 'green'
  }

  return projectedAttainment >= PACE_THRESHOLDS.atRisk ? 'amber' : 'red'
}

export const PACE_TONE_CLASSES: Record<PaceTone, string> = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
  none: 'border-slate-200 bg-slate-50 text-slate-500',
}

export const LIFECYCLE_LABELS: Record<MyDayLifecycleStatus, string> = {
  active: 'Activa',
  new: 'Nueva',
  recovered: 'Recuperada',
  lost: 'Perdida',
  inactive: 'Inactiva',
}

export const LIFECYCLE_CLASSES: Record<MyDayLifecycleStatus, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  new: 'border-blue-200 bg-blue-50 text-blue-700',
  recovered: 'border-violet-200 bg-violet-50 text-violet-700',
  lost: 'border-rose-200 bg-rose-50 text-rose-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-600',
}

export const TREND_LABELS: Record<MyDayTrendStatus, string> = {
  growing: 'Crece',
  stable: 'Estable',
  declining: 'Cae',
  without_comparison: 'Sin comparativo',
}

export const TREND_CLASSES: Record<MyDayTrendStatus, string> = {
  growing: 'text-emerald-700',
  stable: 'text-slate-600',
  declining: 'text-rose-700',
  without_comparison: 'text-slate-400',
}

export const ARRIVAL_STATUS_LABELS: Record<MyDayArrivalStatus, string> = {
  scheduled: 'Programada',
  overdue: 'Atrasada',
  'no-date': 'Sin fecha',
  'no-po-data': 'Sin PO cargada',
  'no-po': 'Sin PO',
}

export const ARRIVAL_STATUS_CLASSES: Record<MyDayArrivalStatus, string> = {
  scheduled: 'text-blue-700',
  overdue: 'text-rose-700',
  'no-date': 'text-amber-700',
  'no-po-data': 'text-amber-700',
  'no-po': 'text-slate-500',
}

export const ACTION_PRIORITY_LABELS: Record<MyDayActionPriority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export const ACTION_PRIORITY_CLASSES: Record<MyDayActionPriority, string> = {
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
  high: 'border-orange-200 bg-orange-50 text-orange-700',
  medium: 'border-blue-200 bg-blue-50 text-blue-700',
  low: 'border-slate-200 bg-slate-50 text-slate-600',
}

export const ACTION_STATUS_LABELS: Record<MyDayActionStatus, string> = {
  open: 'Abierta',
  in_progress: 'En curso',
  blocked: 'Bloqueada',
  done: 'Cerrada',
  cancelled: 'Cancelada',
  auto_resolved: 'Resuelta',
}

/** Server reasons for an empty block. */
export const REASON_MESSAGES: Record<string, string> = {
  'no-brand-assignments': 'No tienes marcas asignadas.',
  'no-sales-data': 'No hay ventas cargadas.',
  'period-after-data-cutoff': 'El periodo es posterior a la fecha de corte.',
  'no-inventory-data': 'No hay inventario cargado.',
  'catalog-status-missing':
    'El inventario cargado no trae el estatus de catálogo: vuelve a cargarlo desde Data Center.',
  'no-purchase-data': 'No hay órdenes de compra cargadas.',
}

export function reasonMessage(reason: string | null | undefined): string | null {
  return reason ? REASON_MESSAGES[reason] ?? 'Sin datos para mostrar.' : null
}

export const INCOMPLETE_INVENTORY_WARNING =
  'El inventario se cargó antes de la actualización: faltan artículos agotados; vuelve a cargarlo'

export const NOT_AVAILABLE_FOR_ACCESS = 'Mi día no está disponible para tu tipo de acceso'

export type MyDaySourceName = 'inventory' | 'purchases' | 'sales'

const SOURCE_NAMES: Record<MyDaySourceName, string> = {
  inventory: 'inventario',
  purchases: 'compras',
  sales: 'ventas',
}

const STALE_CONSEQUENCES: Record<MyDaySourceName, string> = {
  inventory: 'la existencia puede haber cambiado',
  purchases: "pueden faltar PO's",
  sales: 'pueden faltar ventas recientes',
}

/** "Inventario al 24 nov 2026". */
export function sourceLabel(name: MyDaySourceName, source: MyDaySourceFreshness | null | undefined): string {
  const label = SOURCE_NAMES[name]

  return source?.referenceDate
    ? `${capitalizeFirst(label)} al ${formatDate(source.referenceDate)}`
    : `Sin datos de ${label}`
}

/** "Datos de compras al 26 ago 2026: pueden faltar PO's" when stale. */
export function sourceWarning(name: MyDaySourceName, source: MyDaySourceFreshness | null | undefined): string | null {
  if (!source) {
    return null
  }

  if (source.status === 'no-data') {
    return `No hay datos de ${SOURCE_NAMES[name]} cargados`
  }

  return source.stale
    ? `Datos de ${SOURCE_NAMES[name]} al ${formatDate(source.referenceDate)}: ${STALE_CONSEQUENCES[name]}`
    : null
}
