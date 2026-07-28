import { describe, expect, it } from 'vitest'
import { BusinessRepository } from '../../business'
import type { BusinessDataModel } from '../../business/models'
import { ProductDecisionEngine } from './productDecisionEngine'

function model(status: 'A' | 'B' | 'C' | 'D' | 'E'): BusinessDataModel {
  return {
    generatedAt: '2026-07-01T00:00:00.000Z', periodStart: '2026-01-01', periodEnd: '2026-03-31',
    totals: { revenue: 250, grossProfit: 70, quantity: 3, documents: 3 },
    customers: new Map(), customerPeriods: new Map(), customerBrandPeriods: new Map(), brands: new Map(), brandPeriods: new Map(), brandTargets: new Map(),
    products: new Map([['SKU-1', { id: 'SKU-1', model: 'SKU-1', sku: 'SKU-1', brand: 'UNV', commercialStatus: status, firstSale: '2026-01-10', lastSale: '2026-03-10', revenue: 250, grossProfit: 70, quantity: 3, documents: 3, activePeriods: new Set(['2026-01', '2026-02', '2026-03']), brands: new Set(['UNV']), customers: new Set(['C1', 'C2']), locations: new Set(['CDMX']) }]]),
    productPeriods: new Map([
      ['2026-01::SKU-1', { id: '2026-01::SKU-1', productId: 'SKU-1', periodId: '2026-01', revenue: 100, grossProfit: 30, quantity: 1, documents: 1, customers: new Set(['C1', 'C2']), brands: new Set(['UNV']), locations: new Set(['CDMX']) }],
      ['2026-02::SKU-1', { id: '2026-02::SKU-1', productId: 'SKU-1', periodId: '2026-02', revenue: 100, grossProfit: 30, quantity: 1, documents: 1, customers: new Set(['C1']), brands: new Set(['UNV']), locations: new Set(['CDMX']) }],
      ['2026-03::SKU-1', { id: '2026-03::SKU-1', productId: 'SKU-1', periodId: '2026-03', revenue: 50, grossProfit: 10, quantity: 1, documents: 1, customers: new Set(['C1']), brands: new Set(['UNV']), locations: new Set(['CDMX']) }],
    ]),
    periods: new Map([
      ['2026-01', { id: '2026-01', year: 2026, month: 1, periodStart: '2026-01-01', periodEnd: '2026-01-31', revenue: 100, grossProfit: 30, quantity: 1, documents: 1, customers: new Set(), brands: new Set(), products: new Set() }],
      ['2026-02', { id: '2026-02', year: 2026, month: 2, periodStart: '2026-02-01', periodEnd: '2026-02-28', revenue: 100, grossProfit: 30, quantity: 1, documents: 1, customers: new Set(), brands: new Set(), products: new Set() }],
      ['2026-03', { id: '2026-03', year: 2026, month: 3, periodStart: '2026-03-01', periodEnd: '2026-03-31', revenue: 50, grossProfit: 10, quantity: 1, documents: 1, customers: new Set(), brands: new Set(), products: new Set() }],
    ]),
    documentNumbers: new Set(), locations: new Set(), salesRepresentatives: new Set(), currencies: new Set(), processedRows: 3, ignoredRows: 0,
  }
}

describe('ProductDecisionEngine', () => {
  it('treats E as a new product and does not penalize it as low penetration', () => {
    const result = new ProductDecisionEngine(new BusinessRepository(model('E'))).evaluate('SKU-1', '2026-03')
    expect(result?.isNewProduct).toBe(true)
    expect(result?.lifecycleStage).toBe('launch')
    expect(result?.riskLevel).toBe('low')
    expect(result?.opportunities.some((item) => item.ruleId === 'P-OPP-003')).toBe(true)
  })

  it('creates penetration development opportunity for D products', () => {
    const result = new ProductDecisionEngine(new BusinessRepository(model('D'))).evaluate('SKU-1', '2026-03')
    expect(result?.commercialStatusLabel).toBe('Muy baja penetración')
    expect(result?.opportunities.some((item) => item.ruleId === 'P-OPP-001')).toBe(true)
  })

  it('detects demand decline and produces explainable evidence', () => {
    const result = new ProductDecisionEngine(new BusinessRepository(model('B'))).evaluate('SKU-1', '2026-03')
    const decline = result?.risks.find((item) => item.ruleId === 'P-RISK-002')
    expect(decline).toBeDefined()
    expect(decline?.evidence.length).toBeGreaterThan(0)
  })
})
