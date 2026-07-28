import type {
  OpportunityPriority,
  OpportunityType,
} from '../../../core/business/opportunityRadar'

export const opportunityPriorityLabel: Record<OpportunityPriority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export const opportunityPriorityClasses: Record<OpportunityPriority, string> = {
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  medium: 'border-sky-200 bg-sky-50 text-sky-700',
  low: 'border-slate-200 bg-slate-50 text-slate-600',
}

export const opportunityTypeLabel: Record<OpportunityType, string> = {
  recovery: 'Recuperación',
  growth: 'Crecimiento',
  coverage: 'Cobertura',
  portfolio: 'Portafolio',
}

export const opportunityTypeClasses: Record<OpportunityType, string> = {
  recovery: 'bg-rose-50 text-rose-700 ring-rose-200',
  growth: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  coverage: 'bg-sky-50 text-sky-700 ring-sky-200',
  portfolio: 'bg-violet-50 text-violet-700 ring-violet-200',
}
