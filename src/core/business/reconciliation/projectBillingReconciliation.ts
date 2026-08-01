import type {
  BusinessProjectBillingDocument,
} from '../entities/projectBilling'

import type {
  BusinessSalesTransactionDocument,
  BusinessSalesTransactionLine,
} from '../entities/salesTransaction'

import type {
  BusinessDataModel,
} from '../models'

export type ProjectBillingReconciliationStatus =
  | 'matched'
  | 'missing_sales_document'
  | 'pending_cutoff'
  | 'voided'
  | 'conflict'

export interface ProjectBillingReconciliationMetrics {
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
}

export interface ProjectBillingReconciliationDocument {
  id: string
  projectBillingDocumentId: string
  projectId: string
  documentNumber: string
  documentType: BusinessProjectBillingDocument['documentType']
  status: ProjectBillingReconciliationStatus

  projectBillingDate: string
  projectBillingPeriodId: string
  salesPeriodIds: string[]

  sourceAmount: number
  sourceCurrency: string | null

  revenue: number
  grossProfit: number
  quantity: number
  matchedSalesLines: number

  brandIds: string[]
  customerIds: string[]

  orphanProject: boolean
  periodMismatch: boolean
  customerMismatch: boolean
  creditNoteSignAnomaly: boolean
  salesDocumentPresent: boolean
  salesDocumentFinanciallyMaterial: boolean
  afterSalesCutoff: boolean
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

export interface ProjectBillingReconciliationBrandPeriod {
  id: string
  periodId: string
  brandId: string

  total: ProjectBillingReconciliationMetrics
  project: ProjectBillingReconciliationMetrics
  transactional: ProjectBillingReconciliationMetrics

  projectRevenueShare: number
}

export interface ProjectBillingReconciliationProject {
  projectId: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
  invoiceDocuments: number
  creditNoteDocuments: number
  periodIds: string[]
  brandIds: string[]
  customerIds: string[]
}

export interface ProjectBillingReconciliationCustomer {
  customerId: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
  projectIds: string[]
  periodIds: string[]
  brandIds: string[]
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

export interface ProjectBillingReconciliationReport {
  generatedAt: string

  total: ProjectBillingReconciliationMetrics
  project: ProjectBillingReconciliationMetrics
  transactional: ProjectBillingReconciliationMetrics

  documents: ProjectBillingReconciliationDocument[]
  periods: ProjectBillingReconciliationPeriod[]
  brandPeriods: ProjectBillingReconciliationBrandPeriod[]
  projects: ProjectBillingReconciliationProject[]
  customers: ProjectBillingReconciliationCustomer[]

