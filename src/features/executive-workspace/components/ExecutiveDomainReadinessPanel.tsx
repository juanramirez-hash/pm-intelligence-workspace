import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  CircleDashed,
  Clock3,
  PackageSearch,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'

import type {
  LucideIcon,
} from 'lucide-react'

import type {
  ExecutiveDomainId,
  ExecutiveDomainReadiness,
  ExecutiveDomainRegistry,
  ExecutiveDomainStatus,
  ExecutiveWorkspaceHealth,
} from '../types/executiveWorkspaceTypes'

interface ExecutiveDomainReadinessPanelProps {
  domains:
    ExecutiveDomainRegistry

  health:
    ExecutiveWorkspaceHealth
}

interface DomainPresentation {
  icon: LucideIcon

  accent: string

  iconClasses: string
}

const DOMAIN_ORDER:
  readonly ExecutiveDomainId[] = [
  'sales',
  'inventory',
  'forecast',
  'pricing',
  'purchasing',
]

const DOMAIN_PRESENTATION:
  Record<ExecutiveDomainId, DomainPresentation> = {
  sales: {
    icon: TrendingUp,
    accent: 'before:bg-blue-500',
    iconClasses:
      'bg-blue-50 text-blue-600',
  },
  inventory: {
    icon: PackageSearch,
    accent: 'before:bg-cyan-500',
    iconClasses:
      'bg-cyan-50 text-cyan-700',
  },
  forecast: {
    icon: Activity,
    accent: 'before:bg-violet-500',
    iconClasses:
      'bg-violet-50 text-violet-600',
  },
  pricing: {
    icon: BadgeDollarSign,
    accent: 'before:bg-amber-500',
    iconClasses:
      'bg-amber-50 text-amber-700',
  },
  purchasing: {
    icon: ShoppingCart,
    accent: 'before:bg-emerald-500',
    iconClasses:
      'bg-emerald-50 text-emerald-700',
  },
}

const DATASET_LABELS:
  Record<string, string> = {
  sales: 'Ventas',
  salesTargets: 'Objetivos',
  inventory: 'Inventario',
  products: 'Productos',
  projects: 'Proyectos',
  projectBillings: 'Facturación',
  exchangeRates: 'Tipo de cambio',
  businessCalendar: 'Calendario',
  pricing: 'Pricing',
  purchases: 'Órdenes de compra',
  purchaseRequests: 'Solicitudes de compra',
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return 'Sin actualización'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date)
}

function getStatusLabel(
  status: ExecutiveDomainStatus,
): string {
  switch (status) {
    case 'ready':
      return 'Listo'

    case 'partial':
      return 'Parcial'

    case 'blocked':
      return 'Bloqueado'

    default:
      return 'Sin datos'
  }
}

function getStatusClasses(
  status: ExecutiveDomainStatus,
): string {
  switch (status) {
    case 'ready':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'

    case 'partial':
      return 'border-amber-200 bg-amber-50 text-amber-700'

    case 'blocked':
      return 'border-rose-200 bg-rose-50 text-rose-700'

    default:
      return 'border-slate-200 bg-slate-100 text-slate-500'
  }
}

function getStatusIcon(
  status: ExecutiveDomainStatus,
) {
  if (status === 'ready') {
    return (
      <CheckCircle2
        size={14}
        strokeWidth={2.2}
      />
    )
  }

  if (
    status === 'partial' ||
    status === 'blocked'
  ) {
    return (
      <AlertTriangle
        size={14}
        strokeWidth={2.2}
      />
    )
  }

  return (
    <CircleDashed
      size={14}
      strokeWidth={2.2}
    />
  )
}

function getFreshnessLabel(
  domain: ExecutiveDomainReadiness,
): string {
  switch (domain.freshness) {
    case 'current':
      return 'Información vigente'

    case 'stale':
      return 'Requiere actualización'

    default:
      return 'Frescura no disponible'
  }
}

function getDatasetLabel(
  value: string,
): string {
  return DATASET_LABELS[value] ?? value
}

