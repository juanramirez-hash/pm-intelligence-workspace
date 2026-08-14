import {
  AlertTriangle,
  BadgeDollarSign,
  ClipboardList,
  PackageSearch,
  Search,
  ShoppingCart,
  Truck,
  Users,
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
  usePurchasingWorkspace,
} from '../hooks/usePurchasingWorkspace'

import {
  buildPurchasingWorkspaceAnalytics,
  DEFAULT_PURCHASING_WORKSPACE_FILTERS,
  filterPurchasingLines,
  filterPurchasingOrders,
  filterPurchasingRequests,
  getPurchasingWorkspaceGroups,
} from '../engine/purchasingWorkspaceModel'

import type {
  PurchasingWorkspaceDimension,
  PurchasingWorkspaceFilters,
} from '../engine/purchasingWorkspaceModel'

import {
  PurchaseOrderTable,
  PurchaseRequestTable,
  PurchasingRankingTable,
} from '../components/PurchasingTables'

import {
  PurchasingInventorySummary,
} from '../components/PurchasingInventorySummary'

import {
  PurchasingForecastSummary,
} from '../components/PurchasingForecastSummary'

function formatCurrency(
  value: number,
): string {
  return value.toLocaleString(
    'es-MX',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    },
  )
}

function formatNumber(
  value: number,
): string {
  return value.toLocaleString(
    'es-MX',
    {
      maximumFractionDigits: 1,
    },
  )
}

function formatPercent(
  value: number,
): string {
  return `${(
    value * 100
  ).toFixed(1)}%`
}

const dimensionLabels:
  Record<
    PurchasingWorkspaceDimension,
    string
  > = {
    supplier: 'Proveedor',
    buyer: 'Comprador',
    brand: 'Marca',
    item: 'Artículo',
  }

const agingLabels:
  Record<
    PurchasingWorkspaceFilters['agingBucket'],
    string
  > = {
    all: 'Todo aging',
    current: 'Vigentes',
    '1_7_days': '1-7 días',
    '8_15_days': '8-15 días',
    '16_30_days': '16-30 días',
    '31_plus_days': '31+ días',
    undated: 'Sin fecha',
  }

