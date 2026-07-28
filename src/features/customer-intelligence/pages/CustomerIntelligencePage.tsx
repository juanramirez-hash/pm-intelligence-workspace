import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Home,
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
  ExecutiveBreadcrumbs,
  KPIGrid,
} from '../../../atlas/shell'

import {
  ExecutiveHero,
} from '../../../atlas/widgets/executive'

import {
  IntelligentKpiCard,
} from '../../../atlas/widgets/kpi'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import {
  WorkspaceComposition,
} from '../../workspaces/shared/components'

import {
  buildCustomerKpis,
} from '../adapters'

import {
  useCustomerIntelligenceWorkspace,
} from '../hooks/useCustomerIntelligenceWorkspace'

function riskTone(
  riskLevel: string,
): 'positive' | 'attention' | 'critical' | 'default' {
  if (riskLevel === 'critical' || riskLevel === 'high') return 'critical'
  if (riskLevel === 'medium') return 'attention'
  if (riskLevel === 'low') return 'positive'
  return 'default'
}

export function CustomerIntelligencePage() {
  const navigate = useNavigate()
  const { customerId, workspace } = useCustomerIntelligenceWorkspace()

  if (!workspace) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <h1 className="text-3xl font-bold text-slate-950">
          Customer Intelligence no disponible
        </h1>
        <p className="mt-3 text-slate-500">
          No se encontró información para {customerId ?? 'el cliente seleccionado'}.
        </p>
        <Link className="mt-6 inline-block font-semibold text-sky-700" to="/customers">
          Volver al directorio de clientes
        </Link>
      </main>
    )
  }

  const kpis = buildCustomerKpis(workspace)
  const healthScore = workspace.decision.healthScore
  const current = workspace.decision.current

  return (
    <WorkspaceComposition
      breadcrumbs={(
        <ExecutiveBreadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: <Home size={14} /> },
            { label: 'Customer Intelligence', href: '/customers' },
            { label: workspace.header.customerId },
          ]}
        />
      )}
      hero={(
        <ExecutiveHero
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                to="/customers"
              >
                <ArrowLeft size={16} />
                Directorio
              </Link>
              <select
                aria-label="Seleccionar marca para analizar"
                className="rounded-xl border border-sky-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-sky-200"
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
          description="Expediente comercial inteligente para identificar riesgo, recuperación, crecimiento y acciones concretas por cliente."
          eyebrow="Customer Decision Intelligence"
          icon={<Users size={22} />}
          metadata={(
            <>
              <span>{workspace.header.scopeLabel}</span>
              <span>Periodo actual: {workspace.header.currentPeriodId}</span>
            </>
          )}
          metrics={[
            {
              label: 'Venta del periodo',
              value: workspace.cards[0]?.value ?? '—',
              helper: workspace.cards[0]?.helper,
              icon: <TrendingUp size={17} />,
              tone: 'intelligence',
            },
            {
              label: 'Riesgo de abandono',
              value: workspace.intelligence.riskLabel,
              helper: `${workspace.decision.inactiveMonths} meses sin recompra`,
              icon: <ShieldAlert size={17} />,
              tone: riskTone(workspace.intelligence.riskLevel),
            },
            {
              label: 'Potencial de recuperación',
              value: workspace.intelligence.recoveryPotentialLabel,
              helper: `Probabilidad ${workspace.intelligence.recoveryProbabilityLabel}`,
              icon: <BrainCircuit size={17} />,
              tone: 'positive',
            },
            {
              label: 'Productos activos',
              value: workspace.products.active.length,
              helper: `${workspace.products.inactive.length} abandonados`,
              icon: <PackageSearch size={17} />,
              tone: 'attention',
            },
          ]}
          score={{
            score: healthScore.score,
            label: healthScore.label,
            tone: healthScore.level === 'critical'
              ? 'critical'
              : healthScore.level === 'attention'
                ? 'attention'
                : 'healthy',
          }}
          status={(
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={13} />
              Customer Decision Core conectado
            </span>
          )}
          summaryItems={[
            { label: 'Cliente', value: workspace.header.customerId },
            { label: 'Marca', value: workspace.header.selectedBrandName },
            { label: 'Última actividad', value: workspace.intelligence.lastActivePeriodLabel },
            { label: 'Frecuencia activa', value: `${Math.round(workspace.decision.activePeriodRate * 100)}%` },
            { label: 'Documentos', value: current.documents },
            { label: 'Confianza', value: `${Math.round(workspace.decision.decisionConfidence)}%`, tone: 'positive' },
          ]}
          theme="customer"
          title={`${workspace.header.customerId} · ${workspace.header.customerName}`}
        />
      )}
      kpis={(
        <KPIGrid columns={5} gap="compact">
          {kpis.map((kpi, index) => (
            <IntelligentKpiCard {...kpi} key={workspace.cards[index]?.id ?? index} />
          ))}
        </KPIGrid>
      )}
      panels={(
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <ExecutivePanel
            icon={<BrainCircuit size={19} />}
            subtitle={`Última actividad: ${workspace.intelligence.lastActivePeriodLabel}`}
            title="Diagnóstico y decisión recomendada"
            tone="intelligence"
          >
            <h2 className="text-xl font-semibold text-slate-950">
              {workspace.intelligence.riskLabel}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {workspace.intelligence.diagnosis}
            </p>
            <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                Acción recomendada
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {workspace.intelligence.recommendedAction}
              </p>
            </div>
          </ExecutivePanel>

          <ExecutivePanel
            count={workspace.decision.opportunities.length}
            icon={<TrendingUp size={19} />}
            subtitle="Señales generadas por Customer Decision Engine"
            title="Oportunidades detectadas"
            tone="positive"
          >
            <div className="space-y-3">
              {workspace.decision.opportunities.length > 0 ? (
                workspace.decision.opportunities.slice(0, 4).map((opportunity) => (
                  <article className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4" key={opportunity.id}>
                    <p className="font-semibold text-slate-900">{opportunity.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{opportunity.description}</p>
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      Confianza {Math.round(opportunity.confidence)}%
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">No hay oportunidades activas en este alcance.</p>
              )}
            </div>
          </ExecutivePanel>

          <ExecutivePanel
            icon={<TrendingUp size={19} />}
            subtitle="Comportamiento mensual del alcance seleccionado"
            title="Historial comercial"
            tone="neutral"
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
          </ExecutivePanel>

          <ExecutivePanel
            count={workspace.products.inactive.length}
            icon={<PackageSearch size={19} />}
            subtitle="Productos previamente comprados y sin actividad reciente"
            title="Productos abandonados"
            tone="attention"
          >
            {workspace.products.inactive.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {workspace.products.inactive.slice(0, 20).map((productId) => (
                  <Link
                    className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                    key={productId}
                    to={`/products/${encodeURIComponent(productId)}`}
                  >
                    {productId}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No se detectaron productos abandonados en el alcance seleccionado.
              </p>
            )}
          </ExecutivePanel>
        </div>
      )}
    />
  )
}
