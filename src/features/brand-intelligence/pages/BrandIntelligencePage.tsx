import { BrandCommercialPlan } from '../components/BrandCommercialPlan'

import {
  AlertTriangle,
  BrainCircuit,
  CircleHelp,
  ClipboardList,
  CircleDollarSign,
  Lightbulb,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  WorkspaceSection,
} from '../../../components/workspace/section'

import {
  useBrandIntelligenceWorkspace,
} from '../hooks/useBrandIntelligenceWorkspace'

/**
 * MB-001B: Inteligencia tab. It is rendered inside BrandFrame (title, team,
 * period and tabs), so it has no page shell, no back link and no brand header
 * of its own. It shows the Decision Core diagnosis: Executive Score, AI Commercial
 * Intelligence, Executive Action Center, Executive Brief, Prioridad comercial,
 * Why, Riesgos, Oportunidades and Recommended Actions. The forecast, pace,
 * gap, KPI row, commercial comparison and lost customers / products live in
 * the Ventas, Clientes and Productos tabs (served by the server).
 */
export function BrandIntelligencePage() {
  const {
    accessDenied,
    brandId,
    workspace,
  } = useBrandIntelligenceWorkspace()

  if (accessDenied) {
    return (
      <div
        data-brand-intelligence-state="access-denied"
        className="flex flex-col items-center py-12 text-center"
      >
        <ShieldAlert
          className="text-amber-500"
          size={40}
          strokeWidth={1.8}
        />

        <h2 className="mt-4 text-xl font-semibold text-slate-900">
          Acceso restringido
        </h2>

        <p className="mt-2 max-w-xl text-sm text-slate-500">
          La marca {brandId ?? 'seleccionada'} no está asignada a tu usuario.
        </p>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div
        data-brand-intelligence-state="unavailable"
        className="flex flex-col items-center py-12 text-center"
      >
        <h2 className="text-xl font-semibold text-slate-900">
          Inteligencia de la marca no disponible
        </h2>

        <p className="mt-2 max-w-xl text-sm text-slate-500">
          No fue posible construir el diagnóstico de la marca “{brandId ?? 'sin identificar'}”. Verifica que exista información comercial importada para el periodo actual.
        </p>
      </div>
    )
  }

  return (
    <div data-brand-intelligence="embedded">
      <div>
        <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
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
                <BrandCommercialPlan workspace={workspace} request={workspace.prioritizedActions[0] ?? { title: 'Siguiente paso comercial', description: workspace.executiveIntelligence.nextStep }} />
              </article>
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
                  <BrandCommercialPlan workspace={workspace} request={workspace.actionCenter.agenda[0] ?? workspace.prioritizedActions[0] ?? { title: 'Prioridad inmediata', description: workspace.actionCenter.dailyBrief.recommendation }} />
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
                    <BrandCommercialPlan workspace={workspace} request={item} />
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
                <BrandCommercialPlan workspace={workspace} request={action} />
                {action.estimatedRevenueImpactLabel && (
                  <p className="mt-4 text-sm font-semibold text-emerald-700">
                    Impacto potencial {action.estimatedRevenueImpactLabel}
                  </p>
                )}
              </article>
            ))}
          </div>
        </WorkspaceSection>

      </div>
    </div>
  )
}
