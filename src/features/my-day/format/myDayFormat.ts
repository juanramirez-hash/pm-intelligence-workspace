// MD-003: es-MX formats of "Mi día". A missing value (null, undefined or a
// non-finite number) is always "—", never 0.
//
// MD-003-HOTFIX1: every format passes an explicit locale. Numbers use
// NUMBER_LOCALE: es-MX when the browser really formats it as in Mexico
// (1,234.5); some mobile browsers lack the es-MX data and fall back to "es"
// (1.234,5), so en-US, which has the same separators, is used instead.
// Currency symbols are composed here ($ for MXN, the ISO code otherwise), so
// they never depend on the locale data either.

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
const MEXICAN_PROBE = '1,234.5'

/**
 * es-MX when formatting 1234.5 with it gives "1,234.5"; otherwise en-US
 * (same separators). The formatter is injectable for tests.
 */
export function chooseNumberLocale(
  format: (locale: string) => string = (locale) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(1234.5),
): 'es-MX' | 'en-US' {
  try {
    return format(LOCALE) === MEXICAN_PROBE ? LOCALE : 'en-US'
  } catch {
    return 'en-US'
  }
}

export const NUMBER_LOCALE = chooseNumberLocale()

const isNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

function formatNumber(
  value: number,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

/** "$1,234" / "-$1,234" (MXN) or "USD 1,234.00" (other currencies). */
function formatCurrency(
  value: number,
  currency: string,
  fractionDigits: number,
): string {
  const amount = formatNumber(Math.abs(value), fractionDigits, fractionDigits)
  const sign = value < 0 && amount.replace(/[0.,]/g, '') !== '' ? '-' : ''

  return currency === 'MXN'
    ? `${sign}$${amount}`
    : `${sign}${currency} ${amount}`
}

/** MXN without decimals; negative values allowed (credit notes). */
export function formatMoney(value: number | null | undefined): string {
  return isNumber(value) ? formatCurrency(value, 'MXN', 0) : EMPTY_VALUE
}

/** Ratio as a percentage with one decimal: 0.856 → "85.6%". */
export function formatPercent(value: number | null | undefined): string {
  if (!isNumber(value)) {
    return EMPTY_VALUE
  }

  return new Intl.NumberFormat(NUMBER_LOCALE, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

/** Variation with its sign: +12.5%, -3.0%. */
export function formatSignedPercent(value: number | null | undefined): string {
  if (!isNumber(value)) {
    return EMPTY_VALUE
  }

  return new Intl.NumberFormat(NUMBER_LOCALE, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(value)
}

export function formatInteger(value: number | null | undefined): string {
  return isNumber(value) ? formatNumber(value, 0, 0) : EMPTY_VALUE
}

/** Units with up to one decimal (averages). */
export function formatUnits(value: number | null | undefined): string {
  return isNumber(value) ? formatNumber(value, 0, 1) : EMPTY_VALUE
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

/** YYYY-MM → "noviembre de 2026". */
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

/** YYYY-MM → "noviembre" (month name only). */
function formatMonthName(value: string): string {
  const match = PERIOD.exec(value)

  if (!match) {
    return EMPTY_VALUE
  }

  return new Intl.DateTimeFormat(LOCALE, {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)))
}

/** Only the first letter in upper case: "Noviembre de 2026". */
export function capitalizeFirst(value: string): string {
  return value.charAt(0).toLocaleUpperCase(LOCALE) + value.slice(1)
}

const monthIndex = (period: string) => {
  const match = PERIOD.exec(period)

  return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : null
}

const yearOf = (period: string) => period.slice(0, 4)

/**
 * "agosto de 2026", "junio y julio de 2026", "diciembre de 2025 y enero de
 * 2026": the year is written once when both months share it.
 */
function twoMonths(from: string, to: string, joiner: string): string {
  return yearOf(from) === yearOf(to)
    ? `${formatMonthName(from)}${joiner}${formatPeriod(to)}`
    : `${formatPeriod(from)}${joiner}${formatPeriod(to)}`
}

/**
 * MD-003-HOTFIX1: the lost-customers window in words, from the response:
 * "Compraron en agosto de 2026 y no compraron ni en septiembre ni en octubre
 * de 2026". Longer windows read "entre <inicio> y <fin>".
 */
export function describeLostCustomersWindow(window: {
  baseFrom: string
  baseTo: string
  inactiveFrom: string
  inactiveTo: string
} | null | undefined): string | null {
  if (!window) {
    return null
  }

  const months = (from: string, to: string) => {
    const start = monthIndex(from)
    const end = monthIndex(to)

    return start === null || end === null ? 0 : end - start + 1
  }

  const baseMonths = months(window.baseFrom, window.baseTo)
  const inactiveMonths = months(window.inactiveFrom, window.inactiveTo)

  const bought = baseMonths <= 1
    ? `en ${formatPeriod(window.baseFrom)}`
    : `entre ${twoMonths(window.baseFrom, window.baseTo, ' y ')}`

  let notBought: string

  if (inactiveMonths <= 1) {
    notBought = `no compraron en ${formatPeriod(window.inactiveFrom)}`
  } else if (inactiveMonths === 2) {
    notBought = `no compraron ni en ${twoMonths(window.inactiveFrom, window.inactiveTo, ' ni en ')}`
  } else {
    notBought = `no compraron entre ${twoMonths(window.inactiveFrom, window.inactiveTo, ' y ')}`
  }

  return `Compraron ${bought} y ${notBought}`
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

    return { value, label: capitalizeFirst(formatPeriod(value)) }
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
    .sort(([left], [right]) => left.localeCompare(right, LOCALE))

  if (entries.length === 0) {
    return [EMPTY_VALUE]
  }

  return entries.map(([currency, entry]) => {
    if (entry.amount === null || !Number.isFinite(entry.amount)) {
      return entry.linesHidden > 0 ? NO_COST_ACCESS_LABEL : EMPTY_VALUE
    }

    const amount = currency === NO_CURRENCY
      ? `${formatNumber(entry.amount, 2, 2)} (sin moneda)`
      : formatCurrency(entry.amount, currency, 2)

    // Some lines of this currency are hidden by the cost scope.
    return entry.linesHidden > 0
      ? `${amount} + ${NO_COST_ACCESS_LABEL.toLowerCase()}`
      : amount
  })
}
