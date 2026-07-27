import {
  ArrowLeft,
  BadgeDollarSign,
  BrainCircuit,
  PackageSearch,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { KpiCard } from '../../../components/business/kpi'
import { WorkspaceGrid } from '../../../components/workspace/grid'
import { WorkspaceHeader } from '../../../components/workspace/header'
import { WorkspaceSection } from '../../../components/workspace/section'
import { useProductIntelligenceWorkspace } from '../hooks/useProductIntelligenceWorkspace'

const cardIcons = {
  revenue: TrendingUp,
  'gross-profit': BadgeDollarSign,
  customers: Users,
  risk: ShieldAlert,
  recovery: BrainCircuit,
} as const

export function ProductIntelligencePage() {
  const { productId, workspace } = useProductIntelligenceWorkspace()

  if (!workspace) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <h1 className="text-3xl font-bold text-slate-950">Product Intelligence no disponible</h1>
        <p className="mt-3 text-slate-500">No se encontró información para {productId ?? 'el producto seleccionado'}.</p>
        <Link className="mt-6 inline-block font-semibold text-amber-700" to="/products">Volver al directorio de productos</Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-amber-700" to="/products">
          <ArrowLeft size={17} /> Volver al directorio de productos
        </Link>

        <WorkspaceHeader
          connected
          connectedLabel="Product Decision Core conectado"
          description="Expediente inteligente del producto con análisis comercial, clientes y recuperación."
          eyebrow="Product Intelligence Workspace"
          icon={PackageSearch}
          metadata={<p className="mt-3 text-xs font-medium text-slate-400">Marca {workspace.header.brandName} · Periodo {workspace.header.currentPeriodId}</p>}
          title={`${workspace.header.productId} · ${workspace.header.productName}`}
          tone="amber"
        />

        <WorkspaceGrid className="mt-6" columns={5}>
          {workspace.cards.map((card) => {
            const Icon = cardIcons[card.id as keyof typeof cardIcons] ?? PackageSearch
            return <KpiCard icon={Icon} key={card.id} subtitle={card.helper} title={card.label} tone={card.tone} value={card.value} />
          })}
        </WorkspaceGrid>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <WorkspaceSection icon={BrainCircuit} subtitle={`Última actividad ${workspace.intelligence.lastActivePeriodLabel}`} title="Product Commercial Intelligence" tone="violet">
            <h2 className="text-xl font-semibold text-slate-950">{workspace.intelligence.riskLabel}</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{workspace.intelligence.diagnosis}</p>
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Acción recomendada</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{workspace.intelligence.recommendedAction}</p>
            </div>
          </WorkspaceSection>
          <WorkspaceSection icon={TrendingUp} subtitle={`Probabilidad estimada ${workspace.intelligence.recoveryProbabilityLabel}`} title="Potencial de recuperación" tone="emerald">
            <p className="text-4xl font-semibold text-slate-950">{workspace.intelligence.recoveryPotentialLabel}</p>
          </WorkspaceSection>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <WorkspaceSection icon={TrendingUp} subtitle="Comportamiento mensual del producto" title="Historial comercial" tone="blue">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400"><tr><th className="pb-3 pr-4">Periodo</th><th className="pb-3 pr-4">Venta</th><th className="pb-3 pr-4">GP</th><th className="pb-3 pr-4">Margen</th><th className="pb-3 pr-4">Cantidad</th><th className="pb-3">Clientes</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {workspace.timeline.map((item) => <tr key={item.periodId}><td className="py-3 pr-4 font-semibold text-slate-900">{item.periodId}</td><td className="py-3 pr-4 text-slate-600">{item.revenueLabel}</td><td className="py-3 pr-4 text-slate-600">{item.grossProfitLabel}</td><td className="py-3 pr-4 text-slate-600">{item.marginLabel}</td><td className="py-3 pr-4 text-slate-600">{item.quantityLabel}</td><td className="py-3 text-slate-600">{item.customersLabel}</td></tr>)}
                </tbody>
              </table>
            </div>
          </WorkspaceSection>

          <WorkspaceSection icon={Users} subtitle="Clientes con compra en el periodo actual" title="Clientes activos" tone="emerald">
            <div className="space-y-2">
              {workspace.activeCustomers.slice(0, 15).map((customer) => <Link className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:border-violet-300 hover:bg-violet-50" key={customer.customerId} to={`/customers/${encodeURIComponent(customer.customerId)}?brand=${encodeURIComponent(workspace.header.brandId)}`}>{customer.customerId} · {customer.customerName}</Link>)}
            </div>
          </WorkspaceSection>
        </div>

        <WorkspaceSection className="mt-6" icon={ShieldAlert} subtitle="Clientes del último periodo activo sin compra actual" title="Clientes por recuperar" tone="rose">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {workspace.lostCustomers.map((customer) => <Link className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 hover:border-rose-300" key={customer.customerId} to={`/customers/${encodeURIComponent(customer.customerId)}?brand=${encodeURIComponent(workspace.header.brandId)}`}><p className="text-xs font-bold uppercase tracking-wide text-rose-600">{customer.customerId}</p><h3 className="mt-2 font-semibold text-slate-950">{customer.customerName}</h3><p className="mt-3 text-sm text-slate-600">Base estimada {customer.estimatedBaseRevenueLabel}</p><p className="mt-1 text-sm text-slate-600">Prob. {customer.probabilityLabel} · Impacto {customer.expectedImpactLabel}</p></Link>)}
          </div>
        </WorkspaceSection>
      </div>
    </main>
  )
}
