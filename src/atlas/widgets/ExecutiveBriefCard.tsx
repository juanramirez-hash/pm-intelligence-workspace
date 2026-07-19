import { ArrowRight, Sparkles } from 'lucide-react'
import { AtlasCard } from '../components/AtlasCard'

type ExecutiveBriefCardProps = {
  title: string
  summary: string
  recommendation: string
}

export function ExecutiveBriefCard({
  title,
  summary,
  recommendation,
}: ExecutiveBriefCardProps) {
  return (
    <AtlasCard className="relative overflow-hidden p-8">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-100/50 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <Sparkles size={24} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
              Executive Brief
            </p>

            <h2 className="text-2xl font-bold text-slate-950">
              {title}
            </h2>
          </div>
        </div>

        <p className="max-w-4xl text-base leading-8 text-slate-600">
          {summary}
        </p>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
            Recomendación principal
          </p>

          <p className="mt-3 leading-7 text-slate-700">
            {recommendation}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Ver análisis completo
          <ArrowRight size={17} />
        </button>
      </div>
    </AtlasCard>
  )
}