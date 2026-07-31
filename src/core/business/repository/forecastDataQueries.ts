import type {
  BusinessDataModel,
} from '../models'

import {
  buildForecastDataFoundation,
  buildForecastSeries,
} from '../forecast'

import type {
  ForecastCapabilityId,
  ForecastCapabilityProfile,
  ForecastDataFoundation,
  ForecastGranularity,
  ForecastGranularityProfile,
  ForecastQualityIssue,
  ForecastSourceId,
  ForecastSeries,
  ForecastSourceProfile,
} from '../forecast'

function cloneSource(
  source: ForecastSourceProfile,
): ForecastSourceProfile {
  return {
    ...source,
    facts: { ...source.facts },
    notes: [...source.notes],
  }
}

function cloneCapability(
  capability: ForecastCapabilityProfile,
): ForecastCapabilityProfile {
  return {
    ...capability,
    dependencies: [...capability.dependencies],
  }
}

function cloneGranularity(
  granularity: ForecastGranularityProfile,
): ForecastGranularityProfile {
  return { ...granularity }
}

function cloneIssue(
  issue: ForecastQualityIssue,
): ForecastQualityIssue {
  return { ...issue }
}

function cloneSeries(
  series: ForecastSeries,
): ForecastSeries {
  return {
    ...series,
    observations: series.observations.map((observation) => ({
      ...observation,
    })),
  }
}

function cloneFoundation(
  report: ForecastDataFoundation,
): ForecastDataFoundation {
  return {
    ...report,
    history: {
      ...report.history,
      periodIds: [...report.history.periodIds],
      baselinePeriodIds: [...report.history.baselinePeriodIds],
      missingPeriodIds: [...report.history.missingPeriodIds],
    },
    sources: report.sources.map(cloneSource),
    capabilities: report.capabilities.map(cloneCapability),
    granularities: report.granularities.map(cloneGranularity),
    metrics: [...report.metrics],
    scenarios: report.scenarios.map((scenario) => ({ ...scenario })),
    quality: {
      ...report.quality,
      issues: report.quality.issues.map(cloneIssue),
    },
    constraints: [...report.constraints],
  }
}

export class ForecastDataQueries {
  private readonly foundation: ForecastDataFoundation

  private readonly seriesByGranularity:
    Map<ForecastGranularity, ForecastSeries[]>

  constructor(
    model: BusinessDataModel,
  ) {
    this.foundation = buildForecastDataFoundation(model)
    this.seriesByGranularity = new Map(
      ([
        'portfolio',
        'brand',
        'product',
        'customer',
      ] as const).map((granularity) => [
        granularity,
        buildForecastSeries(model, granularity),
      ]),
    )
  }

  getFoundation(): ForecastDataFoundation {
    return cloneFoundation(this.foundation)
  }

  getHistoricalPeriodIds(): string[] {
    return [...this.foundation.history.periodIds]
  }

  getBaselinePeriodIds(): string[] {
    return [...this.foundation.history.baselinePeriodIds]
  }

  findSource(
    id: ForecastSourceId,
  ): ForecastSourceProfile | undefined {
    const source = this.foundation.sources.find(
      (candidate) => candidate.id === id,
    )

    return source
      ? cloneSource(source)
      : undefined
  }

  findCapability(
    id: ForecastCapabilityId,
  ): ForecastCapabilityProfile | undefined {
    const capability = this.foundation.capabilities.find(
      (candidate) => candidate.id === id,
    )

    return capability
      ? cloneCapability(capability)
      : undefined
  }

  findGranularity(
    granularity: ForecastGranularity,
  ): ForecastGranularityProfile | undefined {
    const profile = this.foundation.granularities.find(
      (candidate) => candidate.granularity === granularity,
    )

    return profile
      ? cloneGranularity(profile)
      : undefined
  }

  getSeries(
    granularity: ForecastGranularity,
  ): ForecastSeries[] {
    return (
      this.seriesByGranularity.get(granularity) ?? []
    ).map(cloneSeries)
  }

  findSeries(
    granularity: Exclude<ForecastGranularity, 'portfolio'>,
    entityId: string,
  ): ForecastSeries | undefined {
    const normalizedEntityId = entityId
      .trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

    const series = (
      this.seriesByGranularity.get(granularity) ?? []
    ).find(
      (candidate) => candidate.entityId === normalizedEntityId,
    )

    return series
      ? cloneSeries(series)
      : undefined
  }

  getQualityIssues(): ForecastQualityIssue[] {
    return this.foundation.quality.issues.map(cloneIssue)
  }
}
