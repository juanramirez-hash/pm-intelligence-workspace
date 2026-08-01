import {
  AlertTriangle,
  Activity,
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
  evaluatePriceTierLadder,
} from '../../../core/business/pricing'

import type {
  PriceBatchDesignResult,
  PriceTierLadderCell,
  PriceTierLadderResult,
  PriceTierObjective,
} from '../../../core/business/pricing'

import {
  buildPricingTierLadderExport,
} from '../export/buildPricingTierLadderExport'

import {
  downloadPricingTierLadderExport,
} from '../export/downloadPricingTierLadderExport'

import {
  printPricingTierLadder,
} from '../export/printPricingTierLadder'

import {
  buildPriceTierLadderInputFromDraft,
  createEmptyPricingTierDraft,
  createEmptyPricingTierLadderDraft,
  PRICE_TIER_OBJECTIVE_TYPES,
  priceTierObjectiveLabel,
  priceTierObjectiveUnit,
} from '../state/pricingTierLadderDraft'

import type {
  PricingTierLadderTierDraft,
} from '../state/pricingTierLadderDraft'

import {
  formatPricingFactor,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils/pricingLaboratoryFormatters'

export interface PricingTierLadderAnalyzerProps {
  source: PriceBatchDesignResult
}

function updateTierField<K extends keyof PricingTierLadderTierDraft>(
  tier: PricingTierLadderTierDraft,
  key: K,
  value: PricingTierLadderTierDraft[K],
): PricingTierLadderTierDraft {
  return {
    ...tier,
    [key]: value,
  }
}

function objectiveDescription(
  objective: PriceTierObjective,
  currency: string,
): string {
  switch (objective.type) {
    case 'minimum_gross_margin':
      return `Margen mínimo ${formatPricingPercentage(objective.grossMargin)}`
    case 'minimum_gross_profit':
      return `GP mínimo ${formatPricingMoney(objective.grossProfit, currency)}`
  }
}

function feasibilityPresentation(
  cell: PriceTierLadderCell,
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

export function PricingTierLadderAnalyzer({
  source,
}: PricingTierLadderAnalyzerProps) {
  const [draft, setDraft] = useState(
    createEmptyPricingTierLadderDraft,
  )
  const [result, setResult] = useState<PriceTierLadderResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [sequence, setSequence] = useState(1)
  const [tierSequence, setTierSequence] = useState(2)
  const [isExporting, setIsExporting] = useState(false)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  const updateTier = <K extends keyof PricingTierLadderTierDraft>(
    key: string,
    field: K,
    value: PricingTierLadderTierDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier) => tier.key === key
        ? updateTierField(tier, field, value)
        : tier),
    }))
    setResult(null)
    setActionStatus(null)
  }

  const addTier = () => {
    setDraft((current) => ({
      ...current,
      tiers: [
        ...current.tiers,
        createEmptyPricingTierDraft(tierSequence),
      ],
    }))
    setTierSequence((current) => current + 1)
    setResult(null)
    setActionStatus(null)
  }

  const removeTier = (key: string) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.filter((tier) => tier.key !== key),
    }))
    setResult(null)
    setActionStatus(null)
  }

  const appendFactor = (factor: number | null) => {
    if (factor === null || !Number.isFinite(factor) || factor <= 0) {
      return
    }

    const value = factor.toString()

    setDraft((current) => ({
      ...current,
      commonListFactors: current.commonListFactors.trim()
        ? `${current.commonListFactors.trim()}, ${value}`
        : value,
    }))
    setResult(null)
    setErrors([])
    setActionStatus('Factor agregado explícitamente a la lista de evaluación.')
  }

  const calculateLadder = () => {
    const draftResult = buildPriceTierLadderInputFromDraft(
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

    const nextResult = evaluatePriceTierLadder(draftResult.input)

    if (!nextResult.available) {
      setErrors(nextResult.issues.map((item) => item.message))
      setResult(nextResult)
      setActionStatus(null)
      return
    }

    setResult(nextResult)
    setErrors([])
    setActionStatus('Escalera calculada en memoria. Ningún factor o precio fue aplicado.')
    setSequence((current) => current + 1)
  }

  const exportLadder = async () => {
    if (!result?.available || isExporting) {
      return
    }

    setIsExporting(true)
    setActionStatus(null)

    try {
      const payload = buildPricingTierLadderExport(result)
      await downloadPricingTierLadderExport(payload)
      setActionStatus(`Exportación generada: ${payload.fileName}`)
    } catch {
      setActionStatus('No fue posible generar la exportación de la escalera.')
    } finally {
      setIsExporting(false)
    }
  }

  const printLadder = () => {
    if (!result?.available) {
      return
    }

    try {
      printPricingTierLadder(result)
      setActionStatus('Vista imprimible generada. Usa Guardar como PDF en el navegador.')
    } catch {
      setActionStatus('No fue posible abrir la vista imprimible. Revisa el bloqueo de ventanas emergentes.')
    }
  }

  const resetLadder = () => {
    setDraft(createEmptyPricingTierLadderDraft())
    setResult(null)
    setErrors([])
    setSequence(1)
    setTierSequence(2)
    setIsExporting(false)
    setActionStatus(null)
  }

  const currency = result?.input.currency ?? source.input.currency

  return (
    <section
      className="mt-8 rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50/70 to-white p-5"
      data-pricing-component="tier-ladder-analyzer"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-700">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Arquitectura multinivel y escalera de descuentos
            </p>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
              Define niveles con descuentos y objetivos distintos, calcula el factor requerido por nivel y evalúa factores comunes contra toda la escalera.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" data-pricing-print-hidden="true">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={resetLadder}
            type="button"
          >
            <RotateCcw size={15} />
            Reiniciar escalera
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!result?.available || isExporting}
            onClick={exportLadder}
            type="button"
          >
            <FileSpreadsheet size={15} />
            {isExporting ? 'Exportando…' : 'Exportar escalera'}
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!result?.available}
            onClick={printLadder}
            type="button"
          >
            <Printer size={15} />
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Factores comunes candidatos
          </span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                commonListFactors: event.target.value,
              }))
              setResult(null)
              setActionStatus(null)
            }}
            placeholder="Ej. 2.00, 2.15, 2.30"
            value={draft.commonListFactors}
          />
          <p className="mt-2 text-[11px] leading-4 text-slate-500">
            Campo opcional. Sin factores candidatos se calculan únicamente los mínimos matemáticos por nivel. No existe un factor oculto.
          </p>
        </label>

        <div className="rounded-xl border border-fuchsia-100 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Referencias disponibles
          </p>
          <div className="mt-3 space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Factor de matriz PL-009</span>
              <strong className="text-slate-900">{formatPricingFactor(source.commonListFactor)}</strong>
            </div>
            {result?.globalMinimumFactor !== undefined && (
              <div className="flex items-center justify-between gap-3">
                <span>Mínimo global calculado</span>
                <strong className="text-slate-900">{formatPricingFactor(result.globalMinimumFactor)}</strong>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 text-xs font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100"
              onClick={() => appendFactor(source.commonListFactor)}
              type="button"
            >
              <Plus size={14} />
              Agregar factor actual
            </button>
            {result?.globalMinimumFactor !== null && result?.globalMinimumFactor !== undefined && (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                onClick={() => appendFactor(result.globalMinimumFactor)}
                type="button"
              >
                <Plus size={14} />
                Agregar mínimo global
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Niveles comerciales</p>
            <p className="mt-1 text-xs text-slate-500">Cada descuento y objetivo debe capturarse explícitamente.</p>
          </div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 text-xs font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100"
            onClick={addTier}
            type="button"
          >
            <Plus size={14} />
            Agregar nivel
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {draft.tiers.map((tier, index) => (
            <div className="grid gap-3 p-4 lg:grid-cols-[1.15fr_0.7fr_1.1fr_0.75fr_1.2fr_auto]" key={tier.key}>
              <label>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Nivel</span>
                <input
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                  onChange={(event) => updateTier(tier.key, 'label', event.target.value)}
                  placeholder="Ej. Silver"
                  type="text"
                  value={tier.label}
                />
              </label>
              <label>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Descuento %</span>
                <input
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                  onChange={(event) => updateTier(tier.key, 'discountRate', event.target.value)}
                  placeholder="Ej. 46"
                  type="text"
                  value={tier.discountRate}
                />
              </label>
              <label>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Objetivo</span>
                <select
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                  onChange={(event) => updateTier(
                    tier.key,
                    'objectiveType',
                    event.target.value as PricingTierLadderTierDraft['objectiveType'],
                  )}
                  value={tier.objectiveType}
                >
                  {PRICE_TIER_OBJECTIVE_TYPES.map((type) => (
                    <option key={type} value={type}>{priceTierObjectiveLabel(type)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Valor · {priceTierObjectiveUnit(tier.objectiveType)}
                </span>
                <input
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                  onChange={(event) => updateTier(tier.key, 'objectiveValue', event.target.value)}
                  placeholder={tier.objectiveType === 'minimum_gross_margin' ? 'Ej. 24' : 'Ej. 50'}
                  type="text"
                  value={tier.objectiveValue}
                />
              </label>
              <label>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Notas</span>
                <input
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
                  onChange={(event) => updateTier(tier.key, 'notes', event.target.value)}
                  placeholder="Alcance o supuesto"
                  type="text"
                  value={tier.notes}
                />
              </label>
              <div className="flex items-end">
                <button
                  aria-label={`Eliminar nivel ${index + 1}`}
                  className="flex size-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={draft.tiers.length <= 1}
                  onClick={() => removeTier(tier.key)}
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Notas de arquitectura
        </span>
        <input
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100"
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              notes: event.target.value,
            }))
            setResult(null)
          }}
          placeholder="Supuestos, alcance o criterio interno"
          type="text"
          value={draft.notes}
        />
      </label>

      {errors.length > 0 && (
        <div className="mt-5 space-y-2">
          {errors.map((error) => (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700" key={error}>
              <AlertTriangle className="mt-0.5 shrink-0" size={14} />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {actionStatus && (
        <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-700">
          {actionStatus}
        </div>
      )}

      <div className="mt-5 flex justify-end" data-pricing-print-hidden="true">
        <button
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-fuchsia-700 px-5 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
          onClick={calculateLadder}
          type="button"
        >
          <Activity size={17} />
          Calcular escalera comercial
        </button>
      </div>

      {result?.available && (
        <div className="mt-6" data-pricing-tier-ladder-result="true">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800">
            SIMULACIÓN SIN EFECTO COMERCIAL
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Factor mínimo global</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{formatPricingFactor(result.globalMinimumFactor)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Nivel limitante</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{result.limitingTierLabel ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Producto limitante</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{result.limitingProductLabel ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Factores factibles</p>
              <p className="mt-2 text-xl font-bold text-emerald-800">{result.summary.fullyFeasibleFactorCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">Incumplimientos</p>
              <p className="mt-2 text-xl font-bold text-amber-800">{result.summary.belowObjectiveCount}</p>
            </div>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Factor mínimo por nivel comercial</p>
              <p className="mt-1 text-xs text-slate-500">El nivel con el mayor mínimo determina el factor global matemático.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nivel</th>
                    <th className="px-4 py-3 font-semibold">Descuento</th>
                    <th className="px-4 py-3 font-semibold">Objetivo</th>
                    <th className="px-4 py-3 font-semibold">Factor mínimo</th>
                    <th className="px-4 py-3 font-semibold">Producto limitante</th>
                    <th className="px-4 py-3 font-semibold">Productos calculables</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.tierMinimums.map((minimum) => (
                    <tr key={minimum.tierId}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{minimum.tierLabel}</td>
                      <td className="px-4 py-3">{formatPricingPercentage(minimum.discountRate)}</td>
                      <td className="px-4 py-3">{objectiveDescription(minimum.objective, currency)}</td>
                      <td className="px-4 py-3 font-semibold">{formatPricingFactor(minimum.minimumRequiredFactor)}</td>
                      <td className="px-4 py-3">{minimum.limitingProductLabel ?? '—'}</td>
                      <td className="px-4 py-3">{minimum.calculableProductCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {result.cells.length > 0 && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Matriz Factor × Nivel</p>
                <p className="mt-1 text-xs text-slate-500">Conserva el orden capturado y no selecciona un factor ganador.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[1380px] w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Factor</th>
                      <th className="px-4 py-3 font-semibold">Nivel</th>
                      <th className="px-4 py-3 font-semibold">Descuento</th>
                      <th className="px-4 py-3 font-semibold">Objetivo</th>
                      <th className="px-4 py-3 font-semibold">Mínimo</th>
                      <th className="px-4 py-3 font-semibold">Δ mínimo</th>
                      <th className="px-4 py-3 font-semibold">Factibilidad</th>
                      <th className="px-4 py-3 font-semibold">Cumplen</th>
                      <th className="px-4 py-3 font-semibold">Cobertura</th>
                      <th className="px-4 py-3 font-semibold">Venta agregada</th>
                      <th className="px-4 py-3 font-semibold">GP agregado</th>
                      <th className="px-4 py-3 font-semibold">Margen agregado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.cells.map((cell) => {
                      const presentation = feasibilityPresentation(cell)

                      return (
                        <tr key={cell.key}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatPricingFactor(cell.commonListFactor)}</td>
                          <td className="px-4 py-3 font-semibold">{cell.tierLabel}</td>
                          <td className="px-4 py-3">{formatPricingPercentage(cell.discountRate)}</td>
                          <td className="px-4 py-3">{objectiveDescription(cell.objective, currency)}</td>
                          <td className="px-4 py-3">{formatPricingFactor(cell.minimumRequiredFactor)}</td>
                          <td className="px-4 py-3">{formatPricingFactor(cell.factorGapToMinimum)}</td>
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
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {result.factorSummaries.length > 0 && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Cobertura de la escalera por factor</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Factor</th>
                      <th className="px-4 py-3 font-semibold">Niveles factibles</th>
                      <th className="px-4 py-3 font-semibold">Parciales</th>
                      <th className="px-4 py-3 font-semibold">No factibles</th>
                      <th className="px-4 py-3 font-semibold">Incumplimientos</th>
                      <th className="px-4 py-3 font-semibold">Cobertura mínima</th>
                      <th className="px-4 py-3 font-semibold">Toda la escalera</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.factorSummaries.map((summary) => (
                      <tr key={summary.commonListFactor}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatPricingFactor(summary.commonListFactor)}</td>
                        <td className="px-4 py-3">{summary.fullyFeasibleTierCount}/{summary.tierCount}</td>
                        <td className="px-4 py-3">{summary.partiallyFeasibleTierCount}</td>
                        <td className="px-4 py-3">{summary.notFeasibleTierCount}</td>
                        <td className="px-4 py-3">{summary.belowObjectiveCount}</td>
                        <td className="px-4 py-3">{formatPricingPercentage(summary.minimumCoverageRate)}</td>
                        <td className="px-4 py-3">
                          <span className={[
                            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
                            summary.fullyFeasibleAcrossAllTiers
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800',
                          ].join(' ')}>
                            {summary.fullyFeasibleAcrossAllTiers
                              ? <CheckCircle2 size={12} />
                              : <AlertTriangle size={12} />}
                            {summary.fullyFeasibleAcrossAllTiers ? 'Sí' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
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

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={17} />
          Frontera de la escalera comercial
        </div>
        <p className="mt-2 text-xs leading-5">
          La escalera calcula umbrales y factibilidad. No recomienda, aprueba, guarda o publica factores y precios, ni escribe en Product Master, Data Center, Business Repository, IndexedDB u otros Workspaces.
        </p>
      </div>
    </section>
  )
}
