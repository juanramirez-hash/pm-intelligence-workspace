import type { ProductCommercialStatus, ProductLifecycleStage } from './productDecisionTypes'

export function commercialStatusLabel(status: ProductCommercialStatus): string {
  return ({
    A: 'Alta penetración',
    B: 'Buena penetración',
    C: 'Baja penetración',
    D: 'Muy baja penetración',
    E: 'Producto nuevo',
    unclassified: 'Sin clasificación',
  } satisfies Record<ProductCommercialStatus, string>)[status]
}

export function penetrationInterpretation(status: ProductCommercialStatus): string {
  return ({
    A: 'Producto comprado por una base amplia de clientes.',
    B: 'Producto con buena cobertura de clientes y espacio para avanzar a A.',
    C: 'Producto comprado por una base limitada de clientes.',
    D: 'Producto comprado por muy pocos clientes; requiere desarrollo comercial.',
    E: 'Producto nuevo; no debe penalizarse por baja penetración mientras desarrolla adopción.',
    unclassified: 'No existe estatus ABCDE disponible para interpretar su penetración.',
  } satisfies Record<ProductCommercialStatus, string>)[status]
}

export function penetrationScore(status: ProductCommercialStatus): number {
  return ({ A: 100, B: 82, C: 58, D: 32, E: 70, unclassified: 50 } satisfies Record<ProductCommercialStatus, number>)[status]
}

export function resolveLifecycle(
  status: ProductCommercialStatus,
  inactiveMonths: number,
  revenueVariation: number | null,
): ProductLifecycleStage {
  if (status === 'E') return 'launch'
  if (inactiveMonths >= 2) return 'dormant'
  if (revenueVariation !== null && revenueVariation >= 0.15) return 'growth'
  if (revenueVariation !== null && revenueVariation <= -0.20) return 'declining'
  return 'mature'
}

export function lifecycleLabel(stage: ProductLifecycleStage): string {
  return ({ launch: 'Lanzamiento', growth: 'Crecimiento', mature: 'Maduro', declining: 'Declive', dormant: 'Dormido' } satisfies Record<ProductLifecycleStage, string>)[stage]
}
