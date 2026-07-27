export const DEFAULT_BUSINESS_LOCALE = 'es-MX'

export interface BusinessNumberFormatOptions {
  locale?: string
  fallback?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export interface BusinessCurrencyFormatOptions
  extends BusinessNumberFormatOptions {
  currency?: string
}

function isFiniteBusinessNumber(
  value: number | null | undefined,
): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
}

export function formatBusinessNumber(
  value: number | null | undefined,
  options: BusinessNumberFormatOptions = {},
): string {
  if (!isFiniteBusinessNumber(value)) {
    return options.fallback ?? 'sin dato'
  }

  return new Intl.NumberFormat(
    options.locale ?? DEFAULT_BUSINESS_LOCALE,
    {
      minimumFractionDigits:
        options.minimumFractionDigits ?? 0,
      maximumFractionDigits:
        options.maximumFractionDigits ?? 1,
    },
  ).format(value)
}

/**
 * Formats a ratio as a percentage. A value of 0.6 is rendered as 60 %
 * according to the selected locale.
 */
export function formatBusinessPercent(
  value: number | null | undefined,
  options: BusinessNumberFormatOptions = {},
): string {
  if (!isFiniteBusinessNumber(value)) {
    return options.fallback ?? 'sin dato'
  }

  return new Intl.NumberFormat(
    options.locale ?? DEFAULT_BUSINESS_LOCALE,
    {
      style: 'percent',
      minimumFractionDigits:
        options.minimumFractionDigits ?? 0,
      maximumFractionDigits:
        options.maximumFractionDigits ?? 1,
    },
  ).format(value)
}

export function formatBusinessCurrency(
  value: number | null | undefined,
  options: BusinessCurrencyFormatOptions = {},
): string {
  if (!isFiniteBusinessNumber(value)) {
    return options.fallback ?? 'sin dato'
  }

  return new Intl.NumberFormat(
    options.locale ?? DEFAULT_BUSINESS_LOCALE,
    {
      style: 'currency',
      currency: options.currency ?? 'MXN',
      minimumFractionDigits:
        options.minimumFractionDigits ?? 0,
      maximumFractionDigits:
        options.maximumFractionDigits ?? 2,
    },
  ).format(value)
}
