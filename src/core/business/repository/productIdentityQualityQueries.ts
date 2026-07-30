import type {
  BusinessDataModel,
} from '../models'

import {
  createEmptyProductIdentityQualityReport,
} from '../quality'

import type {
  ProductIdentityQualityIssue,
  ProductIdentityQualityReport,
} from '../quality'

import type {
  ProductSalesReconciliationReason,
} from '../reconciliation'

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 0
  }

  return Math.floor(limit)
}

export class ProductIdentityQualityQueries {
  private readonly model: BusinessDataModel

  constructor(model: BusinessDataModel) {
    this.model = model
  }

  getReport(): ProductIdentityQualityReport {
    const report =
      this.model.productIdentityQuality ??
      createEmptyProductIdentityQualityReport()

    return {
      ...report,
      thresholds: { ...report.thresholds },
      reasonSummaries: report.reasonSummaries.map((summary) => ({
        ...summary,
      })),
      issues: report.issues.map((issue) => ({
        ...issue,
        candidateNames: [...issue.candidateNames],
        candidateCodes: [...issue.candidateCodes],
        attributeWarnings: [...issue.attributeWarnings],
      })),
    }
  }

  getTopIssues(limit = 25): ProductIdentityQualityIssue[] {
    const normalizedLimit = normalizeLimit(limit)

    if (normalizedLimit === 0) {
      return []
    }

    return this.getReport().issues.slice(0, normalizedLimit)
  }

  findIssuesByReason(
    reason: ProductSalesReconciliationReason,
  ): ProductIdentityQualityIssue[] {
    return this.getReport().issues.filter(
      (issue) => issue.reason === reason,
    )
  }

  isGatePassed(): boolean {
    return this.getReport().status === 'passed'
  }
}
