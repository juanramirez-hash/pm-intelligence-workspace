export type BusinessPerformanceStatus =
  | 'not-evaluable'
  | 'behind-plan'
  | 'on-plan'
  | 'ahead-of-plan'
  | 'achieved'

export interface BusinessMetricAttainment {
  actual: number | null
  target: number | null
  variance: number | null
  attainment: number | null
}

export interface BusinessRevenuePace {
  workingDays: number | null
  elapsedWorkingDays: number | null
  expectedToDate: number | null
  varianceToPlan: number | null
  attainmentToPlan: number | null
  projectedPeriodEnd: number | null
  status: BusinessPerformanceStatus
}

export interface BusinessTargetAttainment {
  id: string
  brandId: string
  periodId: string

  hasActual: boolean
  hasTarget: boolean

  revenue: BusinessMetricAttainment
  grossProfit: BusinessMetricAttainment
  grossMargin: BusinessMetricAttainment
  revenuePace: BusinessRevenuePace
}
