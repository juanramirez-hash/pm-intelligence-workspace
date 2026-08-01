import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Gauge,
  Plus,
  Printer,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  evaluatePriceBatchSensitivity,
} from '../../../core/business/pricing'

import type {
  PriceBatchDesignResult,
  PriceBatchSensitivityCell,
  PriceBatchSensitivityResult,
} from '../../../core/business/pricing'

import {
  buildPricingBatchSensitivityExport,
} from '../export/buildPricingBatchSensitivityExport'

import {
  downloadPricingBatchSensitivityExport,
} from '../export/downloadPricingBatchSensitivityExport'

import {
  printPricingBatchSensitivity,
} from '../export/printPricingBatchSensitivity'

import {
  buildPriceBatchSensitivityInputFromDraft,
  createEmptyPricingBatchSensitivityDraft,
} from '../state/pricingBatchSensitivityDraft'

import {
  formatPricingFactor,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils/pricingLaboratoryFormatters'

export interface PricingBatchSensitivityAnalyzerProps {
  source: PriceBatchDesignResult
}

function feasibilityPresentation(
  cell: PriceBatchSensitivityCell,
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

function bandLabel(cell: PriceBatchSensitivityCell): string {
  switch (cell.band) {
    case 'below_minimum':
      return 'Debajo mínimo'
    case 'minimum_threshold':
      return 'En mínimo'
    case 'above_minimum':
      return 'Arriba mínimo'
    case 'unavailable':
      return 'Sin mínimo'
  }
}

export function PricingBatchSensitivityAnalyzer({
  source,
}: PricingBatchSensitivityAnalyzerProps) {
  const [draft, setDraft] = useState(
    createEmptyPricingBatchSensitivityDraft,
  )
  const [result, setResult] = useState<PriceBatchSensitivityResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [sequence, setSequence] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  const calculateSensitivity = () => {
    const draftResult = buildPriceBatchSensitivityInputFromDraft(
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

    const nextResult = evaluatePriceBatchSensitivity(draftResult.input)

    if (!nextResult.available) {
      setErrors(nextResult.issues.map((item) => item.message))
      setResult(nextResult)
      setActionStatus(null)
      return
    }

    setResult(nextResult)
    setErrors([])
    setActionStatus('Sensibilidad calculada en memoria. Ningún factor o precio fue aplicado.')
    setSequence((current) => current + 1)
  }

  const appendCurrentFactor = () => {
    if (source.commonListFactor === null) {
      return
    }

    const factor = source.commonListFactor.toString()

    setDraft((current) => ({
      ...current,
      commonListFactors: current.commonListFactors.trim()
        ? `${current.commonListFactors.trim()}, ${factor}`
        : factor,
    }))
    setResult(null)
    setErrors([])
    setActionStatus('Factor de la matriz actual agregado explícitamente a la lista de análisis.')
  }

  const resetSensitivity = () => {
    setDraft(createEmptyPricingBatchSensitivityDraft())
    setResult(null)
    setErrors([])
    setSequence(1)
    setIsExporting(false)
    setActionStatus(null)
  }

  const exportSensitivity = async () => {
    if (!result?.available || isExporting) {
      return
    }

    setIsExporting(true)
    setActionStatus(null)

    try {
      const payload = buildPricingBatchSensitivityExport(result)
      await downloadPricingBatchSensitivityExport(payload)
      setActionStatus(`Exportación generada: ${payload.fileName}`)
    } catch {
      setActionStatus('No fue posible generar la exportación de sensibilidad.')
    } finally {
      setIsExporting(false)
    }
  }

  const printSensitivity = () => {
    if (!result?.available) {
      return
    }

    try {
      printPricingBatchSensitivity(result)
      setActionStatus('Vista imprimible generada. Usa Guardar como PDF en el navegador.')
    } catch {
      setActionStatus('No fue posible abrir la vista imprimible. Revisa el bloqueo de ventanas emergentes.')
    }
  }

  const currency = result?.input.currency ?? source.input.currency

  return (
    <section
      className="mt-8 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-white p-5"
      data-pricing-component="batch-sensitivity-analyzer"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
            <Gauge size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Sensibilidad de factor común y factibilidad
            </p>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
              Evalúa varios factores contra todos los productos y descuentos de la matriz. El mínimo publicado es matemático, no una recomendación comercial.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" data-pricing-print-hidden="true">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={resetSensitivity}
            type="button"
          >
            <RotateCcw size={15} />
            Reiniciar análisis
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!result?.available || isExporting}
            onClick={exportSensitivity}
            type="button"
          >
            <FileSpreadsheet size={15} />
            {isExporting ? 'Exportando…' : 'Exportar sensibilidad'}
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!result?.available}
            onClick={printSensitivity}
            type="button"
          >
            <Printer size={15} />
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Factores comunes a evaluar
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
            placeholder="Ej. 1.90, 2.00, 2.10, 2.20"
            value={draft.commonListFactors}
          />
          <p className="mt-2 text-[11px] leading-4 text-slate-500">
            Usa punto decimal y separa los factores con coma, espacio, punto y coma o salto de línea. No se precarga ningún factor oculto.
          </p>
        </label>

        <div className="rounded-xl border border-cyan-100 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Referencia de la matriz actual
          </p>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {formatPricingFactor(source.commonListFactor)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {source.summary.productCount} productos · {source.summary.discountCount} descuentos
          </p>
          <button
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
            onClick={appendCurrentFactor}
            type="button"
          >
            <Plus size={14} />
            Agregar este factor
          </button>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Notas del análisis
        </span>
        <input
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              notes: event.target.value,
            }))
            setResult(null)
          }}
          placeholder="Supuestos, criterio interno o alcance"
          type="text"
          value={draft.notes}
        />
      </label>

      {errors.length > 0 && (
        <div className="mt-5 space-y-2">
          {errors.map((error) => (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
              key={error}
            >
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
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
          onClick={calculateSensitivity}
          type="button"
        >
          <Activity size={17} />
          Calcular sensibilidad
        </button>
      </div>

      {result?.available && (
        <div className="mt-6" data-pricing-sensitivity-result="true">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800">
            SIMULACIÓN SIN EFECTO COMERCIAL
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">Mínimo global matemático</p>
              <p className="mt-2 text-xl font-bold text-cyan-900">{formatPricingFactor(result.globalMinimumFactor)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Factores</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{result.summary.factorCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Combinaciones</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{result.summary.cellCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Factores plenamente factibles</p>
              <p className="mt-2 text-xl font-bold text-emerald-800">{result.summary.fullyFeasibleFactorCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">Incumplimientos</p>
              <p className="mt-2 text-xl font-bold text-amber-800">{result.summary.belowObjectiveCount}</p>
            </div>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Mínimos matemáticos por descuento</p>
              <p className="mt-1 text-xs text-slate-500">El producto limitante determina el factor necesario para que todos alcancen el objetivo.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Descuento</th>
                    <th className="px-4 py-3 font-semibold">Factor mínimo</th>
                    <th className="px-4 py-3 font-semibold">Producto limitante</th>
                    <th className="px-4 py-3 font-semibold">Productos calculables</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.discountMinimums.map((minimum) => (
                    <tr key={minimum.discountRate}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatPricingPercentage(minimum.discountRate)}</td>
                      <td className="px-4 py-3 font-semibold">{formatPricingFactor(minimum.minimumRequiredFactor)}</td>
                      <td className="px-4 py-3">{minimum.limitingProductLabel ?? '—'}</td>
                      <td className="px-4 py-3">{minimum.calculableProductCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Matriz Factor × Descuento</p>
              <p className="mt-1 text-xs text-slate-500">La matriz conserva el orden de captura y no selecciona un factor ganador.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1320px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Factor</th>
                    <th className="px-4 py-3 font-semibold">Descuento</th>
                    <th className="px-4 py-3 font-semibold">Mínimo</th>
                    <th className="px-4 py-3 font-semibold">Δ mínimo</th>
                    <th className="px-4 py-3 font-semibold">Banda</th>
                    <th className="px-4 py-3 font-semibold">Factibilidad</th>
                    <th className="px-4 py-3 font-semibold">Cumplen</th>
                    <th className="px-4 py-3 font-semibold">Cobertura</th>
                    <th className="px-4 py-3 font-semibold">Venta agregada</th>
                    <th className="px-4 py-3 font-semibold">GP agregado</th>
                    <th className="px-4 py-3 font-semibold">Margen agregado</th>
                    <th className="px-4 py-3 font-semibold">Margen mínimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.cells.map((cell) => {
                    const presentation = feasibilityPresentation(cell)

                    return (
                      <tr key={cell.key}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatPricingFactor(cell.commonListFactor)}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(cell.discountRate)}</td>
                        <td className="px-4 py-3">{formatPricingFactor(cell.minimumRequiredFactor)}</td>
                        <td className="px-4 py-3">{formatPricingFactor(cell.factorGapToMinimum)}</td>
                        <td className="px-4 py-3">{bandLabel(cell)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${presentation.className}`}>
                            {presentation.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">{cell.meetsObjectiveCount}/{cell.productCount}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(cell.coverageRate)}</td>
                        <td className="px-4 py-3">{formatPricingMoney(cell.totalSellingPrice, currency)}</td>
                        <td className="px-4 py-3">{formatPricingMoney(cell.totalGrossProfit, currency)}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(cell.grossMargin)}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(cell.minimumGrossMargin)}</td>
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
              <p className="mt-1 text-xs text-slate-500">Permite identificar cobertura y excepciones sin convertir el resultado en recomendación.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[960px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Factor</th>
                    <th className="px-4 py-3 font-semibold">Descuentos factibles</th>
                    <th className="px-4 py-3 font-semibold">Parciales</th>
                    <th className="px-4 py-3 font-semibold">No factibles</th>
                    <th className="px-4 py-3 font-semibold">Incumplimientos</th>
                    <th className="px-4 py-3 font-semibold">Cobertura mínima</th>
                    <th className="px-4 py-3 font-semibold">Cobertura promedio</th>
                    <th className="px-4 py-3 font-semibold">Todos los descuentos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.factorSummaries.map((summary) => (
                    <tr key={summary.commonListFactor}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatPricingFactor(summary.commonListFactor)}</td>
                      <td className="px-4 py-3">{summary.fullyFeasibleDiscountCount}/{summary.discountCount}</td>
                      <td className="px-4 py-3">{summary.partiallyFeasibleDiscountCount}</td>
                      <td className="px-4 py-3">{summary.notFeasibleDiscountCount}</td>
                      <td className="px-4 py-3">{summary.belowObjectiveCount}</td>
                      <td className="px-4 py-3">{formatPricingPercentage(summary.minimumCoverageRate)}</td>
                      <td className="px-4 py-3">{formatPricingPercentage(summary.averageCoverageRate)}</td>
                      <td className="px-4 py-3">
                        <span className={[
                          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
                          summary.fullyFeasibleAcrossAllDiscounts
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800',
                        ].join(' ')}>
                          {summary.fullyFeasibleAcrossAllDiscounts
                            ? <CheckCircle2 size={12} />
                            : <AlertTriangle size={12} />}
                          {summary.fullyFeasibleAcrossAllDiscounts ? 'Sí' : 'No'}
                        </span>
                      </td>
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
          Frontera del análisis de sensibilidad
        </div>
        <p className="mt-2 text-xs leading-5">
          El análisis no recomienda, aprueba, crea o publica factores y precios. Tampoco escribe en Product Master, Data Center, Business Repository, IndexedDB u otros Workspaces.
        </p>
      </div>
    </section>
  )
}
