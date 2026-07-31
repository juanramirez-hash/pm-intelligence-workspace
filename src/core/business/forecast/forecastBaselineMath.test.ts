import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  averageMetricValues,
  calculateTrendRate,
  coefficientOfVariation,
  projectMetricTrend,
} from './forecastBaselineMath'

describe('FW-002 baseline math', () => {
  it('calcula promedio y tendencia lineal determinista', () => {
    const values = [
      { revenue: 100, grossProfit: 25, quantity: 10 },
      { revenue: 120, grossProfit: 30, quantity: 12 },
    ]

    expect(averageMetricValues(values)).toEqual({
      revenue: 110,
      grossProfit: 27.5,
      quantity: 11,
    })

    expect(projectMetricTrend(values)).toEqual({
      revenue: 140,
      grossProfit: 35,
      quantity: 14,
    })
  })


  it('mide la tendencia contra el último periodo cerrado', () => {
    expect(
      calculateTrendRate(
        120,
        140,
        110,
      ),
    ).toBe(0.1667)
  })

  it('mide volatilidad sin dividir entre cero', () => {
    expect(coefficientOfVariation([100, 120])).toBe(0.0909)
    expect(coefficientOfVariation([0, 0])).toBe(0)
    expect(coefficientOfVariation([0, 10])).toBe(1)
  })
})
