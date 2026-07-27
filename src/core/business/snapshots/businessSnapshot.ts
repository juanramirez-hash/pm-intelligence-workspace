import type {
  BusinessTargetAttainment,
} from '../attainment'

export type BusinessSnapshotEntityType =
  'brand'

export interface BusinessBrandSnapshotIdentity {
  id: string
  name: string
}

export interface BusinessBrandSnapshotActuals {
  revenue: number
  grossProfit: number
  grossMargin: number | null
  quantity: number
  documents: number
  customers: number
  products: number
  averageTicket: number | null
}

export interface BusinessBrandSnapshotTarget {
  revenue: number | null
  grossProfit: number | null
  grossMargin: number | null
  workingDays: number | null
}

/**
 * Immutable, presentation-agnostic view of one brand in one business period.
 *
 * The snapshot consolidates facts, declared targets and derived attainment so
 * consumers do not need to coordinate Repository, Cube and Attainment calls.
 */
export interface BusinessBrandSnapshot {
  id: string
  entityType: BusinessSnapshotEntityType
  generatedAt: string

  brand: BusinessBrandSnapshotIdentity
  periodId: string

  hasActual: boolean
  hasTarget: boolean

  actuals: BusinessBrandSnapshotActuals
  target: BusinessBrandSnapshotTarget
  attainment: BusinessTargetAttainment
}
