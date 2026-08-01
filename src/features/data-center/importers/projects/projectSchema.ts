import type { ProjectField } from './projectColumnAliases'

export const REQUIRED_PROJECT_FIELDS: ProjectField[] = [
  'internalId',
  'projectId',
  'status',
]

export const RECOMMENDED_PROJECT_FIELDS: ProjectField[] = [
  'name',
  'primaryBrand',
  'estimatedBillingDate',
  'amountToClose',
  'currency',
]

export const OPTIONAL_PROJECT_FIELDS: ProjectField[] = [
  'endUser',
  'customer',
  'salesExecutive',
  'location',
  'assignedBusinessDeveloper',
  'assignedProductManager',
  'group',
  'createdAt',
  'elapsedDays',
  'closingProbability',
  'estimatedCloseDate',
  'observations',
  'assignedEngineer',
  'approximateAmount',
  'invoicedAmount',
  'reportAmountToInvoice',
  'amountToInvoice',
  'isDuplicate',
]

export const ALL_PROJECT_FIELDS: ProjectField[] = [
  ...REQUIRED_PROJECT_FIELDS,
  ...RECOMMENDED_PROJECT_FIELDS,
  ...OPTIONAL_PROJECT_FIELDS,
]
