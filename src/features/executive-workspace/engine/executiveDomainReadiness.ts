import type {
  DatasetRegistryItem,
  DatasetType,
} from '../../../core/datasets/datasetTypes'

import type {
  ExecutiveDomainId,
  ExecutiveDomainReadiness,
  ExecutiveDomainRegistry,
  ExecutiveDomainStatus,
  ExecutivePurchasingReadiness,
  ExecutiveWorkspaceHealth,
} from '../types/executiveWorkspaceTypes'

interface ExecutiveDomainDefinition {
  id: ExecutiveDomainId

  label: string

  requiredDatasets:
    readonly DatasetType[]
}

export interface ExecutiveDomainReadinessOptions {
  referenceDate?:
    Date | string
}

const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000

const DATASET_FRESHNESS_DAYS:
  Record<string, number> = {
  semanal: 10,
  mensual: 40,
  anual: 400,
}

const DOMAIN_DEFINITIONS:
  readonly ExecutiveDomainDefinition[] = [
  {
    id: 'sales',
    label: 'Sales Workspace',
    requiredDatasets: [
      'sales',
      'salesTargets',
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory Workspace',
    requiredDatasets: [
      'inventory',
      'products',
    ],
  },
  {
    id: 'forecast',
    label: 'Forecast Workspace',
    requiredDatasets: [
      'sales',
      'salesTargets',
      'projects',
      'projectBillings',
      'exchangeRates',
      'inventory',
      'products',
      'businessCalendar',
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing Laboratory',
    requiredDatasets: [
      'pricing',
      'products',
      'exchangeRates',
    ],
  },
]

const PURCHASING_DIRECT_DATASETS:
  readonly DatasetType[] = [
  'purchases',
  'purchaseRequests',
]

function normalizeReferenceDate(
  value: Date | string | undefined,
): Date {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date()
}

function parseDate(
  value: string | null,
): Date | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed
}

function normalizeFrequency(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase('es-MX')
}

function resolveFreshnessWindowDays(
  dataset: DatasetRegistryItem,
): number {
  return DATASET_FRESHNESS_DAYS[
    normalizeFrequency(
      dataset.updateFrequency,
    )
  ] ?? 40
}

function isDatasetCurrent(
  dataset: DatasetRegistryItem,
  referenceDate: Date,
): boolean | null {
  const importedAt =
    parseDate(dataset.lastImportedAt)

  if (!importedAt) {
    return null
  }

  const ageInDays =
    Math.max(
      0,
      (
        referenceDate.getTime() -
        importedAt.getTime()
      ) / MILLISECONDS_PER_DAY,
    )

  return ageInDays <=
    resolveFreshnessWindowDays(dataset)
}

function findDataset(
  datasets: readonly DatasetRegistryItem[],
  type: DatasetType,
): DatasetRegistryItem | undefined {
  return datasets.find(
    (dataset) =>
      dataset.type === type,
  )
}

function isDatasetActive(
  datasets: readonly DatasetRegistryItem[],
  type: DatasetType,
): boolean {
  return findDataset(
    datasets,
    type,
  )?.status === 'active'
}

function resolveLastUpdatedAt(
  datasets: readonly DatasetRegistryItem[],
): string | null {
  const timestamps =
    datasets
      .map((dataset) => ({
        value: dataset.lastImportedAt,
        date: parseDate(
          dataset.lastImportedAt,
        ),
      }))
      .filter(
        (item): item is {
          value: string
          date: Date
        } =>
          item.value !== null &&
          item.date !== null,
      )
      .sort(
        (itemA, itemB) =>
          itemB.date.getTime() -
          itemA.date.getTime(),
      )

  return timestamps[0]?.value ?? null
}

function resolveDomainFreshness(
  activeDatasets:
    readonly DatasetRegistryItem[],
  referenceDate: Date,
): ExecutiveDomainReadiness['freshness'] {
  if (activeDatasets.length === 0) {
    return 'unknown'
  }

  const statuses =
    activeDatasets.map(
      (dataset) =>
        isDatasetCurrent(
          dataset,
          referenceDate,
        ),
    )

  if (
    statuses.some(
      (status) => status === false,
    )
  ) {
    return 'stale'
  }

  if (
    statuses.some(
      (status) => status === null,
    )
  ) {
    return 'unknown'
  }

  return 'current'
}

function resolveDomainStatus(
  activeCount: number,
  missingCount: number,
  hasErrors: boolean,
  freshness:
    ExecutiveDomainReadiness['freshness'],
): ExecutiveDomainStatus {
  if (hasErrors) {
    return 'blocked'
  }

  if (activeCount === 0) {
    return 'not_available'
  }

  if (
    missingCount > 0 ||
    freshness !== 'current'
  ) {
    return 'partial'
  }

  return 'ready'
}

function buildDomainIssues(
  requiredDatasets:
    readonly DatasetType[],
  missingDatasets:
    readonly DatasetType[],
  errorDatasets:
    readonly DatasetType[],
  freshness:
    ExecutiveDomainReadiness['freshness'],
): string[] {
  const issues: string[] = []

  if (missingDatasets.length > 0) {
    issues.push(
      `Datasets faltantes: ${missingDatasets.join(', ')}.`,
    )
  }

  if (errorDatasets.length > 0) {
    issues.push(
      `Datasets con error: ${errorDatasets.join(', ')}.`,
    )
  }

  if (
    requiredDatasets.length > 0 &&
    freshness === 'stale'
  ) {
    issues.push(
      'Uno o más datasets requieren actualización.',
    )
  }

  if (
    requiredDatasets.length > 0 &&
    freshness === 'unknown'
  ) {
    issues.push(
      'No existe una fecha confiable de actualización para todos los datasets activos.',
    )
  }

  return issues
}

function buildDomainReadiness(
  definition: ExecutiveDomainDefinition,
  datasets: readonly DatasetRegistryItem[],
  referenceDate: Date,
): ExecutiveDomainReadiness {
  const requiredDatasetItems =
    definition.requiredDatasets
      .map((type) =>
        findDataset(datasets, type),
      )
      .filter(
        (dataset): dataset is DatasetRegistryItem =>
          dataset !== undefined,
      )

  const activeDatasetItems =
    requiredDatasetItems.filter(
      (dataset) =>
        dataset.status === 'active',
    )

  const activeDatasets =
    activeDatasetItems.map(
      (dataset) => dataset.type,
    )

  const missingDatasets =
    definition.requiredDatasets.filter(
      (type) =>
        findDataset(datasets, type)?.status !== 'active',
    )

  const errorDatasets =
    requiredDatasetItems
      .filter(
        (dataset) =>
          dataset.status === 'error',
      )
      .map(
        (dataset) => dataset.type,
      )

  const freshness =
    resolveDomainFreshness(
      activeDatasetItems,
      referenceDate,
    )

  const status =
    resolveDomainStatus(
      activeDatasets.length,
      missingDatasets.length,
      errorDatasets.length > 0,
      freshness,
    )

  return {
    id: definition.id,
    label: definition.label,
    status,
    available:
      activeDatasets.length > 0,
    requiredDatasets:
      [...definition.requiredDatasets],
    activeDatasets,
    missingDatasets,
    lastUpdatedAt:
      resolveLastUpdatedAt(
        activeDatasetItems,
      ),
    freshness,
    issues:
      buildDomainIssues(
        definition.requiredDatasets,
        missingDatasets,
        errorDatasets,
        freshness,
      ),
  }
}

function buildPurchasingReadiness(
  datasets: readonly DatasetRegistryItem[],
  forecast:
    ExecutiveDomainReadiness,
  referenceDate: Date,
): ExecutivePurchasingReadiness {
  const base =
    buildDomainReadiness(
      {
        id: 'purchasing',
        label: 'Purchasing Workspace',
        requiredDatasets:
          PURCHASING_DIRECT_DATASETS,
      },
      datasets,
      referenceDate,
    )

  const purchaseOrdersAvailable =
    isDatasetActive(
      datasets,
      'purchases',
    )

  const purchaseRequestsAvailable =
    isDatasetActive(
      datasets,
      'purchaseRequests',
    )

  const inventoryAvailable =
    isDatasetActive(
      datasets,
      'inventory',
    )

  const productMasterAvailable =
    isDatasetActive(
      datasets,
      'products',
    )

  const forecastAvailable =
    forecast.status === 'ready'

  const directSourcesReady =
    purchaseOrdersAvailable &&
    purchaseRequestsAvailable

  const canActivateWorkspace =
    directSourcesReady &&
    base.freshness === 'current' &&
    base.status !== 'blocked'

  let status:
    ExecutiveDomainStatus = base.status

  if (
    base.status !== 'blocked' &&
    canActivateWorkspace
  ) {
    status = 'ready'
  } else if (
    base.status !== 'blocked' &&
    base.activeDatasets.length > 0
  ) {
    status = 'partial'
  }

  const limitations: string[] = []

  if (!purchaseOrdersAvailable) {
    limitations.push(
      'No hay órdenes de compra normalizadas.',
    )
  }

  if (!purchaseRequestsAvailable) {
    limitations.push(
      'No hay solicitudes de compra normalizadas.',
    )
  }

  return {
    ...base,
    id: 'purchasing',
    status,
    purchaseOrdersAvailable,
    purchaseRequestsAvailable,
    inventoryAvailable,
    productMasterAvailable,
    forecastAvailable,
    canActivateWorkspace,
    limitations,
  }
}

export function buildExecutiveDomainRegistry(
  datasets: readonly DatasetRegistryItem[],
  options: ExecutiveDomainReadinessOptions = {},
): ExecutiveDomainRegistry {
  const referenceDate =
    normalizeReferenceDate(
      options.referenceDate,
    )

  const domains =
    DOMAIN_DEFINITIONS.map(
      (definition) =>
        buildDomainReadiness(
          definition,
          datasets,
          referenceDate,
        ),
    )

  const sales =
    domains.find(
      (domain) =>
        domain.id === 'sales',
    )!

  const inventory =
    domains.find(
      (domain) =>
        domain.id === 'inventory',
    )!

  const forecast =
    domains.find(
      (domain) =>
        domain.id === 'forecast',
    )!

  const pricing =
    domains.find(
      (domain) =>
        domain.id === 'pricing',
    )!

  return {
    sales,
    inventory,
    forecast,
    pricing,
    purchasing:
      buildPurchasingReadiness(
        datasets,
        forecast,
        referenceDate,
      ),
  }
}

export function buildExecutiveDomainHealth(
  health: ExecutiveWorkspaceHealth,
  domains: ExecutiveDomainRegistry,
): ExecutiveWorkspaceHealth {
  const domainItems = [
    domains.sales,
    domains.inventory,
    domains.forecast,
    domains.pricing,
    domains.purchasing,
  ]

  const readyDomains =
    domainItems.filter(
      (domain) =>
        domain.status === 'ready',
    ).length

  const totalDomains =
    domainItems.length

  return {
    ...health,
    readyDomains,
    totalDomains,
    domainCoveragePercentage:
      totalDomains > 0
        ? Math.round(
            (
              readyDomains /
              totalDomains
            ) * 100,
          )
        : 0,
    purchasingReady:
      domains.purchasing
        .canActivateWorkspace,
  }
}