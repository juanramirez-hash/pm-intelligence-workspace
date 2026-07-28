import type {
  LucideIcon,
} from 'lucide-react'

import {
  ArrowUpRight,
  BadgeDollarSign,
  CircleGauge,
  PackageSearch,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundSearch,
} from 'lucide-react'

import type {
  SalesCommercialOpportunity,
  SalesCommercialOpportunityPriority,
  SalesCommercialOpportunitySummary,
  SalesCommercialOpportunityType,
} from '../types'

import {
  formatSalesCurrency,
} from '../utils'

const priorityLabel:
Record<SalesCommercialOpportunityPriority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const priorityClasses:
Record<SalesCommercialOpportunityPriority, string> = {
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  medium: 'border-sky-200 bg-sky-50 text-sky-700',
  low: 'border-slate-200 bg-slate-50 text-slate-600',
}

const typePresentation:
Record<
  SalesCommercialOpportunityType,
  {
    label: string
    icon: LucideIcon
    classes: string
  }
> = {
  'target-gap': {
    label: 'Brecha de cuota',
    icon: Target,
    classes: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  'customer-recovery': {
    label: 'Recuperación',
    icon: UserRoundSearch,
    classes: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  'customer-growth': {
    label: 'Cliente potencial',
    icon: TrendingUp,
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  'product-growth': {
    label: 'Producto potencial',
    icon: PackageSearch,
    classes: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  'margin-protection': {
    label: 'Protección de margen',
    icon: ShieldAlert,
    classes: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
}

interface SalesCommercialOpportunityPanelProps {
  summary: SalesCommercialOpportunitySummary
  onSelect?: (
    opportunity: SalesCommercialOpportunity,
  ) => void
}

function OpportunityCard({
  opportunity,
  rank,
  onSelect,
}: {
  opportunity: SalesCommercialOpportunity
  rank: number
  onSelect?: (
    opportunity: SalesCommercialOpportunity,
  ) => void
}) {
  const presentation =
    typePresentation[opportunity.type]

  const Icon = presentation.icon

  const actionable =
    Boolean(
      onSelect &&
      opportunity.entityId &&
      opportunity.entityType !== 'workspace',
    )

  return (
    <article
      className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)]"
      data-atlas-component="sales-commercial-opportunity-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
            {rank}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
                  presentation.classes,
                ].join(' ')}
              >
                <Icon size={14} />
                {presentation.label}
              </span>

              <span
                className={[
                  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                  priorityClasses[opportunity.priority],
                ].join(' ')}
              >
                Prioridad {priorityLabel[opportunity.priority]}
              </span>
            </div>

            <p className="mt-3 truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {opportunity.entityLabel}
            </p>

            <h3 className="mt-1 text-lg font-bold leading-6 text-slate-950">
              {opportunity.title}
            </h3>
          </div>
        </div>

        <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {opportunity.score}/100
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {opportunity.description}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {opportunity.evidence.map((evidence) => (
          <div
            className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5"
            key={`${opportunity.id}.${evidence.label}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {evidence.label}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {evidence.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-600">
          Acción recomendada
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          {opportunity.recommendedAction}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
            Impacto {formatSalesCurrency(opportunity.impact)}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
            Confianza {opportunity.confidence}%
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
            Esfuerzo {opportunity.effort}/100
          </span>
        </div>

        {actionable && (
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
            onClick={() => onSelect?.(opportunity)}
            type="button"
          >
            Abrir segmento
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>
    </article>
  )
}

export function SalesCommercialOpportunityPanel({
  summary,
  onSelect,
}: SalesCommercialOpportunityPanelProps) {
  return (
    <section
      className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-6"
      data-atlas-component="sales-commercial-opportunity-panel"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-violet-700">
            <Sparkles size={18} />
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
              Commercial Opportunity Engine
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Prioridades comerciales accionables
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Convierte brechas de cuota, cambios de clientes, tracción de productos y riesgo de margen en una lista priorizada por impacto, urgencia y probabilidad.
          </p>
        </div>

        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:min-w-[28rem] lg:grid-cols-4">
          <div className="rounded-2xl border border-violet-100 bg-white px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Impacto detectado
            </p>
            <p className="mt-1 text-base font-bold text-slate-950">
              {formatSalesCurrency(summary.totalImpact)}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Oportunidades
            </p>
            <p className="mt-1 text-base font-bold text-slate-950">
              {summary.totalCount}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Críticas / Altas
            </p>
            <p className="mt-1 text-base font-bold text-slate-950">
              {summary.criticalCount} / {summary.highCount}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Venta diaria requerida
            </p>
            <p className="mt-1 text-base font-bold text-slate-950">
              {summary.requiredDailyRevenue === null
                ? 'No evaluable'
                : formatSalesCurrency(summary.requiredDailyRevenue)}
            </p>
          </div>
        </div>
      </div>

      {!summary.available ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <CircleGauge className="mx-auto text-slate-400" size={28} />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Sin oportunidades priorizadas
          </p>
          <p className="mx-auto mt-1 max-w-2xl text-sm text-slate-500">
            {summary.unavailableReason}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {summary.opportunities.map(
            (opportunity, index) => (
              <OpportunityCard
                key={opportunity.id}
                onSelect={onSelect}
                opportunity={opportunity}
                rank={index + 1}
              />
            ),
          )}
        </div>
      )}

      {summary.available && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <BadgeDollarSign size={15} />
          <span>
            El impacto es una estimación analítica; no representa una venta garantizada.
          </span>
          <span className="hidden text-slate-300 sm:inline">•</span>
          <span>
            La variación se calcula contra el periodo comparable activo.
          </span>
        </div>
      )}
    </section>
  )
}
