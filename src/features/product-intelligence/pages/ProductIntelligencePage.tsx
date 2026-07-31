import type { ReactNode } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  BrainCircuit,
  CheckCircle2,
  Home,
  PackageSearch,
  Rocket,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ExecutiveBreadcrumbs, KPIGrid } from '../../../atlas/shell'
import { ExecutiveHero } from '../../../atlas/widgets/executive'
import { IntelligentKpiCard } from '../../../atlas/widgets/kpi'
import { ExecutivePanel } from '../../../atlas/widgets/panel'
import { WorkspaceComposition } from '../../workspaces/shared/components'
import { buildProductKpis } from '../adapters'
import { useProductIntelligenceWorkspace } from '../hooks/useProductIntelligenceWorkspace'
import {
  ProductCatalogReplacementPanel,
} from '../components/ProductCatalogReplacementPanel'


type ComparisonTone = 'positive' | 'negative' | 'neutral'

function comparisonTone(value: number | null): ComparisonTone {
  if (value === null || value === 0) return 'neutral'
  return value > 0 ? 'positive' : 'negative'
}

function comparisonIcon(value: number | null) {
  if (value === null || value === 0) return <ArrowRight size={16} />
  return value > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />
}

function formatPercentVariation(value: number | null): string {
  if (value === null) return 'Sin base'
  const percentage = value * 100
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`
}

function formatPointVariation(value: number | null): string {
  if (value === null) return 'Sin base'
  const points = value * 100
  return `${points > 0 ? '+' : ''}${points.toFixed(1)} pts`
}

function formatAbsoluteVariation(value: number | null): string {
  if (value === null) return 'Sin base'
  return `${value > 0 ? '+' : ''}${value}`
}

function TemporalMetric({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string
  value: string
  helper: string
  icon: ReactNode
  tone: ComparisonTone
}) {
  const toneClasses = {
    positive: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
    negative: 'border-rose-200 bg-rose-50/60 text-rose-700',
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
  } as const

  return (
    <article className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-2 shadow-sm">{icon}</div>
      </div>
    </article>
  )
}

function riskTone(riskLevel: string): 'positive' | 'attention' | 'critical' | 'default' {
  if (riskLevel === 'critical' || riskLevel === 'high') return 'critical'
  if (riskLevel === 'medium') return 'attention'
  if (riskLevel === 'low') return 'positive'
  return 'default'
}

function scoreTone(score: number): 'healthy' | 'attention' | 'critical' {
  if (score >= 70) return 'healthy'
  if (score >= 45) return 'attention'
  return 'critical'
}

export function ProductIntelligencePage() {
  const {
    productId,
    workspace,
    catalogReplacement,
  } = useProductIntelligenceWorkspace()

  if (!workspace) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <h1 className="text-3xl font-bold text-slate-950">Product Intelligence no disponible</h1>
        <p className="mt-3 text-slate-500">No se encontró información para {productId ?? 'el producto seleccionado'}.</p>
        <Link className="mt-6 inline-block font-semibold text-emerald-700" to="/products">Volver al directorio de productos</Link>
      </main>
    )
  }

  const decision = workspace.decision
  const kpis = buildProductKpis(workspace)

  return (
    <WorkspaceComposition
      breadcrumbs={(
        <ExecutiveBreadcrumbs items={[
          { label: 'Inicio', href: '/', icon: <Home size={14} /> },
          { label: 'Product Intelligence', href: '/products' },
          { label: workspace.header.productId },
        ]} />
      )}
      hero={(
        <ExecutiveHero
          actions={(
            <Link className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white" to="/products">
              <ArrowLeft size={16} /> Directorio
            </Link>
          )}
          description="Expediente inteligente del SKU para decidir si proteger, desarrollar, recuperar, sustituir o acelerar su adopción comercial."
          eyebrow="Product Decision Intelligence"
          icon={<PackageSearch size={22} />}
          metadata={<><span>Marca: {workspace.header.brandName}</span><span>Periodo actual: {workspace.header.currentPeriodId}</span></>}
          metricFooter={catalogReplacement ? (
            <ProductCatalogReplacementPanel
              currentProductId={workspace.header.productId}
              replacement={catalogReplacement}
            />
          ) : undefined}
          metrics={[
            {
              label: 'Clasificación valor', value: decision.commercialStatus,
              helper: decision.commercialStatusLabel,
              icon: decision.isNewProduct ? <Rocket size={17} /> : <Users size={17} />,
              tone: decision.isNewProduct ? 'intelligence' : 'positive',
            },
            {
              label: 'Ciclo de vida', value: decision.lifecycleLabel,
              helper: decision.penetrationInterpretation,
              icon: <Sparkles size={17} />, tone: decision.isNewProduct ? 'intelligence' : 'attention',
            },
            {
              label: 'Riesgo comercial', value: decision.riskLabel,
              helper: `${decision.inactiveMonths} meses sin venta`,
              icon: <ShieldAlert size={17} />, tone: riskTone(decision.riskLevel),
            },
            {
              label: 'Potencial de recuperación', value: workspace.intelligence.recoveryPotentialLabel,
              helper: `Probabilidad ${workspace.intelligence.recoveryProbabilityLabel}`,
              icon: <BrainCircuit size={17} />, tone: 'positive',
            },
          ]}
          score={{ score: Math.round(decision.healthScore), label: decision.healthLabel, tone: scoreTone(decision.healthScore) }}
          status={<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} /> Product Decision Core conectado</span>}
          summaryItems={[
            { label: 'SKU', value: decision.sku },
            { label: 'Última actividad', value: workspace.intelligence.lastActivePeriodLabel },
            { label: 'Clientes activos', value: decision.activeCustomerIds.length },
            { label: 'Clientes por recuperar', value: decision.lostCustomers.length },
            { label: 'Margen', value: workspace.cards[1]?.helper.replace('Margen ', '') ?? '—' },
            { label: 'BCG', value: decision.dna.bcg.label },
            { label: 'Concentración', value: decision.dna.concentration.label },
            ...(catalogReplacement
              ? [{
                  label: 'Sustitución',
                  value: catalogReplacement.shortLabel,
                  tone: catalogReplacement.tone,
                }]
              : []),
            { label: 'Confianza', value: `${Math.round(decision.confidence)}%`, tone: 'positive' },
          ]}
          theme="product"
          title={`${workspace.header.productId} · ${workspace.header.productName}`}
        />
      )}
      kpis={(
        <KPIGrid columns={5} gap="compact">
          {kpis.map((kpi, index) => <IntelligentKpiCard {...kpi} key={workspace.cards[index]?.id ?? index} />)}
        </KPIGrid>
      )}
      panels={(
        <div className="grid gap-6 xl:grid-cols-2">
          <ExecutivePanel
            className="xl:col-span-2"
            icon={<Activity size={19} />}
            subtitle={`Comparación contra ${workspace.comparison.basePeriodId ?? 'el periodo anterior disponible'}`}
            title="Comparativo temporal"
            tone="neutral"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <TemporalMetric
                helper="Venta vs periodo anterior"
                icon={comparisonIcon(workspace.comparison.revenueVariation)}
                label="Venta"
                tone={comparisonTone(workspace.comparison.revenueVariation)}
                value={formatPercentVariation(workspace.comparison.revenueVariation)}
              />
              <TemporalMetric
                helper="Variación del margen GP"
                icon={<BadgeDollarSign size={16} />}
                label="Margen GP"
                tone={comparisonTone(workspace.comparison.grossMarginVariation)}
                value={formatPointVariation(workspace.comparison.grossMarginVariation)}
              />
              <TemporalMetric
                helper="Clientes activos netos"
                icon={<Users size={16} />}
                label="Clientes"
                tone={comparisonTone(workspace.comparison.customerDelta)}
                value={formatAbsoluteVariation(workspace.comparison.customerDelta)}
              />
              <TemporalMetric
                helper="Unidades vs periodo anterior"
                icon={<PackageSearch size={16} />}
                label="Cantidad"
                tone={comparisonTone(workspace.comparison.quantityVariation)}
                value={formatPercentVariation(workspace.comparison.quantityVariation)}
              />
              <TemporalMetric
                helper="Cambio del Business Score"
                icon={<BrainCircuit size={16} />}
                label="Product Health"
                tone={comparisonTone(workspace.comparison.healthVariation)}
                value={formatAbsoluteVariation(workspace.comparison.healthVariation)}
              />
            </div>
          </ExecutivePanel>
          <ExecutivePanel icon={<BrainCircuit size={19} />} subtitle={`Última actividad: ${workspace.intelligence.lastActivePeriodLabel}`} title="Diagnóstico y decisión recomendada" tone="intelligence">
            <h2 className="text-xl font-semibold text-slate-950">{decision.topDecision?.title ?? workspace.intelligence.riskLabel}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{workspace.intelligence.diagnosis}</p>
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Acción recomendada</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{workspace.intelligence.recommendedAction}</p>
            </div>
          </ExecutivePanel>

          <ExecutivePanel count={decision.opportunities.length} icon={<TrendingUp size={19} />} subtitle="Señales generadas por Product Decision Engine" title="Oportunidades detectadas" tone="positive">
            <div className="space-y-3">
              {decision.opportunities.length > 0 ? decision.opportunities.slice(0, 4).map((item) => (
                <article className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4" key={item.id}>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  <p className="mt-2 text-xs font-semibold text-emerald-700">Confianza {Math.round(item.confidence)}% · Regla {item.ruleId}</p>
                </article>
              )) : <p className="text-sm text-slate-500">No hay oportunidades activas para este SKU.</p>}
            </div>
          </ExecutivePanel>

          <ExecutivePanel count={decision.risks.length} icon={<ShieldAlert size={19} />} subtitle="Alertas que requieren revisión del Product Manager" title="Riesgos del producto" tone="attention">
            <div className="space-y-3">
              {decision.risks.length > 0 ? decision.risks.slice(0, 4).map((item) => (
                <article className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4" key={item.id}>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  <p className="mt-2 text-xs font-semibold text-amber-700">{item.recommendedAction}</p>
                </article>
              )) : <p className="text-sm text-slate-500">No se detectaron riesgos relevantes.</p>}
            </div>
          </ExecutivePanel>

          <ExecutivePanel icon={<Sparkles size={19} />} subtitle="Componentes utilizados para calcular la salud" title="Explicabilidad del Product Health" tone="neutral">
            <div className="space-y-3">
              {decision.healthComponents.map((component) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={component.id}>
                  <div className="flex items-center justify-between gap-4"><p className="font-semibold text-slate-900">{component.label}</p><p className="text-sm font-bold text-slate-700">{Math.round(component.score)}/100</p></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, component.score))}%` }} /></div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{component.explanation}</p>
                </div>
              ))}
            </div>
          </ExecutivePanel>

          <ExecutivePanel icon={<BrainCircuit size={19} />} subtitle="Perfil estratégico consolidado" title="Product DNA" tone="intelligence">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">BCG</p><p className="mt-2 text-lg font-bold text-slate-950">{decision.dna.bcg.label}</p><p className="mt-1 text-xs text-slate-500">{decision.dna.bcg.rationale}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Concentración</p><p className="mt-2 text-lg font-bold text-slate-950">{decision.dna.concentration.label}</p><p className="mt-1 text-xs text-slate-500">Principal cliente {decision.dna.concentration.topCustomerShare === null ? '—' : `${(decision.dna.concentration.topCustomerShare * 100).toFixed(1)}%`}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Penetración</p><p className="mt-2 text-lg font-bold text-slate-950">{decision.dna.penetration.label}</p><p className="mt-1 text-xs text-slate-500">Score {decision.dna.penetration.score}/100</p></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Adopción</p><p className="mt-2 text-lg font-bold text-slate-950">{decision.dna.adoption.label}</p><p className="mt-1 text-xs text-slate-500">Score {decision.dna.adoption.adoptionScore}/100</p></div>
            </div>
          </ExecutivePanel>

          <ExecutivePanel count={decision.dna.radar.length} icon={<Sparkles size={19} />} subtitle="Señales priorizadas del portafolio" title="Product Radar" tone="attention">
            <div className="space-y-3">
              {decision.dna.radar.length > 0 ? decision.dna.radar.slice(0, 6).map((item) => (
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item.id}>
                  <div className="flex items-center justify-between gap-4"><p className="font-semibold text-slate-900">{item.title}</p><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">{item.score}</span></div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">Confianza {Math.round(item.confidence)}%</p>
                </article>
              )) : <p className="text-sm text-slate-500">No se detectaron señales activas.</p>}
            </div>
          </ExecutivePanel>

          <ExecutivePanel className="xl:col-span-2" icon={<TrendingUp size={19} />} subtitle="Comportamiento mensual del SKU" title="Historial comercial" tone="neutral">
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase tracking-wide text-slate-400"><tr><th className="pb-3 pr-4">Periodo</th><th className="pb-3 pr-4">Venta</th><th className="pb-3 pr-4">GP</th><th className="pb-3 pr-4">Margen</th><th className="pb-3 pr-4">Cantidad</th><th className="pb-3">Clientes</th></tr></thead><tbody className="divide-y divide-slate-100">{workspace.timeline.map((item) => <tr key={item.periodId}><td className="py-3 pr-4 font-semibold text-slate-900">{item.periodId}</td><td className="py-3 pr-4 text-slate-600">{item.revenueLabel}</td><td className="py-3 pr-4 text-slate-600">{item.grossProfitLabel}</td><td className="py-3 pr-4 text-slate-600">{item.marginLabel}</td><td className="py-3 pr-4 text-slate-600">{item.quantityLabel}</td><td className="py-3 text-slate-600">{item.customersLabel}</td></tr>)}</tbody></table></div>
          </ExecutivePanel>

          <ExecutivePanel count={workspace.activeCustomers.length} icon={<Users size={19} />} subtitle="Clientes con compra en el periodo actual" title="Clientes activos" tone="positive">
            <div className="space-y-2">{workspace.activeCustomers.slice(0, 15).map((customer) => <Link className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50" key={customer.customerId} to={`/customers/${encodeURIComponent(customer.customerId)}?brand=${encodeURIComponent(workspace.header.brandId)}`}>{customer.customerId} · {customer.customerName}</Link>)}</div>
          </ExecutivePanel>

          <ExecutivePanel count={workspace.lostCustomers.length} icon={<ShieldAlert size={19} />} subtitle="Clientes del periodo base sin recompra reciente" title="Clientes por recuperar" tone="critical">
            <div className="grid gap-3">{workspace.lostCustomers.slice(0, 10).map((customer) => <Link className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 transition hover:border-rose-300" key={customer.customerId} to={`/customers/${encodeURIComponent(customer.customerId)}?brand=${encodeURIComponent(workspace.header.brandId)}`}><p className="text-xs font-bold uppercase tracking-wide text-rose-600">{customer.customerId}</p><h3 className="mt-1 font-semibold text-slate-950">{customer.customerName}</h3><p className="mt-2 text-sm text-slate-600">Base {customer.estimatedBaseRevenueLabel} · Prob. {customer.probabilityLabel} · Impacto {customer.expectedImpactLabel}</p></Link>)}</div>
          </ExecutivePanel>
        </div>
      )}
    />
  )
}
