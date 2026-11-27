import {
  ExternalLink,
} from 'lucide-react'

import {
  useMemo,
} from 'react'

import {
  useShallow,
} from 'zustand/react/shallow'

import {
  AtlasCard,
} from '../../../atlas/components/AtlasCard'

import {
  SectionHeader,
} from '../../../atlas/layout/SectionHeader'

import {
  acceptedSpreadsheetExtensions,
} from '../parsers/spreadsheetParser'

import {
  NETSUITE_SOURCE_STATUS_LABELS,
  buildNetsuiteSourceRows,
  type NetsuiteSourceStatus,
} from '../engine/netsuiteSourceStatus'

import {
  useDataCenterStore,
} from '../store/dataCenterStore'

// Color plus text, so the status is readable without color.
const statusStyles: Record<NetsuiteSourceStatus, string> = {
  'up-to-date': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  stale: 'border-amber-200 bg-amber-50 text-amber-800',
  'no-data': 'border-rose-200 bg-rose-50 text-rose-700',
  unconfigured: 'border-slate-200 bg-slate-50 text-slate-500',
}

function formatImportedAt(value: string | null): string {
  if (!value) {
    return 'Sin carga'
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
}

// YYYY-MM-DD is a calendar date: format it without a time zone shift.
function formatCutoff(value: string | null): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (!match) {
    return '—'
  }

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ).toLocaleDateString('es-MX', {
    dateStyle: 'medium',
  })
}

export function NetsuiteSourcesPanel() {
  const dates = useDataCenterStore(
    useShallow((store) => ({
      salesLastImportedAt: store.lastImportedAt,
      salesCutoff: store.salesSummary?.periodEnd ?? null,
      targetsLastImportedAt: store.targetsLastImportedAt,
      inventoryLastImportedAt: store.inventoryLastImportedAt,
      inventoryCutoff: store.inventorySummary?.periodEnd ?? null,
      purchaseOrderLastImportedAt: store.purchaseOrderLastImportedAt,
      purchaseRequestLastImportedAt: store.purchaseRequestLastImportedAt,
      pricingLastImportedAt: store.pricingLastImportedAt,
      productMasterLastImportedAt: store.productMasterLastImportedAt,
      customerMasterLastImportedAt: store.customerMasterLastImportedAt,
      projectsLastImportedAt: store.projectsLastImportedAt,
      projectBillingLastImportedAt: store.projectBillingLastImportedAt,
      exchangeRateLastImportedAt: store.exchangeRateLastImportedAt,
    })),
  )

  const rows = useMemo(
    () =>
      buildNetsuiteSourceRows({
        sales: {
          lastImportedAt: dates.salesLastImportedAt,
          dataCutoff: dates.salesCutoff,
        },
        targets: {
          lastImportedAt: dates.targetsLastImportedAt,
          dataCutoff: null,
        },
        inventory: {
          lastImportedAt: dates.inventoryLastImportedAt,
          dataCutoff: dates.inventoryCutoff,
        },
        'purchase-orders': {
          lastImportedAt: dates.purchaseOrderLastImportedAt,
          dataCutoff: null,
        },
        'purchase-requests': {
          lastImportedAt: dates.purchaseRequestLastImportedAt,
          dataCutoff: null,
        },
        pricing: {
          lastImportedAt: dates.pricingLastImportedAt,
          dataCutoff: null,
        },
        'product-master': {
          lastImportedAt: dates.productMasterLastImportedAt,
          dataCutoff: null,
        },
        'customer-master': {
          lastImportedAt: dates.customerMasterLastImportedAt,
          dataCutoff: null,
        },
        projects: {
          lastImportedAt: dates.projectsLastImportedAt,
          dataCutoff: null,
        },
        'project-billings': {
          lastImportedAt: dates.projectBillingLastImportedAt,
          dataCutoff: null,
        },
        'exchange-rates': {
          lastImportedAt: dates.exchangeRateLastImportedAt,
          dataCutoff: null,
        },
      }),
    [dates],
  )

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Fuentes de NetSuite"
        description="Datos atrasados y reporte de NetSuite de cada carga semanal: exporta el archivo y arrástralo al Centro de datos."
      />

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-3 font-semibold">Dataset</th>
              <th className="px-3 py-3 font-semibold">Reporte en NetSuite</th>
              <th className="px-3 py-3 font-semibold">Última carga</th>
              <th className="px-3 py-3 font-semibold">Corte de datos</th>
              <th className="px-3 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.importerId}>
                <td className="px-3 py-4 font-semibold text-slate-900">
                  {row.label}
                </td>
                <td className="px-3 py-4">
                  {row.source ? (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-800">
                        {row.source.name}
                      </p>
                      <a
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                        href={row.source.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Abrir en NetSuite
                        <ExternalLink size={13} />
                      </a>
                      <p className="text-xs text-slate-500">
                        {row.help}
                      </p>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {formatImportedAt(row.lastImportedAt)}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {formatCutoff(row.dataCutoff)}
                </td>
                <td className="px-3 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[row.status]}`}
                  >
                    {NETSUITE_SOURCE_STATUS_LABELS[row.status]}
                  </span>
                  {row.daysSinceReference !== null &&
                    row.status !== 'unconfigured' && (
                      <p className="mt-1 text-xs text-slate-400">
                        {row.daysSinceReference === 1
                          ? 'Hace 1 día'
                          : `Hace ${row.daysSinceReference} días`}
                      </p>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        El Data Center acepta {acceptedSpreadsheetExtensions.join(', ')}.
      </p>
    </AtlasCard>
  )
}
