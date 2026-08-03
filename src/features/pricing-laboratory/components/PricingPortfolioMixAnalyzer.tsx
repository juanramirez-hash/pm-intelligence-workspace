import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
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
  evaluatePricePortfolioMix,
} from '../../../core/business/pricing'

import type {
  PriceBatchDesignResult,
  PricePortfolioMixCell,
  PricePortfolioMixResult,
} from '../../../core/business/pricing'

import {
  buildPricingPortfolioMixExport,
} from '../export/buildPricingPortfolioMixExport'

import {
  downloadPricingPortfolioMixExport,
} from '../export/downloadPricingPortfolioMixExport'

import {
  printPricingPortfolioMix,
} from '../export/printPricingPortfolioMix'

import {
  buildPricePortfolioMixInputFromDraft,
  createEmptyPricingPortfolioMixDraft,
  createEmptyPricingPortfolioMixScenarioDraft,
} from '../state/pricingPortfolioMixDraft'

import type {
  PricingPortfolioMixScenarioDraft,
} from '../state/pricingPortfolioMixDraft'

import {
  formatPricingFactor,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils/pricingLaboratoryFormatters'

export interface PricingPortfolioMixAnalyzerProps {
  source: PriceBatchDesignResult
}

function feasibilityPresentation(
  cell: PricePortfolioMixCell,
): {
  label: string
  className: string
} {
  switch (cell.feasibility) {
    case 'fully_feasible':
      return {
        label: 'Factible',
        className: 'bg-emerald-100 text-emerald-700',
      }
    case 'partially_feasible':
      return {
        label: 'Parcial',
        className: 'bg-amber-100 text-amber-800',
      }
    case 'not_feasible':
      return {
        label: 'No factible',
        className: 'bg-rose-100 text-rose-700',
      }
    case 'invalid':
      return {
        label: 'No calculable',
        className: 'bg-slate-100 text-slate-600',
      }
  }
}

function updateMixField<K extends keyof PricingPortfolioMixScenarioDraft>(
  mix: PricingPortfolioMixScenarioDraft,
  key: K,
  value: PricingPortfolioMixScenarioDraft[K],
): PricingPortfolioMixScenarioDraft {
  return {
    ...mix,
    [key]: value,
  }
}

export function PricingPortfolioMixAnalyzer({
  source,
}: PricingPortfolioMixAnalyzerProps) {
  const productIds = source.input.products.map((product) => product.id)
  const [draft, setDraft] = useState(() =>
    createEmptyPricingPortfolioMixDraft(productIds),
  )
  const [result, setResult] = useState<PricePortfolioMixResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [sequence, setSequence] = useState(1)
  const [mixSequence, setMixSequence] = useState(2)
  const [isExporting, setIsExporting] = useState(false)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  const addMix = () => {
    setDraft((current) => ({
      ...current,
      mixes: [
        ...current.mixes,
        createEmptyPricingPortfolioMixScenarioDraft(
          mixSequence,
          productIds,
        ),
      ],
    }))
    setMixSequence((current) => current + 1)
    setResult(null)
    setActionStatus(null)
  }

  const removeMix = (key: string) => {
    setDraft((current) => ({
      ...current,
      mixes: current.mixes.filter((mix) => mix.key !== key),
    }))
    setResult(null)
    setActionStatus(null)
  }

  const updateMix = <K extends keyof PricingPortfolioMixScenarioDraft>(
    key: string,
    field: K,
    value: PricingPortfolioMixScenarioDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      mixes: current.mixes.map((mix) => mix.key === key
        ? updateMixField(mix, field, value)
        : mix),
    }))
    setResult(null)
    setActionStatus(null)
  }

  const updateQuantity = (
    key: string,
    productId: string,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      mixes: current.mixes.map((mix) => mix.key === key
        ? {
          ...mix,
          quantities: {
            ...mix.quantities,
            [productId]: value,
          },
        }
        : mix),
    }))
    setResult(null)
    setActionStatus(null)
  }

  const appendFactor = (factor: number | null) => {
    if (factor === null || !Number.isFinite(factor) || factor <= 0) {
      return
    }

    setDraft((current) => ({
      ...current,
      commonListFactors: current.commonListFactors.trim()
        ? `${current.commonListFactors.trim()}, ${factor}`
        : factor.toString(),
    }))
    setResult(null)
    setErrors([])
    setActionStatus('Factor agregado explícitamente a la simulación de mezcla.')
  }

  const calculatePortfolio = () => {
    const draftResult = buildPricePortfolioMixInputFromDraft(
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

    const nextResult = evaluatePricePortfolioMix(draftResult.input)

    if (!nextResult.available) {
      setErrors(nextResult.issues.map((item) => item.message))
      setResult(nextResult)
      setActionStatus(null)
      return
    }

    setResult(nextResult)
    setErrors([])
    setActionStatus('Mezclas calculadas en memoria. No se creó Forecast, presupuesto ni precio comercial.')
    setSequence((current) => current + 1)
  }

  const exportPortfolio = async () => {
    if (!result?.available || isExporting) {
      return
    }

    setIsExporting(true)
    setActionStatus(null)

    try {
      const payload = buildPricingPortfolioMixExport(result)
      await downloadPricingPortfolioMixExport(payload)
      setActionStatus(`Exportación generada: ${payload.fileName}`)
    } catch {
      setActionStatus('No fue posible generar la exportación de la mezcla.')
    } finally {
      setIsExporting(false)
    }
  }

  const printPortfolio = () => {
    if (!result?.available) {
      return
    }

    try {
      printPricingPortfolioMix(result)
      setActionStatus('Vista imprimible generada. Usa Guardar como PDF en el navegador.')
    } catch {
      setActionStatus('No fue posible abrir la vista imprimible. Revisa el bloqueo de ventanas emergentes.')
    }
  }

  const resetPortfolio = () => {
    setDraft(createEmptyPricingPortfolioMixDraft(productIds))
    setResult(null)
    setErrors([])
    setSequence(1)
    setMixSequence(2)
    setIsExporting(false)
    setActionStatus(null)
  }

  const currency = result?.input.currency ?? source.input.currency

  return (
    <section
      className="mt-8 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-white p-5"
      data-pricing-component="portfolio-mix-analyzer"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Simulación ponderada por volumen y mezcla
            </p>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
              Captura cantidades temporales por producto y compara el impacto consolidado de factores y descuentos sin crear Forecast, presupuesto o precios reales.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" data-pricing-print-hidden="true">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={resetPortfolio}
            type="button"
          >
            <RotateCcw size={15} />
            Reiniciar mezclas
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!result?.available || isExporting}
            onClick={exportPortfolio}
            type="button"
          >
            <FileSpreadsheet size={15} />
            {isExporting ? 'Exportando…' : 'Exportar mezcla'}
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!result?.available}
            onClick={printPortfolio}
            type="button"
          >
            <Printer size={15} />
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Factores comunes candidatos
          </span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                commonListFactors: event.target.value,
              }))
              setResult(null)
              setActionStatus(null)
            }}
            placeholder="Ej. 1.95, 2.10, 2.25"
            value={draft.commonListFactors}
          />
          <span className="mt-1 block text-[11px] text-slate-500">
            Todos los factores son explícitos; no se selecciona un ganador automáticamente.
          </span>
        </label>

        <div className="rounded-xl border border-cyan-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
            Referencias disponibles
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={source.commonListFactor === null}
              onClick={() => appendFactor(source.commonListFactor)}
              type="button"
            >
              Agregar factor actual {formatPricingFactor(source.commonListFactor)}
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            Agregar la referencia es una acción explícita del usuario y no implica recomendación.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Escenarios de mezcla
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Las cantidades pueden ser enteras o decimales y representan únicamente supuestos de laboratorio.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-700"
          onClick={addMix}
          type="button"
        >
          <Plus size={15} />
          Agregar mezcla
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {draft.mixes.map((mix, mixIndex) => (
          <div
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            key={mix.key}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex-1">
                <input
                  aria-label={`Nombre mezcla ${mixIndex + 1}`}
                  className="h-10 w-full max-w-md rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                  onChange={(event) => updateMix(
                    mix.key,
                    'label',
                    event.target.value,
                  )}
                  placeholder="Ej. Conservadora, Objetivo o Agresiva"
                  type="text"
                  value={mix.label}
                />
              </div>
              <button
                aria-label={`Eliminar mezcla ${mixIndex + 1}`}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700"
                onClick={() => removeMix(mix.key)}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">Costo</th>
                    <th className="px-4 py-3 font-semibold">Cantidad asumida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {source.input.products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {product.model ?? product.sku ?? product.id}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {product.sku ?? product.id}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {formatPricingMoney(product.cost, currency)}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          aria-label={`Cantidad ${mix.label} ${product.id}`}
                          className="h-10 w-40 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                          min="0"
                          onChange={(event) => updateQuantity(
                            mix.key,
                            product.id,
                            event.target.value,
                          )}
                          placeholder="0"
                          step="any"
                          type="number"
                          value={mix.quantities[product.id] ?? ''}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 p-4">
              <label>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Notas de la mezcla
                </span>
                <input
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                  onChange={(event) => updateMix(
                    mix.key,
                    'notes',
                    event.target.value,
                  )}
                  placeholder="Supuestos, canal o contexto temporal"
                  type="text"
                  value={mix.notes}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Notas generales
        </span>
        <textarea
          className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              notes: event.target.value,
            }))
            setResult(null)
          }}
          placeholder="Periodo supuesto, origen de cantidades o restricciones de interpretación"
          value={draft.notes}
        />
      </label>

      {errors.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={15} />
            Revisa los supuestos
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {actionStatus && (
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-700">
          {actionStatus}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white transition hover:bg-cyan-800"
          onClick={calculatePortfolio}
          type="button"
        >
          <BarChart3 size={17} />
          Calcular mezcla ponderada
        </button>
      </div>

      {result?.available && (
        <div className="mt-7" data-pricing-portfolio-result="true">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">Mezclas</p>
              <p className="mt-2 text-xl font-bold text-cyan-900">{result.summary.mixCount}</p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Factores</p>
              <p className="mt-2 text-xl font-bold text-indigo-900">{result.summary.factorCount}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-700">Descuentos</p>
              <p className="mt-2 text-xl font-bold text-violet-900">{result.summary.discountCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Celdas factibles</p>
              <p className="mt-2 text-xl font-bold text-emerald-900">{result.summary.fullyFeasibleCellCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">Unidades asumidas</p>
              <p className="mt-2 text-xl font-bold text-amber-900">{result.summary.totalAssumedUnitsAcrossMixes.toLocaleString('es-MX')}</p>
            </div>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Comparación ejecutiva por mezcla</p>
              <p className="mt-1 text-xs text-slate-500">Cada fila representa una combinación de mezcla, factor y descuento.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1500px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Mezcla</th>
                    <th className="px-4 py-3 font-semibold">Factor</th>
                    <th className="px-4 py-3 font-semibold">Descuento</th>
                    <th className="px-4 py-3 font-semibold">Unidades</th>
                    <th className="px-4 py-3 font-semibold">Venta ponderada</th>
                    <th className="px-4 py-3 font-semibold">GP ponderado</th>
                    <th className="px-4 py-3 font-semibold">Margen consolidado</th>
                    <th className="px-4 py-3 font-semibold">Factor neto ponderado</th>
                    <th className="px-4 py-3 font-semibold">Cobertura volumen</th>
                    <th className="px-4 py-3 font-semibold">Mayor impacto venta</th>
                    <th className="px-4 py-3 font-semibold">Mayor impacto GP</th>
                    <th className="px-4 py-3 font-semibold">Factibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.cells.map((cell) => {
                    const presentation = feasibilityPresentation(cell)

                    return (
                      <tr key={cell.key}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{cell.mixLabel}</td>
                        <td className="px-4 py-3">{formatPricingFactor(cell.commonListFactor)}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(cell.discountRate)}</td>
                        <td className="px-4 py-3">{cell.totalUnits.toLocaleString('es-MX')}</td>
                        <td className="px-4 py-3">{formatPricingMoney(cell.totalSellingPrice, currency)}</td>
                        <td className="px-4 py-3">{formatPricingMoney(cell.totalGrossProfit, currency)}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(cell.grossMargin)}</td>
                        <td className="px-4 py-3">{formatPricingFactor(cell.weightedNetFactor)}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(cell.volumeCoverageRate)}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{cell.topSalesProductLabel ?? '—'}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{formatPricingPercentage(cell.topSalesShare)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{cell.topGrossProfitProductLabel ?? '—'}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{formatPricingPercentage(cell.topGrossProfitShare)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${presentation.className}`}>
                            {cell.feasibility === 'fully_feasible'
                              ? <CheckCircle2 size={12} />
                              : <AlertTriangle size={12} />}
                            {presentation.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Resumen por factor</p>
              <p className="mt-1 text-xs text-slate-500">Muestra sensibilidad entre todas las mezclas y descuentos sin seleccionar una propuesta.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Factor</th>
                    <th className="px-4 py-3 font-semibold">Celdas</th>
                    <th className="px-4 py-3 font-semibold">Factibles</th>
                    <th className="px-4 py-3 font-semibold">Parciales</th>
                    <th className="px-4 py-3 font-semibold">No factibles</th>
                    <th className="px-4 py-3 font-semibold">Cobertura mínima</th>
                    <th className="px-4 py-3 font-semibold">Cobertura promedio</th>
                    <th className="px-4 py-3 font-semibold">Margen mínimo</th>
                    <th className="px-4 py-3 font-semibold">Margen máximo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.factorSummaries.map((summary) => (
                    <tr key={summary.commonListFactor}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatPricingFactor(summary.commonListFactor)}</td>
                      <td className="px-4 py-3">{summary.cellCount}</td>
                      <td className="px-4 py-3">{summary.fullyFeasibleCellCount}</td>
                      <td className="px-4 py-3">{summary.partiallyFeasibleCellCount}</td>
                      <td className="px-4 py-3">{summary.notFeasibleCellCount}</td>
                      <td className="px-4 py-3">{formatPricingPercentage(summary.minimumVolumeCoverageRate)}</td>
                      <td className="px-4 py-3">{formatPricingPercentage(summary.averageVolumeCoverageRate)}</td>
                      <td className="px-4 py-3">{formatPricingPercentage(summary.minimumGrossMargin)}</td>
                      <td className="px-4 py-3">{formatPricingPercentage(summary.maximumGrossMargin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

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
          Frontera de la simulación de portafolio
        </div>
        <p className="mt-2 text-xs leading-5">
          Las cantidades y mezclas no crean Forecast, presupuesto, demanda, inventario ni compromisos. Tampoco modifican productos, costos, factores o precios en Product Master, Data Center, Business Repository, IndexedDB u otros Workspaces.
        </p>
      </div>
    </section>
  )
}
