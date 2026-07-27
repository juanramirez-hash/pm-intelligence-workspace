export {
  OpportunityEngine,
} from './opportunityEngine'

export {
  buildOpportunityRadar,
} from './opportunityBuilder'

export {
  calculateOpportunityScore,
  classifyOpportunityPriority,
} from './opportunityScore'

export {
  buildCoverageOpportunity,
  buildGrowthOpportunity,
  buildPortfolioOpportunity,
  buildRecoveryOpportunity,
} from './opportunityRules'

export {
  createOpportunityExplanation,
} from './opportunityExplanation'

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
} from './opportunityTypes'
