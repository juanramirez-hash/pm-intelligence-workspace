/**
 * Public facade for the Business Core.
 *
 * Workspaces should consume contracts from this entry point or from one of
 * the documented module entry points. Internal implementation files are not
 * part of the stable API.
 */
export * from './attainment'
export * from './builders'
export * from './cube'
export * from './formatting'
export * from './health'
export * from './metrics'
export * from './models'
export * from './narrative'
export * from './quality'
export * from './repository'
export * from './reconciliation'
export * from './snapshots'
export * from './targets'

export {
  ExecutiveBriefEngine,
  buildExecutiveBrief,
  buildExecutiveBriefHighlights,
  buildExecutiveBriefOpportunities,
  buildExecutiveBriefRecommendations,
  buildExecutiveBriefRisks,
} from './executiveBrief'

export type {
  ExecutiveBrief,
  ExecutiveBriefCategory,
  ExecutiveBriefContext,
  ExecutiveBriefEvidence,
  ExecutiveBriefExplanation,
  ExecutiveBriefHealth,
  ExecutiveBriefItem,
  ExecutiveBriefSeverity,
} from './executiveBrief'


export {
  OpportunityEngine,
  buildCoverageOpportunity,
  buildGrowthOpportunity,
  buildOpportunityRadar,
  buildPortfolioOpportunity,
  buildRecoveryOpportunity,
  calculateOpportunityScore,
  classifyOpportunityPriority,
  createOpportunityExplanation,
} from './opportunityRadar'

export type {
  BusinessOpportunity,
  OpportunityEvidence,
  OpportunityExplanation,
  OpportunityPriority,
  OpportunityRadar,
  OpportunityRadarContext,
  OpportunityRuleContext,
  OpportunityScoreInput,
  OpportunityType,
} from './opportunityRadar'
