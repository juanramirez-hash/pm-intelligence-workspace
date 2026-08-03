import {
  Activity,
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
  evaluatePriceCorridor,
} from '../../../core/business/pricing'

import type {
  PriceBatchDesignResult,
  PriceCorridorCell,
  PriceCorridorExposure,
  PriceCorridorResult,
} from '../../../core/business/pricing'

import {
  buildPricingCorridorExport,
} from '../export/buildPricingCorridorExport'

import {
  downloadPricingCorridorExport,
} from '../export/downloadPricingCorridorExport'

import {
  printPricingCorridor,
} from '../export/printPricingCorridor'

import {
  buildPriceCorridorInputFromDraft,
  createEmptyPricingCorridorDraft,
  createEmptyPricingCorridorScenarioDraft,
  createEmptyPricingCorridorTierDraft,
} from '../state/pricingCorridorDraft'

import type {
  PricingCorridorDraft,
  PricingCorridorScenarioDraft,
  PricingCorridorTierDraft,
} from '../state/pricingCorridorDraft'

import {
  formatPricingFactor,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils/pricingLaboratoryFormatters'

export interface PricingPriceCorridorAnalyzerProps {
  source: PriceBatchDesignResult
}

function updateScenarioField<
  K extends keyof PricingCorridorScenarioDraft,
>(
  scenario: PricingCorridorScenarioDraft,
  key: K,
  value: PricingCorridorScenarioDraft[K],
): PricingCorridorScenarioDraft {
  return {
    ...scenario,
    [key]: value,
  }
}

function updateTierField<
  K extends keyof PricingCorridorTierDraft,
>(
  tier: PricingCorridorTierDraft,
  key: K,
  value: PricingCorridorTierDraft[K],
): PricingCorridorTierDraft {
  return {
    ...tier,
    [key]: value,
  }
}

function feasibilityPresentation(
  cell: PriceCorridorCell,
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

function exposurePresentation(
  exposure: PriceCorridorExposure,
): {
  label: string
  className: string
} {
  switch (exposure) {
    case 'safe':
      return {
        label: 'Sobre piso',
        className: 'bg-emerald-100 text-emerald-700',
      }
    case 'at_floor':
      return {
        label: 'En piso',
        className: 'bg-amber-100 text-amber-800',
      }
    case 'below_floor':
      return {
        label: 'Debajo del piso',
        className: 'bg-rose-100 text-rose-700',
      }
    case 'invalid':
      return {
        label: 'No calculable',
        className: 'bg-slate-100 text-slate-600',
      }
  }
}

function costBasisLabel(
  value: PricingCorridorDraft['costBasis'],
): string {
  return value === 'reference_landed_cost'
    ? 'Costo aterrizado explícito'
    : 'Costo de compra convertido'
}

export function PricingPriceCorridorAnalyzer({
  source,
}: PricingPriceCorridorAnalyzerProps) {
  const [draft, setDraft] = useState<PricingCorridorDraft>(
    () => createEmptyPricingCorridorDraft(source),
  )
  const [result, setResult] = useState<PriceCorridorResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [sequence, setSequence] = useState(1)
  const [scenarioSequence, setScenarioSequence] = useState(2)
  const [tierSequence, setTierSequence] = useState(
    Math.max(2, source.input.discountRates.length + 1),
  )
  const [isExporting, setIsExporting] = useState(false)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  const invalidate = () => {
    setResult(null)
    setActionStatus(null)
  }

  const updateScenario = <
    K extends keyof PricingCorridorScenarioDraft,
  >(
    key: string,
    field: K,
    value: PricingCorridorScenarioDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      scenarios: current.scenarios.map((scenario) =>
        scenario.key === key
          ? updateScenarioField(scenario, field, value)
          : scenario),
    }))
    invalidate()
  }

  const updateTier = <
    K extends keyof PricingCorridorTierDraft,
  >(
    key: string,
    field: K,
    value: PricingCorridorTierDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier) =>
        tier.key === key
          ? updateTierField(tier, field, value)
          : tier),
    }))
    invalidate()
  }

  const addScenario = () => {
    setDraft((current) => ({
      ...current,
      scenarios: [
        ...current.scenarios,
        createEmptyPricingCorridorScenarioDraft(
          scenarioSequence,
          current.referenceExchangeRate,
        ),
      ],
    }))
    setScenarioSequence((current) => current + 1)
    invalidate()
  }

  const removeScenario = (key: string) => {
    setDraft((current) => ({
      ...current,
      scenarios: current.scenarios.filter(
        (scenario) => scenario.key !== key,
      ),
    }))
    invalidate()
  }

  const addTier = () => {
    setDraft((current) => ({
      ...current,
      tiers: [
        ...current.tiers,
        createEmptyPricingCorridorTierDraft(tierSequence),
      ],
    }))
    setTierSequence((current) => current + 1)
    invalidate()
  }

  const removeTier = (key: string) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.filter(
        (tier) => tier.key !== key,
      ),
    }))
    invalidate()
  }

  const updateQuantity = (
    productId: string,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      quantities: {
        ...current.quantities,
        [productId]: value,
      },
    }))
    invalidate()
  }

  const updateLandedCost = (
    productId: string,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      explicitLandedCosts: {
        ...current.explicitLandedCosts,
        [productId]: value,
      },
    }))
    invalidate()
  }

  const appendSourceFactor = () => {
    const sourceFactor = source.commonListFactor

    if (
      sourceFactor === null ||
      !Number.isFinite(sourceFactor) ||
      sourceFactor <= 0
    ) {
      return
    }

    setDraft((current) => ({
      ...current,
      commonListFactors: current.commonListFactors.trim()
        ? `${current.commonListFactors.trim()}, ${sourceFactor}`
        : sourceFactor.toString(),
    }))
    invalidate()
    setActionStatus('Factor del lote agregado explícitamente.')
  }

  const calculateCorridor = () => {
    const draftResult = buildPriceCorridorInputFromDraft(
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

    const nextResult = evaluatePriceCorridor(draftResult.input)

    if (!nextResult.available) {
      setErrors(nextResult.issues.map((item) => item.message))
      setResult(nextResult)
      setActionStatus(null)
      return
    }

    setResult(nextResult)
    setErrors([])
    setActionStatus(
      'Corredor calculado en memoria. Ningún descuento o precio fue aprobado.',
    )
    setSequence((current) => current + 1)
  }

  const exportCorridor = async () => {
    if (!result?.available || isExporting) {
      return
    }

    setIsExporting(true)
    setActionStatus(null)

    try {
      await downloadPricingCorridorExport(
        buildPricingCorridorExport(result),
      )
      setActionStatus(
        'Excel generado con la leyenda de simulación sin efecto comercial.',
      )
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : 'No fue posible generar el archivo Excel.',
      ])
    } finally {
      setIsExporting(false)
    }
  }

  const printCorridor = () => {
    if (!result?.available) {
      return
    }

    try {
      printPricingCorridor(result)
      setActionStatus(
        'Vista imprimible abierta. El resultado continúa siendo una simulación.',
      )
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : 'No fue posible abrir la vista imprimible.',
      ])
    }
  }

  const reset = () => {
    setDraft(createEmptyPricingCorridorDraft(source))
    setResult(null)
    setErrors([])
    setSequence(1)
    setScenarioSequence(2)
    setTierSequence(
      Math.max(2, source.input.discountRates.length + 1),
    )
    setActionStatus(null)
  }

  const currency = result?.input.reportingCurrency ||
    draft.reportingCurrency ||
    source.input.currency
  const firstCell = result?.cells[0] ?? null

  return (
    <section
      className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5"
      data-pricing-component="price-corridor-analyzer"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-900">
            <Activity size={19} />
            <h3 className="text-base font-semibold">
              Corredor de precio, descuento máximo y piso de margen
            </h3>
          </div>
          <p className="mt-2 max-w-4xl text-xs leading-5 text-slate-600">
            Calcula el precio piso, el descuento máximo soportado, el
            factor mínimo y la distancia de seguridad por producto,
            escenario y nivel comercial. Los límites son matemáticos;
            no constituyen autorización de descuento.
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
          SIMULACIÓN SIN EFECTO COMERCIAL
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <label className="text-xs font-medium text-slate-700">
          Moneda del costo
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            value={draft.sourceCostCurrency}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                sourceCostCurrency: event.target.value,
              }))
              invalidate()
            }}
          />
        </label>

        <label className="text-xs font-medium text-slate-700">
          Moneda de reporte
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            value={draft.reportingCurrency}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                reportingCurrency: event.target.value,
              }))
              invalidate()
            }}
          />
        </label>

        <label className="text-xs font-medium text-slate-700">
          Tipo de cambio de referencia
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            inputMode="decimal"
            value={draft.referenceExchangeRate}
            onChange={(event) => {
              const value = event.target.value
              setDraft((current) => ({
                ...current,
                referenceExchangeRate: value,
                scenarios: current.scenarios.map((scenario, index) =>
                  index === 0 && scenario.label === 'Base'
                    ? {
                      ...scenario,
                      exchangeRate: value,
                    }
                    : scenario),
              }))
              invalidate()
            }}
          />
        </label>

        <label className="text-xs font-medium text-slate-700">
          Base de costo
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            value={draft.costBasis}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                costBasis: event.target.value as PricingCorridorDraft['costBasis'],
              }))
              invalidate()
            }}
          >
            <option value="reference_purchase_cost">
              Costo de compra convertido
            </option>
            <option value="reference_landed_cost">
              Costo aterrizado explícito
            </option>
          </select>
        </label>

        <label className="text-xs font-medium text-slate-700">
          Factores candidatos
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            placeholder="Ej. 2.20, 2.40, 2.60"
            value={draft.commonListFactors}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                commonListFactors: event.target.value,
              }))
              invalidate()
            }}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span>
          Base activa: <strong>{costBasisLabel(draft.costBasis)}</strong>
        </span>
        {source.commonListFactor !== null && (
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700"
            onClick={appendSourceFactor}
          >
            Agregar factor del lote {formatPricingFactor(source.commonListFactor)}
          </button>
        )}
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            Base de costo y volumen por producto
          </p>
          <p className="mt-1 text-xs text-slate-500">
            El costo aterrizado solo es obligatorio cuando se selecciona
            esa base. Las cantidades ponderan la exposición.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Costo fuente</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Costo aterrizado explícito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {source.input.products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {product.model ?? product.id}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {product.sku ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {formatPricingMoney(
                      product.cost,
                      source.input.currency,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-28 rounded-lg border border-slate-200 px-2 py-1.5"
                      inputMode="decimal"
                      value={draft.quantities[product.id] ?? ''}
                      onChange={(event) => updateQuantity(
                        product.id,
                        event.target.value,
                      )}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-36 rounded-lg border border-slate-200 px-2 py-1.5 disabled:bg-slate-100"
                      inputMode="decimal"
                      disabled={draft.costBasis !== 'reference_landed_cost'}
                      placeholder="Importe unitario"
                      value={draft.explicitLandedCosts[product.id] ?? ''}
                      onChange={(event) => updateLandedCost(
                        product.id,
                        event.target.value,
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Escenarios de costo y tipo de cambio
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Cada escenario se captura explícitamente. No se consultan
              tipos de cambio en vivo.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
            onClick={addScenario}
          >
            <Plus size={14} />
            Agregar escenario
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {draft.scenarios.map((scenario) => (
            <div
              key={scenario.key}
              className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr_auto]"
            >
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                placeholder="Nombre"
                value={scenario.label}
                onChange={(event) => updateScenario(
                  scenario.key,
                  'label',
                  event.target.value,
                )}
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                inputMode="decimal"
                placeholder="Δ costo %"
                value={scenario.costChangePercent}
                onChange={(event) => updateScenario(
                  scenario.key,
                  'costChangePercent',
                  event.target.value,
                )}
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                inputMode="decimal"
                placeholder="Tipo de cambio"
                value={scenario.exchangeRate}
                onChange={(event) => updateScenario(
                  scenario.key,
                  'exchangeRate',
                  event.target.value,
                )}
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                placeholder="Notas"
                value={scenario.notes}
                onChange={(event) => updateScenario(
                  scenario.key,
                  'notes',
                  event.target.value,
                )}
              />
              <button
                type="button"
                className="rounded-lg border border-rose-100 bg-white p-2 text-rose-600"
                aria-label="Eliminar escenario"
                onClick={() => removeScenario(scenario.key)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Niveles, descuentos y pisos
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Cada nivel puede tener piso de margen, piso de GP o ambos.
              Cuando ambos existen gobierna el mayor.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
            onClick={addTier}
          >
            <Plus size={14} />
            Agregar nivel
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {draft.tiers.map((tier) => (
            <div
              key={tier.key}
              className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 xl:grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_1.2fr_auto]"
            >
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                placeholder="Silver, Gold, Proyecto..."
                value={tier.label}
                onChange={(event) => updateTier(
                  tier.key,
                  'label',
                  event.target.value,
                )}
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                inputMode="decimal"
                placeholder="Descuento %"
                value={tier.discountPercent}
                onChange={(event) => updateTier(
                  tier.key,
                  'discountPercent',
                  event.target.value,
                )}
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                inputMode="decimal"
                placeholder="Margen mín. %"
                value={tier.minimumGrossMarginPercent}
                onChange={(event) => updateTier(
                  tier.key,
                  'minimumGrossMarginPercent',
                  event.target.value,
                )}
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                inputMode="decimal"
                placeholder="GP mín."
                value={tier.minimumGrossProfit}
                onChange={(event) => updateTier(
                  tier.key,
                  'minimumGrossProfit',
                  event.target.value,
                )}
              />
              <input
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                placeholder="Notas"
                value={tier.notes}
                onChange={(event) => updateTier(
                  tier.key,
                  'notes',
                  event.target.value,
                )}
              />
              <button
                type="button"
                className="rounded-lg border border-rose-100 bg-white p-2 text-rose-600"
                aria-label="Eliminar nivel"
                onClick={() => removeTier(tier.key)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <label className="mt-5 block text-xs font-medium text-slate-700">
        Notas de la simulación
        <textarea
          className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
          value={draft.notes}
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              notes: event.target.value,
            }))
            invalidate()
          }}
        />
      </label>

      {errors.length > 0 && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            Revisa los supuestos
          </div>
          <ul className="mt-2 space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {actionStatus && (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
          {actionStatus}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white"
          onClick={calculateCorridor}
        >
          <Activity size={15} />
          Calcular corredor y descuento máximo
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
          disabled={!result?.available || isExporting}
          onClick={exportCorridor}
        >
          <FileSpreadsheet size={15} />
          {isExporting ? 'Generando...' : 'Exportar Excel'}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
          disabled={!result?.available}
          onClick={printCorridor}
        >
          <Printer size={15} />
          Imprimir / PDF
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700"
          onClick={reset}
        >
          <RotateCcw size={15} />
          Reiniciar
        </button>
      </div>

      {result?.available && (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Escenario crítico
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {result.criticalScenarioLabel ?? '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Factor mínimo global
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatPricingFactor(
                  result.summary.globalMaximumRequiredFactor,
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Descuento máximo global
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatPricingPercentage(
                  result.summary.globalMinimumSupportedDiscountRate,
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Seguridad mínima
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatPricingMoney(
                  result.summary.globalMinimumSafetyAmount,
                  currency,
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Factores totalmente factibles
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {result.summary.fullyFeasibleFactorCount}/
                {result.summary.factorCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Debajo del piso
              </p>
              <p className="mt-2 text-sm font-semibold text-rose-700">
                {result.summary.belowFloorProductCount}
              </p>
            </div>
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Matriz escenario × factor × nivel
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1500px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Escenario</th>
                    <th className="px-3 py-3">Δ costo</th>
                    <th className="px-3 py-3">TC</th>
                    <th className="px-3 py-3">Factor</th>
                    <th className="px-3 py-3">Nivel</th>
                    <th className="px-3 py-3">Descuento</th>
                    <th className="px-3 py-3">Factor mínimo</th>
                    <th className="px-3 py-3">Descuento máximo</th>
                    <th className="px-3 py-3">Seguridad mínima</th>
                    <th className="px-3 py-3">Venta</th>
                    <th className="px-3 py-3">GP</th>
                    <th className="px-3 py-3">Margen</th>
                    <th className="px-3 py-3">Cobertura</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3">Limitante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.cells.map((cell) => {
                    const presentation =
                      feasibilityPresentation(cell)

                    return (
                      <tr key={cell.key}>
                        <td className="px-3 py-3 font-semibold">
                          {cell.scenarioLabel}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingPercentage(cell.costChangeRate)}
                        </td>
                        <td className="px-3 py-3">
                          {cell.exchangeRate.toLocaleString('es-MX')}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingFactor(cell.commonListFactor)}
                        </td>
                        <td className="px-3 py-3">
                          {cell.tierLabel}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingPercentage(cell.discountRate)}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingFactor(cell.minimumRequiredFactor)}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingPercentage(
                            cell.supportedMaximumDiscountRate,
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingMoney(
                            cell.minimumSafetyAmount,
                            currency,
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingMoney(
                            cell.totalSellingPrice,
                            currency,
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingMoney(
                            cell.totalGrossProfit,
                            currency,
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingPercentage(cell.grossMargin)}
                        </td>
                        <td className="px-3 py-3">
                          {formatPricingPercentage(
                            cell.volumeCoverageRate,
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className={[
                            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
                            presentation.className,
                          ].join(' ')}>
                            {cell.feasibility === 'fully_feasible'
                              ? <CheckCircle2 size={12} />
                              : <AlertTriangle size={12} />}
                            {presentation.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {cell.limitingProductLabel ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {firstCell && (
            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  Corredor detallado · primera combinación
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {firstCell.scenarioLabel} ·{' '}
                  {formatPricingFactor(firstCell.commonListFactor)} ·{' '}
                  {firstCell.tierLabel}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[1500px] w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Producto</th>
                      <th className="px-3 py-3">Costo stress</th>
                      <th className="px-3 py-3">Precio lista</th>
                      <th className="px-3 py-3">Precio neto</th>
                      <th className="px-3 py-3">Piso margen</th>
                      <th className="px-3 py-3">Piso GP</th>
                      <th className="px-3 py-3">Piso gobernante</th>
                      <th className="px-3 py-3">Descuento máximo</th>
                      <th className="px-3 py-3">Ancho corredor</th>
                      <th className="px-3 py-3">Seguridad</th>
                      <th className="px-3 py-3">Factor mínimo</th>
                      <th className="px-3 py-3">GP</th>
                      <th className="px-3 py-3">Margen</th>
                      <th className="px-3 py-3">Exposición</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {firstCell.products.map((product) => {
                      const presentation =
                        exposurePresentation(product.exposure)

                      return (
                        <tr key={product.key}>
                          <td className="px-3 py-3 font-semibold">
                            {product.product.model ??
                              product.product.id}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingMoney(
                              product.stressedUnitCost,
                              currency,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingMoney(
                              product.candidateListPrice,
                              currency,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingMoney(
                              product.candidateNetPrice,
                              currency,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingMoney(
                              product.floorFromGrossMargin,
                              currency,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingMoney(
                              product.floorFromGrossProfit,
                              currency,
                            )}
                          </td>
                          <td className="px-3 py-3 font-semibold">
                            {formatPricingMoney(
                              product.priceFloor,
                              currency,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingPercentage(
                              product.maximumDiscountRate,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingMoney(
                              product.corridorWidth,
                              currency,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingMoney(
                              product.safetyAmount,
                              currency,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingFactor(
                              product.requiredListFactor,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingMoney(
                              product.grossProfit,
                              currency,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {formatPricingPercentage(
                              product.grossMargin,
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className={[
                              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
                              presentation.className,
                            ].join(' ')}>
                              {product.meetsFloor
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
          Frontera del corredor
        </div>
        <p className="mt-2">
          El corredor no aprueba descuentos, no guarda pisos, no
          modifica costos o precios y no escribe en Product Master,
          Data Center, Business Repository, IndexedDB u otros
          Workspaces.
        </p>
      </div>
    </section>
  )
}
