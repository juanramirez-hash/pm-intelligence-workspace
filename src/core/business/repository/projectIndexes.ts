import type {
  BusinessProject,
} from '../entities/project'

import type {
  BusinessDataModel,
} from '../models'

export interface ProjectIndexes {
  byInternalId: Map<string, BusinessProject>
  byProjectId: Map<string, BusinessProject>
  byBillingPeriod: Map<string, BusinessProject[]>
  byForecastStage: Map<string, BusinessProject[]>
}

function pushToIndex(
  index: Map<string, BusinessProject[]>,
  key: string | null,
  project: BusinessProject,
): void {
  if (!key) {
    return
  }

  const items = index.get(key) ?? []
  items.push(project)
  index.set(key, items)
}

export function buildProjectIndexes(
  model: BusinessDataModel,
): ProjectIndexes {
  const byInternalId = new Map<string, BusinessProject>()
  const byProjectId = new Map<string, BusinessProject>()
  const byBillingPeriod = new Map<string, BusinessProject[]>()
  const byForecastStage = new Map<string, BusinessProject[]>()

  for (const project of model.projects?.values() ?? []) {
    byInternalId.set(project.internalId, project)
    byProjectId.set(project.projectId, project)
    pushToIndex(byBillingPeriod, project.estimatedBillingPeriodId, project)
    pushToIndex(byForecastStage, project.forecastStage, project)
  }

  return {
    byInternalId,
    byProjectId,
    byBillingPeriod,
    byForecastStage,
  }
}
