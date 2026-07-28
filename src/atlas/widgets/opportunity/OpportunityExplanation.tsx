import {
  ChevronDown,
  Database,
} from 'lucide-react'

import type {
  OpportunityExplanation as OpportunityExplanationModel,
} from '../../../core/business/opportunityRadar'

interface OpportunityExplanationProps {
  explanation: OpportunityExplanationModel
}

export function OpportunityExplanation({
  explanation,
}: OpportunityExplanationProps) {
  return (
    <details
      className="group rounded-2xl border border-slate-200 bg-slate-50/70 open:bg-white"
      data-atlas-component="opportunity-explanation"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-colors hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <Database size={15} />
          ¿Por qué aparece aquí?
        </span>

        <ChevronDown
          className="transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          size={16}
        />
      </summary>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Regla aplicada
          </span>
          <code className="rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
            {explanation.ruleId}
          </code>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {explanation.rationale}
        </p>

        {explanation.evidence.length > 0 && (
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {explanation.evidence.map((evidence) => (
              <div
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                key={`${evidence.label}-${evidence.value}`}
              >
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {evidence.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {evidence.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </details>
  )
}
