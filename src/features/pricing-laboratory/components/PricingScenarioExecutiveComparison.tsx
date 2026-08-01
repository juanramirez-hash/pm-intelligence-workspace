import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  ShieldAlert,
} from 'lucide-react'

import type {
  PricingScenarioExecutiveComparisonModel,
  PricingScenarioExecutiveComparisonRow,
} from '../types'

import {
  formatPricingBasis,
  formatPricingDate,
  formatPricingDeltaMoney,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils'

export interface PricingScenarioExecutiveComparisonProps {
  comparison: PricingScenarioExecutiveComparisonModel
}

function statusPresentation(
  status: PricingScenarioExecutiveComparisonRow['evaluationStatus'],
) {
  switch (status) {
    case 'valid':
      return {
        label: 'Válido',
        className: 'bg-emerald-100 text-emerald-700',
        icon: <CheckCircle2 size={13} />,
      }
    case 'warning':
      return {
        label: 'Advertencia',
        className: 'bg-amber-100 text-amber-800',
        icon: <AlertTriangle size={13} />,
      }
    case 'blocked':
      return {
        label: 'Bloqueado',
        className: 'bg-orange-100 text-orange-800',
        icon: <ShieldAlert size={13} />,
      }
    case 'invalid':
      return {
        label: 'Inválido',
        className: 'bg-rose-100 text-rose-700',
        icon: <AlertTriangle size={13} />,
      }
  }
}

function deltaClassName(value: number): string {
  if (value === 0) {
    return 'text-slate-500'
  }

  return value > 0
    ? 'text-emerald-700'
    : 'text-rose-700'
}

export function PricingScenarioExecutiveComparison({
  comparison,
}: PricingScenarioExecutiveComparisonProps) {
  const source = comparison.source
  const currency = source?.currency ?? null

  return (
    <section
      data-pricing-component="executive-comparison"
      data-pricing-print-section="executive-comparison"
    >
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
        {comparison.disclaimer}
      </div>

      {source && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Generado: {formatPricingDate(comparison.generatedAt)}</span>
          <span>Vigencia fuente: {formatPricingDate(source.effectiveDate)}</span>
          <span>Referencia: {source.sourceReference ?? 'Sin referencia'}</span>
        </div>
      )}

      {comparison.issues.length > 0 && (
        <div className="mt-3 grid gap-2">
          {comparison.issues.map((issue, index) => (
            <div
              className={[
                'rounded-xl border px-3 py-2 text-xs',
                issue.severity === 'invalid'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : issue.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-sky-200 bg-sky-50 text-sky-700',
              ].join(' ')}
              key={`${issue.code}-${issue.scenarioKey ?? 'general'}-${index}`}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}

      {!source ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
          <LockKeyhole className="mx-auto text-slate-400" size={24} />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Fuente de precio pendiente
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Selecciona producto y moneda antes de preparar una comparación ejecutiva.
          </p>
        </div>
      ) : comparison.rows.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
          <FileCheck2 className="mx-auto text-slate-400" size={24} />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Sin escenarios seleccionados para el reporte
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Marca la casilla Reporte en uno o más escenarios calculables. El precio vigente se conserva como base comparativa.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Producto
              </p>
              <p className="mt-2 font-semibold text-slate-950">
                {source.model ?? source.productName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {source.brandName} · {source.currency}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Precio vigente
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {formatPricingMoney(source.metrics.sellingPrice, currency)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Hecho fuente · solo lectura
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Escenarios incluidos
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {comparison.summary.selectedRows.toLocaleString('es-MX')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Selección documental explícita
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Con alertas
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {(comparison.summary.warningRows + comparison.summary.blockedRows)
                  .toLocaleString('es-MX')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Advertencia o guardrail bloqueante
              </p>
            </div>
          </div>

          <div
            className="mt-5 overflow-x-auto"
            data-pricing-print-table="true"
          >
            <table className="min-w-[1180px] w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold">Lectura</th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold">Estado</th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold">Base</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Precio</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Δ precio</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Descuento</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">GP</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Margen</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Guardrails</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Señales</th>
                </tr>
              </thead>

              <tbody>
                <tr className="bg-slate-950 text-white">
                  <td className="border-b border-slate-800 px-3 py-3.5">
                    <div className="font-semibold">Precio vigente</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-300">
                      Base · no modificable
                    </div>
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3.5">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
                      Fuente
                    </span>
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3.5 text-xs text-slate-300">
                    Registro efectivo vigente
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3.5 text-right font-semibold">
                    {formatPricingMoney(source.metrics.sellingPrice, currency)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3.5 text-right">—</td>
                  <td className="border-b border-slate-800 px-3 py-3.5 text-right">
                    {formatPricingPercentage(source.metrics.discountRate)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3.5 text-right">
                    {formatPricingMoney(source.metrics.grossProfit, currency)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3.5 text-right">
                    {formatPricingPercentage(source.metrics.grossMargin)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3.5 text-right">—</td>
                  <td className="border-b border-slate-800 px-3 py-3.5 text-right">—</td>
                </tr>

                {comparison.rows.map((row) => {
                  const status = statusPresentation(row.evaluationStatus)

                  return (
                    <tr key={row.key}>
                      <td className="border-b border-slate-100 px-3 py-3.5 align-top">
                        <div className="font-semibold text-slate-900">
                          {row.name}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                          {row.origin === 'template'
                            ? 'Temporal de sesión'
                            : 'Almacenado · lectura'}
                          {row.pricingGroupId
                            ? ` · ${row.pricingGroupId}`
                            : ''}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3.5 align-top">
                        <span className={[
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                          status.className,
                        ].join(' ')}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="max-w-64 border-b border-slate-100 px-3 py-3.5 text-xs leading-5 text-slate-600">
                        {formatPricingBasis(row.basis, currency)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3.5 text-right font-semibold text-slate-900">
                        {formatPricingMoney(row.metrics.sellingPrice, currency)}
                      </td>
                      <td className={[
                        'border-b border-slate-100 px-3 py-3.5 text-right font-semibold',
                        deltaClassName(row.delta.sellingPrice),
                      ].join(' ')}>
                        {formatPricingDeltaMoney(row.delta.sellingPrice, currency)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3.5 text-right text-slate-700">
                        {formatPricingPercentage(row.metrics.discountRate)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3.5 text-right text-slate-700">
                        {formatPricingMoney(row.metrics.grossProfit, currency)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3.5 text-right text-slate-700">
                        {formatPricingPercentage(row.metrics.grossMargin)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3.5 text-right text-slate-700">
                        {row.guardrailSummary.total.toLocaleString('es-MX')}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3.5 text-right text-slate-700">
                        {row.signalSummary.total.toLocaleString('es-MX')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {comparison.rows.map((row) => (
              <article
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                key={`trace-${row.key}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {row.name}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {row.guardrailSummary.total} guardrails · {row.signalSummary.total} señales
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {row.explainability[0] ?? 'Sin explicación adicional.'}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
