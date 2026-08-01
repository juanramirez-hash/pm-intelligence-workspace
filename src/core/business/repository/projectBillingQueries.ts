import type {
  BusinessProjectBillingDocument,
  BusinessProjectBillingLine,
} from '../entities/projectBilling'

import type {
  BusinessDataModel,
} from '../models'

import {
  buildProjectBillingIndexes,
} from './projectBillingIndexes'

import type {
  ProjectBillingIndexes,
} from './projectBillingIndexes'

export interface ProjectBillingDataQualityReport {
  totalDocuments: number
  totalLines: number
  voidedDocuments: number
  creditNoteDocuments: number
  orphanProjectIds: string[]
  duplicateSourceLines: number
}

export class ProjectBillingQueries {
  private readonly model: BusinessDataModel
  private readonly indexes: ProjectBillingIndexes

  constructor(model: BusinessDataModel) {
    this.model = model
    this.indexes = buildProjectBillingIndexes(model)
  }

  getAllDocuments(): BusinessProjectBillingDocument[] {
    return [...(this.model.projectBillings?.values() ?? [])]
  }

  getAllLines(): BusinessProjectBillingLine[] {
    return [...(this.model.projectBillingLines?.values() ?? [])]
  }

  findByDocumentNumber(
    documentNumber: string,
  ): BusinessProjectBillingDocument | undefined {
    return this.indexes.documentsByNumber.get(
      documentNumber.trim().toLocaleUpperCase('es-MX'),
    )
  }

  getDocumentsByPeriod(periodId: string): BusinessProjectBillingDocument[] {
    return [...(this.indexes.documentsByPeriod.get(periodId) ?? [])]
  }

  getLinesByPeriod(periodId: string): BusinessProjectBillingLine[] {
    return [...(this.indexes.linesByPeriod.get(periodId) ?? [])]
  }

  getDocumentsByProject(projectId: string): BusinessProjectBillingDocument[] {
    return [...(this.indexes.documentsByProject.get(projectId) ?? [])]
  }

  getActiveDocumentNumbersByPeriod(periodId: string): Set<string> {
    return new Set(
      this.getDocumentsByPeriod(periodId)
        .filter((document) => !document.isVoided)
        .map((document) => document.documentNumber),
    )
  }

  getQualityReport(): ProjectBillingDataQualityReport {
    const documents = this.getAllDocuments()
    const projectIds = new Set(
      [...(this.model.projects?.values() ?? [])]
        .map((project) => project.projectId),
    )
    const orphanProjectIds = [...new Set(
      documents
        .map((document) => document.projectId)
        .filter((projectId) => projectId && !projectIds.has(projectId)),
    )].sort()

    return {
      totalDocuments: documents.length,
      totalLines: this.model.projectBillingLines?.size ?? 0,
      voidedDocuments: documents.filter((document) => document.isVoided).length,
      creditNoteDocuments: documents.filter(
        (document) => document.documentType === 'credit_note',
      ).length,
      orphanProjectIds,
      duplicateSourceLines: this.getAllLines().reduce(
        (total, line) => total + line.duplicateOccurrences,
        0,
      ),
    }
  }
}
