import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  Building2,
  Search,
  Users,
  PackageSearch,
  WalletCards,
} from 'lucide-react'

import type {
  BrandIntelligenceItem,
  BrandLifecycleStatus,
  BrandTrendStatus,
} from '../../../core/analytics/brands'

import type {
  BrandLifecycleFilter,
  BrandTrendFilter,
  BrandWorkspaceFilters,
  BrandWorkspaceSortDirection,
  BrandWorkspaceSortField,
} from '../../../features/brand-workspace/types/brandWorkspaceTypes'

export interface SmartBrandDirectoryProps {
  brands: BrandIntelligenceItem[]
  totalBrands: number
  filters: BrandWorkspaceFilters
  sortField: BrandWorkspaceSortField
  sortDirection: BrandWorkspaceSortDirection
  selectedBrandId?: string | null
  onSearchChange: (value: string) => void
  onLifecycleChange: (value: BrandLifecycleFilter) => void
  onTrendChange: (value: BrandTrendFilter) => void
  onAttentionChange: (value: boolean) => void
  onSortFieldChange: (value: BrandWorkspaceSortField) => void
  onSortDirectionChange: (value: BrandWorkspaceSortDirection) => void
  onResetFilters: () => void
  onSelectBrand: (brandId: string) => void
}

const lifecycleLabels: Record<BrandLifecycleStatus, string> = {
  active: 'Activa',
  new: 'Nueva',
  recovered: 'Recuperada',
  inactive: 'Inactiva',
  lost: 'Perdida',
}

const lifecycleStyles: Record<BrandLifecycleStatus, string> = {
  active: 'bg-blue-50 text-blue-700 ring-blue-100',
  new: 'bg-violet-50 text-violet-700 ring-violet-100',
  recovered: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  lost: 'bg-rose-50 text-rose-700 ring-rose-100',
}

const trendLabels: Record<BrandTrendStatus, string> = {
  growing: 'Crecimiento',
  declining: 'Descenso',
  stable: 'Estable',
  without_comparison: 'Sin comparación',
}

