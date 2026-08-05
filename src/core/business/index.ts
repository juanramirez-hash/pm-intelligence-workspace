/**
 * Public facade for the Business Core.
 *
 * Workspaces should consume contracts from this entry point or from one of
 * the documented module entry points. Internal implementation files are not
 * part of the stable API.
 */
export * from './analytics/inventory'
export * from './attainment'
export * from './builders'
export * from './cube'
export * from './formatting'
export * from './forecast'
export * from './health'
export * from './metrics'
export * from './models'
export * from './narrative'
export * from './quality'
export * from './pricing'
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

export type { BusinessInventoryPosition, BusinessInventoryIdentityStatus } from './entities/inventoryPosition'
export type { BusinessInventorySnapshot } from './entities/inventorySnapshot'
export { buildBusinessInventory } from './builders/buildBusinessInventory'
export type { BusinessInventoryBuildResult } from './builders/buildBusinessInventory'

export type { BusinessProject } from './entities/project'
export type {
  BusinessProjectBillingDocument,
  BusinessProjectBillingLine,
} from './entities/projectBilling'

export type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
  BusinessPurchaseOrderLineType,
} from './entities/purchaseOrder'

export type {
  BusinessPurchaseRequest,
} from './entities/purchaseRequest'

export type { BusinessExchangeRate } from './entities/exchangeRate'


export type {
  BusinessSalesTransactionDocument,
  BusinessSalesTransactionLine,
} from './entities/salesTransaction'

export type {
  BusinessPrice,
  BusinessPriceMarginBand,
  BusinessPricingQualityCode,
  BusinessPricingQualityIssue,
  BusinessPriceScenario,
  BusinessPriceScenarioKind,
  BusinessPriceSource,
  BusinessPricingQualitySeverity,
  BusinessPricingSummary,
  StandardPricingGroupId,
} from './entities/price'

export {
  STANDARD_PRICING_GROUP_IDS,
} from './entities/price'
