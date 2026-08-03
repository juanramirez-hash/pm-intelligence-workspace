import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Layers3,
  Plus,
  Printer,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  evaluatePriceLandedCost,
} from '../../../core/business/pricing'

import type {
  PriceBatchDesignResult,
  PriceLandedCostResult,
  PriceTierObjectiveType,
} from '../../../core/business/pricing'

import {
  buildPricingLandedCostExport,
  downloadPricingLandedCostExport,
  printPricingLandedCost,
} from '../export'

import {
  buildPriceLandedCostInputFromDraft,
  createEmptyPricingLandedCostComponentDraft,
  createEmptyPricingLandedCostDraft,
  createEmptyPricingLandedCostScenarioDraft,
  createEmptyPricingLandedCostTierDraft,
  PRICE_LANDED_COST_CALCULATION_TYPES,
  PRICE_LANDED_COST_COMPONENT_CATEGORIES,
  PRICE_LANDED_COST_LIST_PRICE_BASES,
  priceLandedCostCalculationLabel,
  priceLandedCostCalculationUnit,
  priceLandedCostCategoryLabel,
  priceLandedCostListPriceBasisLabel,
} from '../state'

import type {
  PricingLandedCostComponentDraft,
  PricingLandedCostDraft,
  PricingLandedCostScenarioDraft,
  PricingLandedCostTierDraft,
} from '../state'

