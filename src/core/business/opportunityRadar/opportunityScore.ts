import type {
  OpportunityPriority,
  OpportunityScoreInput,
} from './opportunityTypes'

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value))
}

export function calculateOpportunityScore(
  input: OpportunityScoreInput,
): number {
  const score =
    clamp(input.impact) * 0.35 +
    clamp(input.urgency) * 0.25 +
    clamp(input.probability) * 0.2 +
    clamp(input.coverage) * 0.1 +
    clamp(input.risk) * 0.1

  return Math.round(score)
}

export function classifyOpportunityPriority(
  score: number,
): OpportunityPriority {
  if (score >= 85) {
    return 'critical'
  }

  if (score >= 70) {
    return 'high'
  }

  if (score >= 50) {
    return 'medium'
  }

  return 'low'
}
