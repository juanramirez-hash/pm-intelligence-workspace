import { assert, describe, it } from 'vitest'
import { buildBrandCommercialPlan } from './brandCommercialPlans'
import type { BrandWorkspaceViewModel } from './brandWorkspaceViewModel'

const workspace = {
  forecast: { revenueTargetLabel: 'Sin dato', actualRevenueLabel: '$300', revenueGapLabel: 'Sin dato', remainingWorkingDaysLabel: 'Sin dato', requiredDailyRevenueLabel: 'Sin dato' },
  lossEvaluation: { basePeriodId: '2026-06', inactivityPeriodIds: ['2026-07', '2026-08'] },
  tables: {
    lostCustomers: [{ id: 'C1', customerName: 'Uno', previousRevenue: '$300' }, { id: 'C2', customerName: 'Dos', previousRevenue: '$100' }],
    lostProducts: [{ id: 'P1', productModel: 'Modelo' }],
  },
} as unknown as BrandWorkspaceViewModel
const request = { title: 'Acción', description: 'Motivo de la recomendación' }

describe('Proposed commercial plans', () => {
  it('routes by stable reason codes instead of translated title', () => {
    const plan = buildBrandCommercialPlan(workspace, { ...request, reasonCodes: ['revenue-below-target'] })
    assert.equal(plan.kind, 'revenue')
    assert.equal(plan.metrics[0][1], 'Sin dato')
    assert.equal(plan.steps.length, 4)
  })
  it('scopes an individual customer plan and states the historical loss window', () => {
    const plan = buildBrandCommercialPlan(workspace, { ...request, type: 'customer', entityId: 'C2' })
    assert.deepEqual(plan.customers.map((row) => row.id), ['C2'])
    assert.match(plan.lossContext, /2026-06/)
    assert.match(plan.lossContext, /2026-07 y 2026-08/)
  })
  it('does not fill an unknown customer with unrelated candidates', () => {
    const plan = buildBrandCommercialPlan(workspace, { ...request, type: 'customer', entityId: 'missing' })
    assert.equal(plan.customers.length, 0)
  })
  it('recognizes health recommendations from agenda evidence', () => {
    assert.equal(buildBrandCommercialPlan(workspace, { ...request, evidence: ['health.grossProfit.risk'] }).kind, 'margin')
    assert.equal(buildBrandCommercialPlan(workspace, { ...request, code: 'health.forecast.attention' }).kind, 'revenue')
  })
  it('provides an explicit review plan for unknown actions without claiming to know their cause', () => {
    assert.equal(buildBrandCommercialPlan(workspace, { ...request, code: 'unknown' }).kind, 'follow-up')
  })
})
