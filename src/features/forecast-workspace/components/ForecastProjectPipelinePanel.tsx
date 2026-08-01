import type {
  ProjectAwareForecastProjectContribution,
} from '../../../core/business/forecast'

import {
  formatForecastCurrency,
  formatForecastDate,
  formatForecastPercentage,
} from '../utils/forecastWorkspaceFormatters'

export interface ForecastProjectPipelinePanelProps {
  contributions: readonly ProjectAwareForecastProjectContribution[]
}

const statusStyles: Record<
  ProjectAwareForecastProjectContribution['contributionStatus'],
  string
> = {
  included: 'bg-emerald-50 text-emerald-700',
  upside: 'bg-sky-50 text-sky-700',
  blocked: 'bg-rose-50 text-rose-700',
  excluded: 'bg-slate-100 text-slate-600',
}

const statusLabels: Record<
  ProjectAwareForecastProjectContribution['contributionStatus'],
  string
> = {
  included: 'Incluido',
  upside: 'Upside',
  blocked: 'Bloqueado',
  excluded: 'Excluido',
}

export function ForecastProjectPipelinePanel({
  contributions,
}: ForecastProjectPipelinePanelProps) {
  if (contributions.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center"
        data-forecast-component="project-pipeline"
      >
        <p className="text-sm font-semibold text-slate-700">
          No hay proyectos que coincidan con el periodo y filtros activos.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Revisa fecha estimada de facturación, marca o búsqueda.
        </p>
      </div>
    )
  }

  return (
    <div
      className="overflow-x-auto"
      data-forecast-component="project-pipeline"
      data-forecast-print-table="true"
    >
      <table className="min-w-[1180px] w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Proyecto</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Status</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Tratamiento</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Facturación estimada</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Monto origen</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Tipo de cambio</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Monto MXN</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Ponderado</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">GP estimado</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Calidad</th>
          </tr>
        </thead>
        <tbody>
          {contributions.map((project) => (
            <tr key={project.id}>
              <td className="border-b border-slate-100 px-3 py-4">
                <div className="font-semibold text-slate-900">
                  {project.projectName}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {project.projectId} · {project.brandId ?? 'Sin marca'}
                </div>
              </td>
              <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                {project.statusCode} · {project.statusLabel}
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[project.contributionStatus]}`}>
                  {statusLabels[project.contributionStatus]}
                </span>
              </td>
              <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                {formatForecastDate(project.estimatedBillingDate)}
              </td>
              <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                {project.sourceAmount === null
                  ? '—'
                  : `${project.sourceCurrency ?? '—'} ${project.sourceAmount.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`}
              </td>
              <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                {project.exchangeRate === null
                  ? '—'
                  : project.exchangeRate.toLocaleString('es-MX', { maximumFractionDigits: 4 })}
              </td>
              <td className="border-b border-slate-100 px-3 py-4 font-semibold text-slate-900">
                {formatForecastCurrency(project.convertedAmountMxn, true)}
              </td>
              <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                <div>{formatForecastCurrency(project.weightedAmountMxn, true)}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Prob. {formatForecastPercentage(project.closingProbability)}
                </div>
              </td>
              <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                <div>{formatForecastCurrency(project.estimatedGrossProfitMxn, true)}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Margen {formatForecastPercentage(project.estimatedGrossMargin)}
                </div>
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                {project.issueCodes.length === 0 ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    Sin incidencias
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {project.issueCodes.map((code) => (
                      <span
                        className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700"
                        key={code}
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
