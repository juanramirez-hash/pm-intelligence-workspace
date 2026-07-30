import { describe, expect, it } from 'vitest'

import type {
  BusinessInventoryPosition,
} from '../../entities/inventoryPosition'

import {
  buildInventoryRiskOpportunityReport,
} from './inventoryRiskOpportunity'

function position(
  overrides: Partial<BusinessInventoryPosition>,
): BusinessInventoryPosition {
  return {
    id: '2026-07-30::P-1::CDMX',
    snapshotDate: '2026-07-30',
    productId: 'P-1',
    productName: 'P-1',
    productCode: 'P-1',
    brandId: 'UNV',
    model: 'IPC-A',
    locationId: 'CDMX',
    identityStatus: 'current_master',
    onHand: 10,
    available: 8,
    committed: 2,
    inTransit: 0,
    onOrder: 0,
    unitCost: 100,
    inventoryValue: 1000,
    currency: 'MXN',
    sourceRows: 1,
    ...overrides,
  }
}

describe('IW-004 Inventory Risk & Opportunity Engine', () => {
  it('detecta riesgos operativos y prioriza inventario negativo', () => {
    const report = buildInventoryRiskOpportunityReport(
      [
        position({ available: -2, onHand: -2 }),
        position({
          id: 'P-2',
          productId: 'P-2',
          productName: 'P-2',
          onHand: 0,
          available: 0,
          inventoryValue: 0,
        }),
      ],
      '2026-07-30',
    )

    expect(report.risks[0]?.type).toBe('negative_stock')
    expect(report.risks.some((risk) => risk.type === 'out_of_stock')).toBe(true)
    expect(report.summary.criticalRisks).toBeGreaterThan(0)
  })

  it('propone transferencia entre ubicaciones del mismo producto', () => {
    const report = buildInventoryRiskOpportunityReport(
      [
        position({ locationId: 'CDMX', available: 12, onHand: 12 }),
        position({
          id: '2026-07-30::P-1::QRO',
          locationId: 'QRO',
          available: 0,
          onHand: 0,
          committed: 4,
          inventoryValue: 0,
        }),
      ],
      '2026-07-30',
    )

    const transfer = report.opportunities.find(
      (opportunity) => opportunity.type === 'transfer_candidate',
    )

    expect(transfer?.sourceLocationId).toBe('CDMX')
    expect(transfer?.targetLocationId).toBe('QRO')
    expect(transfer?.evidence.suggestedUnits).toBe(4)
  })

  it('distingue compra requerida de entrada pendiente', () => {
    const report = buildInventoryRiskOpportunityReport(
      [
        position({ onHand: 0, available: 0, committed: 3 }),
        position({
          id: 'P-2',
          productId: 'P-2',
          productName: 'P-2',
          onHand: 0,
          available: 0,
          onOrder: 5,
          inventoryValue: 0,
        }),
      ],
      '2026-07-30',
    )

    expect(
      report.opportunities.some(
        (opportunity) => opportunity.type === 'purchase_review',
      ),
    ).toBe(true)
    expect(
      report.opportunities.some(
        (opportunity) => opportunity.type === 'inbound_recovery',
      ),
    ).toBe(true)
  })
})
