import {
  CircleAlert,
  CircleCheckBig,
  DatabaseZap,
  ShieldCheck,
} from 'lucide-react'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  SalesWorkspaceReconciliation,
} from '../types'

import {
  formatSalesInteger,
  formatSalesPercentage,
} from '../utils'

interface SalesReconciliationPanelProps {
  reconciliation: SalesWorkspaceReconciliation
}

export function SalesReconciliationPanel({
  reconciliation,
}: SalesReconciliationPanelProps) {
  const hasDiagnostic =
    reconciliation.totalRows > 0

  return (
    <ExecutivePanel
      count={
        hasDiagnostic
          ? formatSalesPercentage(
              reconciliation.matchRate,
            )
          : 'Pendiente'
      }
      icon={<ShieldCheck size={19} />}
      subtitle="Calidad de vinculación entre ventas y Product Master."
      title="Conciliación de productos"
      tone={
        !hasDiagnostic
          ? 'neutral'
          : reconciliation.matchRate >= 90
            ? 'positive'
            : reconciliation.matchRate >= 70
              ? 'attention'
              : 'critical'
      }
    >
      {!hasDiagnostic ? (
        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm text-slate-500">
          El diagnóstico estará disponible al importar ventas junto con Product Master.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl bg-emerald-50 p-4">
            <CircleCheckBig
              className="text-emerald-700"
              size={20}
            />

            <p className="mt-3 text-2xl font-semibold text-emerald-900">
              {formatSalesInteger(reconciliation.matchedRows)}
            </p>

            <p className="mt-1 text-xs font-medium text-emerald-700">
              Filas conciliadas
            </p>
          </article>

          <article className="rounded-2xl bg-amber-50 p-4">
            <CircleAlert
              className="text-amber-700"
              size={20}
            />

            <p className="mt-3 text-2xl font-semibold text-amber-900">
              {formatSalesInteger(reconciliation.ambiguousRows)}
            </p>

            <p className="mt-1 text-xs font-medium text-amber-700">
              Coincidencias ambiguas
            </p>
          </article>

          <article className="rounded-2xl bg-slate-100 p-4">
            <DatabaseZap
              className="text-slate-600"
              size={20}
            />

            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {formatSalesInteger(reconciliation.unmatchedRows)}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-600">
              Sin correspondencia
            </p>
          </article>
        </div>
      )}
    </ExecutivePanel>
  )
}
