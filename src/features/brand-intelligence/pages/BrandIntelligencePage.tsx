import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  BrainCircuit,
  Building2,
  CircleHelp,
  ClipboardList,
  CircleDollarSign,
  Lightbulb,
  PackageSearch,
  Gauge,
  CalendarDays,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'

import {
  Link,
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

import type {
  BrandWorkspaceCard,
} from '../../../core/decision'

import {
  useBrandIntelligenceWorkspace,
} from '../hooks/useBrandIntelligenceWorkspace'

const cardIcons = {
  revenue: BarChart3,
  'gross-profit': BadgeDollarSign,
  'gross-margin': Target,
  customers: Users,
  products: PackageSearch,
} as const

const cardTones = {
  positive: 'emerald',
  neutral: 'slate',
  attention: 'amber',
  critical: 'rose',
} as const

function BrandKpiCard({
  card,
}: {
  card: BrandWorkspaceCard
}) {
  const Icon =
    cardIcons[
      card.id as keyof typeof cardIcons
    ] ?? BarChart3

  return (
    <KpiCard
      icon={Icon}
      subtitle={card.helper}
      title={card.label}
      tone={cardTones[card.status]}
      value={card.value}
    />
  )
}

export function BrandIntelligencePage() {
  const {
    brandId,
    workspace,
  } = useBrandIntelligenceWorkspace()

  if (!workspace) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Brand Intelligence no disponible
          </h1>

          <p className="mt-3 text-slate-500">
            No fue posible construir el Workspace para la marca “{brandId ?? 'sin identificar'}”. Verifica que exista información comercial importada para el periodo actual.
          </p>

          <Link
            className="mt-8 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
            to="/brands"
          >
            Volver al directorio
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
        <Link
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-700"
          to="/brands"
        >
          <ArrowLeft size={17} />
          Volver al directorio de marcas
        </Link>

        <WorkspaceHeader
          connected
          connectedLabel="Decision Core conectado"
          description="Workspace ejecutivo construido desde Business Repository y Decision Engines, sin lógica comercial en React."
          eyebrow="Brand Intelligence Workspace"
          icon={Building2}
          metadata={(
            <p className="text-xs font-medium text-slate-400">
              Periodo actual {workspace.header.currentPeriodId} · Comparativo {workspace.header.previousPeriodId} · Salud {workspace.header.healthLabel}
            </p>
          )}
          title={workspace.header.brandName}
          tone="violet"
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_2fr]">
          <WorkspaceSection
            icon={BrainCircuit}
            subtitle={`Confianza ${workspace.executiveIntelligence.confidenceLabel}`}
            title="Executive Score"
            tone="violet"
          >
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-6xl font-semibold tracking-tight text-slate-950">
                  {workspace.executiveIntelligence.score}
                </p>
                <p className="mt-2 text-sm font-semibold text-violet-700">
                  {workspace.executiveIntelligence.label} · 100
                </p>
              </div>
              <div className="space-y-2 text-right">
                {workspace.executiveIntelligence.components.map((component) => (
                  <p className="text-xs text-slate-500" key={component.id}>
                    {component.label}: <strong className="text-slate-800">{component.score}</strong>
                  </p>
                ))}
              </div>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            icon={Sparkles}
            subtitle="Diagnóstico comercial explicable"
            title="AI Commercial Intelligence"
            tone="blue"
          >
            <h2 className="text-lg font-semibold text-slate-950">
              {workspace.executiveIntelligence.headline}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Diagnóstico</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{workspace.executiveIntelligence.diagnosis}</p>
              </article>
              <article className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Enfoque principal</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{workspace.executiveIntelligence.primaryFocus}</p>
              </article>
              <article className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Siguiente paso</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{workspace.executiveIntelligence.nextStep}</p>
              </article>
            </div>
          </WorkspaceSection>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <WorkspaceSection
            icon={Gauge}
            subtitle={`Confianza ${workspace.forecast.confidenceLabel}`}
            title="Forecast de cierre"
            tone={workspace.forecast.status === 'critical' ? 'rose' : workspace.forecast.status === 'at-risk' ? 'amber' : 'emerald'}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold text-slate-950">{workspace.forecast.projectedRevenueLabel}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">Proyección · {workspace.forecast.statusLabel}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">Cumplimiento esperado</p>
                <p className="mt-1 font-semibold text-slate-800">{workspace.forecast.projectedAttainmentLabel}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Objetivo</p><strong>{workspace.forecast.revenueTargetLabel}</strong></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Probabilidad</p><strong>{workspace.forecast.achievementProbabilityLabel}</strong></div>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            icon={CalendarDays}
            subtitle="Avance contra calendario laboral"
            title="Daily Pace"
            tone="blue"
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Laborables</p><strong>{workspace.forecast.workingDaysLabel}</strong></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Transcurridos</p><strong>{workspace.forecast.elapsedWorkingDaysLabel}</strong></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Restantes</p><strong>{workspace.forecast.remainingWorkingDaysLabel}</strong></div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Avance esperado</span><strong>{workspace.forecast.expectedProgressLabel}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Avance real</span><strong>{workspace.forecast.actualProgressLabel}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Índice de ritmo</span><strong>{workspace.forecast.paceIndexLabel}</strong></div>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            icon={TrendingUp}
            subtitle="Brecha y ritmo requerido"
            title="Gap Analysis"
            tone="amber"
          >
            <div className="space-y-4 text-sm">
              <div><p className="text-slate-400">Brecha restante</p><p className="text-2xl font-semibold text-slate-950">{workspace.forecast.revenueGapLabel}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Ritmo diario actual</p><strong>{workspace.forecast.currentDailyRevenueLabel}</strong></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Ritmo diario requerido</p><strong>{workspace.forecast.requiredDailyRevenueLabel}</strong></div>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3"><span className="text-slate-500">Variación contra plan</span><strong>{workspace.forecast.revenueVarianceToPaceLabel}</strong></div>
            </div>
          </WorkspaceSection>
        </div>

        <WorkspaceSection
          className="mt-6"
          icon={ClipboardList}
          subtitle="Agenda ejecutiva priorizada por impacto, urgencia y probabilidad"
          title="Executive Action Center"
          tone="violet"
        >
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
            <div className="space-y-4">
              <article className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Briefing de hoy</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">{workspace.actionCenter.dailyBrief.greeting}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-violet-900">{workspace.actionCenter.dailyBrief.headline}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{workspace.actionCenter.dailyBrief.situation}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{workspace.actionCenter.dailyBrief.objective}</p>
                <div className="mt-4 rounded-xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prioridad inmediata</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{workspace.actionCenter.dailyBrief.recommendation}</p>
                </div>
              </article>

              <div className="grid grid-cols-2 gap-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-4">
                  <CircleDollarSign className="text-rose-500" size={20} />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Brecha de venta</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{workspace.actionCenter.revenueGapLabel}</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-white p-4">
                  <TrendingUp className="text-emerald-500" size={20} />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Recuperación esperada</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{workspace.actionCenter.expectedCustomerRecoveryLabel}</p>
                  <p className="mt-1 text-xs text-emerald-700">Cubre {workspace.actionCenter.coverageOfGapLabel} de la brecha</p>
                </article>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-950">Agenda priorizada</h3>
                  <p className="text-sm text-slate-500">Clientes, productos y acciones a ejecutar</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{workspace.actionCenter.agenda.length} acciones</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {workspace.actionCenter.agenda.slice(0, 6).map((item) => (
                  <article className="rounded-2xl border border-slate-200 bg-white p-4" key={`${item.type}-${item.rank}-${item.entityId ?? item.title}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-violet-600">#{item.rank} · {item.typeLabel}</p>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700">{item.urgencyLabel}</span>
                    </div>
                    {item.type === 'customer' && item.entityId ? (
                      <Link
                        className="mt-2 block font-semibold text-slate-950 hover:text-violet-700"
                        to={`/customers/${encodeURIComponent(item.entityId)}?brand=${encodeURIComponent(workspace.header.brandId)}`}
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <h4 className="mt-2 font-semibold text-slate-950">{item.title}</h4>
                    )}
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">Prob. {item.probabilityLabel}</span>
                      {item.estimatedRevenueImpactLabel && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Impacto {item.estimatedRevenueImpactLabel}</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </WorkspaceSection>

        <WorkspaceGrid
          className="mt-6"
          columns={5}
        >
          {workspace.cards.map((card) => (
            <BrandKpiCard
              card={card}
              key={card.id}
            />
          ))}
        </WorkspaceGrid>

        <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <WorkspaceSection
            icon={Sparkles}
            subtitle={workspace.brief.title}
            title="Executive Brief"
            tone="violet"
          >
            <p className="text-base leading-7 text-slate-700">
              {workspace.brief.summary}
            </p>

            {workspace.brief.highlights.length > 0 && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {workspace.brief.highlights.map((highlight) => (
                  <article
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    key={highlight.code}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {highlight.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {highlight.description}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </WorkspaceSection>

          <WorkspaceSection
            icon={Target}
            subtitle="Commercial Priority Score"
            title="Prioridad comercial"
            tone={workspace.priority.level === 'critical' ? 'rose' : workspace.priority.level === 'high' ? 'amber' : 'violet'}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-semibold tracking-tight text-slate-950">
                  {workspace.priority.score}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Nivel {workspace.priority.label}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Escala
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  0–100
                </p>
              </div>
            </div>

            {workspace.priority.reasons.length > 0 && (
              <div className="mt-5 space-y-2 border-t border-slate-200 pt-4">
                {workspace.priority.reasons.slice(0, 3).map((reason) => (
                  <div className="flex items-start justify-between gap-3 text-xs" key={reason.code}>
                    <span className="leading-5 text-slate-500">{reason.message}</span>
                    <strong className="shrink-0 text-slate-700">+{reason.impact.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
            )}
          </WorkspaceSection>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <WorkspaceSection
            icon={CircleHelp}
            subtitle="Razones generadas por el Decision Engine"
            title="Why"
            tone="blue"
          >
            <div className="space-y-3">
              {workspace.why.map((reason) => (
                <p
                  className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm leading-6 text-blue-900"
                  key={reason}
                >
                  {reason}
                </p>
              ))}

              {workspace.why.length === 0 && (
                <p className="text-sm text-slate-500">
                  No existen razones de atención para el periodo.
                </p>
              )}
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            icon={ShieldAlert}
            subtitle="Señales que requieren seguimiento"
            title="Riesgos"
            tone="rose"
          >
            <div className="space-y-3">
              {workspace.risks.map((risk) => (
                <article
                  className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4"
                  key={risk.code}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-rose-900">
                      {risk.title}
                    </p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${risk.severity === 'critical' ? 'bg-rose-600 text-white' : risk.severity === 'attention' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {risk.severityLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-rose-700">
                    {risk.description}
                  </p>
                </article>
              ))}

              {workspace.risks.length === 0 && (
                <p className="text-sm text-slate-500">
                  No se identificaron riesgos relevantes.
                </p>
              )}
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            icon={Lightbulb}
            subtitle="Palancas comerciales disponibles"
            title="Oportunidades"
            tone="emerald"
          >
            <div className="space-y-3">
              {workspace.opportunities.map((opportunity) => (
                <article
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
                  key={opportunity.code}
                >
                  <p className="text-sm font-semibold text-emerald-900">
                    {opportunity.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-700">
                    {opportunity.description}
                  </p>
                </article>
              ))}

              {workspace.opportunities.length === 0 && (
                <p className="text-sm text-slate-500">
                  No se identificaron oportunidades específicas.
                </p>
              )}
            </div>
          </WorkspaceSection>
        </div>

        <WorkspaceSection
          className="mt-6"
          icon={BarChart3}
          subtitle="Periodo anterior contra periodo actual"
          title="Comparativo comercial"
          tone="blue"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            {workspace.charts.comparison.map((point) => (
              <article
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                key={point.periodId}
              >
                <h3 className="font-semibold text-slate-950">
                  {point.periodId}
                </h3>

                <div className="mt-5 space-y-5">
                  <div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">Venta</span>
                      <span className="flex items-center gap-2">
                        {point.revenueChangeLabel && (
                          <small className={`font-semibold ${point.revenueChangeLabel.startsWith('↓') ? 'text-rose-600' : 'text-emerald-600'}`}>{point.revenueChangeLabel}</small>
                        )}
                        <strong className="text-slate-900">{point.revenueLabel}</strong>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${point.revenueWidth}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">GP</span>
                      <span className="flex items-center gap-2">
                        {point.grossProfitChangeLabel && (
                          <small className={`font-semibold ${point.grossProfitChangeLabel.startsWith('↓') ? 'text-rose-600' : 'text-emerald-600'}`}>{point.grossProfitChangeLabel}</small>
                        )}
                        <strong className="text-slate-900">{point.grossProfitLabel}</strong>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${point.grossProfitWidth}%` }} />
                    </div>
                  </div>

                  <dl className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-white p-3">
                      <dt className="text-xs text-slate-400">Margen</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">{point.grossMarginLabel}</dd>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <dt className="text-xs text-slate-400">Clientes</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">{point.customersLabel}</dd>
                      {point.customersChangeLabel && <p className={`mt-1 text-[10px] font-semibold ${point.customersChangeLabel.startsWith('↓') ? 'text-rose-600' : 'text-emerald-600'}`}>{point.customersChangeLabel}</p>}
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <dt className="text-xs text-slate-400">Productos</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">{point.productsLabel}</dd>
                      {point.productsChangeLabel && <p className={`mt-1 text-[10px] font-semibold ${point.productsChangeLabel.startsWith('↓') ? 'text-rose-600' : 'text-emerald-600'}`}>{point.productsChangeLabel}</p>}
                    </div>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </WorkspaceSection>

        <WorkspaceSection
          className="mt-6"
          icon={AlertTriangle}
          subtitle="Acciones ordenadas por prioridad"
          title="Recommended Actions"
          tone="amber"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspace.prioritizedActions.map((action) => (
              <article
                className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5"
                key={action.code}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                    #{action.rank} · Urgencia {action.urgencyLabel}
                  </p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Prob. {action.probabilityLabel}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-slate-950">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {action.description}
                </p>
                {action.estimatedRevenueImpactLabel && (
                  <p className="mt-4 text-sm font-semibold text-emerald-700">
                    Impacto potencial {action.estimatedRevenueImpactLabel}
                  </p>
                )}
              </article>
            ))}
          </div>
        </WorkspaceSection>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <WorkspaceSection
            icon={Users}
            subtitle="Clientes activos en el periodo anterior sin compra actual"
            title="Lost Customers"
            tone="rose"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 pr-4">Cliente</th>
                    <th className="pb-3 pr-4">Venta previa</th>
                    <th className="pb-3 pr-4">GP previo</th>
                    <th className="pb-3 pr-4">Cantidad</th>
                    <th className="pb-3">Documentos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workspace.tables.lostCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        <Link
                          className="hover:text-violet-700"
                          to={`/customers/${encodeURIComponent(customer.id)}?brand=${encodeURIComponent(workspace.header.brandId)}`}
                        >
                          {customer.customerName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{customer.previousRevenue}</td>
                      <td className="py-3 pr-4 text-slate-600">{customer.previousGrossProfit}</td>
                      <td className="py-3 pr-4 text-slate-600">{customer.previousQuantity}</td>
                      <td className="py-3 text-slate-600">{customer.previousDocuments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {workspace.tables.lostCustomers.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  No existen clientes perdidos en el comparativo.
                </p>
              )}
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            icon={PackageSearch}
            subtitle="Productos activos en el periodo anterior sin actividad actual"
            title="Lost Products"
            tone="amber"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {workspace.tables.lostProducts.map((product) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={product.id}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {product.id}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {product.productModel}
                  </p>
                </article>
              ))}
            </div>

            {workspace.tables.lostProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No existen productos perdidos en el comparativo.
              </p>
            )}
          </WorkspaceSection>
        </div>
      </div>
    </main>
  )
}
