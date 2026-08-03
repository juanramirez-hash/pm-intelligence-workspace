import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import type {
  DatasetRegistryItem,
} from '../../../core/datasets/datasetTypes'

import type {
  WorkspaceContextModel,
} from '../../workspaces/shared/types/workspaceContextTypes'

import type {
  ExecutiveDomainRegistry,
  ExecutiveWorkspaceHealth,
} from '../types/executiveWorkspaceTypes'

const mocks = vi.hoisted(() => ({
  buildWorkspaceContext:
    vi.fn(),

  buildExecutiveDomainRegistry:
    vi.fn(),

  buildExecutiveDomainHealth:
    vi.fn(),
}))

vi.mock(
  '../../workspaces/shared/engine/buildWorkspaceContext',
  () => ({
    buildWorkspaceContext:
      mocks.buildWorkspaceContext,
  }),
)

vi.mock(
  './executiveDomainReadiness',
  () => ({
    buildExecutiveDomainRegistry:
      mocks.buildExecutiveDomainRegistry,

    buildExecutiveDomainHealth:
      mocks.buildExecutiveDomainHealth,
  }),
)

import {
  buildExecutiveWorkspace,
} from './buildExecutiveWorkspace'

const salesDataset:
  DatasetRegistryItem = {
  type: 'sales',
  label: 'Ventas',
  description: 'Detalle de ventas.',
  status: 'active',
  storage: 'indexeddb',
  totalRows: 100,
  ignoredRows: 0,
  periodStart: '2026-01-01',
  periodEnd: '2026-07-31',
  lastImportedFile: 'sales.xlsx',
  lastImportedAt:
    '2026-08-03T15:00:00.000Z',
  version: 1,
  updateFrequency: 'semanal',
  displayOrder: 1,
}

const workspace:
  WorkspaceContextModel = {
  sales: null,
  metrics: null,
  repository: null,
  currentPeriodId: null,
  customers: null,
  brands: null,
  insights: [],
  executiveBrief: null,
  opportunityRadar: null,
  datasets: [salesDataset],
  health: {
    readyDatasets: 1,
    totalDatasets: 12,
    coveragePercentage: 8,
    systemReady: true,
    importStatus: 'completed',
    lastImportedAt:
      '2026-08-03T15:00:00.000Z',
  },
}

function domain(
  id: 'sales' | 'inventory' | 'forecast' | 'pricing',
) {
  return {
    id,
    label: id,
    status: 'partial' as const,
    available: true,
    requiredDatasets: [],
    activeDatasets: [],
    missingDatasets: [],
    lastUpdatedAt: null,
    freshness: 'unknown' as const,
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
    available: false,
    requiredDatasets: [],
    activeDatasets: [],
    missingDatasets: [],
    lastUpdatedAt: null,
    freshness: 'unknown',
    issues: [],
    purchaseOrdersAvailable: false,
    purchaseRequestsAvailable: false,
    inventoryAvailable: false,
    productMasterAvailable: false,
    forecastAvailable: false,
    canActivateWorkspace: false,
    limitations: [
      'No hay fuentes de Purchasing.',
    ],
  },
}

const enrichedHealth:
  ExecutiveWorkspaceHealth = {
  ...workspace.health,
  readyDomains: 0,
  totalDomains: 5,
  domainCoveragePercentage: 0,
  purchasingReady: false,
}

describe(
  'EW-001 Executive workspace builder',
  () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(
        new Date(
          '2026-08-03T18:00:00.000Z',
        ),
      )

      mocks.buildWorkspaceContext
        .mockReturnValue(workspace)

      mocks.buildExecutiveDomainRegistry
        .mockReturnValue(domains)

      mocks.buildExecutiveDomainHealth
        .mockReturnValue(
          enrichedHealth,
        )
    })

    afterEach(() => {
      vi.clearAllMocks()
      vi.useRealTimers()
    })

    it('integra contexto, dominios y readiness de Purchasing', () => {
      const state =
        {} as Parameters<
          typeof buildExecutiveWorkspace
        >[0]

      const result =
        buildExecutiveWorkspace(
          state,
          {
            referenceDate:
              '2026-08-03T18:00:00.000Z',
          },
        )

      expect(
        mocks.buildWorkspaceContext,
      ).toHaveBeenCalledWith(state)

      expect(
        mocks.buildExecutiveDomainRegistry,
      ).toHaveBeenCalledWith(
        workspace.datasets,
        {
          referenceDate:
            new Date(
              '2026-08-03T18:00:00.000Z',
            ),
        },
      )

      expect(
        mocks.buildExecutiveDomainHealth,
      ).toHaveBeenCalledWith(
        workspace.health,
        domains,
      )

      expect(result).toMatchObject({
        health: enrichedHealth,
        domains,
        purchasingReadiness:
          domains.purchasing,
        generatedAt:
          '2026-08-03T18:00:00.000Z',
        methodology:
          'executive-workspace-v1',
      })
    })

    it('usa la fecha actual como corte por defecto', () => {
      const result =
        buildExecutiveWorkspace(
          {} as Parameters<
            typeof buildExecutiveWorkspace
          >[0],
        )

      expect(result.generatedAt).toBe(
        '2026-08-03T18:00:00.000Z',
      )
    })
  },
)
