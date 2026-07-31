import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  InventoryAnalyticsReport,
  InventoryOpportunitySignal,
  InventoryRiskSignal,
} from '../../../core/business/analytics/inventory'

import {
  DEFAULT_INVENTORY_WORKSPACE_FILTERS,
} from './inventoryWorkspaceModel'

import {
  buildInventoryExecutiveSummary,
} from './inventoryExecutiveSummary'

const analytics: InventoryAnalyticsReport = {
  generatedAt: '2026-07-31T12:00:00.000Z',
  snapshotDate: '2026-07-30',
  totals: {
    positions: 2,
    products: 2,
    locations: 2,
    unresolvedProducts: 1,
    onHand: 10,
    available: 8,
    committed: 2,
    inTransit: 3,
    onOrder: 4,
    inventoryValue: 1000,
    availableRate: 0.8,
    committedRate: 0.2,
    inboundUnits: 7,
  },
  byBrand: [],
  byLocation: [],
  byProduct: [],
  stockStatus: [],
}

const risk: InventoryRiskSignal = {
  id: 'R-1',
  type: 'out_of_stock',
  priority: 'critical',
  score: 90,
  snapshotDate: '2026-07-30',
  productId: 'P-1',
  productName: 'P-1',
  brandId: 'UNV',
  locationId: 'CDMX',
  title: 'Producto agotado',
  rationale: 'Sin existencia.',
  evidence: {
    onHand: 0,
    available: 0,
    committed: 0,
    inbound: 0,
    inventoryValue: 0,
    valueShare: 0,
  },
}

const opportunity: InventoryOpportunitySignal = {
  id: 'O-1',
  type: 'purchase_review',
  priority: 'high',
  score: 75,
  snapshotDate: '2026-07-30',
  productId: 'P-1',
  productName: 'P-1',
  brandId: 'UNV',
  sourceLocationId: null,
  targetLocationId: 'CDMX',
  title: 'Revisión de compra requerida',
  rationale: 'Sin entradas.',
  evidence: {
    shortageUnits: 2,
    surplusUnits: 0,
    suggestedUnits: 2,
    inboundUnits: 0,
    inventoryValue: 0,
  },
}

describe('IW-006 Inventory executive summary', () => {
  it('construye una lectura ejecutiva determinística', () => {
    const summary = buildInventoryExecutiveSummary({
      analytics,
      risks: [risk],
      opportunities: [opportunity],
      filters: {
        ...DEFAULT_INVENTORY_WORKSPACE_FILTERS,
        brandId: 'UNV',
      },
    })

    expect(summary.title).toContain('2026-07-30')
    expect(summary.overview).toContain('$1,000')
    expect(summary.outlook).toContain('1 riesgos críticos o altos')
    expect(summary.filterContext).toBe('Marca: UNV')
    expect(
      summary.findings.find(
        (finding) => finding.label === 'Productos sin conciliar',
      )?.tone,
    ).toBe('critical')
  })
})
