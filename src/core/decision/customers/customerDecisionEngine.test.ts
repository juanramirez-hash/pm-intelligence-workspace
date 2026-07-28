import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import {
  buildBusinessDataModel,
  BusinessRepository,
} from '../../business'

import {
  CustomerDecisionEngine,
} from './customerDecisionEngine'

function createRepository(): BusinessRepository {
  const rows: NormalizedSalesRow[] = [
    {
      date: '2026-01-05',
      brand: 'UNV',
      revenue: 1000,
      grossProfit: 300,
      customerId: '100001',
      customerName: 'Cliente Uno',
      model: 'IPC-A',
      quantity: 2,
      documentNumber: 'F001',
      location: 'CDMX',
      salesRep: 'Ana',
      currency: 'MXN',
    },
    {
      date: '2026-01-18',
      brand: 'UNV',
      revenue: 500,
      grossProfit: 150,
      customerId: '100001',
      customerName: 'Cliente Uno',
      model: 'IPC-B',
      quantity: 1,
      documentNumber: 'F002',
      location: 'CDMX',
      salesRep: 'Ana',
      currency: 'MXN',
    },
    {
      date: '2026-02-10',
      brand: 'UNV',
      revenue: 600,
      grossProfit: 180,
      customerId: '100001',
      customerName: 'Cliente Uno',
      model: 'IPC-A',
      quantity: 1,
      documentNumber: 'F003',
      location: 'CDMX',
      salesRep: 'Ana',
      currency: 'MXN',
    },
    {
      date: '2026-03-12',
      brand: 'AJAX',
      revenue: 2000,
      grossProfit: 500,
      customerId: '100002',
      customerName: 'Cliente Dos',
      model: 'HUB-2',
      quantity: 3,
      documentNumber: 'F004',
      location: 'QRO',
      salesRep: 'Luis',
      currency: 'MXN',
    },
  ]

  return new BusinessRepository(
    buildBusinessDataModel(rows),
  )
}

describe(
  'CustomerDecisionEngine',
  () => {
    it(
      'transforma customerPeriods en una decisión explicable',
      () => {
        const engine =
          new CustomerDecisionEngine(
            createRepository(),
          )

        const decision = engine.evaluate(
          '100001',
          '2026-02',
        )

        expect(decision).not.toBeNull()
        expect(decision?.current.revenue).toBe(600)
        expect(decision?.previous?.revenue).toBe(1500)
        expect(decision?.revenueVariation).toBe(-0.6)
        expect(decision?.healthScore.score).toBeGreaterThanOrEqual(0)
        expect(decision?.healthScore.score).toBeLessThanOrEqual(100)
        expect(decision?.risks.map(
          (risk) => risk.ruleId,
        )).toContain('customer.revenue-decline')
        expect(decision?.risks.map(
          (risk) => risk.ruleId,
        )).toContain('customer.frequency-decline')
        expect(decision?.explanations.length).toBeGreaterThan(0)
        expect(decision?.recommendedActions.length).toBeGreaterThan(0)
      },
    )

    it(
      'detecta recuperación potencial cuando el cliente deja de comprar',
      () => {
        const engine =
          new CustomerDecisionEngine(
            createRepository(),
          )

        const decision = engine.evaluate(
          '100001',
          '2026-04',
        )

        expect(decision?.inactiveMonths).toBe(2)
        expect(decision?.riskLevel).toBe('high')
        expect(decision?.recoveryPotential).toBeGreaterThan(0)
        expect(decision?.opportunities.map(
          (opportunity) => opportunity.ruleId,
        )).toContain('customer.recovery')
      },
    )

    it(
      'mantiene el análisis específico por marca',
      () => {
        const engine =
          new CustomerDecisionEngine(
            createRepository(),
          )

        const decision = engine.evaluate(
          '100001',
          '2026-02',
          'unv',
        )

        expect(decision?.scope).toBe('brand')
        expect(decision?.selectedBrandId).toBe('UNV')
        expect(decision?.current.brands).toBe(1)
      },
    )

    it(
      'devuelve null para un cliente inexistente',
      () => {
        const engine =
          new CustomerDecisionEngine(
            createRepository(),
          )

        expect(
          engine.evaluate(
            'NO-EXISTE',
            '2026-02',
          ),
        ).toBeNull()
      },
    )
  },
)
