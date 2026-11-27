// MB-001C: "Año contra año de la cartera" panel of the Marcas directory. It is
// the same comparison as the Ventas tab of a brand (BrandYearComparison), for
// the brands of the "Mis marcas / Todas" selector of the page. Its own call
// (/api/brand-portfolio/year-over-year), loading and error: a failure here does
// not affect the directory table.
//
// Mis marcas: open by default (the call is fast). Todas: collapsed with a
// "Ver comparativo" button, because the whole portfolio takes about 2 s; the
// call is made only when the user clicks, shows "Calculando comparativo de toda
// la cartera…" while it loads and, once open, reloads when the period changes.
// Going back to Mis marcas opens it automatically again.

import {
  useState,
} from 'react'

import {
  loadBrandPortfolioYearOverYear,
} from '../api/brandsApi'

import type {
  BrandPortfolioYearResponse,
  MyDayView,
} from '../api/brandsTypes'

import {
  PORTFOLIO_LOADING_ALL,
  brandReasonMessage,
  costHiddenNote,
  portfolioRequestKey,
  portfolioSubtitle,
} from '../format/brandsFormat'

import {
  MyDayBlock,
  type MyDayBlockStatus,
} from '../../my-day/components/MyDayBlock'

import {
  useMyDayBlock,
} from '../../my-day/hooks/useMyDayBlock'

import {
  YearComparison,
} from './BrandYearComparison'

interface PortfolioViewProps {
  view: MyDayView
  // Todas starts collapsed: nothing is requested until the user opens it.
  collapsed?: boolean
  onExpand?: () => void
  status: 'loading' | 'success' | 'error'
  data: BrandPortfolioYearResponse | null
  error: Error | null
  onRetry: () => void
}

const NOTE =
  'Mes equivalente, acumulado del año y cierre anual. Clientes, productos y documentos son distintos sobre toda la cartera, no la suma de las marcas.'

/** Presentational part (static markup in the tests). */
export function BrandPortfolioPanelView({
  view,
  collapsed = false,
  onExpand,
  status,
  data,
  error,
  onRetry,
}: PortfolioViewProps) {
  if (collapsed) {
    return (
      <MyDayBlock
        title="Año contra año de la cartera"
        subtitle={portfolioSubtitle(view, null)}
        note={NOTE}
        status="ready"
      >
        <div data-brand-portfolio-collapsed={view} className="flex flex-col items-start gap-2">
          <p className="text-sm text-slate-600">
            Calcular la cartera completa tarda unos segundos, por eso no se carga sola.
          </p>
          <button
            type="button"
            data-brand-portfolio-expand="true"
            onClick={onExpand}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Ver comparativo
          </button>
        </div>
      </MyDayBlock>
    )
  }

  const reason = brandReasonMessage(data?.reason)
  // Todas: while it computes (also when the period changes) say so, and do not
  // show the previous period's numbers as if they were current.
  const calculating = view === 'all' && status === 'loading'
  const blockStatus: MyDayBlockStatus = calculating
    ? 'ready'
    : status === 'success'
      ? (data?.yearOverYear ? 'ready' : 'empty')
      : status

  return (
    <MyDayBlock
      title="Año contra año de la cartera"
      subtitle={portfolioSubtitle(view, data?.brandCount)}
      note={NOTE}
      warnings={[!calculating && data?.costHidden ? costHiddenNote('portfolio') : null]}
      status={blockStatus}
      errorMessage={error?.message}
      onRetry={onRetry}
      emptyMessage={reason ?? 'No hay información para comparar.'}
    >
      {calculating ? (
        <p data-brand-portfolio-loading="true" className="py-6 text-center text-sm text-slate-500">
          {PORTFOLIO_LOADING_ALL}
        </p>
      ) : (
        <div data-brand-portfolio={view}>
          <YearComparison data={data?.yearOverYear ?? undefined} />
        </div>
      )}
    </MyDayBlock>
  )
}

function PortfolioPanel({
  view,
  period,
}: {
  view: MyDayView
  period: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  // Mis marcas loads right away; Todas only after the click (null = no call).
  const requestKey = portfolioRequestKey(view, expanded, period)
  const active = requestKey !== null
  const block = useMyDayBlock<BrandPortfolioYearResponse>(
    requestKey,
    (signal) => loadBrandPortfolioYearOverYear({ view, period }, signal),
  )

  return (
    <BrandPortfolioPanelView
      view={view}
      collapsed={!active}
      onExpand={() => setExpanded(true)}
      status={block.status}
      data={block.data}
      error={block.error}
      onRetry={block.reload}
    />
  )
}

/**
 * keyed by the view: changing Mis marcas / Todas starts fresh, so Todas is
 * collapsed again and Mis marcas opens by itself.
 */
export function BrandPortfolioPanel({
  view,
  period,
}: {
  view: MyDayView
  period: string | null
}) {
  return <PortfolioPanel key={view} view={view} period={period} />
}