import {
  formatPricingFactor,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils/pricingLaboratoryFormatters'

interface PricingLandedCostAnalyzerProps {
  source: PriceBatchDesignResult
}

function updateComponentField<K extends keyof PricingLandedCostComponentDraft>(
  component: PricingLandedCostComponentDraft,
  key: K,
  value: PricingLandedCostComponentDraft[K],
): PricingLandedCostComponentDraft {
  return {
    ...component,
    [key]: value,
  }
}

function updateScenarioField<K extends keyof PricingLandedCostScenarioDraft>(
  scenario: PricingLandedCostScenarioDraft,
  key: K,
  value: PricingLandedCostScenarioDraft[K],
): PricingLandedCostScenarioDraft {
  return {
    ...scenario,
    [key]: value,
  }
}

function updateTierField<K extends keyof PricingLandedCostTierDraft>(
  tier: PricingLandedCostTierDraft,
  key: K,
  value: PricingLandedCostTierDraft[K],
): PricingLandedCostTierDraft {
  return {
    ...tier,
    [key]: value,
  }
}

function objectiveLabel(value: PriceTierObjectiveType): string {
  switch (value) {
    case 'minimum_gross_margin': return 'Margen mínimo'
    case 'minimum_gross_profit': return 'GP unitario mínimo'
  }
}

function feasibilityLabel(value: string): string {
  switch (value) {
    case 'fully_feasible': return 'Factible'
    case 'partially_feasible': return 'Parcial'
    case 'not_feasible': return 'No factible'
    default: return 'No calculable'
  }
}

function componentDirectionLabel(value: 'add' | 'subtract'): string {
  return value === 'add' ? 'Suma al costo' : 'Resta / rebate'
}

export function PricingLandedCostAnalyzer({
  source,
}: PricingLandedCostAnalyzerProps) {
  const [draft, setDraft] = useState<PricingLandedCostDraft>(
    () => createEmptyPricingLandedCostDraft(source),
  )
  const [result, setResult] = useState<PriceLandedCostResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [sequence, setSequence] = useState(1)
  const [componentSequence, setComponentSequence] = useState(1)
  const [scenarioSequence, setScenarioSequence] = useState(2)
  const [tierSequence, setTierSequence] = useState(2)
  const [isExporting, setIsExporting] = useState(false)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  const invalidate = () => {
    setResult(null)
    setActionStatus(null)
  }

  const updateComponent = <K extends keyof PricingLandedCostComponentDraft>(
    key: string,
    field: K,
    value: PricingLandedCostComponentDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      components: current.components.map((component) => component.key === key
        ? updateComponentField(component, field, value)
        : component),
    }))
    invalidate()
  }

  const updateScenario = <K extends keyof PricingLandedCostScenarioDraft>(
    key: string,
    field: K,
    value: PricingLandedCostScenarioDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      scenarios: current.scenarios.map((scenario) => scenario.key === key
        ? updateScenarioField(scenario, field, value)
        : scenario),
    }))
    invalidate()
  }

  const updateTier = <K extends keyof PricingLandedCostTierDraft>(
    key: string,
    field: K,
    value: PricingLandedCostTierDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier) => tier.key === key
        ? updateTierField(tier, field, value)
        : tier),
    }))
    invalidate()
  }

  const addComponent = () => {
    setDraft((current) => ({
      ...current,
      components: [
        ...current.components,
        createEmptyPricingLandedCostComponentDraft(componentSequence),
      ],
    }))
    setComponentSequence((current) => current + 1)
    invalidate()
  }

  const removeComponent = (key: string) => {
    setDraft((current) => ({
      ...current,
      components: current.components.filter(
        (component) => component.key !== key,
      ),
    }))
    invalidate()
  }

  const addScenario = () => {
    setDraft((current) => ({
      ...current,
      scenarios: [
        ...current.scenarios,
        createEmptyPricingLandedCostScenarioDraft(scenarioSequence),
      ],
    }))
    setScenarioSequence((current) => current + 1)
    invalidate()
  }

  const removeScenario = (key: string) => {
    setDraft((current) => ({
      ...current,
      scenarios: current.scenarios.filter((scenario) => scenario.key !== key),
    }))
    invalidate()
  }

  const addTier = () => {
    setDraft((current) => ({
      ...current,
      tiers: [
        ...current.tiers,
        createEmptyPricingLandedCostTierDraft(tierSequence),
      ],
    }))
    setTierSequence((current) => current + 1)
    invalidate()
  }

  const removeTier = (key: string) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.filter((tier) => tier.key !== key),
    }))
    invalidate()
  }

  const toggleComponentProduct = (
    componentKey: string,
    productId: string,
  ) => {
    setDraft((current) => ({
      ...current,
      components: current.components.map((component) => {
        if (component.key !== componentKey) {
          return component
        }

        const selected = component.productIds.includes(productId)

        return {
          ...component,
          productIds: selected
            ? component.productIds.filter((id) => id !== productId)
            : [...component.productIds, productId],
        }
      }),
    }))
    invalidate()
  }

  const calculate = () => {
    const draftResult = buildPriceLandedCostInputFromDraft(
      source,
      draft,
      sequence,
    )

    if (!draftResult.valid || !draftResult.input) {
      setErrors(draftResult.errors)
      setResult(null)
      setActionStatus(null)
      return
    }

    const nextResult = evaluatePriceLandedCost(draftResult.input)

    if (!nextResult.available) {
      setErrors(nextResult.issues.map((item) => item.message))
      setResult(nextResult)
      setActionStatus(null)
      return
    }

    setResult(nextResult)
    setErrors([])
    setActionStatus(
      'Waterfall calculado en memoria. Ningún costo o precio fue registrado o modificado.',
    )
    setSequence((current) => current + 1)
  }

  const exportResult = async () => {
    if (!result?.available || isExporting) {
      return
    }

    setIsExporting(true)
    setActionStatus(null)

    try {
      const payload = buildPricingLandedCostExport(result)
      await downloadPricingLandedCostExport(payload)
      setActionStatus(`Exportación generada: ${payload.fileName}`)
    } catch {
      setActionStatus('No fue posible generar la exportación de landed cost.')
    } finally {
      setIsExporting(false)
    }
  }

  const printResult = () => {
    if (!result?.available) {
      return
    }

    try {
      printPricingLandedCost(result)
      setActionStatus('Vista imprimible abierta. Usa Imprimir o Guardar como PDF.')
    } catch {
      setActionStatus('No fue posible abrir la vista imprimible.')
    }
  }

  const reset = () => {
    setDraft(createEmptyPricingLandedCostDraft(source))
    setResult(null)
    setErrors([])
    setActionStatus(null)
    setComponentSequence(1)
    setScenarioSequence(2)
    setTierSequence(2)
  }

  const firstCell = result?.cells[0] ?? null
  const currency = result?.input.reportingCurrency || draft.reportingCurrency || source.input.currency

  return (
    <section
      className="mt-8 rounded-3xl border border-cyan-200 bg-cyan-50/40 p-5 shadow-sm"
      data-pricing-component="landed-cost-analyzer"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-800">
            <Layers3 size={19} />
            <p className="text-sm font-bold uppercase tracking-[0.12em]">
              PL-014 · Landed Cost & Price Waterfall
            </p>
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-950">
            Costo aterrizado y waterfall de precio
          </h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Construye el costo unitario desde compra, tipo de cambio, flete, seguro, arancel, aduana, logística, financiamiento y rebates. Cada componente es explícito, secuencial y temporal.
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">
          SIMULACIÓN SIN EFECTO COMERCIAL
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-slate-700">
          Moneda del costo
          <input
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                sourceCostCurrency: event.target.value,
              }))
              invalidate()
            }}
            value={draft.sourceCostCurrency}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Moneda de reporte
          <input
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                reportingCurrency: event.target.value,
              }))
              invalidate()
            }}
            value={draft.reportingCurrency}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Tipo de cambio de referencia
          <input
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            inputMode="decimal"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                referenceExchangeRate: event.target.value,
              }))
              invalidate()
            }}
            value={draft.referenceExchangeRate}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Base del precio de lista
          <select
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                listPriceBasis: event.target.value as PricingLandedCostDraft['listPriceBasis'],
              }))
              invalidate()
            }}
            value={draft.listPriceBasis}
          >
            {PRICE_LANDED_COST_LIST_PRICE_BASES.map((basis) => (
              <option key={basis} value={basis}>
                {priceLandedCostListPriceBasisLabel(basis)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Factores candidatos
          <input
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                commonListFactors: event.target.value,
              }))
              invalidate()
            }}
            placeholder="Ej. 2.10, 2.25, 2.40"
            value={draft.commonListFactors}
          />
        </label>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={17} className="text-cyan-700" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Cantidades asumidas</p>
            <p className="text-xs text-slate-500">Se usan para distribuir cargos totales y ponderar venta, costo y GP. No generan Forecast.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {source.input.products.map((product) => (
            <label className="text-xs font-semibold text-slate-700" key={product.id}>
              {product.model ?? product.sku ?? product.id}
              <input
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                inputMode="decimal"
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    quantities: {
                      ...current.quantities,
                      [product.id]: event.target.value,
                    },
                  }))
                  invalidate()
                }}
                value={draft.quantities[product.id] ?? ''}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Componentes del costo aterrizado</p>
            <p className="mt-1 text-xs text-slate-500">Se aplican en el orden visible. Un alcance vacío significa todos los productos.</p>
          </div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-800"
            onClick={addComponent}
            type="button"
          >
            <Plus size={15} />
            Agregar componente
          </button>
        </div>

        {draft.components.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">
            Sin componentes adicionales. En este estado, el costo aterrizado equivale al costo de compra convertido.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {draft.components.map((component, index) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={component.key}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                    Paso {index + 1}
                  </p>
                  <button
                    aria-label={`Eliminar componente ${index + 1}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => removeComponent(component.key)}
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <label className="text-xs font-semibold text-slate-700">
                    Etiqueta
                    <input
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      onChange={(event) => updateComponent(
                        component.key,
                        'label',
                        event.target.value,
                      )}
                      placeholder="Ej. Flete marítimo"
                      value={component.label}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Categoría
                    <select
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      onChange={(event) => updateComponent(
                        component.key,
                        'category',
                        event.target.value as PricingLandedCostComponentDraft['category'],
                      )}
                      value={component.category}
                    >
                      {PRICE_LANDED_COST_COMPONENT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {priceLandedCostCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Dirección
                    <select
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      onChange={(event) => updateComponent(
                        component.key,
                        'direction',
                        event.target.value as PricingLandedCostComponentDraft['direction'],
                      )}
                      value={component.direction}
                    >
                      <option value="add">Suma al costo</option>
                      <option value="subtract">Resta / rebate</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Base de cálculo
                    <select
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      onChange={(event) => updateComponent(
                        component.key,
                        'calculationType',
                        event.target.value as PricingLandedCostComponentDraft['calculationType'],
                      )}
                      value={component.calculationType}
                    >
                      {PRICE_LANDED_COST_CALCULATION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {priceLandedCostCalculationLabel(type)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Valor ({priceLandedCostCalculationUnit(component.calculationType)})
                    <input
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      inputMode="decimal"
                      onChange={(event) => updateComponent(
                        component.key,
                        'value',
                        event.target.value,
                      )}
                      value={component.value}
                    />
                  </label>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-700">Alcance de productos</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {source.input.products.map((product) => {
                      const checked = component.productIds.includes(product.id)

                      return (
                        <label
                          className={[
                            'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs',
                            checked
                              ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                              : 'border-slate-200 bg-white text-slate-600',
                          ].join(' ')}
                          key={product.id}
                        >
                          <input
                            checked={checked}
                            onChange={() => toggleComponentProduct(component.key, product.id)}
                            type="checkbox"
                          />
                          {product.model ?? product.sku ?? product.id}
                        </label>
                      )
                    })}
                    {component.productIds.length === 0 && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                        Todos los productos
                      </span>
                    )}
                  </div>
                </div>
                <label className="mt-4 block text-xs font-semibold text-slate-700">
                  Notas
                  <input
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    onChange={(event) => updateComponent(
                      component.key,
                      'notes',
                      event.target.value,
                    )}
                    value={component.notes}
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Escenarios de costo y componentes</p>
            <p className="mt-1 text-xs text-slate-500">El cambio de componentes ajusta la magnitud de todos los cargos y rebates, sin cambiar su base ni dirección.</p>
          </div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-800"
            onClick={addScenario}
            type="button"
          >
            <Plus size={15} />
            Agregar escenario
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {draft.scenarios.map((scenario, index) => (
            <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-2 xl:grid-cols-6" key={scenario.key}>
              <label className="text-xs font-semibold text-slate-700 xl:col-span-2">
                Escenario
                <input
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  onChange={(event) => updateScenario(
                    scenario.key,
                    'label',
                    event.target.value,
                  )}
                  value={scenario.label}
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Δ costo compra %
                <input
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  inputMode="decimal"
                  onChange={(event) => updateScenario(
                    scenario.key,
                    'purchaseCostChangePercent',
                    event.target.value,
                  )}
                  value={scenario.purchaseCostChangePercent}
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Tipo de cambio
                <input
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  inputMode="decimal"
                  onChange={(event) => updateScenario(
                    scenario.key,
                    'exchangeRate',
                    event.target.value,
                  )}
                  value={scenario.exchangeRate}
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Δ componentes %
                <input
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  inputMode="decimal"
                  onChange={(event) => updateScenario(
                    scenario.key,
                    'componentChangePercent',
                    event.target.value,
                  )}
                  value={scenario.componentChangePercent}
                />
              </label>
              <div className="flex items-end justify-end">
                <button
                  aria-label={`Eliminar escenario ${index + 1}`}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  disabled={draft.scenarios.length === 1}
                  onClick={() => removeScenario(scenario.key)}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Niveles comerciales y objetivos</p>
            <p className="mt-1 text-xs text-slate-500">Cada descuento y objetivo se captura explícitamente.</p>
          </div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-800"
            onClick={addTier}
            type="button"
          >
            <Plus size={15} />
            Agregar nivel
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {draft.tiers.map((tier, index) => (
            <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-2 xl:grid-cols-6" key={tier.key}>
              <label className="text-xs font-semibold text-slate-700 xl:col-span-2">
                Nivel
                <input
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  onChange={(event) => updateTier(
                    tier.key,
                    'label',
                    event.target.value,
                  )}
                  value={tier.label}
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Descuento %
                <input
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  inputMode="decimal"
                  onChange={(event) => updateTier(
                    tier.key,
                    'discountRate',
                    event.target.value,
                  )}
                  value={tier.discountRate}
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Tipo de objetivo
                <select
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  onChange={(event) => updateTier(
                    tier.key,
                    'objectiveType',
                    event.target.value as PriceTierObjectiveType,
                  )}
                  value={tier.objectiveType}
                >
                  <option value="minimum_gross_margin">Margen mínimo</option>
                  <option value="minimum_gross_profit">GP unitario mínimo</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                {objectiveLabel(tier.objectiveType)}
                <input
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  inputMode="decimal"
                  onChange={(event) => updateTier(
                    tier.key,
                    'objectiveValue',
                    event.target.value,
                  )}
                  value={tier.objectiveValue}
                />
              </label>
              <div className="flex items-end justify-end">
                <button
                  aria-label={`Eliminar nivel ${index + 1}`}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  disabled={draft.tiers.length === 1}
                  onClick={() => removeTier(tier.key)}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <label className="mt-5 block text-xs font-semibold text-slate-700">
        Notas y supuestos
        <textarea
          className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              notes: event.target.value,
            }))
            invalidate()
          }}
          value={draft.notes}
        />
      </label>

      {errors.length > 0 && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            Revisa los supuestos
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      {actionStatus && (
        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
          {actionStatus}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800"
          onClick={calculate}
          type="button"
        >
          <Layers3 size={16} />
          Calcular landed cost y waterfall
        </button>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
          disabled={!result?.available || isExporting}
          onClick={() => void exportResult()}
          type="button"
        >
          <FileSpreadsheet size={16} />
          {isExporting ? 'Exportando…' : 'Exportar Excel'}
        </button>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
          disabled={!result?.available}
          onClick={printResult}
          type="button"
        >
          <Printer size={16} />
          Imprimir / PDF
        </button>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
          onClick={reset}
          type="button"
        >
          <RotateCcw size={16} />
          Reiniciar
        </button>
      </div>

      {result?.available && (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Componentes</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{result.summary.componentCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Escenarios</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{result.summary.scenarioCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Combinaciones</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{result.summary.cellCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700">Escenario crítico</p>
              <p className="mt-2 text-sm font-bold text-amber-900">{result.criticalScenarioLabel ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-cyan-700">Factor máximo requerido</p>
              <p className="mt-2 text-xl font-bold text-cyan-900">{formatPricingFactor(result.summary.globalMaximumRequiredFactor)}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-violet-700">Mayor uplift landed</p>
              <p className="mt-2 text-xl font-bold text-violet-900">{formatPricingPercentage(result.summary.maximumLandedCostUpliftRate)}</p>
            </div>
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Matriz de landed cost y factibilidad</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1480px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Escenario</th>
                    <th className="px-3 py-3">Δ compra</th>
                    <th className="px-3 py-3">TC</th>
                    <th className="px-3 py-3">Δ componentes</th>
                    <th className="px-3 py-3">Factor</th>
                    <th className="px-3 py-3">Nivel</th>
                    <th className="px-3 py-3">Compra stress</th>
                    <th className="px-3 py-3">Landed cost</th>
                    <th className="px-3 py-3">Uplift</th>
                    <th className="px-3 py-3">Venta</th>
                    <th className="px-3 py-3">GP</th>
                    <th className="px-3 py-3">Margen</th>
                    <th className="px-3 py-3">Factor requerido</th>
                    <th className="px-3 py-3">Cobertura</th>
                    <th className="px-3 py-3">Factibilidad</th>
                    <th className="px-3 py-3">Limitante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.cells.map((cell) => (
                    <tr key={cell.key}>
                      <td className="px-3 py-3 font-semibold text-slate-900">{cell.scenarioLabel}</td>
                      <td className="px-3 py-3">{formatPricingPercentage(cell.purchaseCostChangeRate)}</td>
                      <td className="px-3 py-3">{cell.exchangeRate.toLocaleString('es-MX')}</td>
                      <td className="px-3 py-3">{formatPricingPercentage(cell.componentChangeRate)}</td>
                      <td className="px-3 py-3">{formatPricingFactor(cell.commonListFactor)}</td>
                      <td className="px-3 py-3">{cell.tierLabel}</td>
                      <td className="px-3 py-3">{formatPricingMoney(cell.stressedPurchaseCostTotal, currency)}</td>
                      <td className="px-3 py-3 font-semibold">{formatPricingMoney(cell.landedCostTotal, currency)}</td>
                      <td className="px-3 py-3">{formatPricingPercentage(cell.landedCostUpliftRate)}</td>
                      <td className="px-3 py-3">{formatPricingMoney(cell.totalSellingPrice, currency)}</td>
                      <td className="px-3 py-3">{formatPricingMoney(cell.totalGrossProfit, currency)}</td>
                      <td className="px-3 py-3">{formatPricingPercentage(cell.grossMargin)}</td>
                      <td className="px-3 py-3">{formatPricingFactor(cell.minimumRequiredFactor)}</td>
                      <td className="px-3 py-3">{formatPricingPercentage(cell.volumeCoverageRate)}</td>
                      <td className="px-3 py-3">
                        <span className={[
                          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
                          cell.feasibility === 'fully_feasible'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800',
                        ].join(' ')}>
                          {cell.feasibility === 'fully_feasible'
                            ? <CheckCircle2 size={12} />
                            : <AlertTriangle size={12} />}
                          {feasibilityLabel(cell.feasibility)}
                        </span>
                      </td>
                      <td className="px-3 py-3">{cell.limitingProductLabel ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {firstCell && (
            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Waterfall detallado · primera combinación</p>
                <p className="mt-1 text-xs text-slate-500">
                  {firstCell.scenarioLabel} · {formatPricingFactor(firstCell.commonListFactor)} · {firstCell.tierLabel}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[1180px] w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Producto</th>
                      <th className="px-3 py-3">Paso</th>
                      <th className="px-3 py-3">Componente</th>
                      <th className="px-3 py-3">Dirección</th>
                      <th className="px-3 py-3">Subtotal inicial</th>
                      <th className="px-3 py-3">Impacto unitario</th>
                      <th className="px-3 py-3">Subtotal final</th>
                      <th className="px-3 py-3">Impacto GP total</th>
                      <th className="px-3 py-3">Impacto margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {firstCell.products.flatMap((product) => product.waterfall.map((step) => (
                      <tr key={`${product.key}::${step.componentId}`}>
                        <td className="px-3 py-3 font-semibold">{product.product.model ?? product.product.id}</td>
                        <td className="px-3 py-3">{step.order}</td>
                        <td className="px-3 py-3">{step.componentLabel}</td>
                        <td className="px-3 py-3">{componentDirectionLabel(step.direction)}</td>
                        <td className="px-3 py-3">{formatPricingMoney(step.openingSubtotal, currency)}</td>
                        <td className="px-3 py-3">{formatPricingMoney(step.unitImpact, currency)}</td>
                        <td className="px-3 py-3">{formatPricingMoney(step.closingSubtotal, currency)}</td>
                        <td className="px-3 py-3">{formatPricingMoney(step.grossProfitImpact, currency)}</td>
                        <td className="px-3 py-3">{formatPricingPercentage(step.grossMarginImpact)}</td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs leading-5 text-sky-800">
            <p className="font-semibold">Criterio y trazabilidad</p>
            <ul className="mt-2 space-y-1">
              {result.explainability.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={16} />
          Frontera del análisis
        </div>
        <p className="mt-2">
          No registra landed cost, no consulta tipos de cambio en vivo, no modifica costos ni precios y no escribe en Product Master, Data Center, Business Repository, IndexedDB u otros Workspaces.
        </p>
      </div>
    </section>
  )
}
