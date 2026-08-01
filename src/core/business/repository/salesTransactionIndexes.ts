import type {
  BusinessSalesTransactionDocument,
  BusinessSalesTransactionLine,
} from '../entities/salesTransaction'

import type {
  BusinessDataModel,
} from '../models'

export interface SalesTransactionIndexes {
  documentsByNumber:
    Map<string, BusinessSalesTransactionDocument>

  documentsByPeriod:
    Map<string, BusinessSalesTransactionDocument[]>

  linesByDocument:
    Map<string, BusinessSalesTransactionLine[]>

  linesByPeriod:
    Map<string, BusinessSalesTransactionLine[]>
}

function push<T>(
  index: Map<string, T[]>,
  key: string,
  value: T,
): void {
  const items = index.get(key) ?? []
  items.push(value)
  index.set(key, items)
}

export function buildSalesTransactionIndexes(
  model: BusinessDataModel,
): SalesTransactionIndexes {
  const documentsByNumber =
    new Map<string, BusinessSalesTransactionDocument>()

  const documentsByPeriod =
    new Map<string, BusinessSalesTransactionDocument[]>()

  const linesByDocument =
    new Map<string, BusinessSalesTransactionLine[]>()

  const linesByPeriod =
    new Map<string, BusinessSalesTransactionLine[]>()

  for (
    const document of
    model.salesDocuments?.values() ?? []
  ) {
    documentsByNumber.set(
      document.documentNumber,
      document,
    )

    for (const periodId of document.periodIds) {
      push(
        documentsByPeriod,
        periodId,
        document,
      )
    }
  }

  for (
    const line of
    model.salesTransactionLines?.values() ?? []
  ) {
    push(
      linesByDocument,
      line.documentNumber,
      line,
    )

    push(
      linesByPeriod,
      line.periodId,
      line,
    )
  }

  return {
    documentsByNumber,
    documentsByPeriod,
    linesByDocument,
    linesByPeriod,
  }
}
