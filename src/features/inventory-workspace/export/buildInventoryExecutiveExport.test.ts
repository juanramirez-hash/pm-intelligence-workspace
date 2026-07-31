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

import type {
  InventoryWorkspacePosition,
} from '../engine/inventoryCatalogEnrichment'

import {
  DEFAULT_INVENTORY_WORKSPACE_FILTERS,
} from '../engine/inventoryWorkspaceModel'

import {
  buildInventoryExecutiveSummary,
} from '../engine/inventoryExecutiveSummary'

import {
  buildInventoryExecutiveExport,
} from './buildInventoryExecutiveExport'

const position: InventoryWorkspacePosition = {
  id: '2026-07-30::P-1::CDMX',
  snapshotDate: '2026-07-30',
  productId: 'P-1',
  productName: 'CAMARA UNO',
  productCode: 'P-1',
  brandId: 'UNV',
  model: 'IPC-A',
  locationId: 'CDMX',
  identityStatus: 'current_master',
  onHand: 10,
  available: 8,
  committed: 2,
  inTransit: 3,
  onOrder: 4,
  unitCost: 100,
  inventoryValue: 1000,
  currency: 'MXN',
  sourceRows: 1,
  commercialStatus: 'D',
  supersededBy: 'P-2',
  directSubstitute: 'P-2',
  replacementStatus: 'both',
  supersededByAvailable: 5,
  directSubstituteAvailable: 5,
  catalogResolved: true,
}

const analytics: InventoryAnalyticsReport = {
  generatedAt: '2026-07-31T12:00:00.000Z',
  snapshotDate: '2026-07-30',
  totals: {
    positions: 1,
    products: 1,
    locations: 1,
    unresolvedProducts: 0,
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
  byLocation: [
    {
      key: 'CDMX',
      label: 'CDMX',
      positions: 1,
      products: 1,
      locations: 1,
      onHand: 10,
      available: 8,
      committed: 2,
      inTransit: 3,
      onOrder: 4,
      inventoryValue: 1000,
      valueShare: 1,
      availableRate: 0.8,
    },
  ],
  byProduct: [],
  stockStatus: [
    {
      status: 'available',
      positions: 1,
      products: 1,
      inventoryValue: 1000,
      valueShare: 1,
    },
  ],
}

const risks: InventoryRiskSignal[] = []
const opportunities: InventoryOpportunitySignal[] = []

describe('IW-006 Inventory executive export', () => {
  it('construye el libro ejecutivo con catálogo y sustituciones', () => {
    const filters = DEFAULT_INVENTORY_WORKSPACE_FILTERS
    const summary = buildInventoryExecutiveSummary({
      analytics,
      positions: [position],
      risks,
      opportunities,
      filters,
    })

    const payload = buildInventoryExecutiveExport(
      {
        analytics,
        positions: [position],
        risks,
        opportunities,
        filters,
        summary,
      },
      new Date('2026-07-31T12:00:00.000Z'),
    )

    expect(payload.fileName).toBe(
      'PM-Intelligence-Inventory-2026-07-30.xlsx',
    )
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Inventario por Ubicación',
      'Posiciones',
      'Sustituciones',
      'Riesgos',
      'Oportunidades',
      'Metadatos',
    ])
    expect(payload.sheets[0]?.rows).toContainEqual([
      'Corte',
      '2026-07-30',
    ])
    expect(payload.sheets[1]?.rows).toContainEqual([
      'CDMX',
      1,
      1,
      10,
      8,
      2,
      3,
      4,
      7,
      1000,
      1,
      0.8,
    ])
    expect(payload.sheets[2]?.rows[0]).toContain('Categoría de valor')
    expect(payload.sheets[3]?.rows).toContainEqual([
      'P-1',
      'CAMARA UNO',
      'P-1',
      'IPC-A',
      'UNV',
      'D',
      'P-2',
      5,
      'P-2',
      5,
      'Superseded y sustituto directo',
      1,
      'CDMX',
      10,
      8,
      1000,
    ])
  })
})
