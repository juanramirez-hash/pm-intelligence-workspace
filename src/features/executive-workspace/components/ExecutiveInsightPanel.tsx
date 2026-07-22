import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from 'lucide-react'

import type {
  BusinessInsight,
} from '../../../core/insights/insightTypes'

interface Props {
  insights: BusinessInsight[]
}

function Icon({
  severity,
}: {
  severity: BusinessInsight['severity']
}) {
  switch (severity) {
    case 'success':
      return (
        <CheckCircle2
          className="text-emerald-600"
          size={20}
        />
      )

    case 'warning':
      return (
        <AlertTriangle
          className="text-amber-600"
          size={20}
        />
      )

    case 'critical':
      return (
        <XCircle
          className="text-red-600"
          size={20}
        />
      )

    default:
      return (
        <Info
          className="text-sky-600"
          size={20}
        />
      )
  }
}

export function ExecutiveInsightPanel({
  insights,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
          Inteligencia Comercial
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Insights generados automáticamente
        </h2>
      </div>

      <div className="space-y-4">
        {insights.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-500">
            No existen insights disponibles.
          </div>
        )}

        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex gap-4 rounded-xl border border-slate-200 p-5"
          >
            <Icon
              severity={insight.severity}
            />

            <div>
              <h3 className="font-semibold text-slate-900">
                {insight.title}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {insight.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}