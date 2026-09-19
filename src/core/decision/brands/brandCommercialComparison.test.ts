import { assert, describe, it } from 'vitest'
import { SalesSegmentationQueries } from '../../business/repository/salesSegmentationQueries'
import type { BusinessRepository } from '../../business/repository'
import type { BrandDecisionModel } from './brandDecisionTypes'
import { buildBrandCommercialComparison } from './brandCommercialComparison'

function fixture(cutoff = '2026-09-17', currentId = '2026-09', previousId = '2026-08') {
  const rows = [
    ['2026-08-03', 'A', 'C1', 'P1', 100],
    ['2026-08-19', 'A', 'C1', 'P1', 200],
    ['2026-08-20', 'A', 'C2', 'P2', 900],
    ['2026-08-03', 'B', 'C1', 'P1', 9000],
    ['2026-09-01', 'A', 'C1', 'P1', 120],
    ['2026-09-17', 'A', 'C1', 'P2', 180],
    ['2026-09-18', 'A', 'C3', 'P3', 1000],
  ] as const
  const salesSegments = new Map(rows.map(([dateId, brandId, customerId, productId, revenue], index) => [String(index), {
    id: String(index), dateId, periodId: dateId.slice(0, 7), brandId, customerId, productId,
    revenue, grossProfit: revenue / 4, quantity: 1, rowCount: 1,
    documentNumbers: new Set([`DOC${index}`]),
  }]))
  const salesSegmentation = new SalesSegmentationQueries({
    salesSegments, customers: new Map(), products: new Map(), brands: new Map(),
  } as unknown as ConstructorParameters<typeof SalesSegmentationQueries>[0])
  const repository = { salesSegmentation, getDataPeriodEnd: () => cutoff } as unknown as BusinessRepository
  const snapshot = (periodId: string) => ({ periodId, actuals: { revenue: 1200, customers: 2 } })
  const decision = {
    brandId: 'A', currentPeriodId: currentId, previousPeriodId: previousId,
    currentSnapshot: snapshot(currentId), previousSnapshot: snapshot(previousId),
  } as unknown as BrandDecisionModel
  return { repository, decision }
}

describe('Brand commercial comparison at equivalent cutoff', () => {
  it('uses 13 working days in both months and unique customers/products within each window', () => {
    const { repository, decision } = fixture()
    const result = buildBrandCommercialComparison(repository, decision)
    assert.match(result.ranges['2026-08'], /2026-08-19 · 13/)
    assert.match(result.ranges['2026-09'], /2026-09-17 · 13/)
    assert.equal(result.snapshots[0].actuals.revenue, 300)
    assert.equal(result.snapshots[1].actuals.revenue, 300)
    assert.equal(result.snapshots[0].actuals.customers, 1)
    assert.equal(result.snapshots[0].actuals.products, 1)
    assert.equal(result.snapshots[1].actuals.products, 2)
    assert.equal(result.snapshots[1].actuals.grossMargin, 0.25)
    assert.equal(decision.currentSnapshot.actuals.revenue, 1200)
  })
  it('keeps complete months for closed periods', () => {
    const { repository, decision } = fixture('2026-09-30')
    const result = buildBrandCommercialComparison(repository, decision)
    assert.equal(result.snapshots[0].actuals.revenue, 1200)
    assert.equal(result.snapshots[1].actuals.revenue, 1300)
    assert.match(result.description, /Mes cerrado/)
  })
  it('does not substitute a full month when there are no elapsed working days', () => {
    const { repository, decision } = fixture('2026-08-02', '2026-08', '2026-07')
    assert.equal(buildBrandCommercialComparison(repository, decision).snapshots.length, 0)
  })
  it('does not publish fabricated prior-period changes when prior snapshot is absent', () => {
    const { repository, decision } = fixture()
    decision.previousSnapshot = null
    const result = buildBrandCommercialComparison(repository, decision)
    assert.equal(result.snapshots.length, 1)
    assert.match(result.description, /variación no disponible/)
  })
  it('reports missing dated detail instead of monthly totals as comparable data', () => {
    const { repository, decision } = fixture('2026-11-17', '2026-11', '2026-10')
    const result = buildBrandCommercialComparison(repository, decision)
    assert.equal(result.snapshots.length, 0)
    assert.match(result.description, /Falta detalle/)
  })
  it('groups recovery amounts by brand even when the same customer buys other brands', () => {
    const { repository } = fixture()
    const customer = repository.salesSegmentation.groupBy('customer', { periodIds: ['2026-08'], brandIds: ['A'] }).find((row) => row.id === 'C1')
    assert.equal(customer?.revenue, 300)
    assert.equal(customer?.grossProfit, 75)
    assert.equal(customer?.documents, 2)
  })
})
