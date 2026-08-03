import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ExecutiveDomainReadiness,
  ExecutiveDomainRegistry,
  ExecutiveWorkspaceHealth,
} from '../types/executiveWorkspaceTypes'

import {
  ExecutiveDomainReadinessPanel,
} from './ExecutiveDomainReadinessPanel'

function domain(
  id: 'sales' | 'inventory' | 'forecast' | 'pricing',
): ExecutiveDomainReadiness {
  return {
    id,
    label: `${id} Workspace`,
    status:
      id === 'sales'
        ? 'ready'
        : 'partial',
    available: true,
    requiredDatasets: [
      'sales',
      'salesTargets',
    ],
    activeDatasets: ['sales'],
    missingDatasets:
      id === 'sales'
        ? []
        : ['salesTargets'],
    lastUpdatedAt:
      '2026-08-03T15:00:00.000Z',
    freshness: 'current',
    issues: [],
  }
}

const domains:
  ExecutiveDomainRegistry = {
  sales: domain('sales'),
  inventory: domain('inventory'),
  forecast: domain('forecast'),
  pricing: domain('pricing'),
  purchasing: {
    id: 'purchasing',
    label: 'Purchasing Workspace',
    status: 'partial',
    available: true,
    requiredDatasets: [
      'purchases',
      'purchaseRequests',
      'inventory',
      'products',
    ],
    activeDatasets: ['inventory'],
    missingDatasets: [
      'purchases',
      'purchaseRequests',
      'products',
    ],
    lastUpdatedAt:
      '2026-08-03T15:00:00.000Z',
    freshness: 'current',
    issues: [],
    purchaseOrdersAvailable: false,
    purchaseRequestsAvailable: false,
    inventoryAvailable: true,
    productMasterAvailable: false,
    forecastAvailable: false,
    canActivateWorkspace: false,
    limitations: [
      'No hay órdenes de compra normalizadas.',
      'No hay solicitudes de compra normalizadas.',
    ],
  },
}

const health:
  ExecutiveWorkspaceHealth = {
  readyDatasets: 3,
  totalDatasets: 12,
  coveragePercentage: 25,
  systemReady: true,
  importStatus: 'completed',
  lastImportedAt:
    '2026-08-03T15:00:00.000Z',
  readyDomains: 1,
  totalDomains: 5,
  domainCoveragePercentage: 20,
  purchasingReady: false,
}

describe(
  'ExecutiveDomainReadinessPanel',
  () => {
    it('renders domain coverage and Purchasing limitations', () => {
      const markup =
        renderToStaticMarkup(
          <ExecutiveDomainReadinessPanel
            domains={domains}
            health={health}
          />,
        )

      expect(markup).toContain(
        'data-executive-component="domain-readiness-panel"',
      )

      expect(markup).toContain(
        'Preparación de los Workspaces',
      )

      expect(markup).toContain(
        '1 de 5',
      )

      expect(markup).toContain(
        'Purchasing todavía no puede activarse',
      )

      expect(markup).toContain(
        'No hay órdenes de compra normalizadas.',
      )
    })
  },
)
