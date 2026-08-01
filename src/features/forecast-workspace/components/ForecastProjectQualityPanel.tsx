import {
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'

import type {
  ForecastWorkspaceProjectPipeline,
} from '../types/forecastWorkspaceTypes'

import {
  formatForecastInteger,
  formatForecastPercentage,
} from '../utils/forecastWorkspaceFormatters'

export interface ForecastProjectQualityPanelProps {
  pipeline: ForecastWorkspaceProjectPipeline
}

const MAX_VISIBLE_ISSUES = 40

export function ForecastProjectQualityPanel({
  pipeline,
}: ForecastProjectQualityPanelProps) {
  const quality = pipeline.quality
  const severityOrder = {
    blocking: 0,
    warning: 1,
    information: 2,
  } as const

  const orderedIssues = [...quality.issues].sort(
    (left, right) =>
      Number(right.periodId === quality.currentPeriodId) -
        Number(left.periodId === quality.currentPeriodId) ||
      severityOrder[left.severity] - severityOrder[right.severity] ||
      (right.periodId ?? '').localeCompare(left.periodId ?? '') ||
      (left.documentNumber ?? '').localeCompare(
        right.documentNumber ?? '',
      ),
  )
  const visibleIssues = orderedIssues.slice(0, MAX_VISIBLE_ISSUES)
  const hiddenIssues = Math.max(
    0,
    orderedIssues.length - visibleIssues.length,
  )

  return (
    <div data-forecast-component="project-quality">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          {
            label: 'Cobertura periodo actual',
            value: formatForecastPercentage(quality.reconciliationCoverage),
          },
          {
            label: 'Cobertura histórica',
            value: formatForecastPercentage(
              quality.historicalReconciliationCoverage,
            ),
          },
          {
            label: 'Pendientes por corte',
            value: formatForecastInteger(quality.pendingCutoffDocuments),
          },
          {
            label: 'Bloqueos actuales',
            value: formatForecastInteger(quality.blockingIssues),
          },
          {
            label: 'Tipos de cambio faltantes',
            value: formatForecastInteger(quality.missingExchangeRates),
          },
          {
            label: 'Cobertura GP estimado',
            value: formatForecastPercentage(
              quality.grossProfitEstimateCoverage,
            ),
          },
        ].map((item) => (
          <article
            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
            key={item.label}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {item.value}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-sm leading-6 text-sky-900">
        <div className="flex items-start gap-2">
          <Info className="mt-1 shrink-0" size={16} />
          <p>
            Corte de Ventas: {quality.salesDataCutoff ?? 'sin corte'} · Corte de facturación de proyectos: {quality.projectBillingDataCutoff ?? 'sin corte'}. Los faltantes históricos reducen confianza y los documentos posteriores al corte quedan pendientes; solo las incidencias materiales del periodo actual bloquean el resultado oficial.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {quality.issues.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={17} />
            No existen incidencias de calidad para el Forecast Project-Aware.
          </div>
        ) : visibleIssues.map((issue, index) => (
          <article
            className={[
              'flex gap-3 rounded-2xl border p-4 text-sm leading-6',
              issue.severity === 'blocking'
                ? 'border-rose-100 bg-rose-50/60 text-rose-900'
                : issue.severity === 'warning'
                  ? 'border-amber-100 bg-amber-50/60 text-amber-900'
                  : 'border-sky-100 bg-sky-50/60 text-sky-900',
            ].join(' ')}
            key={`${issue.code}-${issue.projectId ?? ''}-${issue.documentNumber ?? ''}-${index}`}
          >
            <AlertTriangle className="mt-1 shrink-0" size={16} />
            <div>
              <p className="font-semibold">
                {issue.code} · {issue.severity}
              </p>
              <p>{issue.message}</p>
              <p className="mt-1 text-xs opacity-75">
                {[issue.periodId, issue.projectId, issue.documentNumber, issue.brandId]
                  .filter(Boolean)
                  .join(' · ') || 'Sin contexto adicional'}
              </p>
            </div>
          </article>
        ))}

        {hiddenIssues > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Se muestran las {visibleIssues.length} incidencias prioritarias. Las {hiddenIssues} adicionales permanecen disponibles en la exportación Excel y en la auditoría de Data Center.
          </div>
        )}
      </div>
    </div>
  )
}
