import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  PackageSearch,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

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

import {
  useInventoryWorkspace,
} from '../hooks/useInventoryWorkspace'

import {
  buildInventoryWorkspaceGroups,
  DEFAULT_INVENTORY_WORKSPACE_FILTERS,
  filterInventoryOpportunities,
  filterInventoryPositions,
  filterInventoryRisks,
} from '../engine/inventoryWorkspaceModel'

import type {
  InventoryWorkspaceDimension,
  InventoryWorkspaceFilters,
} from '../engine/inventoryWorkspaceModel'

import {
  InventoryOpportunityList,
  InventoryPositionTable,
  InventoryRankingTable,
  InventoryRiskList,
} from '../components/InventoryTables'

function formatCurrency(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function formatNumber(value: number): string {
  return value.toLocaleString('es-MX', {
    maximumFractionDigits: 1,
  })
}

const dimensionLabels: Record<InventoryWorkspaceDimension, string> = {
  brand: 'Marca',
  location: 'Ubicación',
  product: 'Producto',
}

export function InventoryWorkspacePage() {
  const workspace = useInventoryWorkspace()
  const [dimension, setDimension] =
    useState<InventoryWorkspaceDimension>('brand')
  const [filters, setFilters] =
    useState<InventoryWorkspaceFilters>(DEFAULT_INVENTORY_WORKSPACE_FILTERS)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const analytics = workspace.analytics
  const riskOpportunity = workspace.riskOpportunity
  const totals = analytics?.totals

  const filteredPositions = useMemo(
    () => filterInventoryPositions(workspace.latestPositions, filters),
    [workspace.latestPositions, filters],
  )

  const dimensionGroups = useMemo(
    () => buildInventoryWorkspaceGroups(filteredPositions, dimension),
    [filteredPositions, dimension],
  )

  const filteredRisks = useMemo(
    () => filterInventoryRisks(riskOpportunity?.risks ?? [], filters),
    [riskOpportunity, filters],
  )

  const filteredOpportunities = useMemo(
    () => filterInventoryOpportunities(
      riskOpportunity?.opportunities ?? [],
      filters,
    ),
    [riskOpportunity, filters],
  )

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
        <WorkspaceHeader
          connected={workspace.available}
          connectedLabel="Inventario conectado"
          description="Supervisa existencias, disponibilidad, compromisos, valor, riesgos y oportunidades por marca, producto y ubicación."
          disconnectedLabel="Carga un inventario en Data Center"
          eyebrow="Inventory Intelligence"
          icon={Warehouse}
          metadata={analytics?.snapshotDate ? (
            <p className="text-xs font-medium text-slate-400">
              Último corte: {analytics.snapshotDate}
            </p>
          ) : null}
          title="Centro de Inteligencia de Inventario"
          tone="blue"
        />

        <WorkspaceGrid className="mt-6" columns={4}>
          <KpiCard
            icon={CircleDollarSign}
            subtitle={`${totals?.products ?? 0} productos en ${totals?.locations ?? 0} ubicaciones`}
            title="Valor de inventario"
            tone="blue"
            value={formatCurrency(totals?.inventoryValue ?? 0)}
          />
          <KpiCard
            icon={Boxes}
            subtitle={`${formatNumber(totals?.available ?? 0)} disponibles`}
            title="Existencia física"
            tone="slate"
            value={formatNumber(totals?.onHand ?? 0)}
          />
          <KpiCard
            icon={Truck}
            subtitle="Tránsito + órdenes de compra"
            title="Entradas pendientes"
            tone="emerald"
            value={formatNumber(totals?.inboundUnits ?? 0)}
          />
          <KpiCard
            icon={AlertTriangle}
            subtitle={`${riskOpportunity?.summary.opportunities ?? 0} oportunidades detectadas`}
            title="Riesgos prioritarios"
            tone="amber"
            value={(riskOpportunity?.summary.criticalRisks ?? 0) +
              (riskOpportunity?.summary.highRisks ?? 0)}
          />
        </WorkspaceGrid>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_160px_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))}
                placeholder="Buscar Name, modelo, marca o ubicación"
                value={filters.search}
              />
            </label>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setFilters((current) => ({
                ...current,
                brandId: event.target.value,
              }))}
              value={filters.brandId}
            >
              <option value="all">Todas las marcas</option>
              {workspace.brands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setFilters((current) => ({
                ...current,
                locationId: event.target.value,
              }))}
              value={filters.locationId}
            >
              <option value="all">Todas las ubicaciones</option>
              {workspace.locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setFilters((current) => ({
                ...current,
                priority: event.target.value as InventoryWorkspaceFilters['priority'],
              }))}
              value={filters.priority}
            >
              <option value="all">Toda prioridad</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>

            <button
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              onClick={() => {
                setFilters(DEFAULT_INVENTORY_WORKSPACE_FILTERS)
                setSelectedLabel(null)
              }}
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <WorkspaceSection
            actions={(
              <div className="flex rounded-xl bg-slate-100 p-1">
                {(Object.keys(dimensionLabels) as InventoryWorkspaceDimension[]).map((item) => (
                  <button
                    className={[
                      'rounded-lg px-3 py-2 text-xs font-semibold transition',
                      dimension === item
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800',
                    ].join(' ')}
                    key={item}
                    onClick={() => {
                      setDimension(item)
                      setSelectedLabel(null)
                    }}
                    type="button"
                  >
                    {dimensionLabels[item]}
                  </button>
                ))}
              </div>
            )}
            icon={PackageCheck}
            subtitle={`${dimensionGroups.length} elementos · ordenados por valor de inventario`}
            title={`Inventario por ${dimensionLabels[dimension].toLowerCase()}`}
            tone="blue"
          >
            <InventoryRankingTable
              groups={dimensionGroups.slice(0, 25)}
              onSelect={(group) => {
                setSelectedLabel(group.label)
                setFilters((current) => {
                  if (dimension === 'brand') {
                    return {
                      ...current,
                      search: '',
                      brandId: group.key,
                    }
                  }

                  if (dimension === 'location') {
                    return {
                      ...current,
                      search: '',
                      locationId: group.key,
                    }
                  }

                  return {
                    ...current,
                    search: group.label,
                  }
                })
              }}
            />
          </WorkspaceSection>

          <WorkspaceSection
            icon={PackageSearch}
            subtitle="Distribución operativa del último corte"
            title="Estado de posiciones"
            tone="slate"
          >
            <div className="space-y-3">
              {(analytics?.stockStatus ?? []).map((status) => (
                <article
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                  key={status.status}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {status.status.replaceAll('_', ' ')}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {status.positions} posiciones · {status.products} productos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(status.inventoryValue)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(status.valueShare * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </WorkspaceSection>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <WorkspaceSection
            icon={AlertTriangle}
            subtitle={`${filteredRisks.length} señales después de filtros`}
            title="Riesgos de inventario"
            tone="rose"
          >
            <InventoryRiskList risks={filteredRisks.slice(0, 20)} />
          </WorkspaceSection>

          <WorkspaceSection
            icon={Truck}
            subtitle={`${filteredOpportunities.length} acciones sugeridas`}
            title="Oportunidades operativas"
            tone="emerald"
          >
            <InventoryOpportunityList
              opportunities={filteredOpportunities.slice(0, 20)}
            />
          </WorkspaceSection>
        </div>

        <WorkspaceSection
          className="mt-5"
          icon={Boxes}
          subtitle={`${filteredPositions.length} posiciones del último corte${selectedLabel ? ` · selección: ${selectedLabel}` : ''}`}
          title="Drill-down de posiciones"
          tone="violet"
        >
          <InventoryPositionTable positions={filteredPositions.slice(0, 200)} />
          {filteredPositions.length > 200 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Se muestran las primeras 200 posiciones. Refina los filtros para revisar un subconjunto.
            </p>
          )}
        </WorkspaceSection>
      </div>
    </main>
  )
}
