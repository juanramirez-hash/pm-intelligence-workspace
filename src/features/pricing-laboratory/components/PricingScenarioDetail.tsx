import {
  AlertCircle,
  CheckCircle2,
  Info,
  LockKeyhole,
  ShieldAlert,
} from 'lucide-react'

import type {
  PriceEngineeringGuardrail,
  PriceEngineeringSignal,
} from '../../../core/business/pricing'

import type {
  PricingLaboratoryWorkspaceScenarioRow,
} from '../types'

import {
  formatPricingBasis,
  formatPricingFactor,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils'

export interface PricingScenarioDetailProps {
  scenario: PricingLaboratoryWorkspaceScenarioRow | null
  currency: string | null
}

function guardrailLabel(
  guardrail: PriceEngineeringGuardrail,
  currency: string | null,
): string {
  switch (guardrail.type) {
    case 'minimum_gross_margin':
      return `Margen mínimo ${formatPricingPercentage(guardrail.threshold)}`
    case 'minimum_gross_profit':
      return `GP mínimo ${formatPricingMoney(guardrail.threshold, currency)}`
    case 'minimum_selling_price':
      return `Precio mínimo ${formatPricingMoney(guardrail.threshold, currency)}`
    case 'maximum_selling_price':
      return `Precio máximo ${formatPricingMoney(guardrail.threshold, currency)}`
    case 'maximum_discount_rate':
      return `Descuento máximo ${formatPricingPercentage(guardrail.threshold)}`
  }
}

function signalPresentation(signal: PriceEngineeringSignal) {
  if (signal.severity === 'blocking') {
    return {
      icon: <ShieldAlert size={15} />,
      className: 'border-orange-200 bg-orange-50 text-orange-800',
      label: 'Bloqueante',
    }
  }

  if (signal.severity === 'invalid') {
    return {
      icon: <AlertCircle size={15} />,
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      label: 'Inválido',
    }
  }

  if (signal.severity === 'warning') {
    return {
      icon: <AlertCircle size={15} />,
      className: 'border-amber-200 bg-amber-50 text-amber-800',
      label: 'Advertencia',
    }
  }

  return {
    icon: <Info size={15} />,
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    label: 'Información',
  }
}

export function PricingScenarioDetail({
  scenario,
  currency,
}: PricingScenarioDetailProps) {
  if (!scenario) {
    return (
      <div
        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center"
        data-pricing-component="scenario-detail-empty"
      >
        <Info className="mx-auto text-slate-400" size={24} />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          Selecciona una comparación
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          El detalle muestra métricas, guardrails y explicación; no declara un precio recomendado.
        </p>
      </div>
    )
  }

  return (
    <div data-pricing-component="scenario-detail">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
            Escenario seleccionado
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            {scenario.name}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {formatPricingBasis(scenario.basis, currency)}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
          <LockKeyhole size={14} />
          Solo simulación
        </div>
      </div>

      {scenario.metrics ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Precio</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {formatPricingMoney(scenario.metrics.sellingPrice, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Descuento</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {formatPricingPercentage(scenario.metrics.discountRate)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GP unitario</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {formatPricingMoney(scenario.metrics.grossProfit, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Margen</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {formatPricingPercentage(scenario.metrics.grossMargin)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Factor venta</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {formatPricingFactor(scenario.metrics.sellingPriceFactor)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Banda de margen</p>
            <p className="mt-2 text-xl font-semibold capitalize text-slate-950">
              {scenario.metrics.marginBand.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          La configuración se conserva para trazabilidad, pero no produjo métricas válidas.
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={17} />
            <h4 className="text-sm font-semibold text-slate-900">
              Guardrails aplicados
            </h4>
          </div>

          {scenario.resolvedGuardrails.length > 0 ? (
            <div className="mt-3 space-y-2">
              {scenario.resolvedGuardrails.map((guardrail, index) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                  key={`${guardrail.type}-${index}`}
                >
                  <span className="text-slate-700">
                    {guardrailLabel(guardrail, currency)}
                  </span>
                  <span className={[
                    'rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
                    guardrail.severity === 'blocking'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-amber-100 text-amber-800',
                  ].join(' ')}>
                    {guardrail.severity === 'blocking' ? 'Bloqueante' : 'Aviso'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
              El escenario no contiene guardrails numéricos.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="text-slate-500" size={17} />
            <h4 className="text-sm font-semibold text-slate-900">
              Señales del motor
            </h4>
          </div>

          {scenario.signals.length > 0 ? (
            <div className="mt-3 space-y-2">
              {scenario.signals.map((signal, index) => {
                const presentation = signalPresentation(signal)

                return (
                  <div
                    className={[
                      'rounded-xl border p-3 text-sm',
                      presentation.className,
                    ].join(' ')}
                    key={`${signal.code}-${index}`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {presentation.icon}
                      {presentation.label}
                    </div>
                    <p className="mt-1 text-xs leading-5">
                      {signal.message}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
              Sin señales para los límites capturados.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h4 className="text-sm font-semibold text-slate-900">
          Explicación determinística
        </h4>
        <ol className="mt-3 space-y-2">
          {scenario.explainability.map((item, index) => (
            <li
              className="flex gap-3 text-sm leading-6 text-slate-600"
              key={`${index}-${item}`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
