import type {
  BusinessDataModel,
} from '../models/businessDataModel'

import {
  buildInventoryRiskOpportunityReport,
} from '../analytics/inventory'

import type {
  InventoryActionPriority,
  InventoryOpportunitySignal,
  InventoryOpportunityType,
  InventoryRiskOpportunityReport,
  InventoryRiskSignal,
  InventoryRiskType,
} from '../analytics/inventory'

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return 0
  return Math.floor(limit)
}

function latestSnapshotDate(model: BusinessDataModel): string | null {
  return [...(model.inventorySnapshots ?? new Map()).values()]
    .map((snapshot) => snapshot.snapshotDate)
    .filter((date): date is string => Boolean(date))
    .sort((left, right) => right.localeCompare(left))[0] ?? null
}

function cloneRisk(risk: InventoryRiskSignal): InventoryRiskSignal {
  return { ...risk, evidence: { ...risk.evidence } }
}

function cloneOpportunity(
  opportunity: InventoryOpportunitySignal,
): InventoryOpportunitySignal {
  return { ...opportunity, evidence: { ...opportunity.evidence } }
}

export class InventoryRiskOpportunityQueries {
  private readonly report: InventoryRiskOpportunityReport

  constructor(model: BusinessDataModel) {
    const snapshotDate = latestSnapshotDate(model)
    this.report = buildInventoryRiskOpportunityReport(
      [...(model.inventoryPositions ?? new Map()).values()],
      snapshotDate,
    )
  }

  getReport(): InventoryRiskOpportunityReport {
    return {
      ...this.report,
      summary: { ...this.report.summary },
      risks: this.report.risks.map(cloneRisk),
      opportunities: this.report.opportunities.map(cloneOpportunity),
    }
  }

  getTopRisks(limit = 10): InventoryRiskSignal[] {
    return this.report.risks
      .slice(0, normalizeLimit(limit))
      .map(cloneRisk)
  }

  getTopOpportunities(limit = 10): InventoryOpportunitySignal[] {
    return this.report.opportunities
      .slice(0, normalizeLimit(limit))
      .map(cloneOpportunity)
  }

  findRisksByType(type: InventoryRiskType): InventoryRiskSignal[] {
    return this.report.risks
      .filter((risk) => risk.type === type)
      .map(cloneRisk)
  }

  findRisksByPriority(
    priority: InventoryActionPriority,
  ): InventoryRiskSignal[] {
    return this.report.risks
      .filter((risk) => risk.priority === priority)
      .map(cloneRisk)
  }

  findOpportunitiesByType(
    type: InventoryOpportunityType,
  ): InventoryOpportunitySignal[] {
    return this.report.opportunities
      .filter((opportunity) => opportunity.type === type)
      .map(cloneOpportunity)
  }
}
