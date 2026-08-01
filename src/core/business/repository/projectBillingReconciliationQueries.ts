import type {
  BusinessDataModel,
} from '../models'

import {
  buildProjectBillingReconciliation,
} from '../reconciliation/projectBillingReconciliation'

import type {
  ProjectBillingReconciliationBrandPeriod,
  ProjectBillingReconciliationCustomer,
  ProjectBillingReconciliationDocument,
  ProjectBillingReconciliationPeriod,
  ProjectBillingReconciliationProject,
  ProjectBillingReconciliationReport,
} from '../reconciliation/projectBillingReconciliation'

function normalizeIdentifier(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

export class ProjectBillingReconciliationQueries {
  private readonly report:
    ProjectBillingReconciliationReport

  constructor(model: BusinessDataModel) {
    this.report =
      buildProjectBillingReconciliation(model)
  }

  getReport(): ProjectBillingReconciliationReport {
    return this.report
  }

  getPeriods(): ProjectBillingReconciliationPeriod[] {
    return [...this.report.periods]
  }

  findPeriod(
    periodId: string,
  ): ProjectBillingReconciliationPeriod | undefined {
    return this.report.periods.find(
      (period) => period.periodId === periodId,
    )
  }

  getBrandPeriods(
    brandId?: string,
  ): ProjectBillingReconciliationBrandPeriod[] {
    if (!brandId) {
      return [...this.report.brandPeriods]
    }

    const normalizedBrandId =
      normalizeIdentifier(brandId)

    return this.report.brandPeriods.filter(
      (period) => period.brandId === normalizedBrandId,
    )
  }

  getDocumentsByNumber(
    documentNumber: string,
  ): ProjectBillingReconciliationDocument[] {
    const normalizedDocumentNumber =
      normalizeIdentifier(documentNumber)

    return this.report.documents.filter(
      (document) =>
        document.documentNumber === normalizedDocumentNumber,
    )
  }

  getDocumentsByStatus(
    status: ProjectBillingReconciliationDocument['status'],
  ): ProjectBillingReconciliationDocument[] {
    return this.report.documents.filter(
      (document) => document.status === status,
    )
  }

  findProject(
    projectId: string,
  ): ProjectBillingReconciliationProject | undefined {
    const normalizedProjectId =
      normalizeIdentifier(projectId)

    return this.report.projects.find(
      (project) => project.projectId === normalizedProjectId,
    )
  }

  findCustomer(
    customerId: string,
  ): ProjectBillingReconciliationCustomer | undefined {
    const normalizedCustomerId =
      normalizeIdentifier(customerId)

    return this.report.customers.find(
      (customer) => customer.customerId === normalizedCustomerId,
    )
  }
}
