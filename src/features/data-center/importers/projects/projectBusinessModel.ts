import type {
  NormalizedProjectRow,
  ProjectDatasetSummary,
} from './projectTypes'

export interface ProjectBusinessModel {
  projects: NormalizedProjectRow[]
  summary: ProjectDatasetSummary
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function projectIdentity(row: NormalizedProjectRow): string {
  return row.internalId || row.projectId
}

export function upsertProjectRows(
  existingRows: readonly NormalizedProjectRow[],
  incomingRows: readonly NormalizedProjectRow[],
): NormalizedProjectRow[] {
  const rowsByIdentity = new Map<string, NormalizedProjectRow>()

  for (const row of existingRows) {
    rowsByIdentity.set(projectIdentity(row), row)
  }

  for (const row of incomingRows) {
    rowsByIdentity.set(projectIdentity(row), row)
  }

  return [...rowsByIdentity.values()].sort(
    (left, right) => left.projectId.localeCompare(right.projectId),
  )
}

export function buildProjectBusinessModel(
  rows: readonly NormalizedProjectRow[],
  ignoredRows = 0,
): ProjectBusinessModel {
  const projects = upsertProjectRows([], rows)
  const datedProjects = projects
    .map((project) => project.estimatedBillingDate)
    .filter((value): value is string => Boolean(value))
    .sort()
  const activeProjects = projects.filter(
    (project) => [
      'early',
      'potential',
      'mature',
    ].includes(project.forecastStage),
  )
  const matureProjects = projects.filter(
    (project) => project.forecastStage === 'mature',
  )
  const potentialProjects = projects.filter(
    (project) => project.forecastStage === 'potential',
  )

  const amountForUsdProjects = (
    projectRows: readonly NormalizedProjectRow[],
  ) => roundCurrency(
    projectRows.reduce(
      (total, project) =>
        project.currency === 'USD' && !project.isDuplicate
          ? total + (project.amountToClose ?? 0)
          : total,
      0,
    ),
  )

  return {
    projects,
    summary: {
      periodStart: datedProjects[0] ?? null,
      periodEnd: datedProjects.at(-1) ?? null,
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      matureProjects: matureProjects.length,
      potentialProjects: potentialProjects.length,
      earlyProjects: projects.filter(
        (project) => project.forecastStage === 'early',
      ).length,
      realizedProjects: projects.filter(
        (project) => project.forecastStage === 'realized',
      ).length,
      cancelledProjects: projects.filter(
        (project) => project.forecastStage === 'cancelled',
      ).length,
      duplicateProjects: projects.filter(
        (project) => project.isDuplicate,
      ).length,
      projectsMissingBillingDate: activeProjects.filter(
        (project) => !project.estimatedBillingDate,
      ).length,
      projectsMissingAmountToClose: activeProjects.filter(
        (project) =>
          project.amountToClose === null ||
          project.amountToClose <= 0,
      ).length,
      projectsMissingCurrency: activeProjects.filter(
        (project) => !project.currency,
      ).length,
      matureAmountToCloseUsd: amountForUsdProjects(matureProjects),
      potentialAmountToCloseUsd: amountForUsdProjects(potentialProjects),
      currencies: [...new Set(
        projects
          .map((project) => project.currency)
          .filter((currency): currency is string => Boolean(currency)),
      )].sort(),
      processedRows: projects.length,
      ignoredRows,
    },
  }
}
