export type BusinessProjectBillingDocumentType =
  | 'invoice'
  | 'credit_note'
  | 'other'

export interface BusinessProjectBillingLine {
  id: string
  documentId: string
  internalId: string
  projectId: string
  projectDescription: string | null

  endUser: string | null
  customerId: string | null
  customerName: string | null
  primaryBrandId: string | null

  itemCode: string | null
  model: string | null
  brandId: string | null
  quantity: number
  sourceAmount: number
  duplicateOccurrences: number

  date: string
  periodId: string
  documentNumber: string
  documentType: BusinessProjectBillingDocumentType
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

export interface BusinessProjectBillingDocument {
  id: string
  internalId: string
  projectId: string
  documentNumber: string
  documentType: BusinessProjectBillingDocumentType
  date: string
  periodId: string
  currency: string | null
  isVoided: boolean
  documentStatus: string | null

  customerId: string | null
  customerName: string | null
  primaryBrandId: string | null

  sourceAmount: number
  quantity: number
  lineCount: number
  lineIds: Set<string>
  itemCodes: Set<string>
  brandIds: Set<string>
}
