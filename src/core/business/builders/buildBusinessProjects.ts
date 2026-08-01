import type {
  NormalizedProjectRow,
} from '../../../features/data-center/importers/projects/projectTypes'

import type {
  BusinessProject,
} from '../entities/project'

function normalizeIdentifier(value: string | null): string | null {
  const normalized = value
    ?.trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')

  return normalized || null
}

function periodFromDate(value: string | null): string | null {
  return value?.slice(0, 7) || null
}

export function buildBusinessProjects(
  rows: readonly NormalizedProjectRow[],
): Map<string, BusinessProject> {
  const projects = new Map<string, BusinessProject>()

  for (const row of rows) {
    const id = row.internalId || row.projectId

    if (!id) {
      continue
    }

    projects.set(id, {
      id,
      internalId: row.internalId,
      projectId: row.projectId,
      name: row.name,
      endUser: row.endUser,
      customerId: normalizeIdentifier(row.customerId),
      customerName: row.customerName,
      salesExecutive: row.salesExecutive,
      locationId: normalizeIdentifier(row.location),
      assignedBusinessDeveloper: row.assignedBusinessDeveloper,
      assignedProductManager: row.assignedProductManager,
      group: row.group,
      primaryBrandId: normalizeIdentifier(row.primaryBrand),
      createdAt: row.createdAt,
      elapsedDays: row.elapsedDays,
      currency: normalizeIdentifier(row.currency),
      statusCode: row.statusCode,
      statusLabel: row.statusLabel,
      forecastStage: row.forecastStage,
      closingProbability: row.closingProbability,
      estimatedCloseDate: row.estimatedCloseDate,
      estimatedBillingDate: row.estimatedBillingDate,
      estimatedBillingPeriodId: periodFromDate(row.estimatedBillingDate),
      amountToClose: row.amountToClose,
      observations: row.observations,
      assignedEngineer: row.assignedEngineer,
      approximateAmount: row.approximateAmount,
      invoicedAmount: row.invoicedAmount,
      reportAmountToInvoice: row.reportAmountToInvoice,
      amountToInvoice: row.amountToInvoice,
      isDuplicate: row.isDuplicate,
    })
  }

  return projects
}
