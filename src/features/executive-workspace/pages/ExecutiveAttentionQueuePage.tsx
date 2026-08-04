import type {
  LucideIcon,
} from 'lucide-react'

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  PackageSearch,
  Search,
  TrendingDown,
  Users,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import {
  WorkspaceHeader,
} from '../../../components/workspace/header'

import {
  formatBusinessCurrency,
} from '../../../core/business'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

import {
  ExecutiveAttentionContextBanner,
} from '../components/ExecutiveAttentionContextBanner'

import {
  buildExecutivePeriodView,
} from '../engine/executivePeriodView'

import {
  filterExecutiveAttentionEntities,
  getExecutiveAttentionSignals,
  isExecutiveAttentionDomain,
  parseExecutiveAttentionRequest,
} from '../navigation/executiveAttentionNavigation'

import type {
  ExecutiveAttentionDomain,
  ExecutiveAttentionSignal,
} from '../navigation/executiveAttentionNavigation'

const PAGE_SIZE = 60

interface QueueItem {
  id: string
  title: string
  subtitle: string
  detail: string
  detailPath: string
  signals:
    readonly ExecutiveAttentionSignal[]
}

interface DomainConfiguration {
  label: string
  labelPlural: string
  description: string
  basePath: string
  icon: LucideIcon
  tone:
    'amber' |
    'violet' |
    'blue'
}

const DOMAIN_CONFIGURATION:
  Record<
    ExecutiveAttentionDomain,
    DomainConfiguration
  > = {
    products: {
      label: 'producto',
      labelPlural: 'productos',
      description:
        'Productos en caída, inactivos o perdidos dentro del periodo seleccionado en el Executive Workspace.',
      basePath: '/products',
      icon: PackageSearch,
      tone: 'amber',
    },
    brands: {
      label: 'marca',
      labelPlural: 'marcas',
      description:
        'Marcas con deterioro comercial o pérdida de actividad dentro del corte seleccionado.',
      basePath: '/brands',
      icon: Building2,
      tone: 'violet',
    },
    customers: {
      label: 'cliente',
      labelPlural: 'clientes',
      description:
        'Clientes en caída, inactivos o perdidos conforme al ciclo de vida comercial y al periodo seleccionado.',
      basePath: '/customers',
      icon: Users,
      tone: 'blue',
    },
  }

function normalizeSearch(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
}

