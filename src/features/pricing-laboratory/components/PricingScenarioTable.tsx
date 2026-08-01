import {
  Eye,
  Trash2,
} from 'lucide-react'

import type {
  PricingLaboratoryWorkspaceScenarioRow,
} from '../types'

import {
  formatPricingBasis,
  formatPricingDeltaMoney,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils'

export interface PricingScenarioTableProps {
  rows: readonly PricingLaboratoryWorkspaceScenarioRow[]
  currency: string | null
  onSelect: (scenarioKey: string) => void
  onRemove: (configurationId: string) => void
}

function statusLabel(
  row: PricingLaboratoryWorkspaceScenarioRow,
): string {
  if (row.orchestrationStatus !== 'evaluated') {
    switch (row.orchestrationStatus) {
      case 'disabled':
        return 'Deshabilitado'
      case 'not_applicable':
        return 'No aplicable'
      case 'invalid':
        return 'Configuración inválida'
    }
  }

  switch (row.evaluationStatus) {
    case 'valid':
      return 'Válido'
    case 'warning':
      return 'Advertencia'
    case 'blocked':
      return 'Bloqueado'
    case 'invalid':
      return 'Inválido'
    case null:
      return 'Sin evaluación'
  }
}

function statusClassName(
  row: PricingLaboratoryWorkspaceScenarioRow,
): string {
  if (
    row.evaluationStatus === 'invalid' ||
    row.orchestrationStatus === 'invalid'
  ) {
    return 'bg-rose-100 text-rose-700'
  }

  if (row.evaluationStatus === 'blocked') {
    return 'bg-orange-100 text-orange-800'
  }

  if (row.evaluationStatus === 'warning') {
    return 'bg-amber-100 text-amber-800'
  }

  if (row.evaluationStatus === 'valid') {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function deltaClassName(value: number | null | undefined): string {
  if (!value) {
    return 'text-slate-500'
  }

  return value > 0
    ? 'text-emerald-700'
    : 'text-rose-700'
}

export function PricingScenarioTable({
  rows,
  currency,
  onSelect,
  onRemove,
}: PricingScenarioTableProps) {
  if (rows.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center"
        data-pricing-component="scenario-table-empty"
      >
        <p className="text-sm font-semibold text-slate-700">
          Sin escenarios comparativos
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Utiliza el constructor para agregar una simulación temporal.
        </p>
      </div>
    )
  }

  return (
    <div
      className="overflow-x-auto"
      data-pricing-component="scenario-table"
    >
      <table className="min-w-[1120px] w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.1em] text-slate-500">
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Escenario</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Estado</th>
            <th className="border-b border-slate-200 px-3 py-3 font-semibold">Base</th>
            <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Precio</th>
            <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Descuento</th>
            <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">GP</th>
            <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Margen</th>
            <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Δ precio</th>
            <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              className={[
                'transition',
                row.selected
                  ? 'bg-rose-50/80'
                  : 'hover:bg-slate-50/80',
              ].join(' ')}
              data-selected={row.selected}
              key={row.key}
            >
              <td className="border-b border-slate-100 px-3 py-3.5 align-top">
                <div className="font-semibold text-slate-900">
                  {row.name}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    {row.origin === 'template' ? 'Temporal' : 'Almacenado · lectura'}
                  </span>
                  {row.pricingGroupId && (
                    <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">
                      {row.pricingGroupId}
                    </span>
                  )}
                </div>
              </td>

              <td className="border-b border-slate-100 px-3 py-3.5 align-top">
                <span className={[
                  'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                  statusClassName(row),
                ].join(' ')}>
                  {statusLabel(row)}
                </span>
              </td>

              <td className="max-w-64 border-b border-slate-100 px-3 py-3.5 align-top text-xs leading-5 text-slate-600">
                {formatPricingBasis(row.basis, currency)}
              </td>

              <td className="border-b border-slate-100 px-3 py-3.5 text-right font-semibold text-slate-900">
                {formatPricingMoney(row.metrics?.sellingPrice, currency)}
              </td>

              <td className="border-b border-slate-100 px-3 py-3.5 text-right text-slate-700">
                {formatPricingPercentage(row.metrics?.discountRate)}
              </td>

              <td className="border-b border-slate-100 px-3 py-3.5 text-right text-slate-700">
                {formatPricingMoney(row.metrics?.grossProfit, currency)}
              </td>

              <td className="border-b border-slate-100 px-3 py-3.5 text-right text-slate-700">
                {formatPricingPercentage(row.metrics?.grossMargin)}
              </td>

              <td className={[
                'border-b border-slate-100 px-3 py-3.5 text-right font-semibold',
                deltaClassName(row.delta?.sellingPrice),
              ].join(' ')}>
                {formatPricingDeltaMoney(row.delta?.sellingPrice, currency)}
              </td>

              <td className="border-b border-slate-100 px-3 py-3.5 align-top">
                <div className="flex justify-end gap-2">
                  <button
                    aria-label={`Revisar ${row.name}`}
                    className={[
                      'inline-flex size-9 items-center justify-center rounded-lg border transition',
                      row.selected
                        ? 'border-rose-300 bg-rose-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-700',
                    ].join(' ')}
                    onClick={() => onSelect(row.key)}
                    type="button"
                  >
                    <Eye size={16} />
                  </button>

                  {row.origin === 'template' && (
                    <button
                      aria-label={`Quitar ${row.name}`}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onRemove(row.configurationId)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
