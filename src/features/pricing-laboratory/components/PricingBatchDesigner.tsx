import {
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
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
  evaluatePriceBatchDesign,
} from '../../../core/business/pricing/priceBatchDesignEngine'

import type {
  PriceBatchDesignResult,
} from '../../../core/business/pricing/priceBatchDesignContracts'

import type {
  PriceDesignObjectiveType,
} from '../../../core/business/pricing/priceDesignContracts'

import {
  buildPricingBatchDesignExport,
} from '../export/buildPricingBatchDesignExport'

import {
  downloadPricingBatchDesignExport,
} from '../export/downloadPricingBatchDesignExport'

import {
  printPricingBatchDesign,
} from '../export/printPricingBatchDesign'

import {
  buildPriceBatchDesignInputFromDraft,
  createEmptyPricingBatchDesignDraft,
  createEmptyPricingBatchProductDraft,
  parsePricingBatchProductsText,
  PRICE_BATCH_COMMON_FACTOR_STRATEGIES,
  priceBatchCommonFactorStrategyLabel,
} from '../state/pricingBatchDesignDraft'

import {
  PRICE_DESIGN_OBJECTIVE_TYPES,
  priceDesignObjectiveLabel,
  priceDesignObjectiveUnit,
} from '../state/pricingNewProductDesignDraft'

import type {
  PricingBatchDesignDraft,
  PricingBatchProductDraft,
} from '../state/pricingBatchDesignDraft'

