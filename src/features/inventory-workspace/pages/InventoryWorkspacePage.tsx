import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
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
  buildInventoryAnalytics,
} from '../../../core/business/analytics/inventory'

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
  buildInventoryExecutiveSummary,
} from '../engine/inventoryExecutiveSummary'

import {
  buildInventoryCatalogLookup,
} from '../engine/inventoryCatalogEnrichment'

import type {
  InventoryExecutiveFindingTone,
} from '../engine/inventoryExecutiveSummary'

import {
  buildInventoryExecutiveExport,
  downloadInventoryExecutiveExport,
} from '../export'

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

const summaryToneStyles: Record<
  InventoryExecutiveFindingTone,
  string
> = {
  positive: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
  warning: 'border-amber-100 bg-amber-50/70 text-amber-700',
  critical: 'border-rose-100 bg-rose-50/70 text-rose-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
}

export function InventoryWorkspacePage() {
  const workspace = useInventoryWorkspace()
  const [dimension, setDimension] =
    useState<InventoryWorkspaceDimension>('brand')
  const [filters, setFilters] =
    useState<InventoryWorkspaceFilters>(DEFAULT_INVENTORY_WORKSPACE_FILTERS)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const analytics = workspace.analytics
  const riskOpportunity = workspace.riskOpportunity

  const catalogLookup = useMemo(
    () => buildInventoryCatalogLookup(workspace.latestPositions),
    [workspace.latestPositions],
  )

  const filteredPositions = useMemo(
    () => filterInventoryPositions(workspace.latestPositions, filters),
    [workspace.latestPositions, filters],
  )

  const filteredAnalytics = useMemo(
    () => buildInventoryAnalytics(
      filteredPositions,
      analytics?.snapshotDate ?? null,
    ),
    [filteredPositions, analytics?.snapshotDate],
  )

  const dimensionGroups = useMemo(
    () => buildInventoryWorkspaceGroups(filteredPositions, dimension),
    [filteredPositions, dimension],
  )

  const filteredRisks = useMemo(
    () => filterInventoryRisks(
      riskOpportunity?.risks ?? [],
      filters,
      catalogLookup,
    ),
    [riskOpportunity, filters, catalogLookup],
  )

  const filteredOpportunities = useMemo(
    () => filterInventoryOpportunities(
      riskOpportunity?.opportunities ?? [],
      filters,
      catalogLookup,
    ),
    [riskOpportunity, filters, catalogLookup],
  )

  const executiveSummary = useMemo(
    () => buildInventoryExecutiveSummary({
      analytics: filteredAnalytics,
      positions: filteredPositions,
      risks: filteredRisks,
      opportunities: filteredOpportunities,
      filters,
    }),
    [
      filteredAnalytics,
      filteredPositions,
      filteredRisks,
      filteredOpportunities,
      filters,
    ],
  )

  const prioritizedRisks = useMemo(
    () => filteredRisks.filter(
      (risk) =>
        risk.priority === 'critical' || risk.priority === 'high',
    ).length,
    [filteredRisks],
  )

  const totals = filteredAnalytics.totals

  async function handleExecutiveExport(): Promise<void> {
    if (!workspace.available || isExporting) {
      return
    }

    setIsExporting(true)
    setExportError(null)

    try {
      const payload = buildInventoryExecutiveExport({
        analytics: filteredAnalytics,
        positions: filteredPositions,
        risks: filteredRisks,
        opportunities: filteredOpportunities,
        filters,
        summary: executiveSummary,
      })

      await downloadInventoryExecutiveExport(payload)
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : 'No fue posible generar el archivo Excel.',
      )
    } finally {
      setIsExporting(false)
    }
  }

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

        <WorkspaceSection
          actions={(
            <div className="flex flex-col items-end gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!workspace.available || isExporting}
                onClick={() => void handleExecutiveExport()}
                type="button"
              >
                <Download size={16} />
                {isExporting ? 'Preparando Excel...' : 'Exportar Excel'}
              </button>
              {exportError && (
                <p className="max-w-72 text-right text-xs text-rose-600">
                  {exportError}
                </p>
              )}
            </div>
          )}
          className="mt-6"
          icon={FileSpreadsheet}
          subtitle={executiveSummary.filterContext}
          title={executiveSummary.title}
          tone="blue"
        >
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Lectura del corte
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {executiveSummary.overview}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Perspectiva operativa
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {executiveSummary.outlook}
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {executiveSummary.findings.map((finding) => (
              <article
                className={`rounded-2xl border p-4 ${summaryToneStyles[finding.tone]}`}
                key={finding.label}
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  {finding.label}
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {finding.value}
                </p>
                <p className="mt-2 text-xs leading-5 opacity-80">
                  {finding.detail}
                </p>
              </article>
            ))}
          </div>
        </WorkspaceSection>

        <WorkspaceGrid className="mt-5" columns={4}>
          <KpiCard
            icon={CircleDollarSign}
            subtitle={`${totals.products} productos en ${totals.locations} ubicaciones`}
            title="Valor de inventario"
            tone="blue"
            value={formatCurrency(totals.inventoryValue)}
          />
          <KpiCard
            icon={Boxes}
            subtitle={`${formatNumber(totals.available)} disponibles`}
            title="Existencia física"
            tone="slate"
            value={formatNumber(totals.onHand)}
          />
          <KpiCard
            icon={Truck}
            subtitle="Tránsito + órdenes de compra"
            title="Entradas pendientes"
            tone="emerald"
            value={formatNumber(totals.inboundUnits)}
          />
          <KpiCard
            icon={AlertTriangle}
            subtitle={`${filteredOpportunities.length} oportunidades detectadas`}
            title="Riesgos prioritarios"
            tone="amber"
            value={prioritizedRisks}
          />
        </WorkspaceGrid>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_160px_160px_150px_180px_190px_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))}
                placeholder="Buscar Name, modelo, marca, categoría o sustituto"
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

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setFilters((current) => ({
                ...current,
                commercialStatus: event.target.value as InventoryWorkspaceFilters['commercialStatus'],
              }))}
              value={filters.commercialStatus}
            >
              <option value="all">Toda categoría ABCE</option>
              {workspace.commercialStatuses.map((status) => (
                <option key={status} value={status}>Categoría {status}</option>
              ))}
              <option value="unclassified">Sin clasificación</option>
            </select>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setFilters((current) => ({
                ...current,
                replacement: event.target.value as InventoryWorkspaceFilters['replacement'],
              }))}
              value={filters.replacement}
            >
              <option value="all">Todo estado de sustitución</option>
              <option value="with_superseded">Con Superseded</option>
              <option value="with_direct_substitute">Con sustituto directo</option>
              <option value="both">Con ambos</option>
              <option value="without_replacement">Sin reemplazo</option>
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
              {filteredAnalytics.stockStatus.map((status) => (
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
