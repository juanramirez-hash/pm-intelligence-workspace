import type {
  BusinessProjectBillingDocument,
  BusinessProjectBillingLine,
} from '../entities/projectBilling'

import type {
  BusinessDataModel,
} from '../models'

export interface ProjectBillingIndexes {
  documentsByNumber: Map<string, BusinessProjectBillingDocument>
  documentsByProject: Map<string, BusinessProjectBillingDocument[]>
  documentsByPeriod: Map<string, BusinessProjectBillingDocument[]>
  linesByDocument: Map<string, BusinessProjectBillingLine[]>
  linesByPeriod: Map<string, BusinessProjectBillingLine[]>
}

function push<T>(index: Map<string, T[]>, key: string, value: T): void {
  const items = index.get(key) ?? []
  items.push(value)
  index.set(key, items)
}

export function buildProjectBillingIndexes(
  model: BusinessDataModel,
): ProjectBillingIndexes {
  const documentsByNumber = new Map<string, BusinessProjectBillingDocument>()
  const documentsByProject = new Map<string, BusinessProjectBillingDocument[]>()
  const documentsByPeriod = new Map<string, BusinessProjectBillingDocument[]>()
  const linesByDocument = new Map<string, BusinessProjectBillingLine[]>()
  const linesByPeriod = new Map<string, BusinessProjectBillingLine[]>()

  for (const document of model.projectBillings?.values() ?? []) {
    documentsByNumber.set(document.documentNumber, document)
    push(documentsByProject, document.projectId, document)
    push(documentsByPeriod, document.periodId, document)
  }

  for (const line of model.projectBillingLines?.values() ?? []) {
    push(linesByDocument, line.documentId, line)
    push(linesByPeriod, line.periodId, line)
  }

  return {
    documentsByNumber,
    documentsByProject,
    documentsByPeriod,
    linesByDocument,
    linesByPeriod,
  }
}
