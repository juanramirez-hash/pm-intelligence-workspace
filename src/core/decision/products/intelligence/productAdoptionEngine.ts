import type { BusinessProduct } from '../../../business/entities/product'
import type { ProductAdoptionModel } from './productIntelligenceTypes'

function daysBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null
  return Math.max(0, Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000))
}

export function evaluateProductAdoption(product: BusinessProduct, dataPeriodEnd: string | null): ProductAdoptionModel {
  const applies = product.commercialStatus === 'E'
  const daysSinceFirstSale = daysBetween(product.firstSale, dataPeriodEnd)
  const score = applies
    ? Math.min(100, Math.round(product.customers.size * 8 + product.activePeriods.size * 7 + product.locations.size * 5))
    : 0

  return {
    applies,
    daysSinceFirstSale,
    activePeriods: product.activePeriods.size,
    accumulatedCustomers: product.customers.size,
    activeLocations: product.locations.size,
    adoptionScore: score,
    label: !applies ? 'No aplica' : score >= 70 ? 'Adopción acelerada' : score >= 40 ? 'Adopción en desarrollo' : 'Adopción inicial',
    recommendation: !applies
      ? 'El producto ya no se evalúa como lanzamiento.'
      : score >= 70
        ? 'Consolidar disponibilidad y preparar transición hacia estatus D.'
        : 'Aumentar demostraciones, clientes iniciales y cobertura por sucursal.',
    confidence: applies ? 86 : 100,
  }
}
