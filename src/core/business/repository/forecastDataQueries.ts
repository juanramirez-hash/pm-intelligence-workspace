import type {
  BusinessDataModel,
} from '../models'

import {
  buildForecastDataFoundation,
  buildForecastSeries,
  ForecastBaselineEngine,
  ForecastInventoryIntelligenceEngine,
  ProjectAwareForecastEngine,
} from '../forecast'

import type {
  ForecastBaselineProjection,
  ForecastCapabilityId,
  ForecastCapabilityProfile,
  ForecastDataFoundation,
  ForecastCoverageStatus,
  ForecastInventoryIntelligenceReport,
  ForecastProductInventoryInsight,
  ForecastGranularity,
  ForecastGranularityProfile,
  ForecastProjectionGranularity,
  ForecastQualityIssue,
  ForecastSourceId,
  ForecastSeries,
  ForecastSourceProfile,
  ProjectAwareForecastProjectContribution,
  ProjectAwareForecastProjection,
  ProjectAwareForecastQualityIssue,
  ProjectAwareForecastQualityProfile,
  ProjectAwareForecastReport,
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

function cloneProjection(
  projection: ForecastBaselineProjection,
): ForecastBaselineProjection {
  return {
    ...projection,
    metrics: [...projection.metrics],
    actual: { ...projection.actual },
    timing: { ...projection.timing },
    historical: {
      ...projection.historical,
      periodIds: [...projection.historical.periodIds],
      lookbackPeriodIds: [...projection.historical.lookbackPeriodIds],
      average: projection.historical.average
        ? { ...projection.historical.average }
        : null,
      seasonalReference: projection.historical.seasonalReference
        ? { ...projection.historical.seasonalReference }
        : null,
    },
    methods: projection.methods.map((method) => ({
      ...method,
      values: method.values
        ? { ...method.values }
        : null,
    })),
    expected: { ...projection.expected },
    scenarios: projection.scenarios.map((scenario) => ({
      ...scenario,
      values: { ...scenario.values },
    })),
    target: { ...projection.target },
    confidence: {
      ...projection.confidence,
      signals: [...projection.confidence.signals],
      limitations: [...projection.confidence.limitations],
    },
    explainability: [...projection.explainability],
  }
}

function cloneInventoryInsight(
  insight: ForecastProductInventoryInsight,
): ForecastProductInventoryInsight {
  return {
    ...insight,
    demand: { ...insight.demand },
    inventory: { ...insight.inventory },
    coverage: { ...insight.coverage },
    catalog: { ...insight.catalog },
    replacement: insight.replacement
      ? { ...insight.replacement }
      : null,
    signals: insight.signals.map((signal) => ({
      ...signal,
      evidence: { ...signal.evidence },
    })),
    explainability: [...insight.explainability],
    limitations: [...insight.limitations],
  }
}

function cloneProjectAwareIssue(
  issue: ProjectAwareForecastQualityIssue,
): ProjectAwareForecastQualityIssue {
  return { ...issue }
}

function cloneProjectAwareQuality(
  quality: ProjectAwareForecastQualityProfile,
): ProjectAwareForecastQualityProfile {
  return {
    ...quality,
    issues: quality.issues.map(cloneProjectAwareIssue),
  }
}

function cloneProjectContribution(
  contribution: ProjectAwareForecastProjectContribution,
): ProjectAwareForecastProjectContribution {
  return {
    ...contribution,
    issueCodes: [...contribution.issueCodes],
  }
}

function cloneProjectAwareProjection(
  projection: ProjectAwareForecastProjection,
): ProjectAwareForecastProjection {
  return {
    ...projection,
    transactionalBaseline: cloneProjection(
      projection.transactionalBaseline,
    ),
    actualTotal: { ...projection.actualTotal },
    actualTransactional: { ...projection.actualTransactional },
    actualProjectBilling: { ...projection.actualProjectBilling },
    pipeline: { ...projection.pipeline },
    expected: { ...projection.expected },
    scenarios: projection.scenarios.map((scenario) => ({
      ...scenario,
      transactional: { ...scenario.transactional },
      projectBillingActual: { ...scenario.projectBillingActual },
      maturePipeline: { ...scenario.maturePipeline },
      values: { ...scenario.values },
    })),
    target: { ...projection.target },
    confidence: {
      ...projection.confidence,
      signals: [...projection.confidence.signals],
      limitations: [...projection.confidence.limitations],
    },
    quality: cloneProjectAwareQuality(projection.quality),
    projectContributions: projection.projectContributions.map(
      cloneProjectContribution,
    ),
    explainability: [...projection.explainability],
    limitations: [...projection.limitations],
  }
}

function cloneProjectAwareReport(
  report: ProjectAwareForecastReport,
): ProjectAwareForecastReport {
  return {
    ...report,
    portfolio: report.portfolio
      ? cloneProjectAwareProjection(report.portfolio)
      : null,
    brands: report.brands.map(cloneProjectAwareProjection),
    quality: cloneProjectAwareQuality(report.quality),
    explainability: [...report.explainability],
    limitations: [...report.limitations],
  }
}

function cloneInventoryIntelligenceReport(
  report: ForecastInventoryIntelligenceReport,
): ForecastInventoryIntelligenceReport {
  return {
    ...report,
    thresholds: { ...report.thresholds },
    summary: { ...report.summary },
    quality: {
      ...report.quality,
      notes: [...report.quality.notes],
    },
    items: report.items.map(cloneInventoryInsight),
  }
}

function normalizeLimit(
  limit: number,
): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 0
  }

  return Math.floor(limit)
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

  private readonly baselineEngine: ForecastBaselineEngine

  private readonly inventoryIntelligenceEngine:
    ForecastInventoryIntelligenceEngine

  private readonly projectAwareForecastEngine:
    ProjectAwareForecastEngine

  private inventoryIntelligenceCache:
    ForecastInventoryIntelligenceReport | null

  private projectAwareForecastCache:
    ProjectAwareForecastReport | null

  private readonly projectionCache:
    Map<string, ForecastBaselineProjection>

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
    this.baselineEngine = new ForecastBaselineEngine(
      model,
      this.foundation,
    )
    this.inventoryIntelligenceEngine =
      new ForecastInventoryIntelligenceEngine(model)
    this.projectAwareForecastEngine =
      new ProjectAwareForecastEngine(
        model,
        this.foundation,
      )
    this.inventoryIntelligenceCache = null
    this.projectAwareForecastCache = null
    this.projectionCache = new Map()
  }

  private projectSeries(
    series: ForecastSeries,
  ): ForecastBaselineProjection | undefined {
    const cached = this.projectionCache.get(series.id)

    if (cached) {
      return cloneProjection(cached)
    }

    const projection = this.baselineEngine.project(series)

    if (!projection) {
      return undefined
    }

    this.projectionCache.set(series.id, projection)

    return cloneProjection(projection)
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

  getPortfolioBaselineProjection():
    ForecastBaselineProjection | undefined {
    const series = this.seriesByGranularity
      .get('portfolio')?.[0]

    return series
      ? this.projectSeries(series)
      : undefined
  }

  getBaselineProjections(
    granularity: Exclude<ForecastProjectionGranularity, 'portfolio'>,
  ): ForecastBaselineProjection[] {
    return (
      this.seriesByGranularity.get(granularity) ?? []
    ).map((series) => this.projectSeries(series))
      .filter(
        (projection): projection is ForecastBaselineProjection =>
          projection !== undefined,
      )
  }

  findBaselineProjection(
    granularity: Exclude<ForecastProjectionGranularity, 'portfolio'>,
    entityId: string,
  ): ForecastBaselineProjection | undefined {
    const series = this.findSeries(granularity, entityId)

    return series
      ? this.projectSeries(series)
      : undefined
  }

  getProjectAwareReport():
    ProjectAwareForecastReport {
    if (!this.projectAwareForecastCache) {
      this.projectAwareForecastCache =
        this.projectAwareForecastEngine.build()
    }

    return cloneProjectAwareReport(
      this.projectAwareForecastCache,
    )
  }

  getProjectAwarePortfolioProjection():
    ProjectAwareForecastProjection | undefined {
    const projection = this.getProjectAwareReport().portfolio

    return projection
      ? cloneProjectAwareProjection(projection)
      : undefined
  }

  getProjectAwareBrandProjections():
    ProjectAwareForecastProjection[] {
    return this.getProjectAwareReport()
      .brands
      .map(cloneProjectAwareProjection)
  }

  findProjectAwareBrandProjection(
    brandId: string,
  ): ProjectAwareForecastProjection | undefined {
    const normalizedBrandId = brandId
      .trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

    const projection = this.getProjectAwareReport()
      .brands
      .find(
        (candidate) => candidate.entityId === normalizedBrandId,
      )

    return projection
      ? cloneProjectAwareProjection(projection)
      : undefined
  }

  getInventoryIntelligenceReport():
    ForecastInventoryIntelligenceReport {
    if (!this.inventoryIntelligenceCache) {
      this.inventoryIntelligenceCache =
        this.inventoryIntelligenceEngine.build(
          this.getBaselineProjections('product'),
        )
    }

    return cloneInventoryIntelligenceReport(
      this.inventoryIntelligenceCache,
    )
  }

  getProductInventoryInsights():
    ForecastProductInventoryInsight[] {
    return this.getInventoryIntelligenceReport().items
  }

  findProductInventoryInsight(
    productId: string,
  ): ForecastProductInventoryInsight | undefined {
    const normalizedProductId = productId
      .trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

    const insight = this.inventoryIntelligenceCache
      ? this.inventoryIntelligenceCache.items.find(
          (candidate) => candidate.productId === normalizedProductId,
        )
      : this.getInventoryIntelligenceReport().items.find(
          (candidate) => candidate.productId === normalizedProductId,
        )

    return insight
      ? cloneInventoryInsight(insight)
      : undefined
  }

  getTopInventoryIntelligence(
    limit = 10,
  ): ForecastProductInventoryInsight[] {
    return this.getInventoryIntelligenceReport()
      .items
      .filter((item) => item.priority !== 'none')
      .slice(0, normalizeLimit(limit))
  }

  findInventoryInsightsByCoverage(
    status: ForecastCoverageStatus,
  ): ForecastProductInventoryInsight[] {
    return this.getInventoryIntelligenceReport()
      .items
      .filter(
        (item) =>
          item.coverage.availableStatus === status ||
          item.coverage.supplyStatus === status,
      )
  }

  getQualityIssues(): ForecastQualityIssue[] {
    return this.foundation.quality.issues.map(cloneIssue)
  }
}
