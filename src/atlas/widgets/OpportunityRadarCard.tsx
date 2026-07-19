import {
  ArrowRight,
  ChartNoAxesCombined,
  CircleDollarSign,
  PackageSearch,
  Percent,
  Radar,
  UserRoundSearch,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AtlasCard } from '../components/AtlasCard'
import { StatusBadge } from '../components/StatusBadge'
import { SectionHeader } from '../layout/SectionHeader'
import type {
  BusinessOpportunity,
  OpportunityCategory,
  OpportunityConfidence,
} from '../../features/pulse/rules/opportunityRules'

type OpportunityRadarCardProps = {
  opportunities: BusinessOpportunity[]
  maxItems?: number
  onOpen?: (opportunity: BusinessOpportunity) => void
}

const categoryIcons: Record<OpportunityCategory, LucideIcon> = {
  sales: ChartNoAxesCombined,
  customers: UserRoundSearch,
  inventory: PackageSearch,
  margin: Percent,
  forecast: ChartNoAxesCombined,
}

const confidenceConfig: Record<
  OpportunityConfidence,
  {
    label: string
    tone: 'success' | 'warning' | 'neutral'
    iconClassName: string
  }
> = {
  high: {
    label: 'Alta probabilidad',
    tone: 'success',
    iconClassName: 'bg-emerald-50 text-emerald-600',
  },
  medium: {
    label: 'Probabilidad media',
    tone: 'warning',
    iconClassName: 'bg-amber-50 text-amber-600',
  },
  low: {
    label: 'Probabilidad baja',
    tone: 'neutral',
    iconClassName: 'bg-slate-100 text-slate-600',
  },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function OpportunityRadarCard({
  opportunities,
  maxItems = 3,
  onOpen,
}: OpportunityRadarCardProps) {
  const visibleOpportunities = opportunities.slice(0, maxItems)

  const totalOpportunity = visibleOpportunities.reduce(
    (total, opportunity) => total + opportunity.estimatedValue,
    0,
  )

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Opportunity Radar"
        description="Oportunidades comerciales detectadas por el motor de reglas."
        action={
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Radar size={15} />
            {formatCurrency(totalOpportunity)}
          </div>
        }
      />

      {visibleOpportunities.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="font-semibold text-slate-900">
            No se detectaron oportunidades
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Los datos actuales no activaron ninguna regla de oportunidad.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {visibleOpportunities.map((opportunity) => {
            const Icon = categoryIcons[opportunity.category]
            const confidence =
              confidenceConfig[opportunity.confidence]

            return (
              <article
                key={opportunity.id}
                className="flex min-h-[300px] flex-col rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={[
                      'flex size-11 items-center justify-center rounded-2xl',
                      confidence.iconClassName,
                    ].join(' ')}
                  >
                    <Icon size={21} />
                  </div>

                  <StatusBadge tone={confidence.tone}>
                    {confidence.label}
                  </StatusBadge>
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {opportunity.brand}
                </p>

                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  {opportunity.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {opportunity.description}
                </p>

                <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CircleDollarSign size={17} />

                    <p className="text-xs font-semibold uppercase tracking-wider">
                      Potencial estimado
                    </p>
                  </div>

                  <p className="mt-2 text-2xl font-bold text-emerald-950">
                    {formatCurrency(opportunity.estimatedValue)}
                  </p>

                  <p className="mt-1 text-sm font-medium text-emerald-700">
                    Probabilidad {opportunity.probability}%
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Acción sugerida
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {opportunity.action}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpen?.(opportunity)}
                  className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  Ver oportunidad
                  <ArrowRight size={16} />
                </button>
              </article>
            )
          })}
        </div>
      )}
    </AtlasCard>
  )
}