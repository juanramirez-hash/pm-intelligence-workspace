import {
  ArrowUpRight,
} from 'lucide-react'

import type {
  ForecastWorkspaceBrandRow,
} from '../types/forecastWorkspaceTypes'

import {
  formatForecastCoverage,
  formatForecastCurrency,
  formatForecastPercentage,
} from '../utils/forecastWorkspaceFormatters'

export interface ForecastBrandTableProps {
  rows: readonly ForecastWorkspaceBrandRow[]
}

const confidenceStyles: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-rose-50 text-rose-700',
}

const confidenceLabels: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const targetStyles: Record<string, string> = {
  achieved: 'bg-emerald-50 text-emerald-700',
  ahead: 'bg-emerald-50 text-emerald-700',
  'on-track': 'bg-blue-50 text-blue-700',
  behind: 'bg-rose-50 text-rose-700',
  unavailable: 'bg-slate-100 text-slate-600',
}

export function ForecastBrandTable({
  rows,
}: ForecastBrandTableProps) {
  if (rows.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center"
        data-forecast-component="brand-table"
      >
        <p className="text-sm font-semibold text-slate-700">
          No hay marcas que coincidan con los filtros.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Ajusta búsqueda, marca o nivel de confianza.
        </p>
      </div>
    )
  }

  return (
    <div
      className="overflow-x-auto"
      data-forecast-component="brand-table"
    >
      <table className="min-w-[1080px] w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Marca</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Venta proyectada</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Objetivo</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Cumplimiento</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Confianza</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Cobertura</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Riesgo inventario</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="group" key={row.brandId}>
              <td className="border-b border-slate-100 px-3 py-4">
                <div className="font-semibold text-slate-900">{row.label}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {row.productsAnalyzed} productos analizados
                </div>
              </td>
              <td className="border-b border-slate-100 px-3 py-4 font-semibold text-slate-900">
                {formatForecastCurrency(row.projected.revenue, true)}
              </td>
              <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                {formatForecastCurrency(row.targetRevenue, true)}
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${targetStyles[row.targetStatus]}`}>
                  {formatForecastPercentage(row.targetAttainment)}
                </span>
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${confidenceStyles[row.confidenceLevel]}`}>
                  {confidenceLabels[row.confidenceLevel]} · {Math.round(row.confidenceScore)}%
                </span>
              </td>
              <td className="border-b border-slate-100 px-3 py-4 text-slate-700">
                {formatForecastCoverage(row.averageAvailableCoverageMonths)}
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {row.stockoutProducts > 0 && (
                    <span className="rounded-full bg-rose-50 px-2 py-1 font-semibold text-rose-700">
                      {row.stockoutProducts} agotados
                    </span>
                  )}
                  {row.shortageProducts > 0 && (
                    <span className="rounded-full bg-orange-50 px-2 py-1 font-semibold text-orange-700">
                      {row.shortageProducts} faltantes
                    </span>
                  )}
                  {row.excessProducts > 0 && (
                    <span className="rounded-full bg-violet-50 px-2 py-1 font-semibold text-violet-700">
                      {row.excessProducts} exceso
                    </span>
                  )}
                  {row.riskScore === 0 && (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                      Sin riesgo prioritario
                    </span>
                  )}
                </div>
              </td>
              <td className="border-b border-slate-100 px-3 py-4">
                <a
                  className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 transition hover:text-indigo-900"
                  href={row.navigation.href}
                >
                  Abrir marca
                  <ArrowUpRight size={14} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
