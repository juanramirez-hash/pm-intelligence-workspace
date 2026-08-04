import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedSalesRow,
} from '../../data-center/importers/sales/salesTypes'

import {
  buildBusinessDataModel,
} from '../../../core/business/builders'

import {
  BusinessRepository,
} from '../../../core/business/repository'

import {
  buildExecutivePeriodSelection,
} from './executivePeriodView'

import {
  buildExecutiveCustomerAttentionSummary,
} from './executiveCustomerLifecycle'

function row(
  date: string,
  customerId: string,
  revenue: number,
): NormalizedSalesRow {
  return {
    date,
    brand: 'UNV',
    revenue,
    grossProfit: revenue * 0.3,
    customerId,
    customerName: `Cliente ${customerId}`,
    model: `P-${customerId}`,
    quantity: 1,
    documentNumber:
      `${date}-${customerId}`,
    location: 'CDMX',
    salesRep: 'PM',
    currency: 'MXN',
  }
}

function createRepository():
BusinessRepository {
  const rows:
    NormalizedSalesRow[] = [
    row('2025-01-10', 'LOST', 100),
    row('2026-04-10', 'INACTIVE', 100),
    row('2026-06-12', 'MONTH_GAP', 100),
    row('2026-06-14', 'DECLINING', 200),
    row('2026-07-14', 'DECLINING', 100),
    row('2026-07-18', 'NEW', 80),
    row('2026-01-20', 'RECOVERED', 50),
    row('2026-07-20', 'RECOVERED', 90),
    row('2026-08-05', 'FUTURE', 120),
  ]

  return new BusinessRepository(
    buildBusinessDataModel(rows),
  )
}

function buildJulySummary() {
  const repository = createRepository()

  const selection =
    buildExecutivePeriodSelection(
      repository,
      {
        anchorPeriodId: '2026-07',
        preset: 'month',
      },
    )

  return {
    repository,
    selection,
    summary:
      buildExecutiveCustomerAttentionSummary(
        repository,
        selection,
      ),
  }
}

describe(
  'EW-001-HOTFIX1 customer lifecycle integrity',
  () => {
    it('does not mark a customer as inactive or lost after only one month without purchases', () => {
      const { summary } =
        buildJulySummary()

      expect(
        summary.inactiveOrLostEntities,
      ).toBe(2)

      expect(
        summary.entitiesRequiringAttention,
      ).toBe(3)

      expect(
        [
          ...(
            summary.entityIds
              ?.requiringAttention ?? []
          ),
        ].sort(),
      ).toEqual([
        'DECLINING',
        'INACTIVE',
        'LOST',
      ])
    })

    it('classifies inactivity at 90 days and loss at 180 days using the selected cutoff', () => {
      const { summary } =
        buildJulySummary()

      expect(
        summary.inactiveOrLostEntities,
      ).toBe(2)

      expect(
        summary.decliningEntities,
      ).toBe(1)
    })

    it('uses the real first purchase to distinguish new and recovered customers', () => {
      const { summary } =
        buildJulySummary()

      expect(summary.newEntities).toBe(1)
      expect(
        summary.recoveredEntities,
      ).toBe(1)
    })

    it('matches active customers with the unique customer-period index for the selected month', () => {
      const {
        repository,
        summary,
      } = buildJulySummary()

      const indexedActiveCustomers =
        repository.customer
          .findPeriodsByPeriodId(
            '2026-07',
          )
          .filter(
            (period) =>
              period.revenue !== 0 ||
              period.quantity !== 0 ||
              period.documents > 0,
          )
          .length

      expect(
        summary.activeEntities,
      ).toBe(indexedActiveCustomers)

      expect(
        summary.activeEntities,
      ).toBe(3)
    })

    it('excludes customers whose first purchase occurs after the selected analysis cutoff', () => {
      const { summary } =
        buildJulySummary()

      expect(summary.totalAnalyzed).toBe(6)
    })
  },
)
