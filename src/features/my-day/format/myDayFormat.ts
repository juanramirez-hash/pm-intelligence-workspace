// MD-003: es-MX formats of "Mi día". A missing value (null, undefined or a
// non-finite number) is always "—", never 0.

import {
  formatBusinessCurrency,
  formatBusinessNumber,
  formatBusinessPercent,
} from '../../../core/business/formatting/businessFormatters'

import {
  NO_COST_ACCESS_LABEL,
} from '../../auth/costPresentation'

import type {
  MyDayAmountsByCurrency,
  MyDayPeriodStatus,
  MyDayWorkingDays,
} from '../api/myDayTypes'

export const EMPTY_VALUE = '—'

const LOCALE = 'es-MX'
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/
const PERIOD = /^(\d{4})-(\d{2})$/
const NO_CURRENCY = 'SIN_MONEDA'

const isNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** MXN without decimals; negative values allowed (credit notes). */
export function formatMoney(value: number | null | undefined): string {
  return formatBusinessCurrency(value, {
    fallback: EMPTY_VALUE,
    maximumFractionDigits: 0,
  })
}

/** Ratio as a percentage with one decimal: 0.856 → "85.6 %". */
export function formatPercent(value: number | null | undefined): string {
  return formatBusinessPercent(value, {
    fallback: EMPTY_VALUE,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

/** Variation with its sign: +12.5 %, -3.0 %. */
export function formatSignedPercent(value: number | null | undefined): string {
  if (!isNumber(value)) {
    return EMPTY_VALUE
  }

  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(value)
}

export function formatInteger(value: number | null | undefined): string {
  return formatBusinessNumber(value, {
    fallback: EMPTY_VALUE,
    maximumFractionDigits: 0,
  })
}

/** Units with up to one decimal (averages). */
export function formatUnits(value: number | null | undefined): string {
  return formatBusinessNumber(value, {
    fallback: EMPTY_VALUE,
    maximumFractionDigits: 1,
  })
}

export function formatDays(value: number | null | undefined): string {
  if (!isNumber(value)) {
    return EMPTY_VALUE
  }

  return `${formatUnits(value)} ${value === 1 ? 'día' : 'días'}`
}

/** YYYY-MM-DD (or an ISO date and time) → "24 nov 2026". */
export function formatDate(value: string | null | undefined): string {
  const match = DATE_ONLY.exec(value ?? '')

  if (!match) {
    return EMPTY_VALUE
  }

  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))))
    .replace(/\./g, '')
}

/** YYYY-MM → "noviembre 2026". */
export function formatPeriod(value: string | null | undefined): string {
  const match = PERIOD.exec(value ?? '')

  if (!match) {
    return EMPTY_VALUE
  }

  return new Intl.DateTimeFormat(LOCALE, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)))
}

export interface MyDayPeriodOption {
  value: string
  label: string
}

/**
 * The cutoff month and the previous ones (12 by default), newest first.
 * Nothing after the cutoff.
 */
export function buildPeriodOptions(
  dataCutoff: string | null | undefined,
  count = 12,
): MyDayPeriodOption[] {
  const match = DATE_ONLY.exec(dataCutoff ?? '')

  if (!match) {
    return []
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - index, 1))
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

    return { value, label: formatPeriod(value) }
  })
}

/**
 * Expected attainment at this point of the month: elapsed / total working
 * days while open, 100 % once closed.
 */
export function expectedProgress(
  workingDays: MyDayWorkingDays | null | undefined,
  periodStatus: MyDayPeriodStatus | null | undefined,
): number | null {
  if (periodStatus === 'closed') {
    return 1
  }

  if (periodStatus !== 'open' || !workingDays || workingDays.total <= 0) {
    return null
  }

  return workingDays.elapsed / workingDays.total
}

/**
 * Purchase order amounts by currency, never converted. A hidden cost reads
 * "Sin acceso a costo" (SEC-003C), a missing one "—"; never $0.
 */
export function formatAmountsByCurrency(
  amounts: MyDayAmountsByCurrency | null | undefined,
): string[] {
  const entries = Object.entries(amounts ?? {})
    .sort(([left], [right]) => left.localeCompare(right))

  if (entries.length === 0) {
    return [EMPTY_VALUE]
  }

  return entries.map(([currency, entry]) => {
    if (entry.amount === null || !Number.isFinite(entry.amount)) {
      return entry.linesHidden > 0 ? NO_COST_ACCESS_LABEL : EMPTY_VALUE
    }

    const amount = currency === NO_CURRENCY
      ? `${formatBusinessNumber(entry.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (sin moneda)`
      : formatBusinessCurrency(entry.amount, {
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

    // Some lines of this currency are hidden by the cost scope.
    return entry.linesHidden > 0
      ? `${amount} + ${NO_COST_ACCESS_LABEL.toLowerCase()}`
      : amount
  })
}