import {
  formatPricingFactor,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils/pricingLaboratoryFormatters'

import {
  PricingBatchSensitivityAnalyzer,
} from './PricingBatchSensitivityAnalyzer'

import {
  PricingTierLadderAnalyzer,
} from './PricingTierLadderAnalyzer'

import {
  PricingPortfolioMixAnalyzer,
} from './PricingPortfolioMixAnalyzer'

function updateDraftField<K extends keyof PricingBatchDesignDraft>(
  draft: PricingBatchDesignDraft,
  key: K,
  value: PricingBatchDesignDraft[K],
): PricingBatchDesignDraft {
  return {
    ...draft,
    [key]: value,
  }
}

function updateProductField<K extends keyof PricingBatchProductDraft>(
  product: PricingBatchProductDraft,
  key: K,
  value: PricingBatchProductDraft[K],
): PricingBatchProductDraft {
  return {
    ...product,
    [key]: value,
  }
}

function objectivePlaceholder(
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

function productLabel(
  product: PricingBatchProductDraft,
  index: number,
): string {
  return product.model.trim() ||
    product.sku.trim() ||
    `Producto ${index + 1}`
}

export function PricingBatchDesigner() {
  const [draft, setDraft] = useState(
    createEmptyPricingBatchDesignDraft,
  )
  const [pasteValue, setPasteValue] = useState('')
  const [result, setResult] = useState<PriceBatchDesignResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [sequence, setSequence] = useState(1)
  const [productSequence, setProductSequence] = useState(2)
  const [isExporting, setIsExporting] = useState(false)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  const updateProduct = <K extends keyof PricingBatchProductDraft>(
    key: string,
    field: K,
    value: PricingBatchProductDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      products: current.products.map((product) => product.key === key
        ? updateProductField(product, field, value)
        : product),
    }))
    setResult(null)
    setActionStatus(null)
  }

  const addProduct = () => {
    setDraft((current) => ({
      ...current,
      products: [
        ...current.products,
        createEmptyPricingBatchProductDraft(productSequence),
      ],
    }))
    setProductSequence((current) => current + 1)
    setResult(null)
    setActionStatus(null)
  }

  const removeProduct = (key: string) => {
    setDraft((current) => ({
      ...current,
      products: current.products.filter((product) => product.key !== key),
    }))
    setResult(null)
    setActionStatus(null)
  }

  const importPastedProducts = () => {
    const parsed = parsePricingBatchProductsText(
      pasteValue,
      productSequence,
    )

    if (parsed.products.length === 0) {
      setErrors(parsed.errors.length > 0
        ? parsed.errors
        : ['No se detectaron productos para importar.'])
      return
    }

    setDraft((current) => {
      const onlyEmptyRow = current.products.length === 1 &&
        !current.products[0]?.model.trim() &&
        !current.products[0]?.sku.trim() &&
        !current.products[0]?.cost.trim() &&
        !current.products[0]?.notes.trim()

      return {
        ...current,
        products: onlyEmptyRow
          ? parsed.products
          : [...current.products, ...parsed.products],
      }
    })
    setProductSequence((current) => current + parsed.products.length)
    setPasteValue('')
    setErrors(parsed.errors)
    setResult(null)
    setActionStatus(
      `${parsed.products.length.toLocaleString('es-MX')} productos agregados desde el bloque pegado.`,
    )
  }

  const calculateBatch = () => {
    const draftResult = buildPriceBatchDesignInputFromDraft(
      draft,
      sequence,
    )

    if (!draftResult.valid || !draftResult.input) {
      setErrors(draftResult.errors)
      setResult(null)
      setActionStatus(null)
      return
    }

    const nextResult = evaluatePriceBatchDesign(draftResult.input)

    if (!nextResult.available) {
      setErrors(nextResult.issues.map((item) => item.message))
      setResult(nextResult)
      setActionStatus(null)
      return
    }

    setResult(nextResult)
    setErrors([])
    setActionStatus('Matriz calculada en memoria. Ningún precio fue creado o modificado.')
    setSequence((current) => current + 1)
  }

  const exportBatch = async () => {
    if (!result?.available || isExporting) {
      return
    }

    setIsExporting(true)
    setActionStatus(null)

    try {
      const payload = buildPricingBatchDesignExport(result)
      await downloadPricingBatchDesignExport(payload)
      setActionStatus(`Exportación generada: ${payload.fileName}`)
    } catch {
      setActionStatus('No fue posible generar la exportación de la matriz.')
    } finally {
      setIsExporting(false)
    }
  }

  const printBatch = () => {
    if (!result?.available) {
      return
    }

    try {
      printPricingBatchDesign(result)
      setActionStatus('Vista imprimible generada. Usa la opción Guardar como PDF del navegador.')
    } catch {
      setActionStatus('No fue posible abrir la vista imprimible. Revisa el bloqueo de ventanas emergentes.')
    }
  }

  const resetBatch = () => {
    setDraft(createEmptyPricingBatchDesignDraft())
    setPasteValue('')
    setResult(null)
    setErrors([])
    setSequence(1)
    setProductSequence(2)
    setIsExporting(false)
    setActionStatus(null)
  }

  const currency = result?.input.currency ?? draft.currency.trim().toLocaleUpperCase('es-MX')

  return (
    <div data-pricing-component="batch-designer">
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Layers3 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Matriz por lote de nueva marca
              </p>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
                Captura varios modelos y costos, evalúa uno o más descuentos y determina un factor de lista común sin requerir catálogo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2" data-pricing-print-hidden="true">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              onClick={resetBatch}
              type="button"
            >
              <RotateCcw size={15} />
              Reiniciar lote
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!result?.available || isExporting}
              onClick={exportBatch}
              type="button"
            >
              <FileSpreadsheet size={15} />
              {isExporting ? 'Exportando…' : 'Exportar Excel'}
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!result?.available}
              onClick={printBatch}
              type="button"
            >
              <Printer size={15} />
              Imprimir / PDF
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Marca nueva o provisional
            </span>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              onChange={(event) => {
                setDraft((current) => updateDraftField(current, 'brandName', event.target.value))
                setResult(null)
              }}
              placeholder="Ej. Nueva Marca"
              type="text"
              value={draft.brandName}
            />
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Moneda común
            </span>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm uppercase outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              onChange={(event) => {
                setDraft((current) => updateDraftField(current, 'currency', event.target.value))
                setResult(null)
              }}
              placeholder="MXN o USD"
              type="text"
              value={draft.currency}
            />
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Descuentos a evaluar
            </span>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              onChange={(event) => {
                setDraft((current) => updateDraftField(current, 'discountRates', event.target.value))
                setResult(null)
              }}
              placeholder="32, 34, 37"
              type="text"
              value={draft.discountRates}
            />
            <span className="mt-1 block text-[11px] text-slate-500">
              Separados por coma, punto y coma o espacio.
            </span>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Estrategia de factor común
            </span>
            <select
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              onChange={(event) => {
                setDraft((current) => updateDraftField(
                  current,
                  'commonFactorStrategy',
                  event.target.value as PricingBatchDesignDraft['commonFactorStrategy'],
                ))
                setResult(null)
              }}
              value={draft.commonFactorStrategy}
            >
              {PRICE_BATCH_COMMON_FACTOR_STRATEGIES.map((strategy) => (
                <option key={strategy} value={strategy}>
                  {priceBatchCommonFactorStrategyLabel(strategy)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)_minmax(0,0.55fr)]">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Objetivo común
            </span>
            <select
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  objectiveType: event.target.value as PriceDesignObjectiveType,
                  objectiveValue: '',
                }))
                setResult(null)
              }}
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
              Valor del objetivo
            </span>
            <div className="mt-2 flex items-center gap-2">
              <input
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                inputMode="decimal"
                onChange={(event) => {
                  setDraft((current) => updateDraftField(current, 'objectiveValue', event.target.value))
                  setResult(null)
                }}
                placeholder={objectivePlaceholder(draft.objectiveType)}
                type="number"
                value={draft.objectiveValue}
              />
              <span className="text-xs font-semibold text-slate-500">
                {priceDesignObjectiveUnit(draft.objectiveType)}
              </span>
            </div>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Factor común explícito
            </span>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
              disabled={draft.commonFactorStrategy !== 'explicit'}
              inputMode="decimal"
              onChange={(event) => {
                setDraft((current) => updateDraftField(current, 'explicitCommonFactor', event.target.value))
                setResult(null)
              }}
              placeholder="Ej. 2.15"
              type="number"
              value={draft.explicitCommonFactor}
            />
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]" data-pricing-print-hidden="true">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ClipboardPaste size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Pegado rápido desde Excel
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Orden recomendado: Modelo, SKU, Costo, Notas. También acepta Modelo y Costo.
              </p>
            </div>
          </div>
          <textarea
            className="mt-4 min-h-36 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            onChange={(event) => setPasteValue(event.target.value)}
            placeholder={'MODELO-01\tSKU-01\t100\nMODELO-02\tSKU-02\t200'}
            value={pasteValue}
          />
          <button
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
            onClick={importPastedProducts}
            type="button"
          >
            <ClipboardPaste size={15} />
            Agregar filas pegadas
          </button>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Productos y costos
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Cada fila es temporal y no crea un SKU en Product Master.
              </p>
            </div>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-700"
              onClick={addProduct}
              type="button"
            >
              <Plus size={14} />
              Agregar producto
            </button>
          </div>

          <div className="max-h-[28rem] overflow-auto">
            <table className="min-w-[760px] w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Modelo</th>
                  <th className="px-3 py-3 font-semibold">SKU</th>
                  <th className="px-3 py-3 font-semibold">Costo</th>
                  <th className="px-3 py-3 font-semibold">Notas</th>
                  <th className="px-3 py-3 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {draft.products.map((product, index) => (
                  <tr key={product.key}>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Modelo ${index + 1}`}
                        className="h-9 w-full rounded-lg border border-slate-200 px-2 outline-none focus:border-violet-300"
                        onChange={(event) => updateProduct(product.key, 'model', event.target.value)}
                        placeholder={`Modelo ${index + 1}`}
                        type="text"
                        value={product.model}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`SKU ${index + 1}`}
                        className="h-9 w-full rounded-lg border border-slate-200 px-2 outline-none focus:border-violet-300"
                        onChange={(event) => updateProduct(product.key, 'sku', event.target.value)}
                        placeholder="Opcional"
                        type="text"
                        value={product.sku}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Costo ${productLabel(product, index)}`}
                        className="h-9 w-full rounded-lg border border-slate-200 px-2 outline-none focus:border-violet-300"
                        inputMode="decimal"
                        min="0"
                        onChange={(event) => updateProduct(product.key, 'cost', event.target.value)}
                        placeholder="0.00"
                        step="any"
                        type="number"
                        value={product.cost}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Notas ${index + 1}`}
                        className="h-9 w-full rounded-lg border border-slate-200 px-2 outline-none focus:border-violet-300"
                        onChange={(event) => updateProduct(product.key, 'notes', event.target.value)}
                        placeholder="Opcional"
                        type="text"
                        value={product.notes}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        aria-label={`Quitar ${productLabel(product, index)}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => removeProduct(product.key)}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {errors.length > 0 && (
        <div className="mt-5 grid gap-2" data-pricing-print-hidden="true">
          {errors.map((error) => (
            <div
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
              key={error}
            >
              <AlertTriangle className="mt-0.5 shrink-0" size={15} />
              {error}
            </div>
          ))}
        </div>
      )}

      {actionStatus && (
        <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-700" data-pricing-print-hidden="true">
          {actionStatus}
        </div>
      )}

      <div className="mt-5 flex justify-end" data-pricing-print-hidden="true">
        <button
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800"
          onClick={calculateBatch}
          type="button"
        >
          <Layers3 size={17} />
          Calcular matriz por lote
        </button>
      </div>

      {result?.available && (
        <div className="mt-6" data-pricing-batch-result="true">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800">
            SIMULACIÓN SIN EFECTO COMERCIAL
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Factor común</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{formatPricingFactor(result.commonListFactor)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Productos</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{result.summary.productCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Descuentos</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{result.summary.discountCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Cumplen objetivo</p>
              <p className="mt-2 text-xl font-bold text-emerald-800">{result.summary.meetsObjectiveCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">Debajo objetivo</p>
              <p className="mt-2 text-xl font-bold text-amber-800">{result.summary.belowObjectiveCount}</p>
            </div>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Resumen agregado por descuento</p>
              <p className="mt-1 text-xs text-slate-500">Los totales consideran una unidad de cada producto.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Descuento</th>
                    <th className="px-4 py-3 font-semibold">Costo agregado</th>
                    <th className="px-4 py-3 font-semibold">Lista agregada</th>
                    <th className="px-4 py-3 font-semibold">Venta agregada</th>
                    <th className="px-4 py-3 font-semibold">GP agregado</th>
                    <th className="px-4 py-3 font-semibold">Margen agregado</th>
                    <th className="px-4 py-3 font-semibold">Debajo objetivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.discountSummaries.map((summary) => (
                    <tr key={summary.discountRate}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatPricingPercentage(summary.discountRate)}</td>
                      <td className="px-4 py-3">{formatPricingMoney(summary.totalCost, currency)}</td>
                      <td className="px-4 py-3">{formatPricingMoney(summary.totalListPrice, currency)}</td>
                      <td className="px-4 py-3">{formatPricingMoney(summary.totalSellingPrice, currency)}</td>
                      <td className="px-4 py-3">{formatPricingMoney(summary.totalGrossProfit, currency)}</td>
                      <td className="px-4 py-3">{formatPricingPercentage(summary.grossMargin)}</td>
                      <td className="px-4 py-3">{summary.belowObjectiveCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Matriz detallada</p>
              <p className="mt-1 text-xs text-slate-500">Compara el factor individual requerido contra el factor común aplicado a toda la marca.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1320px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Modelo</th>
                    <th className="px-4 py-3 font-semibold">Costo</th>
                    <th className="px-4 py-3 font-semibold">Descuento</th>
                    <th className="px-4 py-3 font-semibold">Factor requerido</th>
                    <th className="px-4 py-3 font-semibold">Factor común</th>
                    <th className="px-4 py-3 font-semibold">Δ factor</th>
                    <th className="px-4 py-3 font-semibold">Lista común</th>
                    <th className="px-4 py-3 font-semibold">Venta neta</th>
                    <th className="px-4 py-3 font-semibold">Factor neto</th>
                    <th className="px-4 py-3 font-semibold">GP</th>
                    <th className="px-4 py-3 font-semibold">Margen</th>
                    <th className="px-4 py-3 font-semibold">Cumplimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.rows.map((row) => {
                    const metrics = row.commonFactorDesign?.metrics
                    const meets = row.compliance === 'meets_objective'

                    return (
                      <tr key={row.key}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{row.product.model ?? row.product.id}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{row.product.sku ?? 'Sin SKU'}</p>
                        </td>
                        <td className="px-4 py-3">{formatPricingMoney(row.product.cost, currency)}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(row.discountRate)}</td>
                        <td className="px-4 py-3 font-semibold">{formatPricingFactor(row.requiredListFactor)}</td>
                        <td className="px-4 py-3 font-semibold">{formatPricingFactor(row.commonListFactor)}</td>
                        <td className="px-4 py-3">{formatPricingFactor(row.factorDelta)}</td>
                        <td className="px-4 py-3">{formatPricingMoney(metrics?.listPrice, currency)}</td>
                        <td className="px-4 py-3">{formatPricingMoney(metrics?.sellingPrice, currency)}</td>
                        <td className="px-4 py-3">{formatPricingFactor(metrics?.sellingPriceFactor)}</td>
                        <td className="px-4 py-3">{formatPricingMoney(metrics?.grossProfit, currency)}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(metrics?.grossMargin)}</td>
                        <td className="px-4 py-3">
                          <span className={[
                            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
                            meets
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800',
                          ].join(' ')}>
                            {meets ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                            {meets ? 'Cumple' : 'Revisar'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <PricingBatchSensitivityAnalyzer
            key={result.input.id}
            source={result}
          />

          <PricingTierLadderAnalyzer
            key={`${result.input.id}::tier-ladder`}
            source={result}
          />

          <PricingPortfolioMixAnalyzer
            key={`${result.input.id}::portfolio-mix`}
            source={result}
          />

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

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={17} />
          Frontera de la matriz por lote
        </div>
        <p className="mt-2 text-xs leading-5">
          La matriz no crea productos, marcas, costos, listas, grupos ni precios. Tampoco escribe en Product Master, Data Center, Business Repository, IndexedDB u otros Workspaces.
        </p>
      </div>
    </div>
  )
}