function formatPercentage(
  value: number | null,
): string {
  if (value === null) {
    return 'Sin comparación'
  }

  return `${value >= 0 ? '+' : ''}${value.toLocaleString('es-MX', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function signalPriority(
  signals:
    readonly ExecutiveAttentionSignal[],
): number {
  if (signals.includes('inactive_or_lost')) {
    return 2
  }

  if (signals.includes('declining')) {
    return 1
  }

  return 0
}

function buildQueueItems(
  domain: ExecutiveAttentionDomain,
  context:
    ReturnType<typeof useWorkspaceContext>,
  periodView:
    ReturnType<typeof buildExecutivePeriodView>,
): QueueItem[] {
  const repository = context.repository

  if (!repository) {
    return []
  }

  if (domain === 'products') {
    const summary =
      periodView.attention.products

    return filterExecutiveAttentionEntities(
      repository.product.getAll(),
      summary,
      (product) => product.id,
    ).map((product) => ({
      id: product.id,
      title: product.model || product.id,
      subtitle: [
        product.brand,
        product.sku || product.id,
      ].filter(Boolean).join(' · '),
      detail: `${product.customers.size.toLocaleString('es-MX')} clientes históricos`,
      detailPath:
        `/products/${encodeURIComponent(product.id)}`,
      signals:
        getExecutiveAttentionSignals(
          product.id,
          summary,
        ),
    }))
  }

  if (domain === 'brands') {
    const summary =
      periodView.attention.brands

    return filterExecutiveAttentionEntities(
      periodView.brands?.brands ?? [],
      summary,
      (brand) => brand.brandId,
    ).map((brand) => ({
      id: brand.brandId,
      title: brand.brandName,
      subtitle:
        brand.attentionReason ??
        'Requiere revisión comercial.',
      detail: `${formatBusinessCurrency(brand.currentPeriod.revenue)} · ${formatPercentage(brand.revenueVariationPercentage)}`,
      detailPath:
        `/brands/${encodeURIComponent(brand.brandId)}`,
      signals:
        getExecutiveAttentionSignals(
          brand.brandId,
          summary,
        ),
    }))
  }

  const summary =
    periodView.attention.customers

  return filterExecutiveAttentionEntities(
    repository.customer.getAll(),
    summary,
    (customer) => customer.id,
  ).map((customer) => ({
    id: customer.id,
    title: customer.name || customer.id,
    subtitle: customer.id,
    detail: `${customer.brands.size.toLocaleString('es-MX')} marcas · ${customer.products.size.toLocaleString('es-MX')} productos`,
    detailPath:
      `/customers/${encodeURIComponent(customer.id)}`,
    signals:
      getExecutiveAttentionSignals(
        customer.id,
        summary,
      ),
  }))
}

function SignalBadges({
  signals,
}: {
  signals:
    readonly ExecutiveAttentionSignal[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {signals.includes('declining') && (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
          <TrendingDown size={12} />
          En caída
        </span>
      )}

      {signals.includes('inactive_or_lost') && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
          <AlertTriangle size={12} />
          Inactivo o perdido
        </span>
      )}
    </div>
  )
}

function ExecutiveAttentionQueueContent({
  domain,
}: {
  domain: ExecutiveAttentionDomain
}) {
  const context = useWorkspaceContext()
  const [searchParameters] =
    useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const configuration =
    DOMAIN_CONFIGURATION[domain]
  const request =
    parseExecutiveAttentionRequest(
      searchParameters,
    )

  const periodView = useMemo(
    () =>
      buildExecutivePeriodView(
        context.repository,
        {
          anchorPeriodId:
            request.anchorPeriodId,
          preset: request.preset,
        },
      ),
    [
      context.repository,
      request.anchorPeriodId,
      request.preset,
    ],
  )

  const queueItems = useMemo(
    () =>
      buildQueueItems(
        domain,
        context,
        periodView,
      ),
    [domain, context, periodView],
  )

  const filteredItems = useMemo(() => {
    const normalized = normalizeSearch(query)

    return [...queueItems]
      .filter(
        (item) =>
          !normalized ||
          item.id
            .toLocaleUpperCase('es-MX')
            .includes(normalized) ||
          item.title
            .toLocaleUpperCase('es-MX')
            .includes(normalized) ||
          item.subtitle
            .toLocaleUpperCase('es-MX')
            .includes(normalized),
      )
      .sort(
        (left, right) =>
          signalPriority(right.signals) -
            signalPriority(left.signals) ||
          left.title.localeCompare(
            right.title,
            'es-MX',
          ),
      )
  }, [query, queueItems])

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredItems.length / PAGE_SIZE,
    ),
  )

  const safePage = Math.min(
    page,
    totalPages,
  )

  const visibleItems = filteredItems.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const summary =
    periodView.attention[domain]

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
        <WorkspaceHeader
          connected={Boolean(context.repository)}
          connectedLabel="Filtro ejecutivo aplicado"
          description={configuration.description}
          eyebrow="Executive Attention Queue"
          icon={configuration.icon}
          metadata={(
            <span className="text-sm font-medium text-slate-500">
              {periodView.selection.currentLabel} vs. {periodView.selection.comparisonLabel}
            </span>
          )}
          title={`${configuration.labelPlural.charAt(0).toUpperCase()}${configuration.labelPlural.slice(1)} que requieren atención`}
          tone={configuration.tone}
        />

        <ExecutiveAttentionContextBanner
          basePath={configuration.basePath}
          entityLabel={configuration.labelPlural}
          resultCount={summary.entitiesRequiringAttention}
          selection={periodView.selection}
        />

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 lg:max-w-2xl">
              <Search className="shrink-0 text-slate-400" size={20} />
              <input
                className="w-full bg-transparent text-sm outline-none"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder={`Buscar ${configuration.labelPlural} dentro de la cola de atención`}
                value={query}
              />
            </label>

            <p className="text-sm font-medium text-slate-500">
              {filteredItems.length.toLocaleString('es-MX')} resultados
            </p>
          </div>

          {visibleItems.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <Link
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:shadow-sm"
                  key={item.id}
                  to={item.detailPath}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                        {item.subtitle}
                      </p>
                      <h2 className="mt-2 truncate font-semibold text-slate-950">
                        {item.title}
                      </h2>
                    </div>

                    <ArrowRight className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-600" size={18} />
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    {item.detail}
                  </p>

                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <SignalBadges signals={item.signals} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Search className="mx-auto text-slate-300" size={34} />
              <h2 className="mt-3 font-semibold text-slate-900">
                No hay resultados para este filtro
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ajusta la búsqueda o vuelve al Executive Workspace para seleccionar otro periodo.
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safePage <= 1}
                onClick={() => setPage(
                  Math.max(1, safePage - 1),
                )}
                type="button"
              >
                Anterior
              </button>

              <span className="text-sm font-medium text-slate-500">
                Página {safePage} de {totalPages}
              </span>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safePage >= totalPages}
                onClick={() => setPage(
                  Math.min(
                    totalPages,
                    safePage + 1,
                  ),
                )}
                type="button"
              >
                Siguiente
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export function ExecutiveAttentionQueuePage() {
  const { domain } = useParams()

  if (!isExecutiveAttentionDomain(domain)) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto text-amber-500" size={36} />
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            Cola de atención no disponible
          </h1>
          <Link
            className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            to="/"
          >
            Volver al Executive Workspace
          </Link>
        </div>
      </main>
    )
  }

  return (
    <ExecutiveAttentionQueueContent
      domain={domain}
    />
  )
}

