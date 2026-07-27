import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  formatBusinessCurrency,
  formatBusinessNumber,
  formatBusinessPercent,
} from './businessFormatters'

describe('businessFormatters', () => {
  it('formatea porcentajes desde ratios', () => {
    expect(
      formatBusinessPercent(0.6),
    ).toMatch(/^60\s?%$/u)
  })

  it('usa un fallback estable para valores no evaluables', () => {
    expect(formatBusinessNumber(null)).toBe('sin dato')
    expect(formatBusinessPercent(Number.NaN)).toBe('sin dato')
    expect(formatBusinessCurrency(undefined)).toBe('sin dato')
  })

  it('permite configurar locale, moneda y precisión', () => {
    expect(
      formatBusinessCurrency(
        1234.5,
        {
          locale: 'en-US',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      ),
    ).toBe('$1,234.50')
  })
})
