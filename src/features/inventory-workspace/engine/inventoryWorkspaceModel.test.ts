import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildInventoryWorkspaceGroups,
  DEFAULT_INVENTORY_WORKSPACE_FILTERS,
  filterInventoryOpportunities,
  filterInventoryPositions,
  filterInventoryRisks,
} from './inventoryWorkspaceModel'

import type {
  BusinessInventoryPosition,
} from '../../../core/business/entities/inventoryPosition'

import type {
  InventoryOpportunitySignal,
  InventoryRiskSignal,
} from '../../../core/business/analytics/inventory'

const position: BusinessInventoryPosition = {
  id: 'P-1::CDMX',
  snapshotDate: '2026-07-30',
  productId: 'P-1',
  productName: 'CAMARA UNO',
  productCode: 'P-1',
  brandId: 'UNV',
  model: 'IPC-A',
  locationId: 'CDMX',
  identityStatus: 'current_master',
  onHand: 10,
  available: 6,
  committed: 4,
  inTransit: 0,
  onOrder: 2,
  unitCost: 100,
  inventoryValue: 1000,
  currency: 'MXN',
  sourceRows: 1,
}

const risk: InventoryRiskSignal = {
  id: 'R-1',
  type: 'overcommitted',
  priority: 'high',
  score: 70,
  snapshotDate: '2026-07-30',
  productId: 'P-1',
  productName: 'CAMARA UNO',
  brandId: 'UNV',
  locationId: 'CDMX',
  title: 'Compromiso elevado',
  rationale: 'Prueba',
  evidence: {
    onHand: 10,
    available: -1,
    committed: 11,
    inbound: 0,
    inventoryValue: 1000,
    valueShare: 0.1,
  },
}

const opportunity: InventoryOpportunitySignal = {
  id: 'O-1',
  type: 'inbound_recovery',
  priority: 'high',
  score: 70,
  snapshotDate: '2026-07-30',
  productId: 'P-1',
  productName: 'CAMARA UNO',
  brandId: 'UNV',
  sourceLocationId: null,
  targetLocationId: 'CDMX',
  title: 'Seguimiento de entrada pendiente',
  rationale: 'Prueba',
  evidence: {
    shortageUnits: 0,
    surplusUnits: 0,
    suggestedUnits: 0,
    inboundUnits: 2,
    inventoryValue: 0,
  },
}

describe('Inventory Workspace filters', () => {
  it('filtra posiciones por texto y ubicación', () => {
    const result = filterInventoryPositions(
      [position],
      {
        ...DEFAULT_INVENTORY_WORKSPACE_FILTERS,
        search: 'ipc-a',
        locationId: 'CDMX',
      },
    )

    expect(result).toHaveLength(1)
  })

  it('filtra riesgos por prioridad y marca', () => {
    const result = filterInventoryRisks(
      [risk],
      {
        ...DEFAULT_INVENTORY_WORKSPACE_FILTERS,
        brandId: 'UNV',
        priority: 'high',
      },
    )

    expect(result[0]?.id).toBe('R-1')
  })

  it('recalcula el ranking con las posiciones filtradas por marca', () => {
    const beldenPosition: BusinessInventoryPosition = {
      ...position,
      id: 'P-2::QRO',
      productId: 'P-2',
      productName: 'CABLE BELDEN',
      productCode: 'P-2',
      brandId: 'BELDEN',
      model: 'CB02BBEL05',
      locationId: 'QRO',
      inventoryValue: 500,
    }

    const filtered = filterInventoryPositions(
      [position, beldenPosition],
      {
        ...DEFAULT_INVENTORY_WORKSPACE_FILTERS,
        brandId: 'BELDEN',
      },
    )

    const groups = buildInventoryWorkspaceGroups(filtered, 'brand')

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('BELDEN')
    expect(groups[0]?.valueShare).toBe(1)
  })

  it('mantiene riesgos visibles al buscar por marca', () => {
    const result = filterInventoryRisks(
      [risk],
      {
        ...DEFAULT_INVENTORY_WORKSPACE_FILTERS,
        search: 'UNV',
      },
    )

    expect(result[0]?.id).toBe('R-1')
  })

  it('mantiene oportunidades visibles al buscar por marca o ubicación', () => {
    const byBrand = filterInventoryOpportunities(
      [opportunity],
      {
        ...DEFAULT_INVENTORY_WORKSPACE_FILTERS,
        search: 'UNV',
      },
    )

    const byLocation = filterInventoryOpportunities(
      [opportunity],
      {
        ...DEFAULT_INVENTORY_WORKSPACE_FILTERS,
        search: 'CDMX',
      },
    )

    expect(byBrand[0]?.id).toBe('O-1')
    expect(byLocation[0]?.id).toBe('O-1')
  })
})