function formatCurrency(value: number) {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function formatNumber(value: number) {
  return value.toLocaleString('es-MX', {
    maximumFractionDigits: 0,
  })
}

function formatPercentage(value: number | null) {
  if (value === null) return '—'
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('es-MX', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function TrendBadge({ brand }: { brand: BrandIntelligenceItem }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold'

  if (brand.trendStatus === 'growing') {
    return <span className={`${base} bg-emerald-50 text-emerald-700`}><ArrowUpRight size={14} />{formatPercentage(brand.revenueVariationPercentage)}</span>
  }

  if (brand.trendStatus === 'declining') {
    return <span className={`${base} bg-rose-50 text-rose-700`}><ArrowDownRight size={14} />{formatPercentage(brand.revenueVariationPercentage)}</span>
  }

  return <span className={`${base} bg-slate-100 text-slate-600`}>{trendLabels[brand.trendStatus]}</span>
}

function BrandDirectoryCard({
  brand,
  selected,
  onSelect,
}: {
  brand: BrandIntelligenceItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <article
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition duration-200',
        'hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none',
        selected ? 'border-violet-300 ring-2 ring-violet-100' : 'border-slate-200',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Building2 size={19} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-950">{brand.brandName}</p>
            <p className="mt-1 truncate text-xs text-slate-400">{brand.brandId}</p>
          </div>
        </div>

        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${lifecycleStyles[brand.lifecycleStatus]}`}>
          {lifecycleLabels[brand.lifecycleStatus]}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Venta</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">{formatCurrency(brand.currentPeriod.revenue)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Margen</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatPercentage(brand.currentPeriod.margin)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TrendBadge brand={brand} />
        {brand.requiresAttention && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <AlertTriangle size={13} /> Atención
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        <div>
          <div className="flex items-center gap-1 text-slate-400"><Users size={13} /><span className="text-[10px] uppercase tracking-wide">Clientes</span></div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{formatNumber(brand.currentPeriod.customers)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-slate-400"><PackageSearch size={13} /><span className="text-[10px] uppercase tracking-wide">Productos</span></div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{formatNumber(brand.currentPeriod.products)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-slate-400"><WalletCards size={13} /><span className="text-[10px] uppercase tracking-wide">Part.</span></div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{formatPercentage(brand.revenueParticipation)}</p>
        </div>
      </div>

      {brand.attentionReason && (
        <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">{brand.attentionReason}</p>
      )}

      <button
        className="mt-auto flex w-full items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-violet-700 outline-none transition-colors hover:text-violet-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-4"
        onClick={onSelect}
        type="button"
      >
        Abrir inteligencia de marca
        <ArrowRight className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" size={16} />
      </button>
    </article>
  )
}

export function SmartBrandDirectory(props: SmartBrandDirectoryProps) {
  const {
    brands,
    totalBrands,
    filters,
    sortField,
    sortDirection,
    selectedBrandId,
    onSearchChange,
    onLifecycleChange,
    onTrendChange,
    onAttentionChange,
    onSortFieldChange,
    onSortDirectionChange,
    onResetFilters,
    onSelectBrand,
  } = props

  const activeFilters =
    filters.search.length > 0 ||
    filters.lifecycle !== 'all' ||
    filters.trend !== 'all' ||
    filters.requiresAttention

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 bg-gradient-to-r from-white via-violet-50/50 to-indigo-50/40 px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Smart Brand Directory</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Centro operativo de marcas</h2>
            <p className="mt-1 text-sm text-slate-500">Explora, filtra y abre el contexto completo de cada marca sin perder la visión ejecutiva.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">{brands.length} visibles</span>
            <span className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white">{totalBrands} totales</span>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.4fr)_repeat(3,minmax(150px,.7fr))_auto]">
          <label className="relative block">
            <span className="sr-only">Buscar marca</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por marca o identificador"
              type="search"
              value={filters.search}
            />
          </label>

          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" onChange={(event) => onLifecycleChange(event.target.value as BrandLifecycleFilter)} value={filters.lifecycle}>
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option><option value="new">Nuevas</option><option value="recovered">Recuperadas</option><option value="inactive">Inactivas</option><option value="lost">Perdidas</option>
          </select>

          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" onChange={(event) => onTrendChange(event.target.value as BrandTrendFilter)} value={filters.trend}>
            <option value="all">Todas las tendencias</option>
            <option value="growing">Crecimiento</option><option value="declining">Descenso</option><option value="stable">Estables</option><option value="without_comparison">Sin comparación</option>
          </select>

          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" onChange={(event) => onSortFieldChange(event.target.value as BrandWorkspaceSortField)} value={sortField}>
            <option value="revenue">Ordenar por venta</option><option value="brandName">Nombre</option><option value="revenueVariation">Variación absoluta</option><option value="revenueVariationPercentage">Variación porcentual</option><option value="grossProfit">GP</option><option value="margin">Margen</option><option value="customers">Clientes</option><option value="products">Productos</option><option value="revenueParticipation">Participación</option>
          </select>

          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')} type="button">
            <ArrowUpDown size={16} />{sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
            <input checked={filters.requiresAttention} className="size-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" onChange={(event) => onAttentionChange(event.target.checked)} type="checkbox" />
            Mostrar sólo marcas que requieren atención
          </label>
          {activeFilters && <button className="text-sm font-semibold text-violet-700 hover:text-violet-800" onClick={onResetFilters} type="button">Limpiar filtros</button>}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {brands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <Building2 className="mx-auto text-slate-300" size={34} />
            <p className="mt-3 text-sm font-semibold text-slate-800">No se encontraron marcas</p>
            <p className="mt-1 text-xs text-slate-500">Ajusta la búsqueda o los filtros para mostrar resultados.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {brands.map((brand) => (
              <BrandDirectoryCard brand={brand} key={brand.brandId} onSelect={() => onSelectBrand(brand.brandId)} selected={selectedBrandId === brand.brandId} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
