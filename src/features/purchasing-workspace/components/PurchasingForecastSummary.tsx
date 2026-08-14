import {
  AlertTriangle,
  PackageSearch,
  ShoppingCart,
  Truck,
} from 'lucide-react'

import {
  KpiCard,
} from '../../../components/business/kpi'

import {
  WorkspaceGrid,
} from '../../../components/workspace/grid'

import {
  WorkspaceSection,
} from '../../../components/workspace/section'

import type {
  PurchasingForecastAnalyticsReport,
} from '../../../core/business/analytics/purchasingForecast'

import {
  PurchasingForecastTable,
} from './PurchasingForecastTable'

interface PurchasingForecastSummaryProps {
  report:
    PurchasingForecastAnalyticsReport | null
}

function formatNumber(
  value: number,
): string {
  return value.toLocaleString(
    'es-MX',
    {
      maximumFractionDigits: 0,
    },
  )
}

export function PurchasingForecastSummary({
  report,
}: PurchasingForecastSummaryProps) {
  if (!report) {
    return null
  }

  const reviews =
    report.items.filter(
      (item) =>
        item.signals.some(
          (signal) =>
            signal.type ===
            'potential-overbuy-review',
        ),
    )

  const reviewsWithOverduePurchaseOrder =
    reviews.filter(
      (item) =>
        item.purchasing
          .overduePurchaseOrders > 0,
    ).length

  const reviewsWithPurchaseOrderDueNext7Days =
    reviews.filter(
      (item) =>
        item.purchasing
          .dueNext7DaysPurchaseOrders > 0,
    ).length

  return (
    <WorkspaceSection
      className="mt-5"
      icon={AlertTriangle}
      subtitle={`${formatNumber(report.summary.matchedProducts)} productos conciliados entre Forecast y Purchasing · independiente de los filtros de compras`}
      title="Forecast + abastecimiento"
      tone="amber"
    >
      <WorkspaceGrid
        columns={4}
      >
        <KpiCard
          icon={AlertTriangle}
          subtitle="Cobertura disponible ya excedente frente al forecast y con PO abierta"
          title="Revisar posible sobrecompra"
          tone="rose"
          value={
            report.summary
              .potentialOverbuyReviews
          }
        />

        <KpiCard
          icon={PackageSearch}
          subtitle={`${formatNumber(report.summary.forecastProducts)} productos disponibles en Forecast`}
          title="Productos conciliados"
          tone="blue"
          value={
            report.summary
              .matchedProducts
          }
        />

        <KpiCard
          icon={Truck}
          subtitle="Revisiones con al menos una PO abierta vencida"
          title="Con PO vencida"
          tone="amber"
          value={
            reviewsWithOverduePurchaseOrder
          }
        />

        <KpiCard
          icon={ShoppingCart}
          subtitle="Revisiones con al menos una PO prevista para los próximos 7 días"
          title="PO próximas"
          tone="emerald"
          value={
            reviewsWithPurchaseOrderDueNext7Days
          }
        />
      </WorkspaceGrid>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
        La señal utiliza la cobertura disponible calculada por Forecast y la existencia de PO abiertas.
        La cantidad de PO se presenta como cantidad nominal de líneas abiertas; no representa saldo pendiente ni inbound confirmado.
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Revisión por artículo
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {formatNumber(
              reviews.length,
            )} artículos requieren revisión de posible sobreabastecimiento
          </p>
        </div>

        <div className="mt-4">
          <PurchasingForecastTable
            items={
              reviews.slice(
                0,
                100,
              )
            }
          />

          {reviews.length >
            100 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Se muestran los primeros 100 artículos con señal de revisión.
            </p>
          )}
        </div>
      </div>
    </WorkspaceSection>
  )
}