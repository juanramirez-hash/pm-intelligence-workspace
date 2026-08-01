export type ProjectBillingDocumentType =
  | 'invoice'
  | 'credit_note'
  | 'other'

export interface NormalizedProjectBillingRow {
  lineKey: string
  duplicateOccurrences: number

  internalId: string
  projectId: string
  projectDescription: string | null

  endUser: string | null
  customerId: string | null
  customerName: string | null
  primaryBrand: string | null

  itemCode: string | null
  model: string | null
  brand: string | null
  quantity: number
  amount: number

  date: string
  periodId: string
  documentNumber: string
  documentType: ProjectBillingDocumentType
  documentStatus: string | null
  createdFrom: string | null
  relatedDocumentStatus: string | null
  currency: string | null
  isVoided: boolean

  estimatedCloseDate: string | null
  estimatedBillingDate: string | null
  estimatedDeliveryDate: string | null

  salesRepresentative: string | null
  salesLocation: string | null
  assignedBusinessDeveloper: string | null
  purchaseDescription: string | null
}

export interface ProjectBillingDatasetSummary {
  periodStart: string | null
  periodEnd: string | null

  totalLines: number
  uniqueDocuments: number
  uniqueProjects: number
  invoiceDocuments: number
  creditNoteDocuments: number
  otherDocuments: number
  voidedDocuments: number

  duplicateSourceLines: number
  documentsMissingCurrency: number
  documentsMissingProject: number

  sourceAmountMxn: number
  sourceAmountUsd: number
  currencies: string[]

  processedRows: number
  ignoredRows: number
}
