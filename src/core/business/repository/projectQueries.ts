import type {
  BusinessProject,
} from '../entities/project'

import type {
  BusinessDataModel,
} from '../models'

import {
  buildProjectIndexes,
} from './projectIndexes'

import type {
  ProjectIndexes,
} from './projectIndexes'

export interface ProjectDataQualityReport {
  totalProjects: number
  duplicateProjects: number
  activeProjectsMissingBillingDate: number
  activeProjectsMissingAmountToClose: number
  activeProjectsMissingCurrency: number
}

function eligibleOpenProject(project: BusinessProject): boolean {
  return !project.isDuplicate &&
    project.amountToClose !== null &&
    project.amountToClose > 0 &&
    Boolean(project.estimatedBillingPeriodId)
}

export class ProjectQueries {
  private readonly model: BusinessDataModel
  private readonly indexes: ProjectIndexes

  constructor(model: BusinessDataModel) {
    this.model = model
    this.indexes = buildProjectIndexes(model)
  }

  getAll(): BusinessProject[] {
    return [...(this.model.projects?.values() ?? [])]
  }

  findByInternalId(internalId: string): BusinessProject | undefined {
    return this.indexes.byInternalId.get(internalId)
  }

  findByProjectId(projectId: string): BusinessProject | undefined {
    return this.indexes.byProjectId.get(projectId)
  }

  getByEstimatedBillingPeriod(periodId: string): BusinessProject[] {
    return [...(this.indexes.byBillingPeriod.get(periodId) ?? [])]
  }

  getMatureOpenByPeriod(periodId: string): BusinessProject[] {
    return this.getByEstimatedBillingPeriod(periodId).filter(
      (project) =>
        project.forecastStage === 'mature' &&
        eligibleOpenProject(project),
    )
  }

  getPotentialByPeriod(periodId: string): BusinessProject[] {
    return this.getByEstimatedBillingPeriod(periodId).filter(
      (project) =>
        project.forecastStage === 'potential' &&
        eligibleOpenProject(project),
    )
  }

  getQualityReport(): ProjectDataQualityReport {
    const projects = this.getAll()
    const active = projects.filter((project) =>
      ['early', 'potential', 'mature'].includes(project.forecastStage),
    )

    return {
      totalProjects: projects.length,
      duplicateProjects: projects.filter((project) => project.isDuplicate).length,
      activeProjectsMissingBillingDate: active.filter(
        (project) => !project.estimatedBillingDate,
      ).length,
      activeProjectsMissingAmountToClose: active.filter(
        (project) =>
          project.amountToClose === null ||
          project.amountToClose <= 0,
      ).length,
      activeProjectsMissingCurrency: active.filter(
        (project) => !project.currency,
      ).length,
    }
  }
}
