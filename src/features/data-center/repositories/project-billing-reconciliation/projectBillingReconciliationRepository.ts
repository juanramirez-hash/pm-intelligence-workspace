export interface ProjectBillingReconciliationMetrics {
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
}

export interface ProjectBillingReconciliationPeriod {
  periodId: string

  total: ProjectBillingReconciliationMetrics
  project: ProjectBillingReconciliationMetrics
  transactional: ProjectBillingReconciliationMetrics

  projectRevenueShare: number
  reconciliationCoverage: number

  matchedBillingDocuments: number
  missingBillingDocuments: number
  pendingCutoffBillingDocuments: number
  conflictBillingDocuments: number
  voidedBillingDocuments: number
  materialVoidedDocuments: number
  zeroValueVoidedDocuments: number
  creditNoteDocuments: number
}

export interface ProjectBillingReconciliationQuality {
  activeBillingDocuments: number
  matchedBillingDocuments: number
  missingBillingDocuments: number
  voidedBillingDocuments: number
  conflictBillingDocuments: number
  creditNoteDocuments: number

  coverageRate: number

  currentPeriodId: string | null
  currentPeriodCoverageRate: number
  historicalCoverageRate: number

  salesDataCutoff: string | null
  projectBillingDataCutoff: string | null

  pendingCutoffBillingDocuments: number

  missingSalesDocumentNumbers: string[]
  conflictDocumentNumbers: string[]
  orphanProjectIds: string[]
  periodMismatchDocuments: string[]
  customerMismatchDocuments: string[]
  creditNoteSignAnomalyDocuments: string[]
  voidedDocumentsPresentInSales: string[]
  pendingCutoffDocumentNumbers: string[]
  materialVoidedDocumentsPresentInSales: string[]
  zeroValueVoidedDocumentsPresentInSales: string[]
  currentPeriodBlockingDocumentNumbers: string[]
  historicalExceptionDocumentNumbers: string[]
}

export interface ProjectBillingReconciliationSummary {
  generatedAt: string

  total: ProjectBillingReconciliationMetrics
  project: ProjectBillingReconciliationMetrics
  transactional: ProjectBillingReconciliationMetrics

  periods: ProjectBillingReconciliationPeriod[]

  quality: ProjectBillingReconciliationQuality
}

interface ProjectBillingReconciliationResponse {
  ok: true
  dataset: 'projectBillingReconciliation'
  data: ProjectBillingReconciliationSummary
}

export async function loadProjectBillingReconciliation(
  signal?: AbortSignal,
): Promise<ProjectBillingReconciliationSummary> {
  const response =
    await fetch(
      '/api/data/project-billings/reconciliation',
      {
        method: 'GET',
        credentials: 'include',
        signal,
      },
    )

  const payload =
    await response
      .json()
      .catch(() => null)

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  const result =
    payload as ProjectBillingReconciliationResponse

  return result.data
}