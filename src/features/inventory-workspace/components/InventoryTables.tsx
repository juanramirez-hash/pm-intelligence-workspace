import {
  ArrowRight,
  CircleAlert,
  MapPin,
  PackageSearch,
} from 'lucide-react'

import type {
  BusinessInventoryPosition,
} from '../../../core/business/entities/inventoryPosition'

import type {
  InventoryAnalyticsGroup,
  InventoryOpportunitySignal,
  InventoryRiskSignal,
} from '../../../core/business/analytics/inventory'

function formatCurrency(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function formatNumber(value: number): string {
  return value.toLocaleString('es-MX', {
    maximumFractionDigits: 1,
  })
}

function opportunityEvidenceLabel(
  opportunity: InventoryOpportunitySignal,
): string {
  if (opportunity.type === 'inbound_recovery') {
    return [
      formatNumber(opportunity.evidence.inboundUnits),
      'unidades pendientes de entrada',
    ].join(' ')
  }

  if (opportunity.type === 'purchase_review') {
    return [
      formatNumber(opportunity.evidence.suggestedUnits),
      'unidades para revisión de compra',
    ].join(' ')
  }

  if (opportunity.type === 'commitment_release') {
    return [
      formatNumber(opportunity.evidence.shortageUnits),
      'unidades sobrecomprometidas',
    ].join(' ')
  }

  return [
    formatNumber(opportunity.evidence.suggestedUnits),
    'unidades sugeridas',
  ].join(' ')
}

function opportunityRouteLabel(
  opportunity: InventoryOpportunitySignal,
): string {
  if (opportunity.type === 'transfer_candidate') {
    return [
      opportunity.sourceLocationId ?? 'Sin origen',
      '→',
      opportunity.targetLocationId ?? 'Sin destino',
    ].join(' ')
  }

  return opportunity.targetLocationId ?? 'Sin ubicación'
}

const priorityStyles = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-600',
}

export function InventoryRankingTable({
  groups,
  onSelect,
}: {
  groups: readonly InventoryAnalyticsGroup[]
  onSelect: (group: InventoryAnalyticsGroup) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-3 py-3 font-semibold">Elemento</th>
            <th className="px-3 py-3 text-right font-semibold">Existencia</th>
            <th className="px-3 py-3 text-right font-semibold">Disponible</th>
            <th className="px-3 py-3 text-right font-semibold">Entradas</th>
            <th className="px-3 py-3 text-right font-semibold">Valor</th>
            <th className="px-3 py-3 text-right font-semibold">Participación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {groups.map((group) => (
            <tr
              key={group.key}
              className="cursor-pointer transition hover:bg-slate-50"
              onClick={() => onSelect(group)}
            >
              <td className="px-3 py-4">
                <p className="font-semibold text-slate-900">{group.label}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {group.products} productos · {group.locations} ubicaciones
                </p>
              </td>
              <td className="px-3 py-4 text-right text-slate-700">
                {formatNumber(group.onHand)}
              </td>
              <td className="px-3 py-4 text-right text-slate-700">
                {formatNumber(group.available)}
              </td>
              <td className="px-3 py-4 text-right text-slate-700">
                {formatNumber(group.inTransit + group.onOrder)}
              </td>
              <td className="px-3 py-4 text-right font-semibold text-slate-900">
                {formatCurrency(group.inventoryValue)}
              </td>
              <td className="px-3 py-4 text-right text-slate-700">
                {(group.valueShare * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InventoryRiskList({
  risks,
}: {
  risks: readonly InventoryRiskSignal[]
}) {
  if (risks.length === 0) {
    return <EmptyState label="No hay riesgos con los filtros actuales." />
  }

  return (
    <div className="space-y-3">
      {risks.map((risk) => (
        <article
          key={risk.id}
          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <CircleAlert size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{risk.productName}</p>
                <p className="mt-1 text-sm text-slate-600">{risk.title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {risk.rationale}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-400">
                  {risk.brandId ?? 'Sin marca'} · {risk.locationId ?? 'Sin ubicación'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  En mano: {formatNumber(risk.evidence.onHand)}
                  {' · '}Comprometido: {formatNumber(risk.evidence.committed)}
                  {' · '}Disponible: {formatNumber(risk.evidence.available)}
                  {' · '}Entradas: {formatNumber(risk.evidence.inbound)}
                </p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[risk.priority]}`}>
              {risk.priority} · {risk.score}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

export function InventoryOpportunityList({
  opportunities,
}: {
  opportunities: readonly InventoryOpportunitySignal[]
}) {
  if (opportunities.length === 0) {
    return <EmptyState label="No hay oportunidades con los filtros actuales." />
  }

  return (
    <div className="space-y-3">
      {opportunities.map((opportunity) => (
        <article
          key={opportunity.id}
          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowRight size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {opportunity.productName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {opportunity.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {opportunity.rationale}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-400">
                  <MapPin size={13} />
                  {opportunityRouteLabel(opportunity)}
                  {' · '}{opportunityEvidenceLabel(opportunity)}
                </p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[opportunity.priority]}`}>
              {opportunity.priority} · {opportunity.score}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

export function InventoryPositionTable({
  positions,
}: {
  positions: readonly BusinessInventoryPosition[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-3 py-3 font-semibold">Producto</th>
            <th className="px-3 py-3 font-semibold">Marca / ubicación</th>
            <th className="px-3 py-3 text-right font-semibold">Existencia</th>
            <th className="px-3 py-3 text-right font-semibold">Disponible</th>
            <th className="px-3 py-3 text-right font-semibold">Comprometido</th>
            <th className="px-3 py-3 text-right font-semibold">Entradas</th>
            <th className="px-3 py-3 text-right font-semibold">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {positions.map((position) => (
            <tr key={position.id} className="hover:bg-slate-50">
              <td className="px-3 py-4">
                <p className="font-semibold text-slate-900">{position.productName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {position.model ?? position.productCode ?? 'Sin modelo'}
                </p>
              </td>
              <td className="px-3 py-4 text-slate-600">
                {position.brandId ?? 'Sin marca'} · {position.locationId}
              </td>
              <td className="px-3 py-4 text-right">{formatNumber(position.onHand)}</td>
              <td className="px-3 py-4 text-right">{formatNumber(position.available)}</td>
              <td className="px-3 py-4 text-right">{formatNumber(position.committed)}</td>
              <td className="px-3 py-4 text-right">
                {formatNumber(position.inTransit + position.onOrder)}
              </td>
              <td className="px-3 py-4 text-right font-semibold text-slate-900">
                {formatCurrency(position.inventoryValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
      <PackageSearch className="text-slate-300" size={28} />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
    </div>
  )
}
