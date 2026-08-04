import type {
  ExecutiveEntityAttentionSummary,
  ExecutivePeriodPreset,
  ExecutivePeriodSelection,
} from '../types/executiveWorkspaceTypes'

export type ExecutiveAttentionDomain =
  | 'products'
  | 'brands'
  | 'customers'

export interface ExecutiveAttentionRequest {
  enabled: boolean
  preset: ExecutivePeriodPreset
  anchorPeriodId: string | null
}

export type ExecutiveAttentionSignal =
  | 'declining'
  | 'inactive_or_lost'

const DOMAIN_PATHS:
  Record<ExecutiveAttentionDomain, string> = {
    products: '/attention/products',
    brands: '/attention/brands',
    customers: '/attention/customers',
  }

const VALID_PRESETS = new Set<ExecutivePeriodPreset>([
  'month',
  'last_3_months',
  'last_6_months',
  'year_to_date',
])

interface SearchParameterReader {
  get: (name: string) => string | null
}

export function buildExecutiveAttentionRoute(
  domain: ExecutiveAttentionDomain,
  selection: ExecutivePeriodSelection,
): string {
  const parameters = new URLSearchParams()

  parameters.set('view', 'attention')
  parameters.set('preset', selection.preset)

  if (selection.anchorPeriodId) {
    parameters.set(
      'anchor',
      selection.anchorPeriodId,
    )
  }

  return `${DOMAIN_PATHS[domain]}?${parameters.toString()}`
}

export function parseExecutiveAttentionRequest(
  parameters: SearchParameterReader,
): ExecutiveAttentionRequest {
  const preset = parameters.get('preset')

  return {
    enabled:
      parameters.get('view') === 'attention',
    preset:
      preset &&
      VALID_PRESETS.has(
        preset as ExecutivePeriodPreset,
      )
        ? preset as ExecutivePeriodPreset
        : 'month',
    anchorPeriodId:
      parameters.get('anchor'),
  }
}

export function filterExecutiveAttentionEntities<
  TEntity,
>(
  entities: readonly TEntity[],
  summary:
    ExecutiveEntityAttentionSummary | null,
  idFor: (entity: TEntity) => string,
): TEntity[] {
  const ids = new Set(
    summary?.entityIds
      ?.requiringAttention ?? [],
  )

  if (ids.size === 0) {
    return []
  }

  return entities.filter(
    (entity) => ids.has(idFor(entity)),
  )
}

export function getExecutiveAttentionSignals(
  entityId: string,
  summary:
    ExecutiveEntityAttentionSummary | null,
): ExecutiveAttentionSignal[] {
  const ids = summary?.entityIds

  if (!ids) {
    return []
  }

  const signals:
    ExecutiveAttentionSignal[] = []

  if (ids.declining.includes(entityId)) {
    signals.push('declining')
  }

  if (
    ids.inactiveOrLost.includes(entityId)
  ) {
    signals.push('inactive_or_lost')
  }

  return signals
}

export function isExecutiveAttentionDomain(
  value: string | undefined,
): value is ExecutiveAttentionDomain {
  return (
    value === 'products' ||
    value === 'brands' ||
    value === 'customers'
  )
}
