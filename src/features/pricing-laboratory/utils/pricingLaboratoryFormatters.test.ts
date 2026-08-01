import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  formatPricingBasis,
  formatPricingPercentage,
} from './pricingLaboratoryFormatters'

describe('pricingLaboratoryFormatters', () => {
  it('formats rates as percentages for the visual layer', () => {
    expect(formatPricingPercentage(0.26)).toContain('26')
  })

  it('explains an additional discount without calling it a recommendation', () => {
    const formatted = formatPricingBasis({
      type: 'additional_discount',
      discountRate: 0.05,
      applyTo: 'current_selling_price',
    }, 'MXN')

    expect(formatted).toContain('5')
    expect(formatted).toContain('precio vigente')
    expect(formatted).not.toContain('recomend')
  })
})
