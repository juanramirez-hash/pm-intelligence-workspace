import {
  ArrowLeft,
  BadgeDollarSign,
  BrainCircuit,
  PackageSearch,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  KpiCard,
} from '../../../components/business/kpi'

import {
  WorkspaceGrid,
} from '../../../components/workspace/grid'

import {
  WorkspaceHeader,
} from '../../../components/workspace/header'

import {
  WorkspaceSection,
} from '../../../components/workspace/section'

import {
  useCustomerIntelligenceWorkspace,
} from '../hooks/useCustomerIntelligenceWorkspace'

const cardIcons = {
  revenue: TrendingUp,
  'gross-profit': BadgeDollarSign,
  risk: ShieldAlert,
  probability: BrainCircuit,
  products: PackageSearch,
} as const

export function CustomerIntelligencePage() {
  const navigate = useNavigate()
  const { customerId, workspace } =
    useCustomerIntelligenceWorkspace()

  if (!workspace) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <h1 className="text-3xl font-bold text-slate-950">
          Customer Intelligence no disponible
        </h1>
        <p className="mt-3 text-slate-500">
          No se encontró información para {customerId ?? 'el cliente seleccionado'}.
        </p>
        <Link className="mt-6 inline-block font-semibold text-violet-700" to="/customers">
          Volver al directorio de clientes
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-700" to="/customers">
          <ArrowLeft size={17} />
          Volver al directorio de clientes
        </Link>

        <WorkspaceHeader
          connected
          connectedLabel="Customer Decision Core conectado"
          description="Expediente inteligente del cliente con análisis consolidado y específico por marca."
          eyebrow="Customer Intelligence by Brand"
          icon={Users}
          metadata={(
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-slate-400">
                {workspace.header.scopeLabel} · Periodo {workspace.header.currentPeriodId}
              </span>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                onChange={(event) => {
                  const brand = event.target.value
                  navigate(
                    brand
                      ? `/customers/${encodeURIComponent(workspace.header.customerId)}?brand=${encodeURIComponent(brand)}`
                      : `/customers/${encodeURIComponent(workspace.header.customerId)}`,
                  )
                }}
                value={workspace.header.selectedBrandId ?? ''}
              >
                {workspace.brandOptions.map((option) => (
                  <option key={option.id || 'all'} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          title={`${workspace.header.customerId} · ${workspace.header.customerName}`}
          tone="violet"
        />

        <WorkspaceGrid className="mt-6" columns={5}>
          {workspace.cards.map((card) => {
            const Icon = cardIcons[
              card.id as keyof typeof cardIcons
            ] ?? TrendingUp

            return (
              <KpiCard
                icon={Icon}
                key={card.id}
                subtitle={card.helper}
                title={card.label}
                tone={card.tone}
                value={card.value}
              />
            )
          })}
        </WorkspaceGrid>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <WorkspaceSection
            icon={BrainCircuit}
            subtitle={`Última actividad ${workspace.intelligence.lastActivePeriodLabel}`}
            title="Customer Commercial Intelligence"
            tone="violet"
          >
            <h2 className="text-xl font-semibold text-slate-950">
              {workspace.intelligence.riskLabel}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              {workspace.intelligence.diagnosis}
            </p>
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Acción recomendada
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {workspace.intelligence.recommendedAction}
              </p>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            icon={TrendingUp}
            subtitle="Estimación basada en actividad reciente"
            title="Potencial de recuperación"
            tone="emerald"
          >
            <p className="text-4xl font-semibold text-slate-950">
              {workspace.intelligence.recoveryPotentialLabel}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Probabilidad estimada {workspace.intelligence.recoveryProbabilityLabel}
            </p>
          </WorkspaceSection>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <WorkspaceSection
            icon={TrendingUp}
            subtitle="Comportamiento mensual dentro del alcance seleccionado"
            title="Historial comercial"
            tone="blue"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 pr-4">Periodo</th>
                    <th className="pb-3 pr-4">Venta</th>
                    <th className="pb-3 pr-4">GP</th>
                    <th className="pb-3 pr-4">Margen</th>
                    <th className="pb-3">Productos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workspace.timeline.map((item) => (
                    <tr key={item.periodId}>
                      <td className="py-3 pr-4 font-semibold text-slate-900">{item.periodId}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.revenueLabel}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.grossProfitLabel}</td>
                      <td className="py-3 pr-4 text-slate-600">{item.marginLabel}</td>
                      <td className="py-3 text-slate-600">{item.productsLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            icon={PackageSearch}
            subtitle="Productos dentro de la relación cliente–marca"
            title="Productos abandonados"
            tone="amber"
          >
            {workspace.products.inactive.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {workspace.products.inactive.slice(0, 20).map((productId) => (
                  <Link className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100" key={productId} to={`/products/${encodeURIComponent(productId)}`}>
                    {productId}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No se detectaron productos abandonados en el alcance seleccionado.
              </p>
            )}
          </WorkspaceSection>
        </div>
      </div>
    </main>
  )
}
