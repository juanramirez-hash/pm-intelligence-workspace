import type {
  OpportunityExplanation,
} from './opportunityTypes'

export function createOpportunityExplanation(
  ruleId: string,
  rationale: string,
  evidence: OpportunityExplanation['evidence'],
): OpportunityExplanation {
  return {
    ruleId,
    rationale,
    evidence,
  }
}