  quality: ProjectBillingReconciliationQuality
}

interface MutableMetrics {
  revenue: number
  grossProfit: number
  quantity: number
  documentNumbers: Set<string>
}

interface MutableProjectSummary extends MutableMetrics {
  invoiceDocumentNumbers: Set<string>
  creditNoteDocumentNumbers: Set<string>
  periodIds: Set<string>
  brandIds: Set<string>
  customerIds: Set<string>
}

interface MutableCustomerSummary extends MutableMetrics {
  projectIds: Set<string>
  periodIds: Set<string>
  brandIds: Set<string>
}

function createMutableMetrics(): MutableMetrics {
  return {
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documentNumbers: new Set<string>(),
  }
}

function toMetrics(
  metrics: MutableMetrics,
): ProjectBillingReconciliationMetrics {
  return {
    revenue: metrics.revenue,
    grossProfit: metrics.grossProfit,
    quantity: metrics.quantity,
    documents: metrics.documentNumbers.size,
  }
}

function subtractMetrics(
  total: ProjectBillingReconciliationMetrics,
  project: ProjectBillingReconciliationMetrics,
): ProjectBillingReconciliationMetrics {
  return {
    revenue: total.revenue - project.revenue,
    grossProfit: total.grossProfit - project.grossProfit,
    quantity: total.quantity - project.quantity,
    documents: Math.max(
      0,
      total.documents - project.documents,
    ),
  }
}

function safeRatio(
  numerator: number,
  denominator: number,
): number {
  return denominator === 0
    ? 0
    : numerator / denominator
}

function normalizeIdentifier(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function isFinanciallyMaterial(
  document: BusinessSalesTransactionDocument | undefined,
): boolean {
  if (!document) {
    return false
  }

  const tolerance = 0.0001

  return (
    Math.abs(document.revenue) > tolerance ||
    Math.abs(document.grossProfit) > tolerance ||
    Math.abs(document.quantity) > tolerance
  )
}

function maxDate(
  dates: Iterable<string>,
): string | null {
  let latest: string | null = null

  for (const date of dates) {
    if (!latest || date > latest) {
      latest = date
    }
  }

  return latest
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

function addLineMetrics(
  target: MutableMetrics,
  line: BusinessSalesTransactionLine,
): void {
  target.revenue += line.revenue
  target.grossProfit += line.grossProfit
  target.quantity += line.quantity
  target.documentNumbers.add(line.documentNumber)
}

function getOrCreateMetrics(
  index: Map<string, MutableMetrics>,
  key: string,
): MutableMetrics {
  const current = index.get(key)

  if (current) {
    return current
  }

  const created = createMutableMetrics()
  index.set(key, created)
  return created
}

function createDocumentResult(
  projectBillingDocument: BusinessProjectBillingDocument,
  status: ProjectBillingReconciliationStatus,
  salesDocument: BusinessSalesTransactionDocument | undefined,
  salesLines: BusinessSalesTransactionLine[],
  projectIds: Set<string>,
  salesDataCutoff: string | null,
): ProjectBillingReconciliationDocument {
  const customerMismatch = Boolean(
    projectBillingDocument.customerId &&
    salesDocument &&
    !salesDocument.customerIds.has(
      projectBillingDocument.customerId,
    ),
  )

  const periodMismatch = Boolean(
    salesDocument &&
    !salesDocument.periodIds.has(
      projectBillingDocument.periodId,
    ),
  )

  const creditNoteSignAnomaly = Boolean(
    salesDocument &&
    projectBillingDocument.documentType === 'credit_note' &&
    salesDocument.revenue > 0,
  )

  const salesDocumentFinanciallyMaterial =
    isFinanciallyMaterial(salesDocument)

  const afterSalesCutoff = Boolean(
    salesDataCutoff &&
    projectBillingDocument.date > salesDataCutoff,
  )

  return {
    id: projectBillingDocument.id,
    projectBillingDocumentId: projectBillingDocument.id,
    projectId: projectBillingDocument.projectId,
    documentNumber: projectBillingDocument.documentNumber,
    documentType: projectBillingDocument.documentType,
    status,
    projectBillingDate: projectBillingDocument.date,
    projectBillingPeriodId: projectBillingDocument.periodId,
    salesPeriodIds: salesDocument
      ? [...salesDocument.periodIds].sort()
      : [],
    sourceAmount: projectBillingDocument.sourceAmount,
    sourceCurrency: projectBillingDocument.currency,
    revenue: status === 'matched'
      ? salesDocument?.revenue ?? 0
      : 0,
    grossProfit: status === 'matched'
      ? salesDocument?.grossProfit ?? 0
      : 0,
    quantity: status === 'matched'
      ? salesDocument?.quantity ?? 0
      : 0,
    matchedSalesLines: status === 'matched'
      ? salesLines.length
      : 0,
    brandIds: salesDocument
      ? [...salesDocument.brandIds].sort()
      : [],
    customerIds: salesDocument
      ? [...salesDocument.customerIds].sort()
      : [],
    orphanProject: Boolean(
      projectBillingDocument.projectId &&
      !projectIds.has(projectBillingDocument.projectId),
    ),
    periodMismatch,
    customerMismatch,
    creditNoteSignAnomaly,
    salesDocumentPresent: Boolean(salesDocument),
    salesDocumentFinanciallyMaterial,
    afterSalesCutoff,
  }
}

export function buildProjectBillingReconciliation(
  model: BusinessDataModel,
): ProjectBillingReconciliationReport {
  const salesDocuments =
    model.salesDocuments ?? new Map()

  const salesDataCutoff = maxDate(
    [...(model.salesTransactionLines?.values() ?? [])]
      .map((line) => line.date),
  )

  const projectBillingDataCutoff = maxDate(
    [...(model.projectBillings?.values() ?? [])]
      .map((document) => document.date),
  )

  const salesLinesByDocument =
    new Map<string, BusinessSalesTransactionLine[]>()

  for (
    const line of
    model.salesTransactionLines?.values() ?? []
  ) {
    push(
      salesLinesByDocument,
      line.documentNumber,
      line,
    )
  }

  const billingDocumentsByNumber =
    new Map<string, BusinessProjectBillingDocument[]>()

  for (
    const document of
    model.projectBillings?.values() ?? []
  ) {
    push(
      billingDocumentsByNumber,
      normalizeIdentifier(document.documentNumber),
      document,
    )
  }

  const projectIds = new Set(
    [...(model.projects?.values() ?? [])]
      .map((project) => project.projectId),
  )

  const documentResults:
    ProjectBillingReconciliationDocument[] = []

  const projectMetricsByPeriod =
    new Map<string, MutableMetrics>()

  const projectMetricsByBrandPeriod =
    new Map<string, MutableMetrics>()

  const projectSummaries =
    new Map<string, MutableProjectSummary>()

  const customerSummaries =
    new Map<string, MutableCustomerSummary>()

  const matchedDocumentsByBillingPeriod =
    new Map<string, Set<string>>()

  const missingDocumentsByBillingPeriod =
    new Map<string, Set<string>>()

  const pendingCutoffDocumentsByBillingPeriod =
    new Map<string, Set<string>>()

  const conflictDocumentsByBillingPeriod =
    new Map<string, Set<string>>()

  const materialVoidedDocumentsByBillingPeriod =
    new Map<string, Set<string>>()

  const zeroValueVoidedDocumentsByBillingPeriod =
    new Map<string, Set<string>>()

  const voidedDocumentsByBillingPeriod =
    new Map<string, Set<string>>()

  const creditNotesByBillingPeriod =
    new Map<string, Set<string>>()

  const missingSalesDocumentNumbers = new Set<string>()
  const conflictDocumentNumbers = new Set<string>()
  const orphanProjectIds = new Set<string>()
  const periodMismatchDocuments = new Set<string>()
  const customerMismatchDocuments = new Set<string>()
  const creditNoteSignAnomalyDocuments = new Set<string>()
  const voidedDocumentsPresentInSales = new Set<string>()
  const pendingCutoffDocumentNumbers = new Set<string>()
  const materialVoidedDocumentsPresentInSales = new Set<string>()
  const zeroValueVoidedDocumentsPresentInSales = new Set<string>()

  let activeBillingDocuments = 0
  let matchedBillingDocuments = 0
  let missingBillingDocuments = 0
  let pendingCutoffBillingDocuments = 0
  let voidedBillingDocuments = 0
  let conflictBillingDocuments = 0
  let creditNoteDocuments = 0

  for (
    const [
      documentNumber,
      projectBillingDocuments,
    ] of billingDocumentsByNumber
  ) {
    const salesDocument =
      salesDocuments.get(documentNumber)

    const salesLines =
      salesLinesByDocument.get(documentNumber) ?? []

    const activeDocuments =
      projectBillingDocuments.filter(
        (document) => !document.isVoided,
      )

    for (
      const projectBillingDocument of
      projectBillingDocuments.filter(
        (document) => document.isVoided,
      )
    ) {
      voidedBillingDocuments += 1


      const periodVoidedDocuments =
        voidedDocumentsByBillingPeriod.get(
          projectBillingDocument.periodId,
        ) ?? new Set<string>()

      periodVoidedDocuments.add(documentNumber)
      voidedDocumentsByBillingPeriod.set(
        projectBillingDocument.periodId,
        periodVoidedDocuments,
      )

      if (salesDocument) {
        voidedDocumentsPresentInSales.add(documentNumber)

        const periodIndex = isFinanciallyMaterial(salesDocument)
          ? materialVoidedDocumentsByBillingPeriod
          : zeroValueVoidedDocumentsByBillingPeriod
        const periodDocuments = periodIndex.get(
          projectBillingDocument.periodId,
        ) ?? new Set<string>()

        periodDocuments.add(documentNumber)
        periodIndex.set(
          projectBillingDocument.periodId,
          periodDocuments,
        )

        if (isFinanciallyMaterial(salesDocument)) {
          materialVoidedDocumentsPresentInSales.add(documentNumber)
        } else {
          zeroValueVoidedDocumentsPresentInSales.add(documentNumber)
        }
      }

      const result = createDocumentResult(
        projectBillingDocument,
        'voided',
        salesDocument,
        salesLines,
        projectIds,
        salesDataCutoff,
      )

      documentResults.push(result)

      if (result.orphanProject) {
        orphanProjectIds.add(result.projectId)
      }
    }

    if (activeDocuments.length === 0) {
      continue
    }

    activeBillingDocuments += activeDocuments.length

    for (const activeDocument of activeDocuments) {
      if (activeDocument.documentType !== 'credit_note') {
        continue
      }

      creditNoteDocuments += 1

      const periodCreditNotes =
        creditNotesByBillingPeriod.get(
          activeDocument.periodId,
        ) ?? new Set<string>()

      periodCreditNotes.add(documentNumber)
      creditNotesByBillingPeriod.set(
        activeDocument.periodId,
        periodCreditNotes,
      )
    }

    if (activeDocuments.length > 1) {
      conflictDocumentNumbers.add(documentNumber)
      conflictBillingDocuments += activeDocuments.length

      for (const projectBillingDocument of activeDocuments) {
        const periodConflicts = conflictDocumentsByBillingPeriod.get(
          projectBillingDocument.periodId,
        ) ?? new Set<string>()

        periodConflicts.add(documentNumber)
        conflictDocumentsByBillingPeriod.set(
          projectBillingDocument.periodId,
          periodConflicts,
        )
        const result = createDocumentResult(
          projectBillingDocument,
          'conflict',
          salesDocument,
          salesLines,
          projectIds,
          salesDataCutoff,
        )

        documentResults.push(result)

        if (result.orphanProject) {
          orphanProjectIds.add(result.projectId)
        }
      }

      continue
    }

    const projectBillingDocument = activeDocuments[0]

    if (!projectBillingDocument) {
      continue
    }

    if (!salesDocument || salesLines.length === 0) {
      const afterSalesCutoff = Boolean(
        salesDataCutoff &&
        projectBillingDocument.date > salesDataCutoff,
      )

      if (afterSalesCutoff) {
        pendingCutoffBillingDocuments += 1
        pendingCutoffDocumentNumbers.add(documentNumber)

        const periodPendingDocuments =
          pendingCutoffDocumentsByBillingPeriod.get(
            projectBillingDocument.periodId,
          ) ?? new Set<string>()

        periodPendingDocuments.add(documentNumber)
        pendingCutoffDocumentsByBillingPeriod.set(
          projectBillingDocument.periodId,
          periodPendingDocuments,
        )
      } else {
        missingBillingDocuments += 1
        missingSalesDocumentNumbers.add(documentNumber)

        const periodMissingDocuments =
          missingDocumentsByBillingPeriod.get(
            projectBillingDocument.periodId,
          ) ?? new Set<string>()

        periodMissingDocuments.add(documentNumber)
        missingDocumentsByBillingPeriod.set(
          projectBillingDocument.periodId,
          periodMissingDocuments,
        )
      }

      const result = createDocumentResult(
        projectBillingDocument,
        afterSalesCutoff
          ? 'pending_cutoff'
          : 'missing_sales_document',
        undefined,
        [],
        projectIds,
        salesDataCutoff,
      )

      documentResults.push(result)

      if (result.orphanProject) {
        orphanProjectIds.add(result.projectId)
      }

      continue
    }

    matchedBillingDocuments += 1

    const periodMatchedDocuments =
      matchedDocumentsByBillingPeriod.get(
        projectBillingDocument.periodId,
      ) ?? new Set<string>()

    periodMatchedDocuments.add(documentNumber)
    matchedDocumentsByBillingPeriod.set(
      projectBillingDocument.periodId,
      periodMatchedDocuments,
    )

    const result = createDocumentResult(
      projectBillingDocument,
      'matched',
      salesDocument,
      salesLines,
      projectIds,
      salesDataCutoff,
    )

    documentResults.push(result)

    if (result.orphanProject) {
      orphanProjectIds.add(result.projectId)
    }

    if (result.periodMismatch) {
      periodMismatchDocuments.add(documentNumber)
    }

    if (result.customerMismatch) {
      customerMismatchDocuments.add(documentNumber)
    }

    if (result.creditNoteSignAnomaly) {
      creditNoteSignAnomalyDocuments.add(documentNumber)
    }

    let projectSummary =
      projectSummaries.get(
        projectBillingDocument.projectId,
      )

    if (!projectSummary) {
      projectSummary = {
        ...createMutableMetrics(),
        invoiceDocumentNumbers: new Set<string>(),
        creditNoteDocumentNumbers: new Set<string>(),
        periodIds: new Set<string>(),
        brandIds: new Set<string>(),
        customerIds: new Set<string>(),
      }

      projectSummaries.set(
        projectBillingDocument.projectId,
        projectSummary,
      )
    }

    if (
      projectBillingDocument.documentType === 'credit_note'
    ) {
      projectSummary.creditNoteDocumentNumbers.add(
        documentNumber,
      )
    } else if (
      projectBillingDocument.documentType === 'invoice'
    ) {
      projectSummary.invoiceDocumentNumbers.add(
        documentNumber,
      )
    }

    for (const line of salesLines) {
      const periodMetrics = getOrCreateMetrics(
        projectMetricsByPeriod,
        line.periodId,
      )

      addLineMetrics(periodMetrics, line)

      const brandPeriodMetrics = getOrCreateMetrics(
        projectMetricsByBrandPeriod,
        `${line.periodId}::${line.brandId}`,
      )

      addLineMetrics(brandPeriodMetrics, line)
      addLineMetrics(projectSummary, line)
      projectSummary.periodIds.add(line.periodId)
      projectSummary.brandIds.add(line.brandId)

      if (line.customerId) {
        projectSummary.customerIds.add(line.customerId)

        let customerSummary =
          customerSummaries.get(line.customerId)

        if (!customerSummary) {
          customerSummary = {
            ...createMutableMetrics(),
            projectIds: new Set<string>(),
            periodIds: new Set<string>(),
            brandIds: new Set<string>(),
          }

          customerSummaries.set(
            line.customerId,
            customerSummary,
          )
        }

        addLineMetrics(customerSummary, line)
        customerSummary.projectIds.add(
          projectBillingDocument.projectId,
        )
        customerSummary.periodIds.add(line.periodId)
        customerSummary.brandIds.add(line.brandId)
      }
    }
  }

  const periods = [...model.periods.values()]
    .sort((periodA, periodB) =>
      periodA.id.localeCompare(periodB.id),
    )
    .map((period) => {
      const total: ProjectBillingReconciliationMetrics = {
        revenue: period.revenue,
        grossProfit: period.grossProfit,
        quantity: period.quantity,
        documents: period.documents,
      }

      const project = toMetrics(
        projectMetricsByPeriod.get(period.id) ??
        createMutableMetrics(),
      )

      const matchedForPeriod =
        matchedDocumentsByBillingPeriod.get(period.id)?.size ?? 0

      const eligibleForPeriod =
        matchedForPeriod +
        (missingDocumentsByBillingPeriod.get(period.id)?.size ?? 0) +
        (conflictDocumentsByBillingPeriod.get(period.id)?.size ?? 0)

      return {
        periodId: period.id,
        total,
        project,
        transactional: subtractMetrics(total, project),
        projectRevenueShare: safeRatio(
          project.revenue,
          total.revenue,
        ),
        reconciliationCoverage: eligibleForPeriod === 0
          ? 1
          : safeRatio(
              matchedForPeriod,
              eligibleForPeriod,
            ),
        matchedBillingDocuments: matchedForPeriod,
        missingBillingDocuments:
          missingDocumentsByBillingPeriod.get(period.id)?.size ?? 0,
        pendingCutoffBillingDocuments:
          pendingCutoffDocumentsByBillingPeriod.get(period.id)?.size ?? 0,
        conflictBillingDocuments:
          conflictDocumentsByBillingPeriod.get(period.id)?.size ?? 0,
        voidedBillingDocuments:
          voidedDocumentsByBillingPeriod.get(period.id)?.size ?? 0,
        materialVoidedDocuments:
          materialVoidedDocumentsByBillingPeriod.get(period.id)?.size ?? 0,
        zeroValueVoidedDocuments:
          zeroValueVoidedDocumentsByBillingPeriod.get(period.id)?.size ?? 0,
        creditNoteDocuments:
          creditNotesByBillingPeriod.get(period.id)?.size ?? 0,
      }
    })

  const brandPeriods = [...model.brandPeriods.values()]
    .sort((periodA, periodB) =>
      periodA.id.localeCompare(periodB.id),
    )
    .map((brandPeriod) => {
      const total: ProjectBillingReconciliationMetrics = {
        revenue: brandPeriod.revenue,
        grossProfit: brandPeriod.grossProfit,
        quantity: brandPeriod.quantity,
        documents: brandPeriod.documents,
      }

      const project = toMetrics(
        projectMetricsByBrandPeriod.get(
          `${brandPeriod.periodId}::${brandPeriod.brandId}`,
        ) ?? createMutableMetrics(),
      )

      return {
        id: brandPeriod.id,
        periodId: brandPeriod.periodId,
        brandId: brandPeriod.brandId,
        total,
        project,
        transactional: subtractMetrics(total, project),
        projectRevenueShare: safeRatio(
          project.revenue,
          total.revenue,
        ),
      }
    })

  const projects = [...projectSummaries.entries()]
    .map(([
      projectId,
      summary,
    ]) => ({
      projectId,
      revenue: summary.revenue,
      grossProfit: summary.grossProfit,
      quantity: summary.quantity,
      documents: summary.documentNumbers.size,
      invoiceDocuments: summary.invoiceDocumentNumbers.size,
      creditNoteDocuments: summary.creditNoteDocumentNumbers.size,
      periodIds: [...summary.periodIds].sort(),
      brandIds: [...summary.brandIds].sort(),
      customerIds: [...summary.customerIds].sort(),
    }))
    .sort((projectA, projectB) =>
      projectB.revenue - projectA.revenue ||
      projectA.projectId.localeCompare(projectB.projectId),
    )

  const customers = [...customerSummaries.entries()]
    .map(([
      customerId,
      summary,
    ]) => ({
      customerId,
      revenue: summary.revenue,
      grossProfit: summary.grossProfit,
      quantity: summary.quantity,
      documents: summary.documentNumbers.size,
      projectIds: [...summary.projectIds].sort(),
      periodIds: [...summary.periodIds].sort(),
      brandIds: [...summary.brandIds].sort(),
    }))
    .sort((customerA, customerB) =>
      customerB.revenue - customerA.revenue ||
      customerA.customerId.localeCompare(customerB.customerId),
    )

  const project = toMetrics(
    [...projectMetricsByPeriod.values()]
      .reduce((total, periodMetrics) => {
        total.revenue += periodMetrics.revenue
        total.grossProfit += periodMetrics.grossProfit
        total.quantity += periodMetrics.quantity

        for (
          const documentNumber of
          periodMetrics.documentNumbers
        ) {
          total.documentNumbers.add(documentNumber)
        }

        return total
      }, createMutableMetrics()),
  )

  const total: ProjectBillingReconciliationMetrics = {
    revenue: model.totals.revenue,
    grossProfit: model.totals.grossProfit,
    quantity: model.totals.quantity,
    documents: model.totals.documents,
  }

  const currentPeriodId = periods.at(-1)?.periodId ?? null
  const currentPeriod = currentPeriodId
    ? periods.find((period) => period.periodId === currentPeriodId)
    : undefined
  const historicalPeriods = periods.filter(
    (period) => period.periodId !== currentPeriodId,
  )
  const historicalMatched = historicalPeriods.reduce(
    (sum, period) => sum + period.matchedBillingDocuments,
    0,
  )
  const historicalEligible = historicalPeriods.reduce(
    (sum, period) =>
      sum +
      period.matchedBillingDocuments +
      period.missingBillingDocuments +
      period.conflictBillingDocuments,
    0,
  )

  const currentPeriodBlockingDocumentNumbers = new Set<string>()
  const historicalExceptionDocumentNumbers = new Set<string>()

  for (const document of documentResults) {
    const materialException =
      document.status === 'missing_sales_document' ||
      document.status === 'conflict' ||
      (
        document.status === 'voided' &&
        document.salesDocumentFinanciallyMaterial
      ) ||
      document.creditNoteSignAnomaly

    if (!materialException) {
      continue
    }

    if (document.projectBillingPeriodId === currentPeriodId) {
      currentPeriodBlockingDocumentNumbers.add(document.documentNumber)
    } else {
      historicalExceptionDocumentNumbers.add(document.documentNumber)
    }
  }

  const eligibleBillingDocuments =
    matchedBillingDocuments +
    missingBillingDocuments +
    conflictDocumentNumbers.size

  return {
    generatedAt: model.generatedAt,
    total,
    project,
    transactional: subtractMetrics(total, project),
    documents: documentResults.sort(
      (documentA, documentB) =>
        documentA.documentNumber.localeCompare(
          documentB.documentNumber,
        ) ||
        documentA.projectId.localeCompare(
          documentB.projectId,
        ),
    ),
    periods,
    brandPeriods,
    projects,
    customers,
    quality: {
      activeBillingDocuments,
      matchedBillingDocuments,
      missingBillingDocuments,
      voidedBillingDocuments,
      conflictBillingDocuments,
      creditNoteDocuments,
      coverageRate: eligibleBillingDocuments === 0
        ? 1
        : safeRatio(
            matchedBillingDocuments,
            eligibleBillingDocuments,
          ),
      currentPeriodId,
      currentPeriodCoverageRate:
        currentPeriod?.reconciliationCoverage ?? 1,
      historicalCoverageRate: historicalEligible === 0
        ? 1
        : safeRatio(historicalMatched, historicalEligible),
      salesDataCutoff,
      projectBillingDataCutoff,
      pendingCutoffBillingDocuments,
      missingSalesDocumentNumbers:
        [...missingSalesDocumentNumbers].sort(),
      conflictDocumentNumbers:
        [...conflictDocumentNumbers].sort(),
      orphanProjectIds:
        [...orphanProjectIds].sort(),
      periodMismatchDocuments:
        [...periodMismatchDocuments].sort(),
      customerMismatchDocuments:
        [...customerMismatchDocuments].sort(),
      creditNoteSignAnomalyDocuments:
        [...creditNoteSignAnomalyDocuments].sort(),
      voidedDocumentsPresentInSales:
        [...voidedDocumentsPresentInSales].sort(),
      pendingCutoffDocumentNumbers:
        [...pendingCutoffDocumentNumbers].sort(),
      materialVoidedDocumentsPresentInSales:
        [...materialVoidedDocumentsPresentInSales].sort(),
      zeroValueVoidedDocumentsPresentInSales:
        [...zeroValueVoidedDocumentsPresentInSales].sort(),
      currentPeriodBlockingDocumentNumbers:
        [...currentPeriodBlockingDocumentNumbers].sort(),
      historicalExceptionDocumentNumbers:
        [...historicalExceptionDocumentNumbers].sort(),
    },
  }
}
