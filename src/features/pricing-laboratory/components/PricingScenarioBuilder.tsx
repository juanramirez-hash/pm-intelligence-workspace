import {
  AlertTriangle,
  FlaskConical,
  Plus,
  ShieldCheck,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import {
  findPricingLaboratoryTemplateDefinition,
  getStandardPricingLaboratoryTemplates,
} from '../../../core/business/pricing'

import type {
  PriceEngineeringScenarioBasisType,
  PricingLaboratoryTemplateInput,
  StandardPricingLaboratoryTemplateId,
} from '../../../core/business/pricing'

import {
  basisTypeLabel,
  basisTypeUnit,
  buildPricingLaboratoryTemplateFromDraft,
  createEmptyPricingLaboratoryScenarioDraft,
  PRICING_LABORATORY_BASIS_TYPES,
} from '../state'

import type {
  PricingLaboratoryGuardrailDraftKey,
  PricingLaboratoryScenarioDraft,
  PricingLaboratoryScenarioScope,
} from '../state'

export interface PricingScenarioBuilderProps {
  scope: PricingLaboratoryScenarioScope | null
  sequence: number
  onCreate: (input: PricingLaboratoryTemplateInput) => void
}

interface GuardrailFieldDefinition {
  key: PricingLaboratoryGuardrailDraftKey
  label: string
  placeholder: string
  suffix: string
}

const GUARDRAIL_FIELDS: readonly GuardrailFieldDefinition[] = [
  {
    key: 'minimumGrossMargin',
    label: 'Margen mínimo',
    placeholder: 'Ej. 24',
    suffix: '%',
  },
  {
    key: 'minimumGrossProfit',
    label: 'GP mínimo',
    placeholder: 'Ej. 50',
    suffix: '$',
  },
  {
    key: 'minimumSellingPrice',
    label: 'Precio mínimo',
    placeholder: 'Ej. 350',
    suffix: '$',
  },
  {
    key: 'maximumSellingPrice',
    label: 'Precio máximo',
    placeholder: 'Opcional',
    suffix: '$',
  },
  {
    key: 'maximumDiscountRate',
    label: 'Descuento máximo',
    placeholder: 'Ej. 48',
    suffix: '%',
  },
]

function updateDraftField<K extends keyof PricingLaboratoryScenarioDraft>(
  draft: PricingLaboratoryScenarioDraft,
  key: K,
  value: PricingLaboratoryScenarioDraft[K],
): PricingLaboratoryScenarioDraft {
  return {
    ...draft,
    [key]: value,
  }
}

export function PricingScenarioBuilder({
  scope,
  sequence,
  onCreate,
}: PricingScenarioBuilderProps) {
  const [draft, setDraft] = useState(
    createEmptyPricingLaboratoryScenarioDraft,
  )
  const [errors, setErrors] = useState<string[]>([])
  const definitions = useMemo(
    () => getStandardPricingLaboratoryTemplates(),
    [],
  )
  const selectedDefinition = useMemo(
    () => findPricingLaboratoryTemplateDefinition(draft.templateId),
    [draft.templateId],
  )

  const handleTemplateChange = (
    templateId: StandardPricingLaboratoryTemplateId,
  ) => {
    const definition = findPricingLaboratoryTemplateDefinition(templateId)
    const suggestedBasis = definition?.suggestedBasisTypes[0] ?? 'selling_price'

    setDraft((current) => ({
      ...current,
      templateId,
      basisType: suggestedBasis,
      basisValue: '',
    }))
    setErrors([])
  }

  const handleSubmit = () => {
    const result = buildPricingLaboratoryTemplateFromDraft(
      draft,
      sequence,
      scope,
    )

    if (!result.valid || !result.input) {
      setErrors(result.errors)
      return
    }

    onCreate(result.input)
    setDraft(createEmptyPricingLaboratoryScenarioDraft())
    setErrors([])
  }

  return (
    <div data-pricing-component="scenario-builder">
      <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <FlaskConical size={19} />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Constructor temporal
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Cada escenario requiere un valor explícito. Agregarlo solo incorpora una comparación en memoria.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
            htmlFor="pricing-template"
          >
            Plantilla
          </label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            id="pricing-template"
            onChange={(event) => handleTemplateChange(
              event.target.value as StandardPricingLaboratoryTemplateId,
            )}
            value={draft.templateId}
          >
            {definitions.map((definition) => (
              <option key={definition.id} value={definition.id}>
                {definition.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
            htmlFor="pricing-scenario-name"
          >
            Nombre del escenario
          </label>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            id="pricing-scenario-name"
            onChange={(event) => setDraft((current) =>
              updateDraftField(current, 'name', event.target.value)
            )}
            placeholder={`${selectedDefinition?.label ?? 'Escenario'} ${sequence}`}
            type="text"
            value={draft.name}
          />
        </div>

        <div>
          <label
            className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
            htmlFor="pricing-basis-type"
          >
            Base de cálculo
          </label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            id="pricing-basis-type"
            onChange={(event) => setDraft((current) => ({
              ...current,
              basisType: event.target.value as PriceEngineeringScenarioBasisType,
              basisValue: '',
            }))}
            value={draft.basisType}
          >
            {PRICING_LABORATORY_BASIS_TYPES.map((type) => (
              <option key={type} value={type}>
                {basisTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
            htmlFor="pricing-basis-value"
          >
            Valor explícito · {basisTypeUnit(draft.basisType)}
          </label>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            id="pricing-basis-value"
            inputMode="decimal"
            min="0"
            onChange={(event) => setDraft((current) =>
              updateDraftField(current, 'basisValue', event.target.value)
            )}
            placeholder={
              draft.basisType === 'selling_price_factor'
                ? 'Ej. 1.65'
                : draft.basisType === 'selling_price' ||
                    draft.basisType === 'target_gross_profit'
                  ? 'Captura importe'
                  : 'Captura porcentaje'
            }
            step="any"
            type="number"
            value={draft.basisValue}
          />
        </div>
      </div>

      {draft.basisType === 'additional_discount' && (
        <div className="mt-4">
          <label
            className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
            htmlFor="pricing-additional-discount-base"
          >
            Aplicar descuento adicional sobre
          </label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            id="pricing-additional-discount-base"
            onChange={(event) => setDraft((current) => ({
              ...current,
              additionalDiscountBase: event.target.value as PricingLaboratoryScenarioDraft['additionalDiscountBase'],
            }))}
            value={draft.additionalDiscountBase}
          >
            <option value="current_selling_price">Precio vigente</option>
            <option value="list_price">Precio de lista</option>
          </select>
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-slate-500" size={17} />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Guardrails opcionales
              </p>
              <p className="text-xs text-slate-500">
                Los campos vacíos no generan reglas.
              </p>
            </div>
          </div>

          <select
            aria-label="Severidad de guardrails"
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            onChange={(event) => setDraft((current) => ({
              ...current,
              guardrails: {
                ...current.guardrails,
                severity: event.target.value as PricingLaboratoryScenarioDraft['guardrails']['severity'],
              },
            }))}
            value={draft.guardrails.severity}
          >
            <option value="warning">Advertencia</option>
            <option value="blocking">Bloqueante</option>
          </select>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {GUARDRAIL_FIELDS.map((field) => (
            <label
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              key={field.key}
            >
              <span className="text-xs font-semibold text-slate-600">
                {field.label}
              </span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    guardrails: {
                      ...current.guardrails,
                      [field.key]: event.target.value,
                    },
                  }))}
                  placeholder={field.placeholder}
                  step="any"
                  type="number"
                  value={draft.guardrails[field.key]}
                />
                <span className="text-xs font-semibold text-slate-400">
                  {field.suffix}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label
          className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
          htmlFor="pricing-scenario-notes"
        >
          Notas de simulación
        </label>
        <textarea
          className="mt-2 min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          id="pricing-scenario-notes"
          onChange={(event) => setDraft((current) =>
            updateDraftField(current, 'notes', event.target.value)
          )}
          placeholder="Contexto temporal, cliente, proyecto o supuesto analizado."
          value={draft.notes}
        />
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <ul className="space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <button
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!scope}
        onClick={handleSubmit}
        type="button"
      >
        <Plus size={17} />
        Agregar escenario temporal
      </button>

      <p className="mt-3 text-center text-[11px] leading-4 text-slate-500">
        El escenario se elimina al recargar o salir de la sesión. No publica ni guarda precios.
      </p>
    </div>
  )
}