export function PurchasingWorkspacePage() {
  const workspace =
    usePurchasingWorkspace()

  const [
    dimension,
    setDimension,
  ] =
    useState<PurchasingWorkspaceDimension>(
      'supplier',
    )

  const [
    filters,
    setFilters,
  ] =
    useState<PurchasingWorkspaceFilters>(
      DEFAULT_PURCHASING_WORKSPACE_FILTERS,
    )

  const analytics =
    workspace.analytics

  const referenceDate =
    analytics?.referenceDate ??
    new Date()
      .toISOString()
      .slice(0, 10)

  const filteredOrders =
    useMemo(
      () =>
        filterPurchasingOrders(
          workspace.orders,
          filters,
          referenceDate,
        ),
      [
        workspace.orders,
        filters,
        referenceDate,
      ],
    )

  const filteredLines =
    useMemo(
      () =>
        filterPurchasingLines(
          workspace.lines,
          filteredOrders,
        ),
      [
        workspace.lines,
        filteredOrders,
      ],
    )

  const filteredRequests =
    useMemo(
      () =>
        filterPurchasingRequests(
          workspace.requests,
          filters,
        ),
      [
        workspace.requests,
        filters,
      ],
    )

  const filteredAnalytics =
    useMemo(
      () =>
        buildPurchasingWorkspaceAnalytics(
          filteredOrders,
          filteredLines,
          filteredRequests,
          referenceDate,
        ),
      [
        filteredOrders,
        filteredLines,
        filteredRequests,
        referenceDate,
      ],
    )

  const dimensionGroups =
    useMemo(
      () =>
        getPurchasingWorkspaceGroups(
          filteredAnalytics,
          dimension,
        ),
      [
        filteredAnalytics,
        dimension,
      ],
    )

  const totals =
    filteredAnalytics.totals

  const linkage =
    filteredAnalytics.linkage

  const cycle =
    filteredAnalytics.cycle

  function clearFilters(): void {
    setFilters(
      DEFAULT_PURCHASING_WORKSPACE_FILTERS,
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
        <WorkspaceHeader
          connected={workspace.available}
          connectedLabel="Compras conectadas"
          description="Supervisa órdenes de compra, solicitudes, proveedores, compradores, vencimientos y vinculación SC → PO."
          disconnectedLabel="Carga órdenes y solicitudes de compra en Data Center"
          eyebrow="Purchasing Intelligence"
          icon={ShoppingCart}
          metadata={(
            <p className="text-xs font-medium text-slate-400">
              Fecha de análisis: {
                referenceDate
              }
            </p>
          )}
          title="Centro de Inteligencia de Compras"
          tone="blue"
        />

        <WorkspaceGrid
          className="mt-6"
          columns={4}
        >
          <KpiCard
            icon={BadgeDollarSign}
            subtitle={`${totals.purchaseOrders} órdenes · ${totals.purchaseOrderLines} líneas`}
            title="Monto ordenado"
            tone="blue"
            value={formatCurrency(
              totals.orderedAmountForeignCurrency,
            )}
          />

          <KpiCard
            icon={AlertTriangle}
            subtitle={`${formatPercent(totals.overdueOrderRate)} de órdenes abiertas`}
            title="PO vencidas"
            tone="amber"
            value={
              totals.overduePurchaseOrders
            }
          />

          <KpiCard
            icon={ClipboardList}
            subtitle={`${totals.purchaseRequestsWithPurchaseOrder} vinculadas a PO`}
            title="Solicitudes sin PO"
            tone="rose"
            value={
              totals.purchaseRequestsWithoutPurchaseOrder
            }
          />

          <KpiCard
            icon={Truck}
            subtitle={`${totals.purchaseOrdersDueNext7Days} por recibir en 7 días`}
            title="PO abiertas"
            tone="emerald"
            value={
              totals.openPurchaseOrders
            }
          />
        </WorkspaceGrid>

        <PurchasingInventorySummary
          report={
            workspace.purchasingInventory
          }
        />

        <PurchasingForecastSummary
          report={
            workspace.purchasingForecast
          }
        />

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_170px_170px_160px_160px_160px_150px_auto]">
            <label className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                onChange={(event) =>
                  setFilters(
                    (current) => ({
                      ...current,
                      search:
                        event.target.value,
                    }),
                  )
                }
                placeholder="Buscar PO, SC, proveedor, artículo, marca o proyecto"
                value={filters.search}
              />
            </label>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    supplierId:
                      event.target.value,
                  }),
                )
              }
              value={filters.supplierId}
            >
              <option value="all">
                Todos los proveedores
              </option>
              {workspace.suppliers.map(
                (supplier) => (
                  <option
                    key={supplier}
                    value={supplier}
                  >
                    {supplier}
                  </option>
                ),
              )}
            </select>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    buyer:
                      event.target.value,
                  }),
                )
              }
              value={filters.buyer}
            >
              <option value="all">
                Todos los compradores
              </option>
              {workspace.buyers.map(
                (buyer) => (
                  <option
                    key={buyer}
                    value={buyer}
                  >
                    {buyer}
                  </option>
                ),
              )}
            </select>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    brandId:
                      event.target.value,
                  }),
                )
              }
              value={filters.brandId}
            >
              <option value="all">
                Todas las marcas
              </option>
              {workspace.brands.map(
                (brand) => (
                  <option
                    key={brand}
                    value={brand}
                  >
                    {brand}
                  </option>
                ),
              )}
            </select>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    itemCode:
                      event.target.value,
                  }),
                )
              }
              value={filters.itemCode}
            >
              <option value="all">
                Todos los artículos
              </option>
              {workspace.items.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    status:
                      event.target.value,
                  }),
                )
              }
              value={filters.status}
            >
              <option value="all">
                Todos los estados
              </option>
              {workspace.statuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ),
              )}
            </select>

            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    agingBucket:
                      event.target.value as PurchasingWorkspaceFilters['agingBucket'],
                  }),
                )
              }
              value={
                filters.agingBucket
              }
            >
              {(
                Object.keys(
                  agingLabels,
                ) as PurchasingWorkspaceFilters['agingBucket'][]
              ).map(
                (bucket) => (
                  <option
                    key={bucket}
                    value={bucket}
                  >
                    {
                      agingLabels[
                        bucket
                      ]
                    }
                  </option>
                ),
              )}
            </select>

            <button
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              onClick={clearFilters}
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
                {(
                  Object.keys(
                    dimensionLabels,
                  ) as PurchasingWorkspaceDimension[]
                ).map(
                  (item) => (
                    <button
                      className={[
                        'rounded-lg px-3 py-2 text-xs font-semibold transition',
                        dimension === item
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800',
                      ].join(' ')}
                      key={item}
                      onClick={() =>
                        setDimension(
                          item,
                        )
                      }
                      type="button"
                    >
                      {
                        dimensionLabels[
                          item
                        ]
                      }
                    </button>
                  ),
                )}
              </div>
            )}
            icon={Users}
            subtitle={`${dimensionGroups.length} elementos después de filtros`}
            title={`Compras por ${dimensionLabels[dimension].toLowerCase()}`}
            tone="blue"
          >
            <PurchasingRankingTable
              groups={
                dimensionGroups.slice(
                  0,
                  25,
                )
              }
              onSelect={(group) => {
                if (
                  dimension ===
                  'supplier'
                ) {
                  setFilters(
                    (current) => ({
                      ...current,
                      supplierId:
                        group.key,
                    }),
                  )
                  return
                }

                if (
                  dimension ===
                  'buyer'
                ) {
                  setFilters(
                    (current) => ({
                      ...current,
                      buyer:
                        group.key,
                    }),
                  )
                  return
                }

                if (
                  dimension ===
                  'brand'
                ) {
                  setFilters(
                    (current) => ({
                      ...current,
                      brandId:
                        group.key,
                    }),
                  )
                  return
                }

                setFilters(
                  (current) => ({
                    ...current,
                    itemCode:
                      group.key,
                  }),
                )
              }}
            />
          </WorkspaceSection>

          <WorkspaceSection
            icon={PackageSearch}
            subtitle="Distribución de órdenes abiertas por antigüedad"
            title="Aging de órdenes"
            tone="slate"
          >
            <div className="space-y-3">
              {filteredAnalytics.aging.map(
                (summary) => (
                  <article
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                    key={
                      summary.bucket
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            agingLabels[
                              summary.bucket
                            ]
                          }
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {
                            summary.purchaseOrders
                          } órdenes
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-slate-900">
                        {
                          formatCurrency(
                            summary.orderedAmountForeignCurrency,
                          )
                        }
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          </WorkspaceSection>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <WorkspaceSection
            icon={ClipboardList}
            subtitle={`${filteredRequests.length} solicitudes después de filtros`}
            title="Solicitudes de compra"
            tone="violet"
          >
            <PurchaseRequestTable
              requests={
                filteredRequests.slice(
                  0,
                  100,
                )
              }
            />

            {filteredRequests.length >
              100 && (
              <p className="mt-4 text-center text-xs text-slate-400">
                Se muestran las primeras 100 solicitudes. Refina los filtros para revisar un subconjunto.
              </p>
            )}
          </WorkspaceSection>

          <WorkspaceSection
            icon={ShoppingCart}
            subtitle={`${filteredOrders.length} órdenes después de filtros`}
            title="Órdenes de compra"
            tone="emerald"
          >
            <PurchaseOrderTable
              orders={
                filteredOrders.slice(
                  0,
                  100,
                )
              }
            />

            {filteredOrders.length >
              100 && (
              <p className="mt-4 text-center text-xs text-slate-400">
                Se muestran las primeras 100 órdenes. Refina los filtros para revisar un subconjunto.
              </p>
            )}
          </WorkspaceSection>
        </div>

        <WorkspaceSection
          className="mt-5"
          icon={Truck}
          subtitle={`${linkage.linkedPurchaseOrderExists} SC enlazadas a PO existentes · ${linkage.orphanPurchaseOrderReferences} referencias huérfanas`}
          title="Flujo SC → PO"
          tone="blue"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Tasa de vinculación
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {
                  formatPercent(
                    totals.linkedRequestRate,
                  )
                }
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                SC con PO
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {
                  linkage.linkedToPurchaseOrder
                }
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                SC sin PO
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {
                  linkage.withoutPurchaseOrder
                }
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Ciclo promedio SC → PO
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {
                  cycle.averageDaysRequestToPurchaseOrder === null
                    ? 'N/D'
                    : `${formatNumber(cycle.averageDaysRequestToPurchaseOrder)} días`
                }
              </p>
            </article>
          </div>
        </WorkspaceSection>
      </div>
    </main>
  )
}