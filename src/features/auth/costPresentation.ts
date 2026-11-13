import {
  normalizeBrandKey,
  type CostVisibility,
} from './brandAccess'

// How hidden or missing costs are shown (SEC-003C). Pure helpers, usable
// from engines and exports. The builders and engines keep missing costs as
// NULL and count them; these helpers only choose the text. A NULL cost is
// never shown as $0.

export const NO_COST_ACCESS_LABEL = 'Sin acceso a costo'
export const MISSING_COST_LABEL = 'Sin dato'
export const MISSING_SHARE_LABEL = '—'

export const ASSIGNED_COST_EXPORT_NOTE =
  'Valores de costo calculados solo sobre las marcas asignadas al usuario.'
export const NO_COST_ACCESS_EXPORT_NOTE =
  'Este usuario no tiene acceso a costos; las columnas de valor aparecen vacías.'

export const ASSIGNED_VALUE_CONCENTRATION_NOTE =
  'Calculado sobre el valor de tus marcas.'

export function canSeeBrandCost(
  visibility: CostVisibility,
  brand: string | null | undefined,
): boolean {
  if (visibility.mode === 'all') {
    return true
  }

  if (visibility.mode === 'none') {
    return false
  }

  const brandKey = normalizeBrandKey(brand)

  return brandKey !== null &&
    visibility.brandKeys.includes(brandKey)
}

function isCost(
  value: number | null | undefined,
): value is number {
  return typeof value === 'number' &&
    Number.isFinite(value)
}

/** One row's cost: hidden for brands outside the user's scope. */
export function formatCostValue(
  value: number | null | undefined,
  visibility: CostVisibility,
  brand: string | null | undefined,
  format: (value: number) => string,
): string {
  if (isCost(value)) {
    return format(value)
  }

  return canSeeBrandCost(visibility, brand)
    ? MISSING_COST_LABEL
    : NO_COST_ACCESS_LABEL
}

/** A total that may mix brands. */
export function formatCostTotal(
  value: number | null | undefined,
  visibility: CostVisibility,
  format: (value: number) => string,
): string {
  if (visibility.mode === 'none') {
    return NO_COST_ACCESS_LABEL
  }

  if (isCost(value)) {
    return format(value)
  }

  return visibility.mode === 'all'
    ? MISSING_COST_LABEL
    : NO_COST_ACCESS_LABEL
}

export function formatCostShare(
  share: number | null | undefined,
  visibility: CostVisibility,
  format: (share: number) => string,
): string {
  if (visibility.mode === 'none') {
    return NO_COST_ACCESS_LABEL
  }

  return isCost(share)
    ? format(share)
    : MISSING_SHARE_LABEL
}

/** Label of a total that mixes brands: never a company total for assigned users. */
export function costTotalLabel(
  label: string,
  assignedLabel: string,
  visibility: CostVisibility,
): string {
  return visibility.mode === 'assigned'
    ? assignedLabel
    : label
}

/** Short detail when some values are missing from a total. */
export function describeMissingCosts(
  missing: number,
  singular: string,
  plural: string,
): string | null {
  if (missing <= 0) {
    return null
  }

  return `${missing} ${missing === 1 ? singular : plural} sin valor`
}

export function costExportNote(
  visibility: CostVisibility,
): string | null {
  if (visibility.mode === 'assigned') {
    return ASSIGNED_COST_EXPORT_NOTE
  }

  if (visibility.mode === 'none') {
    return NO_COST_ACCESS_EXPORT_NOTE
  }

  return null
}
