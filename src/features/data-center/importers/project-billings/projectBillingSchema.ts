import type { ProjectBillingField } from './projectBillingColumnAliases'

export const REQUIRED_PROJECT_BILLING_FIELDS: ProjectBillingField[] = [
  'internalId',
  'projectId',
  'date',
  'documentNumber',
  'amount',
]

export const RECOMMENDED_PROJECT_BILLING_FIELDS: ProjectBillingField[] = [
  'itemCode',
  'model',
  'brand',
  'quantity',
  'currency',
  'documentStatus',
]

export const OPTIONAL_PROJECT_BILLING_FIELDS: ProjectBillingField[] = [
  'projectDescription',
  'endUser',
  'customer',
  'primaryBrand',
  'createdFrom',
  'relatedDocumentStatus',
  'estimatedCloseDate',
  'estimatedBillingDate',
  'estimatedDeliveryDate',
  'salesRepresentative',
  'salesLocation',
  'assignedBusinessDeveloper',
  'purchaseDescription',
]

export const ALL_PROJECT_BILLING_FIELDS: ProjectBillingField[] = [
  ...REQUIRED_PROJECT_BILLING_FIELDS,
  ...RECOMMENDED_PROJECT_BILLING_FIELDS,
  ...OPTIONAL_PROJECT_BILLING_FIELDS,
]
