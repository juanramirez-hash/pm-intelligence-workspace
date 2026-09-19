import {
  countWeekdaysInclusive,
  endOfMonth,
  resolveEquivalentWorkingDayCutoff,
  toIsoDate,
} from '../../analytics/shared/dateAnalytics'
import type { BusinessRepository } from '../../business/repository'
import type { BrandDecisionModel } from './brandDecisionTypes'

export interface BrandCommercialComparison {
  snapshots: BrandDecisionModel['currentSnapshot'][]
  ranges: Record<string, string>
  description: string
}

/** Only the commercial comparison uses these actuals; targets and pacing stay monthly. */
export function buildBrandCommercialComparison(
  repository: BusinessRepository,
  decision: BrandDecisionModel,
): BrandCommercialComparison {
  const unavailable = (description: string): BrandCommercialComparison => ({
    snapshots: [], ranges: {}, description,
  })
  const currentId = decision.currentPeriodId
  const previousId = decision.previousPeriodId
  const cutoff = repository.getDataPeriodEnd()?.slice(0, 10)
  if (!cutoff || !/^\d{4}-\d{2}-\d{2}$/.test(cutoff) ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(currentId) ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(previousId)) {
    return unavailable('No hay un corte de datos válido para comparar.')
  }
  const currentStart = `${currentId}-01`
  const previousStart = `${previousId}-01`
  const currentEnd = toIsoDate(endOfMonth(new Date(`${currentStart}T00:00:00Z`)))
  const previousEnd = toIsoDate(endOfMonth(new Date(`${previousStart}T00:00:00Z`)))
  if (cutoff < currentStart) return unavailable('El periodo seleccionado todavía no tiene corte de datos.')
  const closed = cutoff >= currentEnd
  let currentTo = closed ? currentEnd : cutoff
  let previousTo = previousEnd
  if (!closed) {
    const equivalent = resolveEquivalentWorkingDayCutoff(currentId, currentTo, previousId, previousEnd)
    if (!equivalent) return unavailable('Aún no hay días laborables para establecer un corte equivalente.')
    previousTo = equivalent
    const currentDays = countWeekdaysInclusive(currentStart, currentTo) ?? 0
    const previousDays = countWeekdaysInclusive(previousStart, previousTo) ?? 0
    // A shorter comparison month must not be compared with more working days.
    if (previousDays < currentDays) {
      const adjusted = resolveEquivalentWorkingDayCutoff(previousId, previousTo, currentId, currentEnd)
      if (!adjusted) return unavailable('No se pudo establecer un corte equivalente.')
      currentTo = adjusted
    }
  }
  const snapshots: BrandCommercialComparison['snapshots'] = []
  const ranges: Record<string, string> = {}
  for (const [snapshot, dateTo] of [
    [decision.previousSnapshot, previousTo],
    [decision.currentSnapshot, currentTo],
  ] as const) {
    if (!snapshot) continue
    const dateFrom = `${snapshot.periodId}-01`
    const total = repository.salesSegmentation.summarize({
      brandIds: [decision.brandId], periodIds: [snapshot.periodId], dateFrom, dateTo,
    })
    const monthly = repository.salesSegmentation.summarize({
      brandIds: [decision.brandId], periodIds: [snapshot.periodId],
    })
    if (monthly.rowCount === 0 && (snapshot.actuals.revenue !== 0 || snapshot.actuals.customers > 0)) {
      return unavailable('Falta detalle de ventas por fecha para comparar esta marca al mismo corte.')
    }
    snapshots.push({ ...snapshot, actuals: {
      ...snapshot.actuals,
      revenue: total.revenue, grossProfit: total.grossProfit,
      grossMargin: total.revenue !== 0 ? total.grossProfit / total.revenue : null,
      quantity: total.quantity, documents: total.documents,
      customers: total.customerCount, products: total.productCount,
    } })
    ranges[snapshot.periodId] = `${dateFrom} al ${dateTo} · ${countWeekdaysInclusive(dateFrom, dateTo) ?? 0} días laborables`
  }
  return {
    snapshots, ranges,
    description: (closed
      ? 'Mes cerrado contra mes anterior completo.'
      : 'Mismo número de días laborables (lunes a viernes, sin ajuste por feriados). Ventas incluidas dentro de las fechas indicadas.') +
      (decision.previousSnapshot ? '' : ' Sin datos del periodo anterior; variación no disponible.'),
  }
}
