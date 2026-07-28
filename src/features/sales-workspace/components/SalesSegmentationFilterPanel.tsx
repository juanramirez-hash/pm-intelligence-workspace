import type {
  ReactNode,
} from 'react'

import {
  Building2,
  MapPin,
  Package,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react'

import type {
  SalesWorkspaceActiveFilter,
  SalesWorkspaceFilterDimension,
  SalesWorkspaceFilterOption,
  SalesWorkspaceFilterOptions,
  SalesWorkspaceFilters,
} from '../types'

interface SalesSegmentationFilterPanelProps {
  filters: SalesWorkspaceFilters
  options: SalesWorkspaceFilterOptions
  activeFilters: SalesWorkspaceActiveFilter[]
  onSearchTermChange: (value: string) => void
  onDimensionChange: (
    dimension: SalesWorkspaceFilterDimension,
    values: string[],
  ) => void
  onClearDimension: (
    dimension: SalesWorkspaceFilterDimension | 'search',
  ) => void
  onReset: () => void
}

function DimensionSelect({
  label,
  icon,
  options,
  value,
  onChange,
}: {
  label: string
  icon: ReactNode
  options: SalesWorkspaceFilterOption[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-600">
        {icon}
        {label}
      </span>

      <select
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        onChange={(event) =>
          onChange(event.target.value)
        }
        value={value}
      >
        <option value="">
          Todos
        </option>

        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function SalesSegmentationFilterPanel({
  filters,
  options,
  activeFilters,
  onSearchTermChange,
  onDimensionChange,
  onClearDimension,
  onReset,
}: SalesSegmentationFilterPanelProps) {
  return (
    <section
      aria-label="Segmentación comercial"
      className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-4 shadow-sm sm:p-5"
      data-sales-workspace-component="segmentation-filter-panel"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
            Segmentación y drill-down
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            Explora el corte por dimensión comercial
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Combina marca, cliente, producto, ubicación y vendedor. Todos los indicadores se recalculan sobre el mismo segmento.
          </p>
        </div>

        {activeFilters.length > 0 && (
          <button
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
            onClick={onReset}
            type="button"
          >
            <X size={15} />
            Limpiar segmentación
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <label className="block min-w-0">
          <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Search size={14} />
            Buscar ID o nombre
          </span>

          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            onChange={(event) =>
              onSearchTermChange(
                event.target.value,
              )
            }
            placeholder="Cliente, producto, marca..."
            type="search"
            value={filters.searchTerm ?? ''}
          />
        </label>

        <DimensionSelect
          icon={<Building2 size={14} />}
          label="Marca"
          onChange={(value) =>
            onDimensionChange(
              'brand',
              value ? [value] : [],
            )
          }
          options={options.brands}
          value={filters.brandIds?.[0] ?? ''}
        />

        <DimensionSelect
          icon={<Users size={14} />}
          label="Cliente"
          onChange={(value) =>
            onDimensionChange(
              'customer',
              value ? [value] : [],
            )
          }
          options={options.customers}
          value={filters.customerIds?.[0] ?? ''}
        />

        <DimensionSelect
          icon={<Package size={14} />}
          label="Producto"
          onChange={(value) =>
            onDimensionChange(
              'product',
              value ? [value] : [],
            )
          }
          options={options.products}
          value={filters.productIds?.[0] ?? ''}
        />

        <DimensionSelect
          icon={<MapPin size={14} />}
          label="Ubicación"
          onChange={(value) =>
            onDimensionChange(
              'location',
              value ? [value] : [],
            )
          }
          options={options.locations}
          value={filters.locationIds?.[0] ?? ''}
        />

        <DimensionSelect
          icon={<UserRound size={14} />}
          label="Vendedor"
          onChange={(value) =>
            onDimensionChange(
              'salesRepresentative',
              value ? [value] : [],
            )
          }
          options={options.salesRepresentatives}
          value={
            filters.salesRepresentativeIds?.[0] ?? ''
          }
        />
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-blue-100 pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Filtros activos
          </span>

          {activeFilters.map((filter) => (
            <button
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
              key={`${filter.dimension}:${filter.id}`}
              onClick={() =>
                onClearDimension(
                  filter.dimension,
                )
              }
              title="Quitar filtro"
              type="button"
            >
              {filter.label}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
