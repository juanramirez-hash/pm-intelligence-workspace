import {
  ArrowRight,
  BrainCircuit,
  ChartNoAxesCombined,
  PackageSearch,
  Percent,
  UserRoundSearch,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AtlasCard } from '../components/AtlasCard'
import { StatusBadge } from '../components/StatusBadge'
import { SectionHeader } from '../layout/SectionHeader'

import type {
  PulseRecommendation,
  RecommendationCategory,
  RecommendationSeverity,
} from '../../features/pulse/rules/pulseRules'

type AIRecommendationsCardProps = {
  recommendations: PulseRecommendation[]
  maxItems?: number
  onOpen?: (recommendation: PulseRecommendation) => void
}

const categoryIcons: Record<RecommendationCategory, LucideIcon> = {
  forecast: ChartNoAxesCombined,
  inventory: PackageSearch,
  pricing: Percent,
  sales: ChartNoAxesCombined,
  customers: UserRoundSearch,
}

const severityConfig: Record<
  RecommendationSeverity,
  {
    badgeTone: 'danger' | 'warning' | 'neutral' | 'success'
    label: string
    iconClassName: string
  }
> = {
  critical: {
    badgeTone: 'danger',
    label: 'Prioridad crítica',
    iconClassName: 'bg-red-50 text-red-600',
  },
  high: {
    badgeTone: 'warning',
    label: 'Prioridad alta',
    iconClassName: 'bg-amber-50 text-amber-600',
  },
  medium: {
    badgeTone: 'neutral',
    label: 'Prioridad media',
    iconClassName: 'bg-slate-100 text-slate-600',
  },
  low: {
    badgeTone: 'success',
    label: 'Oportunidad',
    iconClassName: 'bg-emerald-50 text-emerald-600',
  },
}

export function AIRecommendationsCard({
  recommendations,
  maxItems = 3,
  onOpen,
}: AIRecommendationsCardProps) {
  const visibleRecommendations = recommendations.slice(0, maxItems)

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Recomendaciones inteligentes"
        description="Acciones generadas por el motor de reglas de negocio."
        action={
          <div className="flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            <BrainCircuit size={15} />
            Motor de reglas
          </div>
        }
      />

      {visibleRecommendations.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="font-semibold text-slate-900">
            No se detectaron acciones prioritarias
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Los indicadores evaluados permanecen dentro de los parámetros definidos.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {visibleRecommendations.map((recommendation) => {
            const Icon = categoryIcons[recommendation.category]
            const severity = severityConfig[recommendation.severity]

            return (
              <article
                key={recommendation.id}
                className="flex min-h-[320px] flex-col rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={[
                      'flex size-11 items-center justify-center rounded-2xl',
                      severity.iconClassName,
                    ].join(' ')}
                  >
                    <Icon size={21} />
                  </div>

                  <StatusBadge tone={severity.badgeTone}>
                    {severity.label}
                  </StatusBadge>
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Priority Score {recommendation.priorityScore}/100
                </p>

                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  {recommendation.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {recommendation.description}
                </p>

                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Acción recomendada
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {recommendation.action}
                  </p>
                </div>

                <div className="mt-auto pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Impacto esperado
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {recommendation.expectedImpact}
                  </p>

                  <button
                    type="button"
                    onClick={() => onOpen?.(recommendation)}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Ver análisis
                    <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </AtlasCard>
  )
}