import type {
  BusinessSalesTransactionDocument,
  BusinessSalesTransactionLine,
} from '../entities/salesTransaction'

import type {
  BusinessDataModel,
} from '../models'

import {
  buildSalesTransactionIndexes,
} from './salesTransactionIndexes'

import type {
  SalesTransactionIndexes,
} from './salesTransactionIndexes'

function normalizeIdentifier(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

export class SalesTransactionQueries {
  private readonly model: BusinessDataModel
  private readonly indexes: SalesTransactionIndexes

  constructor(model: BusinessDataModel) {
    this.model = model
    this.indexes = buildSalesTransactionIndexes(model)
  }

  getAllDocuments(): BusinessSalesTransactionDocument[] {
    return [
      ...(this.model.salesDocuments?.values() ?? []),
    ]
  }

  getAllLines(): BusinessSalesTransactionLine[] {
    return [
      ...(this.model.salesTransactionLines?.values() ?? []),
    ]
  }

  findDocument(
    documentNumber: string,
  ): BusinessSalesTransactionDocument | undefined {
    return this.indexes.documentsByNumber.get(
      normalizeIdentifier(documentNumber),
    )
  }

  getDocumentsByPeriod(
    periodId: string,
  ): BusinessSalesTransactionDocument[] {
    return [
      ...(this.indexes.documentsByPeriod.get(periodId) ?? []),
    ]
  }

  getLinesByDocument(
    documentNumber: string,
  ): BusinessSalesTransactionLine[] {
    return [
      ...(
        this.indexes.linesByDocument.get(
          normalizeIdentifier(documentNumber),
        ) ?? []
      ),
    ]
  }

  getLinesByPeriod(
    periodId: string,
  ): BusinessSalesTransactionLine[] {
    return [
      ...(this.indexes.linesByPeriod.get(periodId) ?? []),
    ]
  }
}
