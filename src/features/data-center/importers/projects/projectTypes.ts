export type ProjectStatusCode =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | 'unknown'

export type ProjectForecastStage =
  | 'early'
  | 'potential'
  | 'mature'
  | 'realized'
  | 'cancelled'
  | 'unknown'

export interface NormalizedProjectRow {
  internalId: string
  projectId: string
  name: string

  endUser: string | null
  customerId: string | null
  customerName: string | null

  salesExecutive: string | null
  location: string | null
  assignedBusinessDeveloper: string | null
  assignedProductManager: string | null
  group: string | null
  primaryBrand: string | null

  createdAt: string | null
  elapsedDays: number | null
  currency: string | null

  statusCode: ProjectStatusCode
  statusLabel: string
  forecastStage: ProjectForecastStage
  closingProbability: number | null

  estimatedCloseDate: string | null
  estimatedBillingDate: string | null
  amountToClose: number | null

  observations: string | null
  assignedEngineer: string | null

  approximateAmount: number | null
  invoicedAmount: number | null
  reportAmountToInvoice: number | null
  amountToInvoice: number | null

  isDuplicate: boolean
}

export interface ProjectDatasetSummary {
  periodStart: string | null
  periodEnd: string | null

  totalProjects: number
  activeProjects: number
  matureProjects: number
  potentialProjects: number
  earlyProjects: number
  realizedProjects: number
  cancelledProjects: number

  duplicateProjects: number
  projectsMissingBillingDate: number
  projectsMissingAmountToClose: number
  projectsMissingCurrency: number

  matureAmountToCloseUsd: number
  potentialAmountToCloseUsd: number
  currencies: string[]

  processedRows: number
  ignoredRows: number
}
