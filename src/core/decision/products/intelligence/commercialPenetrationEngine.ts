import { commercialStatusLabel, penetrationInterpretation, penetrationScore } from '../productDecisionRules'
import type { ProductCommercialStatus } from '../productDecisionTypes'
import type { ProductCommercialPenetration } from './productIntelligenceTypes'

export function evaluateCommercialPenetration(status: ProductCommercialStatus): ProductCommercialPenetration {
  const recommendations: Record<ProductCommercialStatus, string> = {
    A: 'Proteger disponibilidad, precio y continuidad del producto.',
    B: 'Expandir cobertura en clientes similares para avanzar a A.',
    C: 'Incrementar cobertura comercial, bundles y capacitación.',
    D: 'Definir clientes objetivo y validar propuesta de valor.',
    E: 'Acelerar adopción y medir primeros clientes y recompra.',
    unclassified: 'Completar la clasificación comercial ABCDE.',
  }

  return {
    status,
    label: commercialStatusLabel(status),
    interpretation: penetrationInterpretation(status),
    score: penetrationScore(status),
    recommendation: recommendations[status],
    confidence: status === 'unclassified' ? 45 : 95,
    isNewProduct: status === 'E',
  }
}
