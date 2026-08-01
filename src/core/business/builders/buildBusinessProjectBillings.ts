import type {
  NormalizedProjectBillingRow,
} from '../../../features/data-center/importers/project-billings/projectBillingTypes'

import type {
  BusinessProjectBillingDocument,
  BusinessProjectBillingLine,
} from '../entities/projectBilling'

export interface BusinessProjectBillingsResult {
  documents: Map<string, BusinessProjectBillingDocument>
  lines: Map<string, BusinessProjectBillingLine>
}

function normalizeIdentifier(value: string | null): string | null {
  const normalized = value
    ?.trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')

  return normalized || null
}

function documentId(row: NormalizedProjectBillingRow): string {
  return row.internalId || row.documentNumber
}

export function buildBusinessProjectBillings(
  rows: readonly NormalizedProjectBillingRow[],
): BusinessProjectBillingsResult {
  const documents = new Map<string, BusinessProjectBillingDocument>()
  const lines = new Map<string, BusinessProjectBillingLine>()

  for (const row of rows) {
    const id = documentId(row)
    const brandId = normalizeIdentifier(row.brand)
    const itemCode = normalizeIdentifier(row.itemCode)

    const line: BusinessProjectBillingLine = {
      id: row.lineKey,
      documentId: id,
      internalId: row.internalId,
      projectId: row.projectId,
      projectDescription: row.projectDescription,
      endUser: row.endUser,
      customerId: normalizeIdentifier(row.customerId),
      customerName: row.customerName,
      primaryBrandId: normalizeIdentifier(row.primaryBrand),
      itemCode,
      model: row.model,
      brandId,
      quantity: row.quantity,
      sourceAmount: row.amount,
      duplicateOccurrences: row.duplicateOccurrences,
      date: row.date,
      periodId: row.periodId,
      documentNumber: normalizeIdentifier(row.documentNumber) ?? row.documentNumber,
      documentType: row.documentType,
      documentStatus: row.documentStatus,
      createdFrom: row.createdFrom,
      relatedDocumentStatus: row.relatedDocumentStatus,
      currency: normalizeIdentifier(row.currency),
      isVoided: row.isVoided,
      estimatedCloseDate: row.estimatedCloseDate,
      estimatedBillingDate: row.estimatedBillingDate,
      estimatedDeliveryDate: row.estimatedDeliveryDate,
      salesRepresentative: row.salesRepresentative,
      salesLocation: row.salesLocation,
      assignedBusinessDeveloper: row.assignedBusinessDeveloper,
      purchaseDescription: row.purchaseDescription,
    }

    lines.set(line.id, line)

    let document = documents.get(id)

    if (!document) {
      document = {
        id,
        internalId: row.internalId,
        projectId: row.projectId,
        documentNumber: line.documentNumber,
        documentType: row.documentType,
        date: row.date,
        periodId: row.periodId,
        currency: line.currency,
        isVoided: row.isVoided,
        documentStatus: row.documentStatus,
        customerId: line.customerId,
        customerName: row.customerName,
        primaryBrandId: line.primaryBrandId,
        sourceAmount: 0,
        quantity: 0,
        lineCount: 0,
        lineIds: new Set<string>(),
        itemCodes: new Set<string>(),
        brandIds: new Set<string>(),
      }

      documents.set(id, document)
    }

    document.sourceAmount += row.amount
    document.quantity += row.quantity
    document.lineCount += 1
    document.lineIds.add(line.id)
    document.isVoided = document.isVoided || row.isVoided

    if (itemCode) {
      document.itemCodes.add(itemCode)
    }

    if (brandId) {
      document.brandIds.add(brandId)
    }
  }

  return { documents, lines }
}
