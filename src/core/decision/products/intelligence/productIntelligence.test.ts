import { describe, expect, it } from 'vitest'
import { evaluateBCG } from './bcgEngine'
import { evaluateCommercialPenetration } from './commercialPenetrationEngine'
import { buildProductRadar } from './productRadarEngine'

 describe('Product Intelligence Insights', () => {
  it('treats E as a new product without a penetration penalty', () => {
    const result = evaluateCommercialPenetration('E')
    expect(result.isNewProduct).toBe(true)
    expect(result.label).toContain('nuevo')
    expect(result.score).toBeGreaterThanOrEqual(50)
  })

  it('classifies a high-growth and high-position product as a star', () => {
    const result = evaluateBCG({ revenueVariation: 0.35, penetrationScore: 90, recurrenceScore: 80 })
    expect(result.classification).toBe('star')
  })

  it('creates launch and growth radar signals', () => {
    const result = buildProductRadar({
      isNewProduct: true,
      inactiveMonths: 0,
      revenueVariation: 0.30,
      concentrationRisk: 'low',
      commercialStatus: 'E',
    })
    expect(result.some((item) => item.type === 'launch')).toBe(true)
    expect(result.some((item) => item.type === 'growth')).toBe(true)
  })
})
