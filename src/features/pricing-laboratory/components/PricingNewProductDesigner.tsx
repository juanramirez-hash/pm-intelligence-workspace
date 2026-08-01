import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  PackagePlus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import {
  evaluatePriceDesign,
} from '../../../core/business/pricing'

import type {
  PriceDesignObjectiveType,
  PriceDesignResult,
} from '../../../core/business/pricing'

import {
  buildPriceDesignInputFromDraft,
  createEmptyPricingNewProductDesignDraft,
  PRICE_DESIGN_OBJECTIVE_TYPES,
  priceDesignObjectiveLabel,
  priceDesignObjectiveUnit,
} from '../state'

import type {
  PricingNewProductDesignDraft,
} from '../state'

import {
  formatPricingFactor,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils'

interface PricingNewProductDesignRow {
  key: string
  result: PriceDesignResult
}

function updateDraftField<K extends keyof PricingNewProductDesignDraft>(
  draft: PricingNewProductDesignDraft,
  key: K,
  value: PricingNewProductDesignDraft[K],
): PricingNewProductDesignDraft {
  return {
    ...draft,
    [key]: value,
  }
}

function objectiveValuePlaceholder(
  type: PriceDesignObjectiveType,
): string {
  switch (type) {
    case 'target_gross_margin':
      return 'Ej. 24'
    case 'target_gross_profit':
      return 'Ej. 50'
    case 'target_selling_price':
      return 'Ej. 350'
    case 'list_price_factor':
      return 'Ej. 2.15'
    case 'selling_price_factor':
      return 'Ej. 1.42'
    case 'list_price':
      return 'Ej. 525'
  }
}

function designLabel(result: PriceDesignResult): string {
  const model = result.input.identity.model?.trim()
  const brand = result.input.identity.brandName?.trim()

  return model || brand || result.input.id
}

export function PricingNewProductDesigner() {
  const [draft, setDraft] = useState(
    createEmptyPricingNewProductDesignDraft,
  )
  const [rows, setRows] = useState<PricingNewProductDesignRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [sequence, setSequence] = useState(1)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const selected = useMemo(
    () => rows.find((row) => row.key === selectedKey) ?? rows.at(-1) ?? null,
    [rows, selectedKey],
  )

  const handleAddDesign = () => {
    const draftResult = buildPriceDesignInputFromDraft(
      draft,
      sequence,
    )

    if (!draftResult.valid || !draftResult.input) {
      setErrors(draftResult.errors)
      return
    }

    const result = evaluatePriceDesign(draftResult.input)

    if (!result.available) {
      setErrors(result.signals.map((item) => item.message))
      return
    }

    const key = result.input.id

    setRows((current) => [
      ...current,
      {
        key,
        result,
      },
    ])
    setSelectedKey(key)
    setSequence((current) => current + 1)
    setErrors([])
    setDraft((current) => ({
      ...createEmptyPricingNewProductDesignDraft(),
      brandName: current.brandName,
      model: current.model,
      sku: current.sku,
      currency: current.currency,
      cost: current.cost,
      notes: current.notes,
    }))
  }

  const handleRemove = (key: string) => {
    setRows((current) => current.filter((row) => row.key !== key))

    if (selectedKey === key) {
      setSelectedKey(null)
    }
  }

  const resetDesigner = () => {
    setDraft(createEmptyPricingNewProductDesignDraft())
    setRows([])
    setErrors([])
    setSequence(1)
    setSelectedKey(null)
  }

  const selectedResult = selected?.result ?? null
  const selectedMetrics = selectedResult?.metrics ?? null
  const selectedCurrency = selectedMetrics?.currency ?? draft.currency

  return (
    <div data-pricing-component="new-product-designer">
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <PackagePlus size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Diseño desde costo
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                No requiere que el producto, la marca o el precio existan en catálogo. Cada resultado es una simulación temporal.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Marca nueva o provisional
              </span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                onChange={(event) => setDraft((current) =>
                  updateDraftField(current, 'brandName', event.target.value)
                )}
                placeholder="Ej. Nueva Marca"
                type="text"
                value={draft.brandName}
              />
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Modelo o referencia
              </span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                onChange={(event) => setDraft((current) =>
                  updateDraftField(current, 'model', event.target.value)
                )}
                placeholder="Ej. NP-001"
                type="text"
                value={draft.model}
              />
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                SKU provisional
              </span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                onChange={(event) => setDraft((current) =>
                  updateDraftField(current, 'sku', event.target.value)
                )}
                placeholder="Opcional"
                type="text"
                value={draft.sku}
              />
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Moneda
              </span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm uppercase outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                onChange={(event) => setDraft((current) =>
                  updateDraftField(current, 'currency', event.target.value)
                )}
                placeholder="MXN o USD"
                type="text"
                value={draft.currency}
              />
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Costo unitario
              </span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                inputMode="decimal"
                min="0"
                onChange={(event) => setDraft((current) =>
                  updateDraftField(current, 'cost', event.target.value)
                )}
                placeholder="Captura el costo"
                step="any"
                type="number"
                value={draft.cost}
              />
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Descuento a evaluar
              </span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  inputMode="decimal"
                  min="0"
                  max="99.999"
                  onChange={(event) => setDraft((current) =>
                    updateDraftField(current, 'discountRate', event.target.value)
                  )}
                  placeholder="32, 34 u otro"
                  step="any"
                  type="number"
                  value={draft.discountRate}
                />
                <span className="text-sm font-semibold text-slate-400">%</span>
              </div>
            </label>
          </div>

          <div className="mt-5 border-t border-sky-100 pt-5">
            <div className="flex items-center gap-2">
              <Calculator className="text-sky-700" size={18} />
              <p className="text-sm font-semibold text-slate-900">
                ¿Qué dato conoces o deseas asegurar?
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Objetivo de cálculo
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    objectiveType: event.target.value as PriceDesignObjectiveType,
                    objectiveValue: '',
                  }))}
                  value={draft.objectiveType}
                >
                  {PRICE_DESIGN_OBJECTIVE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {priceDesignObjectiveLabel(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Valor · {priceDesignObjectiveUnit(draft.objectiveType)}
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setDraft((current) =>
                    updateDraftField(current, 'objectiveValue', event.target.value)
                  )}
                  placeholder={objectiveValuePlaceholder(draft.objectiveType)}
                  step="any"
                  type="number"
                  value={draft.objectiveValue}
                />
              </label>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Notas del diseño
            </span>
            <textarea
              className="mt-2 min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              onChange={(event) => setDraft((current) =>
                updateDraftField(current, 'notes', event.target.value)
              )}
              placeholder="Marca, familia, canal, objetivo o contexto del nuevo producto."
              value={draft.notes}
            />
          </label>

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

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              onClick={handleAddDesign}
              type="button"
            >
              <Plus size={17} />
              Calcular y agregar diseño
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={resetDesigner}
              type="button"
            >
              <RotateCcw size={17} />
              Reiniciar
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Resultado seleccionado
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Distingue factor de lista y factor neto; no representan el mismo parámetro.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={13} />
              Solo simulación
            </span>
          </div>

          {selectedMetrics && selectedResult ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Precio de lista
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatPricingMoney(selectedMetrics.listPrice, selectedCurrency)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Factor de lista
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatPricingFactor(selectedMetrics.listPriceFactor)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Venta neta
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatPricingMoney(selectedMetrics.sellingPrice, selectedCurrency)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Factor neto
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatPricingFactor(selectedMetrics.sellingPriceFactor)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Costo
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatPricingMoney(selectedMetrics.cost, selectedCurrency)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Descuento
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatPricingPercentage(selectedMetrics.discountRate)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    GP unitario
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatPricingMoney(selectedMetrics.grossProfit, selectedCurrency)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Margen
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatPricingPercentage(selectedMetrics.grossMargin)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 text-xs leading-5 text-sky-800">
                <p className="font-semibold">
                  {designLabel(selectedResult)} · {priceDesignObjectiveLabel(selectedResult.input.objective.type)}
                </p>
                <ul className="mt-2 space-y-1">
                  {selectedResult.explainability.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Captura costo, descuento y un objetivo para calcular el primer diseño.
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Matriz de diseños temporales
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Agrega 32%, 34% u otros descuentos como filas independientes para comparar parámetros.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {rows.length.toLocaleString('es-MX')} diseños
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Aún no existen diseños calculados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Diseño</th>
                  <th className="px-4 py-3 font-semibold">Costo</th>
                  <th className="px-4 py-3 font-semibold">Descuento</th>
                  <th className="px-4 py-3 font-semibold">Lista</th>
                  <th className="px-4 py-3 font-semibold">Factor lista</th>
                  <th className="px-4 py-3 font-semibold">Venta neta</th>
                  <th className="px-4 py-3 font-semibold">Factor neto</th>
                  <th className="px-4 py-3 font-semibold">GP</th>
                  <th className="px-4 py-3 font-semibold">Margen</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const metrics = row.result.metrics

                  if (!metrics) {
                    return null
                  }

                  return (
                    <tr
                      className={selected?.key === row.key
                        ? 'bg-sky-50/60'
                        : 'hover:bg-slate-50/70'}
                      key={row.key}
                    >
                      <td className="px-4 py-3">
                        <button
                          className="font-semibold text-slate-900 hover:text-sky-700"
                          onClick={() => setSelectedKey(row.key)}
                          type="button"
                        >
                          {designLabel(row.result)}
                        </button>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {priceDesignObjectiveLabel(row.result.input.objective.type)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatPricingMoney(metrics.cost, metrics.currency)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatPricingPercentage(metrics.discountRate)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatPricingMoney(metrics.listPrice, metrics.currency)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatPricingFactor(metrics.listPriceFactor)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatPricingMoney(metrics.sellingPrice, metrics.currency)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatPricingFactor(metrics.sellingPriceFactor)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatPricingMoney(metrics.grossProfit, metrics.currency)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatPricingPercentage(metrics.grossMargin)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={[
                          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
                          row.result.status === 'valid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800',
                        ].join(' ')}>
                          {row.result.status === 'valid'
                            ? <CheckCircle2 size={12} />
                            : <AlertTriangle size={12} />}
                          {row.result.status === 'valid'
                            ? 'Calculable'
                            : 'Revisar'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          aria-label={`Quitar ${designLabel(row.result)}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => handleRemove(row.key)}
                          type="button"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={17} />
          Frontera del modo Nuevo producto / marca
        </div>
        <p className="mt-2 text-xs leading-5">
          Los diseños no crean productos, marcas, listas, grupos ni precios. Tampoco escriben en Data Center, Product Master, Business Repository, IndexedDB u otros Workspaces.
        </p>
      </div>
    </div>
  )
}
