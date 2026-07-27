import {
  AlertTriangle,
  Lightbulb,
  Sparkles,
} from 'lucide-react'

import type {
  ExecutiveBrief,
} from '../../../core/business/executiveBrief'

import {
  ExecutiveBriefHeader,
} from './ExecutiveBriefHeader'

import {
  ExecutiveBriefItem,
} from './ExecutiveBriefItem'

import {
  ExecutiveBriefSection,
} from './ExecutiveBriefSection'

import {
  ExecutiveRecommendationCard,
} from './ExecutiveRecommendationCard'

interface ExecutiveBriefCardProps {
  brief: ExecutiveBrief
  className?: string
}

export function ExecutiveBriefCard({
  brief,
  className = '',
}: ExecutiveBriefCardProps) {
  const [primaryRecommendation, ...otherRecommendations] =
    brief.recommendations

  return (
    <section
      aria-labelledby={`${brief.id}-title`}
      className={[
        'space-y-5',
        className,
      ].join(' ')}
      data-atlas-component="executive-brief-card"
    >
      <div id={`${brief.id}-title`}>
        <ExecutiveBriefHeader
          generatedAt={brief.generatedAt}
          periodId={brief.periodId}
          summary={brief.summary}
          title={brief.title}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ExecutiveBriefSection
          count={brief.highlights.length}
          description="Señales relevantes del periodo"
          icon={<Sparkles size={18} />}
          title="Highlights"
        >
          {brief.highlights.map((item) => (
            <ExecutiveBriefItem
              item={item}
              key={item.id}
            />
          ))}
        </ExecutiveBriefSection>

        <ExecutiveBriefSection
          count={brief.risks.length}
          description="Condiciones que requieren vigilancia"
          icon={<AlertTriangle size={18} />}
          title="Riesgos"
        >
          {brief.risks.map((item) => (
            <ExecutiveBriefItem
              item={item}
              key={item.id}
              showExplanation
            />
          ))}
        </ExecutiveBriefSection>

        <ExecutiveBriefSection
          count={brief.opportunities.length}
          description="Palancas con potencial comercial"
          icon={<Lightbulb size={18} />}
          title="Oportunidades"
        >
          {brief.opportunities.map((item) => (
            <ExecutiveBriefItem
              item={item}
              key={item.id}
              showExplanation
            />
          ))}
        </ExecutiveBriefSection>
      </div>

      {primaryRecommendation && (
        <div className="space-y-4">
          <ExecutiveRecommendationCard
            featured
            recommendation={primaryRecommendation}
          />

          {otherRecommendations.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {otherRecommendations.map((recommendation) => (
                <ExecutiveRecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