function DomainCard({
  domain,
}: {
  domain: ExecutiveDomainReadiness
}) {
  const presentation =
    DOMAIN_PRESENTATION[domain.id]

  const Icon = presentation.icon

  return (
    <article
      data-domain-id={domain.id}
      className={[
        'relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1',
        presentation.accent,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={[
            'flex size-10 items-center justify-center rounded-xl',
            presentation.iconClasses,
          ].join(' ')}
        >
          <Icon size={20} />
        </div>

        <span
          className={[
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
            getStatusClasses(
              domain.status,
            ),
          ].join(' ')}
        >
          {getStatusIcon(
            domain.status,
          )}

          {getStatusLabel(
            domain.status,
          )}
        </span>
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-950">
        {domain.label}
      </h3>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-slate-950">
            {domain.activeDatasets.length}
            <span className="text-sm font-medium text-slate-400">
              {' '}/ {domain.requiredDatasets.length}
            </span>
          </p>

          <p className="mt-1 text-xs text-slate-500">
            fuentes activas
          </p>
        </div>

        <div className="text-right">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Clock3 size={13} />

            {getFreshnessLabel(domain)}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {formatDateTime(
              domain.lastUpdatedAt,
            )}
          </p>
        </div>
      </div>

      {domain.missingDatasets.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Fuentes pendientes
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-600">
            {domain.missingDatasets
              .map(getDatasetLabel)
              .join(' · ')}
          </p>
        </div>
      ) : (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={14} />

            Cobertura requerida completa
          </p>
        </div>
      )}
    </article>
  )
}

export function ExecutiveDomainReadinessPanel({
  domains,
  health,
}: ExecutiveDomainReadinessPanelProps) {
  const domainItems =
    DOMAIN_ORDER.map(
      (id) => domains[id],
    )

  const readyDomains =
    health.readyDomains ?? 0

  const totalDomains =
    health.totalDomains ??
    domainItems.length

  const coveragePercentage =
    health.domainCoveragePercentage ?? 0

  const purchasing =
    domains.purchasing

  return (
    <section
      data-executive-component="domain-readiness-panel"
    >
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Cobertura multidominio
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Preparación de los Workspaces
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Disponibilidad operativa de Sales,
            Inventory, Forecast, Pricing y la
            futura capacidad de Purchasing.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Dominios listos
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-950">
                {readyDomains} de {totalDomains}
              </p>
            </div>

            <p className="text-2xl font-semibold text-slate-950">
              {coveragePercentage}%
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-700"
              style={{
                width:
                  `${coveragePercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {domainItems.map(
          (domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
            />
          ),
        )}
      </div>

      <div
        className={[
          'mt-5 rounded-2xl border p-5 shadow-sm',
          purchasing.canActivateWorkspace
            ? 'border-emerald-200 bg-emerald-50/60'
            : 'border-amber-200 bg-amber-50/60',
        ].join(' ')}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={[
                'flex size-11 shrink-0 items-center justify-center rounded-xl',
                purchasing.canActivateWorkspace
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700',
              ].join(' ')}
            >
              {purchasing.canActivateWorkspace ? (
                <CheckCircle2 size={21} />
              ) : (
                <AlertTriangle size={21} />
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                Purchasing readiness
              </p>

              <h3 className="mt-1 text-base font-semibold text-slate-950">
                {purchasing.canActivateWorkspace
                  ? 'Purchasing puede activarse'
                  : 'Purchasing todavía no puede activarse'}
              </h3>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                {purchasing.canActivateWorkspace
                  ? 'Las fuentes directas y Forecast cumplen las condiciones de consumo ejecutivo.'
                  : 'La plataforma conserva el módulo bloqueado hasta contar con sus fuentes mínimas y Forecast listo.'}
              </p>
            </div>
          </div>

          <span
            className={[
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
              purchasing.canActivateWorkspace
                ? 'border-emerald-200 bg-white text-emerald-700'
                : 'border-amber-200 bg-white text-amber-700',
            ].join(' ')}
          >
            {purchasing.canActivateWorkspace ? (
              <CheckCircle2 size={14} />
            ) : (
              <CircleDashed size={14} />
            )}

            {purchasing.canActivateWorkspace
              ? 'Ready'
              : 'Readiness pendiente'}
          </span>
        </div>

        {purchasing.limitations.length > 0 && (
          <div className="mt-4 grid gap-2 border-t border-amber-200/70 pt-4 md:grid-cols-2 xl:grid-cols-3">
            {purchasing.limitations.map(
              (limitation) => (
                <div
                  key={limitation}
                  className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs leading-5 text-slate-600"
                >
                  <CircleDashed
                    className="mt-0.5 shrink-0 text-amber-600"
                    size={13}
                  />

                  {limitation}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  )
}
