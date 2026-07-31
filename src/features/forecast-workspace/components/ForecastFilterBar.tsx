import {
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react'

import type {
  ChangeEvent,
} from 'react'

import type {
  ForecastWorkspaceFilterOptions,
  ForecastWorkspaceFilters,
} from '../types/forecastWorkspaceTypes'

export interface ForecastFilterBarProps {
  filters: ForecastWorkspaceFilters
  options: ForecastWorkspaceFilterOptions
  onChange: (filters: ForecastWorkspaceFilters) => void
  onReset: () => void
  disabled?: boolean
}

const coverageLabels: Record<string, string> = {
  unavailable: 'Sin fuente',
  'no-demand': 'Sin demanda',
  stockout: 'Agotado',
  shortage: 'Faltante al cierre',
  low: 'Cobertura baja',
  balanced: 'Balanceado',
  excess: 'Exceso',
}

const priorityLabels: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  none: 'Sin señal',
}

const confidenceLabels: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export function ForecastFilterBar({
  filters,
  options,
  onChange,
  onReset,
  disabled = false,
}: ForecastFilterBarProps) {
  const update = <Key extends keyof ForecastWorkspaceFilters>(
    key: Key,
    value: ForecastWorkspaceFilters[Key],
  ) => {
    onChange({
      ...filters,
      [key]: value,
    })
  }

  return (
    <div
      className="grid gap-3 xl:grid-cols-[minmax(240px,1.4fr)_repeat(4,minmax(150px,1fr))_auto]"
      data-forecast-component="filter-bar"
    >
      <label className="relative block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
          Buscar producto, modelo o señal
        </span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-3 text-slate-400"
          size={16}
        />
        <input
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) => update('search', event.target.value)}
          placeholder="Ej. UNV, cámara, stockout..."
          type="search"
          value={filters.search}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
          Marca
        </span>
        <select
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => update('brandId', event.target.value)}
          value={filters.brandId}
        >
          <option value="all">Todas las marcas</option>
          {options.brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
          Cobertura
        </span>
        <select
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => update(
            'coverage',
            event.target.value as ForecastWorkspaceFilters['coverage'],
          )}
          value={filters.coverage}
        >
          <option value="all">Todos los estados</option>
          {options.coverage.map((coverage) => (
            <option key={coverage} value={coverage}>
              {coverageLabels[coverage] ?? coverage}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
          Prioridad
        </span>
        <select
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => update(
            'priority',
            event.target.value as ForecastWorkspaceFilters['priority'],
          )}
          value={filters.priority}
        >
          <option value="all">Todas las prioridades</option>
          {options.priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabels[priority] ?? priority}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
          Confianza
        </span>
        <select
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => update(
            'confidence',
            event.target.value as ForecastWorkspaceFilters['confidence'],
          )}
          value={filters.confidence}
        >
          <option value="all">Todos los niveles</option>
          {options.confidenceLevels.map((confidence) => (
            <option key={confidence} value={confidence}>
              {confidenceLabels[confidence] ?? confidence}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={onReset}
          type="button"
        >
          <RotateCcw size={15} />
          Limpiar
        </button>
      </div>

      <div className="xl:col-span-full flex items-center gap-2 text-[11px] text-slate-500">
        <SlidersHorizontal size={13} />
        Los filtros recalculan inventario y rankings; la proyección consolidada del portafolio permanece oficial.
      </div>
    </div>
  )
}
