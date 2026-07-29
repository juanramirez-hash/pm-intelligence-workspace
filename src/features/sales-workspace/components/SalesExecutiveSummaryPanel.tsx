import {
  ArrowRight,
  FileBarChart,
  Sparkles,
} from 'lucide-react'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  SalesExecutiveFindingTone,
  SalesExecutiveSummary,
} from '../types'

interface SalesExecutiveSummaryPanelProps {
  summary: SalesExecutiveSummary
}

const toneClasses: Record<
  SalesExecutiveFindingTone,
  string
> = {
  positive:
    'border-emerald-200 bg-emerald-50 text-emerald-900',
  attention:
    'border-amber-200 bg-amber-50 text-amber-950',
  critical:
    'border-rose-200 bg-rose-50 text-rose-950',
  neutral:
    'border-slate-200 bg-slate-50 text-slate-900',
}

export function SalesExecutiveSummaryPanel({
  summary,
}: SalesExecutiveSummaryPanelProps) {
  return (
    <section
      data-atlas-component="sales-executive-summary-panel"
      data-print-section="executive-summary"
    >
      <ExecutivePanel
        icon={<FileBarChart size={19} />}
        subtitle={summary.filterContext}
        title={summary.title}
      >
        {!summary.available ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            {summary.overview}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  <Sparkles size={15} />
                  Lectura del periodo
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {summary.overview}
                </p>
              </article>

              <article className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                  <ArrowRight size={15} />
                  Perspectiva de cierre
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {summary.outlook}
                </p>
              </article>
            </div>

            {summary.findings.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summary.findings.map(
                  (finding) => (
                    <article
                      className={[
                        'rounded-2xl border p-4',
                        toneClasses[finding.tone],
                      ].join(' ')}
                      key={finding.id}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
                        {finding.label}
                      </p>

                      <p className="mt-2 text-lg font-semibold tracking-tight">
                        {finding.value}
                      </p>

                      <p className="mt-2 text-xs leading-5 opacity-80">
                        {finding.detail}
                      </p>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </ExecutivePanel>
    </section>
  )
}
