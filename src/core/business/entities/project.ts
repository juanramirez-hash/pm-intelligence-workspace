export type BusinessProjectStatusCode =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | 'unknown'

export type BusinessProjectForecastStage =
  | 'early'
  | 'potential'
  | 'mature'
  | 'realized'
  | 'cancelled'
  | 'unknown'

export interface BusinessProject {
  id: string
  internalId: string
  projectId: string
  name: string

  endUser: string | null
  customerId: string | null
  customerName: string | null

  salesExecutive: string | null
  locationId: string | null
  assignedBusinessDeveloper: string | null
  assignedProductManager: string | null
  group: string | null
  primaryBrandId: string | null

  createdAt: string | null
  elapsedDays: number | null
  currency: string | null

  statusCode: BusinessProjectStatusCode
  statusLabel: string
  forecastStage: BusinessProjectForecastStage
  closingProbability: number | null

  estimatedCloseDate: string | null
  estimatedBillingDate: string | null
  estimatedBillingPeriodId: string | null
  amountToClose: number | null

  observations: string | null
  assignedEngineer: string | null

  approximateAmount: number | null
  invoicedAmount: number | null
  reportAmountToInvoice: number | null
  amountToInvoice: number | null

  isDuplicate: boolean
}
