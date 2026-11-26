// MD-003: es-MX formats of "Mi día"; a missing value is "—", never 0.

import { describe, expect, it } from 'vitest'

import {
  EMPTY_VALUE,
  buildPeriodOptions,
  capitalizeFirst,
  chooseNumberLocale,
  describeLostCustomersWindow,
  expectedProgress,
  formatAmountsByCurrency as formatAmounts,
  formatDate,
  formatDays,
  formatInteger,
  formatMoney,
  formatPercent,
  formatPeriod,
  formatSignedPercent,
  formatUnits,
} from './myDayFormat'

describe('MD-003 formats', () => {
  it('shows missing values as "—", never as 0', () => {
    for (const format of [formatMoney, formatPercent, formatSignedPercent, formatInteger, formatUnits, formatDays]) {
      expect(format(null)).toBe(EMPTY_VALUE)
      expect(format(undefined)).toBe(EMPTY_VALUE)
      expect(format(Number.NaN)).toBe(EMPTY_VALUE)
    }

    expect(formatDate(null)).toBe(EMPTY_VALUE)
    expect(formatPeriod('2026-13-01')).toBe(EMPTY_VALUE)
  })

  it('formats MXN without decimals, negative revenue included', () => {
    expect(formatMoney(1234567.4)).toBe('$1,234,567')
    expect(formatMoney(-1234.5)).toBe('-$1,235')
    expect(formatMoney(0)).toBe('$0')
  })

  it('formats percentages with one decimal and signed variations', () => {
    expect(formatPercent(0.856)).toBe('85.6%')
    expect(formatPercent(1)).toBe('100.0%')
    expect(formatSignedPercent(0.125)).toBe('+12.5%')
    expect(formatSignedPercent(-0.03)).toBe('-3.0%')
    expect(formatSignedPercent(0)).toBe('0.0%')
  })

  it('formats units, days and dates in es-MX', () => {
    expect(formatInteger(1234.6)).toBe('1,235')
    expect(formatUnits(15.333)).toBe('15.3')
    expect(formatDays(1)).toBe('1 día')
    expect(formatDays(9.04)).toBe('9 días')
    expect(formatDate('2026-11-24')).toBe('24 nov 2026')
    expect(formatDate('2026-11-21T15:00:00.000Z')).toBe('21 nov 2026')
    expect(formatPeriod('2026-11')).toBe('noviembre de 2026')
  })

  it('keeps Mexican separators when the browser lacks the es-MX data (MD-003-HOTFIX1)', () => {
    // A browser with real es-MX data.
    expect(chooseNumberLocale(() => '1,234.5')).toBe('es-MX')
    // A mobile browser that falls back to "es" (Spain): 1.234,5.
    expect(chooseNumberLocale(() => '1.234,5')).toBe('en-US')
    expect(chooseNumberLocale(() => { throw new RangeError('no data') })).toBe('en-US')
    // Same separators either way.
    expect(new Intl.NumberFormat('en-US').format(60174004)).toBe('60,174,004')
    expect(formatMoney(60174004)).toBe('$60,174,004')
    expect(formatMoney(-0.4)).toBe('$0')
  })

  it('describes the lost-customers window in words (MD-003-HOTFIX1)', () => {
    expect(describeLostCustomersWindow({
      baseFrom: '2026-08', baseTo: '2026-08', inactiveFrom: '2026-09', inactiveTo: '2026-10',
    })).toBe('Compraron en agosto de 2026 y no compraron ni en septiembre ni en octubre de 2026')
    expect(describeLostCustomersWindow({
      baseFrom: '2025-10', baseTo: '2025-10', inactiveFrom: '2025-11', inactiveTo: '2025-11',
    })).toBe('Compraron en octubre de 2025 y no compraron en noviembre de 2025')
    expect(describeLostCustomersWindow({
      baseFrom: '2025-11', baseTo: '2025-11', inactiveFrom: '2025-12', inactiveTo: '2026-01',
    })).toBe('Compraron en noviembre de 2025 y no compraron ni en diciembre de 2025 ni en enero de 2026')
    expect(describeLostCustomersWindow({
      baseFrom: '2026-04', baseTo: '2026-06', inactiveFrom: '2026-07', inactiveTo: '2026-10',
    })).toBe('Compraron entre abril y junio de 2026 y no compraron entre julio y octubre de 2026')
    expect(describeLostCustomersWindow(null)).toBeNull()
  })

  it('capitalizes only the first letter', () => {
    expect(capitalizeFirst('noviembre de 2026')).toBe('Noviembre de 2026')
  })

  it('offers the cutoff month and the 11 previous ones, nothing after the cutoff', () => {
    const options = buildPeriodOptions('2026-02-20')

    expect(options).toHaveLength(12)
    expect(options[0]).toEqual({ value: '2026-02', label: 'Febrero de 2026' })
    expect(options[1]?.value).toBe('2026-01')
    expect(options[2]?.value).toBe('2025-12')
    expect(options[11]?.value).toBe('2025-03')
    expect(buildPeriodOptions(null)).toEqual([])
  })

  it('expects elapsed / total working days while open and 100 % once closed', () => {
    const workingDays = { elapsed: 15, total: 21, remaining: 6, holidaysExcluded: false }

    expect(expectedProgress(workingDays, 'open')).toBeCloseTo(15 / 21)
    expect(expectedProgress(workingDays, 'closed')).toBe(1)
    expect(expectedProgress(workingDays, 'after-cutoff')).toBeNull()
    expect(expectedProgress(null, 'open')).toBeNull()
  })

  it('keeps purchase order amounts by currency and never shows a hidden cost as $0', () => {
    // Intl separates the currency code with a non-breaking space.
    const formatAmountsByCurrency = (...args: Parameters<typeof formatAmounts>) =>
      formatAmounts(...args).map((amount) => amount.replace(/ /g, ' '))

    expect(formatAmountsByCurrency({
      USD: { amount: 5000, lines: 2, linesWithoutAmount: 0, linesHidden: 0 },
      MXN: { amount: 120000, lines: 1, linesWithoutAmount: 0, linesHidden: 0 },
    })).toEqual(['$120,000.00', 'USD 5,000.00'])

    const hidden = formatAmountsByCurrency({
      USD: { amount: null, lines: 3, linesWithoutAmount: 0, linesHidden: 3 },
      SIN_MONEDA: { amount: null, lines: 1, linesWithoutAmount: 1, linesHidden: 0 },
    })

    expect(hidden).toEqual(['—', 'Sin acceso a costo'])
    expect(hidden.join(' ')).not.toContain('$0')
    expect(formatAmountsByCurrency({
      USD: { amount: 100, lines: 2, linesWithoutAmount: 0, linesHidden: 1 },
    })).toEqual(['USD 100.00 + sin acceso a costo'])
    expect(formatAmountsByCurrency({})).toEqual(['—'])
  })
})
