import { lifecycleLabel, resolveLifecycle } from '../productDecisionRules'
import type { ProductCommercialStatus, ProductLifecycleStage } from '../productDecisionTypes'

export function evaluateProductLifecycle(input: {
  commercialStatus: ProductCommercialStatus
  inactiveMonths: number
  revenueVariation: number | null
  activePeriods: number
}): { stage: ProductLifecycleStage; label: string; confidence: number; evidence: readonly string[] } {
  const stage = resolveLifecycle(input.commercialStatus, input.inactiveMonths, input.revenueVariation)
  const evidence = [
    `Estatus ABCDE: ${input.commercialStatus}`,
    `Meses inactivo: ${input.inactiveMonths}`,
    `Periodos activos: ${input.activePeriods}`,
    input.revenueVariation === null
      ? 'Sin variación comparable'
      : `Variación de venta: ${(input.revenueVariation * 100).toFixed(1)}%`,
  ]

  return {
    stage,
    label: lifecycleLabel(stage),
    confidence: input.commercialStatus === 'unclassified' ? 60 : 88,
    evidence,
  }
}
