import {
  AlertTriangle,
  BadgeDollarSign,
  Brain,
  Building2,
  CheckCircle2,
  CircleAlert,
  DollarSign,
  Lightbulb,
  PackageSearch,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'

export type ExecutiveBriefingSeverity =
  | 'positive'
  | 'neutral'
  | 'warning'
  | 'critical'

export type ExecutiveBriefingFindingKind =
  | 'revenue'
  | 'grossProfit'
  | 'customers'
  | 'products'
  | 'margin'
  | 'participation'

export type ExecutiveBriefingFindingTone =
  | 'positive'
  | 'neutral'
  | 'warning'
  | 'critical'

export interface ExecutiveBriefingFinding {
  kind:
    ExecutiveBriefingFindingKind

  label: string

  value: string

  detail?: string

  tone:
    ExecutiveBriefingFindingTone
}

export interface ExecutiveBriefingModel {
  severity:
    ExecutiveBriefingSeverity

  title: string

  headline: string

  summary: string

  diagnosis: string

  findings:
    ExecutiveBriefingFinding[]

  recommendations: string[]
}

interface ExecutiveBriefingProps {
  briefing:
    ExecutiveBriefingModel

  insight?: string

  priorityLabel?: string

  priorityReasons?: string[]

  className?: string
}

const severityConfig = {
  positive: {
    label: 'Saludable',

    tone:
      'border-emerald-200 bg-emerald-50 text-emerald-700',

    iconTone:
      'bg-emerald-100 text-emerald-700',

    accent:
      'bg-emerald-500',

    progress:
      'w-1/4 bg-emerald-500',

    icon:
      CheckCircle2,
  },

  neutral: {
    label: 'Estable',

    tone:
      'border-slate-200 bg-slate-50 text-slate-700',

    iconTone:
      'bg-slate-100 text-slate-700',

    accent:
      'bg-slate-400',

    progress:
      'w-2/4 bg-slate-400',

    icon:
      CircleAlert,
  },

  warning: {
    label: 'Atención',

    tone:
      'border-amber-200 bg-amber-50 text-amber-700',

    iconTone:
      'bg-amber-100 text-amber-700',

    accent:
      'bg-amber-500',

    progress:
      'w-3/4 bg-amber-500',

    icon:
      AlertTriangle,
  },

  critical: {
    label: 'Crítico',

    tone:
      'border-rose-200 bg-rose-50 text-rose-700',

    iconTone:
      'bg-rose-100 text-rose-700',

    accent:
      'bg-rose-500',

    progress:
      'w-full bg-rose-500',

    icon:
      AlertTriangle,
  },
} satisfies Record<
  ExecutiveBriefingSeverity,
  {
    label: string
    tone: string
    iconTone: string
    accent: string
    progress: string
    icon: typeof AlertTriangle
  }
>

const findingToneConfig = {
  positive:
    'border-emerald-100 bg-emerald-50/60 text-emerald-700',

  neutral:
    'border-slate-200 bg-white text-slate-700',

  warning:
    'border-amber-100 bg-amber-50/60 text-amber-700',

  critical:
    'border-rose-100 bg-rose-50/60 text-rose-700',
} satisfies Record<
  ExecutiveBriefingFindingTone,
  string
>

const findingIconConfig = {
  revenue:
    DollarSign,

  grossProfit:
    BadgeDollarSign,

  customers:
    Users,

  products:
    PackageSearch,

  margin:
    Target,

  participation:
    Building2,
} satisfies Record<
  ExecutiveBriefingFindingKind,
  typeof DollarSign
>

export function ExecutiveBriefing({
  briefing,
  insight,
  priorityLabel,
  priorityReasons = [],
  className = '',
}: ExecutiveBriefingProps) {
  const severity =
    severityConfig[
      briefing.severity
    ]

  const SeverityIcon =
    severity.icon

  const resolvedPriorityLabel =
    priorityLabel ??
    severity.label

  const resolvedInsight =
    insight ??
    briefing.diagnosis

  return (
    <section
      className={[
        'overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'h-1.5 w-full',
          severity.accent,
        ].join(' ')}
      />

      <div className="p-6 sm:p-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Brain size={23} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                Executive Briefing
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {briefing.title}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Interpretación ejecutiva del desempeño comercial de la marca.
              </p>
            </div>
          </div>

          <div
            className={[
              'inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold',
              severity.tone,
            ].join(' ')}
          >
            <SeverityIcon size={16} />

            {severity.label}
          </div>
        </header>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-6">
            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'flex size-9 items-center justify-center rounded-xl',
                    severity.iconTone,
                  ].join(' ')}
                >
                  <SeverityIcon
                    size={18}
                  />
                </div>

                <h3 className="font-semibold text-slate-950">
                  Estado general
                </h3>
              </div>

              <p className="mt-5 text-lg font-semibold leading-8 text-slate-950">
                {briefing.headline}
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {briefing.summary}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {briefing.findings.map(
                  (
                    finding,
                  ) => {
                    const FindingIcon =
                      findingIconConfig[
                        finding.kind
                      ]

                    return (
                      <article
                        className={[
                          'rounded-2xl border p-4',
                          findingToneConfig[
                            finding.tone
                          ],
                        ].join(' ')}
                        key={
                          finding.kind
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                              {finding.label}
                            </p>

                            <p className="mt-2 text-xl font-semibold text-slate-950">
                              {finding.value}
                            </p>

                            {finding.detail && (
                              <p className="mt-1 text-xs leading-5 opacity-75">
                                {finding.detail}
                              </p>
                            )}
                          </div>

                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                            <FindingIcon
                              size={17}
                            />
                          </div>
                        </div>
                      </article>
                    )
                  },
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                  <Sparkles
                    size={18}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Conclusión principal
                  </p>

                  <h3 className="mt-1 font-semibold text-slate-950">
                    Diagnóstico ejecutivo
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-700">
                {resolvedInsight}
              </p>
            </article>
          </div>

          <div className="space-y-6">
            <article className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                  <Lightbulb
                    size={18}
                  />
                </div>

                <h3 className="font-semibold text-slate-950">
                  Acciones sugeridas
                </h3>
              </div>

              <ol className="mt-5 space-y-4">
                {briefing.recommendations.map(
                  (
                    recommendation,
                    index,
                  ) => (
                    <li
                      className="flex items-start gap-3"
                      key={recommendation}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-violet-700 shadow-sm">
                        {index + 1}
                      </span>

                      <p className="text-sm leading-6 text-slate-700">
                        {recommendation}
                      </p>
                    </li>
                  ),
                )}
              </ol>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'flex size-9 items-center justify-center rounded-xl',
                    severity.iconTone,
                  ].join(' ')}
                >
                  <Target
                    size={18}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Prioridad comercial
                  </p>

                  <p className="mt-1 font-semibold text-slate-950">
                    {resolvedPriorityLabel}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={[
                    'h-full rounded-full transition-all',
                    severity.progress,
                  ].join(' ')}
                />
              </div>

              {priorityReasons.length >
                0 && (
                <ul className="mt-5 space-y-3">
                  {priorityReasons.map(
                    (
                      reason,
                    ) => (
                      <li
                        className="flex items-start gap-2.5 text-sm leading-6 text-slate-600"
                        key={reason}
                      >
                        <CheckCircle2
                          className="mt-1 shrink-0 text-slate-400"
                          size={15}
                        />

                        {reason}
                      </li>
                    ),
                  )}
                </ul>
              )}
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}