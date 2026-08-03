import {
  BarChart3,
  AlertTriangle,
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
  evaluatePriceCostFxStress,
} from '../../../core/business/pricing'

import type {
  PriceBatchDesignResult,
  PriceCostFxStressResult,
  PriceTierObjectiveType,
} from '../../../core/business/pricing'

import {
  buildPricingCostFxStressExport,
  downloadPricingCostFxStressExport,
  printPricingCostFxStress,
} from '../export'

import {
  buildPriceCostFxStressInputFromDraft,
  createEmptyPricingCostFxStressDraft,
  createEmptyPricingCostFxStressScenarioDraft,
  createEmptyPricingCostFxStressTierDraft,
} from '../state'

import type {
  PricingCostFxStressDraft,
  PricingCostFxStressScenarioDraft,
  PricingCostFxStressTierDraft,
} from '../state'

import {
  formatPricingFactor,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils/pricingLaboratoryFormatters'

interface PricingCostFxStressAnalyzerProps {
  source: PriceBatchDesignResult
}

function updateScenarioField<K extends keyof PricingCostFxStressScenarioDraft>(
  scenario: PricingCostFxStressScenarioDraft,
  key: K,
  value: PricingCostFxStressScenarioDraft[K],
): PricingCostFxStressScenarioDraft {
  return {
    ...scenario,
    [key]: value,
  }
}

function updateTierField<K extends keyof PricingCostFxStressTierDraft>(
  tier: PricingCostFxStressTierDraft,
  key: K,
  value: PricingCostFxStressTierDraft[K],
): PricingCostFxStressTierDraft {
  return {
    ...tier,
    [key]: value,
  }
}

function feasibilityLabel(
  value: string,
): string {
  switch (value) {
    case 'fully_feasible': return 'Factible'
    case 'partially_feasible': return 'Parcial'
    case 'not_feasible': return 'No factible'
    default: return 'No calculable'
  }
}

export function PricingCostFxStressAnalyzer({
  source,
}: PricingCostFxStressAnalyzerProps) {
  const [draft, setDraft] = useState<PricingCostFxStressDraft>(
    () => createEmptyPricingCostFxStressDraft(source),
  )
  const [result, setResult] = useState<PriceCostFxStressResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [sequence, setSequence] = useState(1)
  const [scenarioSequence, setScenarioSequence] = useState(2)
  const [tierSequence, setTierSequence] = useState(2)
  const [isExporting, setIsExporting] = useState(false)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  const invalidate = () => {
    setResult(null)
    setActionStatus(null)
  }

  const updateScenario = <K extends keyof PricingCostFxStressScenarioDraft>(
    key: string,
    field: K,
    value: PricingCostFxStressScenarioDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      scenarios: current.scenarios.map((scenario) => scenario.key === key
        ? updateScenarioField(scenario, field, value)
        : scenario),
    }))
    invalidate()
  }

  const updateTier = <K extends keyof PricingCostFxStressTierDraft>(
    key: string,
    field: K,
    value: PricingCostFxStressTierDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier) => tier.key === key
        ? updateTierField(tier, field, value)
        : tier),
    }))
    invalidate()
  }

  const calculate = () => {
    const draftResult = buildPriceCostFxStressInputFromDraft(
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

    const nextResult = evaluatePriceCostFxStress(draftResult.input)

    if (!nextResult.available) {
      setErrors(nextResult.issues.map((issue) => issue.message))
      setResult(nextResult)
      setActionStatus(null)
      return
    }

    setErrors([])
    setResult(nextResult)
    setActionStatus('Prueba de estrés calculada en memoria. No se actualizó ningún costo, moneda o precio.')
    setSequence((current) => current + 1)
  }

  const exportResult = async () => {
    if (!result?.available || isExporting) {
      return
    }

    setIsExporting(true)
    setActionStatus(null)

    try {
      const payload = buildPricingCostFxStressExport(result)
      await downloadPricingCostFxStressExport(payload)
      setActionStatus(`Exportación generada: ${payload.fileName}`)
    } catch {
      setActionStatus('No fue posible generar la exportación de stress.')
    } finally {
      setIsExporting(false)
    }
  }

  const reset = () => {
    setDraft(createEmptyPricingCostFxStressDraft(source))
    setResult(null)
    setErrors([])
    setSequence(1)
    setScenarioSequence(2)
    setTierSequence(2)
    setActionStatus(null)
  }

  const reportingCurrency = result?.input.reportingCurrency || draft.reportingCurrency || source.input.currency

  return (
    <section
      className="mt-6 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-white p-5 shadow-sm"
      data-pricing-component="cost-fx-stress-analyzer"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Stress de costo y tipo de cambio
            </p>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
              Evalúa variaciones explícitas de costo y tipos de cambio contra factores y niveles comerciales. No consulta tasas en vivo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600" onClick={reset} type="button">
            <RotateCcw size={15} /> Reiniciar
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 disabled:opacity-50" disabled={!result?.available || isExporting} onClick={exportResult} type="button">
            <FileSpreadsheet size={15} /> {isExporting ? 'Exportando…' : 'Exportar Excel'}
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 disabled:opacity-50" disabled={!result?.available} onClick={() => result && printPricingCostFxStress(result)} type="button">
            <Printer size={15} /> Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Moneda del costo</span>
          <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm uppercase" onChange={(event) => { setDraft((current) => ({ ...current, sourceCostCurrency: event.target.value })); invalidate() }} placeholder="USD" value={draft.sourceCostCurrency} />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Moneda de reporte</span>
          <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm uppercase" onChange={(event) => { setDraft((current) => ({ ...current, reportingCurrency: event.target.value })); invalidate() }} placeholder="MXN" value={draft.reportingCurrency} />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">TC de referencia</span>
          <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" onChange={(event) => { setDraft((current) => ({ ...current, referenceExchangeRate: event.target.value })); invalidate() }} placeholder="Ej. 18.50" type="number" value={draft.referenceExchangeRate} />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Factores candidatos</span>
          <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" onChange={(event) => { setDraft((current) => ({ ...current, commonListFactors: event.target.value })); invalidate() }} placeholder="1.95, 2.10, 2.25" value={draft.commonListFactors} />
        </label>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Cantidades explícitas para ponderar</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {source.input.products.map((product) => (
            <label key={product.id}>
              <span className="block truncate text-xs font-semibold text-slate-700">{product.model ?? product.sku ?? product.id}</span>
              <input className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" min="0" onChange={(event) => { setDraft((current) => ({ ...current, quantities: { ...current.quantities, [product.id]: event.target.value } })); invalidate() }} type="number" value={draft.quantities[product.id] ?? ''} />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Escenarios de costo y TC</p>
          <p className="mt-1 text-xs text-slate-500">TC = moneda de reporte por una unidad de moneda del costo.</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700" onClick={() => { setDraft((current) => ({ ...current, scenarios: [...current.scenarios, createEmptyPricingCostFxStressScenarioDraft(scenarioSequence)] })); setScenarioSequence((current) => current + 1); invalidate() }} type="button">
          <Plus size={15} /> Agregar escenario
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {draft.scenarios.map((scenario, index) => (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1.2fr_0.7fr_0.7fr_auto]" key={scenario.key}>
            <input aria-label={`Nombre escenario ${index + 1}`} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" onChange={(event) => updateScenario(scenario.key, 'label', event.target.value)} placeholder="Ej. USD alto" value={scenario.label} />
            <input aria-label={`Variación costo ${index + 1}`} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" onChange={(event) => updateScenario(scenario.key, 'costChangePercent', event.target.value)} placeholder="Δ costo %" type="number" value={scenario.costChangePercent} />
            <input aria-label={`Tipo cambio ${index + 1}`} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" onChange={(event) => updateScenario(scenario.key, 'exchangeRate', event.target.value)} placeholder="TC" type="number" value={scenario.exchangeRate} />
            <button aria-label={`Eliminar escenario ${index + 1}`} className="inline-flex size-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700" onClick={() => { setDraft((current) => ({ ...current, scenarios: current.scenarios.filter((item) => item.key !== scenario.key) })); invalidate() }} type="button"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Niveles comerciales</p>
          <p className="mt-1 text-xs text-slate-500">Cada nivel conserva descuento y objetivo independientes.</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700" onClick={() => { setDraft((current) => ({ ...current, tiers: [...current.tiers, createEmptyPricingCostFxStressTierDraft(tierSequence)] })); setTierSequence((current) => current + 1); invalidate() }} type="button">
          <Plus size={15} /> Agregar nivel
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {draft.tiers.map((tier, index) => (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1.1fr_0.65fr_0.9fr_0.65fr_auto]" key={tier.key}>
            <input aria-label={`Nombre nivel ${index + 1}`} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" onChange={(event) => updateTier(tier.key, 'label', event.target.value)} placeholder="Ej. Silver" value={tier.label} />
            <input aria-label={`Descuento nivel ${index + 1}`} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" onChange={(event) => updateTier(tier.key, 'discountRate', event.target.value)} placeholder="Descuento %" type="number" value={tier.discountRate} />
            <select className="h-10 rounded-xl border border-slate-200 px-3 text-sm" onChange={(event) => updateTier(tier.key, 'objectiveType', event.target.value as PriceTierObjectiveType)} value={tier.objectiveType}>
              <option value="minimum_gross_margin">Margen mínimo</option>
              <option value="minimum_gross_profit">GP unitario mínimo</option>
            </select>
            <input aria-label={`Objetivo nivel ${index + 1}`} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" onChange={(event) => updateTier(tier.key, 'objectiveValue', event.target.value)} placeholder={tier.objectiveType === 'minimum_gross_margin' ? 'Margen %' : 'GP'} type="number" value={tier.objectiveValue} />
            <button aria-label={`Eliminar nivel ${index + 1}`} className="inline-flex size-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700" onClick={() => { setDraft((current) => ({ ...current, tiers: current.tiers.filter((item) => item.key !== tier.key) })); invalidate() }} type="button"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          {errors.map((error) => <p key={error}>{error}</p>)}
        </div>
      )}

      {actionStatus && <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">{actionStatus}</div>}

      <div className="mt-5 flex justify-end">
        <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-semibold text-white" onClick={calculate} type="button">
          <BarChart3 size={17} /> Calcular prueba de estrés
        </button>
      </div>

      {result?.available && (
        <div className="mt-6" data-pricing-cost-fx-result="true">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">SIMULACIÓN SIN EFECTO COMERCIAL</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] uppercase text-slate-500">Escenario crítico</p><p className="mt-2 font-bold">{result.criticalScenarioLabel ?? '—'}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] uppercase text-slate-500">Factor máximo requerido</p><p className="mt-2 font-bold">{formatPricingFactor(result.summary.globalMaximumRequiredFactor)}</p></div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-[11px] uppercase text-emerald-700">Factibles</p><p className="mt-2 font-bold text-emerald-800">{result.summary.fullyFeasibleCellCount}</p></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-[11px] uppercase text-amber-700">Parciales</p><p className="mt-2 font-bold text-amber-800">{result.summary.partiallyFeasibleCellCount}</p></div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-[11px] uppercase text-rose-700">No factibles</p><p className="mt-2 font-bold text-rose-800">{result.summary.notFeasibleCellCount}</p></div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-[1300px] w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Escenario</th><th className="px-4 py-3">Δ costo</th><th className="px-4 py-3">TC</th><th className="px-4 py-3">Factor</th><th className="px-4 py-3">Nivel</th><th className="px-4 py-3">Costo stress</th><th className="px-4 py-3">Venta</th><th className="px-4 py-3">GP</th><th className="px-4 py-3">Margen</th><th className="px-4 py-3">Cobertura</th><th className="px-4 py-3">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {result.cells.map((cell) => {
                  const feasible = cell.feasibility === 'fully_feasible'
                  return <tr key={cell.key}><td className="px-4 py-3 font-semibold">{cell.scenarioLabel}</td><td className="px-4 py-3">{formatPricingPercentage(cell.costChangeRate)}</td><td className="px-4 py-3">{cell.exchangeRate.toLocaleString('es-MX')}</td><td className="px-4 py-3">{formatPricingFactor(cell.commonListFactor)}</td><td className="px-4 py-3">{cell.tierLabel}</td><td className="px-4 py-3">{formatPricingMoney(cell.stressedCostTotal, reportingCurrency)}</td><td className="px-4 py-3">{formatPricingMoney(cell.totalSellingPrice, reportingCurrency)}</td><td className="px-4 py-3">{formatPricingMoney(cell.totalGrossProfit, reportingCurrency)}</td><td className="px-4 py-3">{formatPricingPercentage(cell.grossMargin)}</td><td className="px-4 py-3">{formatPricingPercentage(cell.volumeCoverageRate)}</td><td className="px-4 py-3"><span className={feasible ? 'inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700' : 'inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800'}>{feasible ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}{feasibilityLabel(cell.feasibility)}</span></td></tr>
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800">
        <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={16} /> Frontera del stress test</div>
        <p className="mt-2">No consulta TC en vivo, no actualiza costos y no escribe en Business Repository, Data Center, Forecast ni otros Workspaces.</p>
      </div>
    </section>
  )
}
