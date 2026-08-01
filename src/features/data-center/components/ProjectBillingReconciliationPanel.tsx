import {
  AlertTriangle,
  CheckCircle2,
  GitCompareArrows,
  ReceiptText,
} from 'lucide-react'

import {
  AtlasCard,
} from '../../../atlas/components/AtlasCard'

import {
  SectionHeader,
} from '../../../atlas/layout/SectionHeader'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

const currencyFormatter =
  new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    },
  )

const percentageFormatter =
  new Intl.NumberFormat(
    'es-MX',
    {
      style: 'percent',
      maximumFractionDigits: 1,
    },
  )

function formatCurrency(
  value: number,
): string {
  return currencyFormatter.format(value)
}

function formatPercentage(
  value: number,
): string {
  return percentageFormatter.format(value)
}

export function ProjectBillingReconciliationPanel() {
  const workspace = useWorkspaceContext()

  const report =
    workspace.repository
      ?.projectBillingReconciliation
      .getReport() ?? null

  if (
    !report ||
    (
      report.quality.activeBillingDocuments === 0 &&
      report.quality.voidedBillingDocuments === 0
    )
  ) {
    return null
  }

  const latestPeriods = report.periods
    .filter((period) =>
      period.total.documents > 0 ||
      period.matchedBillingDocuments > 0 ||
      period.missingBillingDocuments > 0,
    )
    .slice(-6)
    .reverse()

  const hasBlockingIssues =
    report.quality.missingBillingDocuments > 0 ||
    report.quality.conflictBillingDocuments > 0

  return (
    <AtlasCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          title="Conciliación de facturación de proyectos"
          description="Separa la venta real por origen usando Document Number y los importes oficiales del repositorio de ventas en MXN."
        />

        <div
          className={[
            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
            hasBlockingIssues
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800',
          ].join(' ')}
        >
          {hasBlockingIssues
            ? <AlertTriangle size={15} />
            : <CheckCircle2 size={15} />}

          {hasBlockingIssues
            ? 'Revisión requerida'
            : 'Conciliación saludable'}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <ReceiptText size={17} />
            Venta total
          </div>

          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {formatCurrency(report.total.revenue)}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-violet-700">
            <GitCompareArrows size={17} />
            Facturación de proyectos
          </div>

          <p className="mt-3 text-2xl font-semibold text-violet-950">
            {formatCurrency(report.project.revenue)}
          </p>

          <p className="mt-1 text-xs text-violet-700">
            {formatPercentage(
              report.total.revenue === 0
                ? 0
                : report.project.revenue /
                  report.total.revenue,
            )} de la venta
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-sm font-medium text-cyan-700">
            Venta transaccional
          </p>

          <p className="mt-3 text-2xl font-semibold text-cyan-950">
            {formatCurrency(report.transactional.revenue)}
          </p>

          <p className="mt-1 text-xs text-cyan-700">
            Base histórica para FW-009
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">
            Cobertura documental
          </p>

          <p className="mt-3 text-2xl font-semibold text-emerald-950">
            {formatPercentage(report.quality.coverageRate)}
          </p>

          <p className="mt-1 text-xs text-emerald-700">
            {report.quality.matchedBillingDocuments} conciliados de{' '}
            {report.quality.activeBillingDocuments}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="font-semibold text-slate-900">
              Serie histórica conciliada
            </p>

            <p className="mt-1 text-xs text-slate-600">
              La marca, el cliente, Revenue y GP provienen de las filas reales de ventas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Proyectos</th>
                  <th className="px-4 py-3 text-right">Transaccional</th>
                  <th className="px-4 py-3 text-right">Participación</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {latestPeriods.map((period) => (
                  <tr key={period.periodId}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {period.periodId}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(period.total.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-violet-700">
                      {formatCurrency(period.project.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-cyan-700">
                      {formatCurrency(period.transactional.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatPercentage(period.projectRevenueShare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">
              Auditoría documental
            </p>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-600">Sin venta correspondiente</dt>
                <dd className="font-semibold text-amber-700">
                  {report.quality.missingBillingDocuments}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-600">Conflictos factura–proyecto</dt>
                <dd className="font-semibold text-red-700">
                  {report.quality.conflictBillingDocuments}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-600">Notas de crédito</dt>
                <dd className="font-semibold text-slate-900">
                  {report.quality.creditNoteDocuments}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-600">Documentos anulados</dt>
                <dd className="font-semibold text-slate-900">
                  {report.quality.voidedBillingDocuments}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-600">Proyectos huérfanos</dt>
                <dd className="font-semibold text-slate-900">
                  {report.quality.orphanProjectIds.length}
                </dd>
              </div>
            </dl>
          </div>

          {hasBlockingIssues && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={19}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="font-semibold text-amber-900">
                    Excepciones bloqueadas
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Los documentos faltantes o asociados a más de un proyecto no se clasifican como venta de proyectos hasta resolver la conciliación. Esto impide el doble conteo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AtlasCard>
  )
}
