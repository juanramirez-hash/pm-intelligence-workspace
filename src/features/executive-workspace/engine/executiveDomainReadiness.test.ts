import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  DatasetRegistryItem,
  DatasetStatus,
  DatasetType,
} from '../../../core/datasets/datasetTypes'

import {
  buildExecutiveDomainHealth,
  buildExecutiveDomainRegistry,
} from './executiveDomainReadiness'

function dataset(
  type: DatasetType,
  status: DatasetStatus = 'active',
  lastImportedAt = '2026-08-01T12:00:00.000Z',
): DatasetRegistryItem {
  return {
    type,
    label: type,
    description: type,
    status,
    storage: 'indexeddb',
    totalRows: status === 'active'
      ? 10
      : 0,
    ignoredRows: 0,
    periodStart: null,
    periodEnd: null,
    lastImportedFile: status === 'active'
      ? `${type}.xlsx`
      : null,
    lastImportedAt: status === 'active'
      ? lastImportedAt
      : null,
    version: 1,
    updateFrequency: type === 'exchangeRates'
      ? 'Mensual'
      : 'Semanal',
    displayOrder: 1,
  }
}

const allRequiredTypes:
  DatasetType[] = [
  'sales',
  'inventory',
  'salesTargets',
  'projects',
  'projectBillings',
  'exchangeRates',
  'purchases',
  'purchaseRequests',
  'pricing',
  'products',
]

describe('EW-001 Executive domain readiness', () => {
  it('marca los dominios completos como ready', () => {
    const registry =
      buildExecutiveDomainRegistry(
        allRequiredTypes.map(
          (type) => dataset(type),
        ),
        {
          referenceDate:
            '2026-08-03T12:00:00.000Z',
        },
      )

    expect(registry.sales.status)
      .toBe('ready')
    expect(registry.inventory.status)
      .toBe('ready')
    expect(registry.forecast.status)
      .toBe('ready')
    expect(registry.pricing.status)
      .toBe('ready')
    expect(
      registry.purchasing
        .canActivateWorkspace,
    ).toBe(true)
  })

  it('distingue un dominio parcial de uno no disponible', () => {
    const registry =
      buildExecutiveDomainRegistry(
        [dataset('sales')],
        {
          referenceDate:
            '2026-08-03T12:00:00.000Z',
        },
      )

    expect(registry.sales.status)
      .toBe('partial')
    expect(registry.sales.missingDatasets)
      .toEqual(['salesTargets'])
    expect(registry.inventory.status)
      .toBe('not_available')
  })

  it('bloquea un dominio cuando una fuente requerida tiene error', () => {
    const registry =
      buildExecutiveDomainRegistry(
        [
          dataset('sales'),
          dataset(
            'salesTargets',
            'error',
          ),
        ],
        {
          referenceDate:
            '2026-08-03T12:00:00.000Z',
        },
      )

    expect(registry.sales.status)
      .toBe('blocked')
    expect(registry.sales.issues[1])
      .toContain('salesTargets')
  })

  it('degrada a parcial cuando los datos están vencidos', () => {
    const registry =
      buildExecutiveDomainRegistry(
        [
          dataset(
            'sales',
            'active',
            '2026-07-01T12:00:00.000Z',
          ),
          dataset(
            'salesTargets',
            'active',
            '2026-07-01T12:00:00.000Z',
          ),
        ],
        {
          referenceDate:
            '2026-08-03T12:00:00.000Z',
        },
      )

    expect(registry.sales.freshness)
      .toBe('stale')
    expect(registry.sales.status)
      .toBe('partial')
  })

  it('expone cobertura ejecutiva y readiness de Purchasing', () => {
    const registry =
      buildExecutiveDomainRegistry(
        allRequiredTypes.map(
          (type) => dataset(type),
        ),
        {
          referenceDate:
            '2026-08-03T12:00:00.000Z',
        },
      )

    const health =
      buildExecutiveDomainHealth(
        {
          readyDatasets: 10,
          totalDatasets: 11,
          coveragePercentage: 91,
          systemReady: true,
          importStatus: 'completed',
          lastImportedAt:
            '2026-08-01T12:00:00.000Z',
        },
        registry,
      )

    expect(health.readyDomains)
      .toBe(5)
    expect(health.totalDomains)
      .toBe(5)
    expect(health.domainCoveragePercentage)
      .toBe(100)
    expect(health.purchasingReady)
      .toBe(true)
  })
})
