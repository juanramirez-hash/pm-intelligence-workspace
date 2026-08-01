import {
  BadgeDollarSign,
  CalendarRange,
  CircleAlert,
  CircleCheckBig,
  Coins,
  Layers3,
  PackageSearch,
} from 'lucide-react'

import {
  AtlasCard,
} from '../../../atlas/components/AtlasCard'

import {
  SectionHeader,
} from '../../../atlas/layout/SectionHeader'

import {
  useDataCenterStore,
} from '../store/dataCenterStore'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}

export function PricingImportSummary() {
  const activeReportType = useDataCenterStore(
    (state) => state.activeReportType,
  )

  const importStatus = useDataCenterStore(
    (state) => state.importStatus,
  )

  const summary = useDataCenterStore(
    (state) => state.pricingSummary,
  )

  if (
    activeReportType !== 'pricing' ||
    importStatus !== 'completed' ||
    !summary
  ) {
    return null
  }

  const cards = [
    {
      label: 'Precios generados',
      value: formatNumber(summary.generatedPriceFacts),
      detail: `${formatNumber(summary.sourceRows)} filas fuente`,
      icon: BadgeDollarSign,
    },
    {
      label: 'Productos',
      value: formatNumber(summary.uniqueProducts),
      detail: `${formatNumber(summary.uniqueBrands)} marcas`,
      icon: PackageSearch,
    },
    {
      label: 'Monedas',
      value: formatNumber(summary.uniqueCurrencies),
      detail: `${formatNumber(summary.mxnPrices)} MXN · ${formatNumber(summary.usdPrices)} USD`,
      icon: Coins,
    },
    {
      label: 'Filas duales',
      value: formatNumber(summary.dualCurrencySourceRows),
      detail: `${formatNumber(summary.singleCurrencySourceRows)} con una moneda · ${formatNumber(summary.skippedUsdCrossCurrencyRows)} cruces evitados`,
      icon: Layers3,
    },
    {
      label: 'Vigencia',
      value: summary.periodEnd ?? 'Sin fecha',
      detail: summary.periodStart
        ? `Desde ${summary.periodStart}`
        : `${formatNumber(summary.pricesWithoutEffectiveDate)} precios sin fecha efectiva`,
      icon: CalendarRange,
    },
    {
      label: 'Conciliación',
      value: summary.productMasterAvailable && summary.productCoverageRate !== null
        ? new Intl.NumberFormat('es-MX', {
            style: 'percent',
            maximumFractionDigits: 1,
          }).format(summary.productCoverageRate)
        : 'Pendiente',
      detail: summary.productMasterAvailable
        ? `${formatNumber(summary.pricesWithoutProduct)} sin producto · ${formatNumber(summary.priceBrandMismatches)} diferencias de marca`
        : 'Carga Product Master para conciliar',
      icon: CircleCheckBig,
    },
    {
      label: 'Calidad',
      value: formatNumber(
        summary.blockingIssues + summary.warningIssues,
      ),
      detail: `${formatNumber(summary.blockingIssues)} bloqueos · ${formatNumber(summary.warningIssues)} advertencias`,
      icon: CircleAlert,
    },
  ]

  return (
    <AtlasCard className="p-6">
      <SectionHeader
        title="Resumen de Pricing"
        description="Costos y precios normalizados por moneda, listos para Business Core y Pricing Laboratory."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>

              <Icon size={18} className="text-violet-600" />
            </div>

            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {value}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {detail}
            </p>
          </div>
        ))}
      </div>

      {(summary.pricesWithNegativeMargin > 0 ||
        summary.pricesAboveList > 0 ||
        summary.duplicatePriceRecords > 0) && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Revisión de Pricing: {formatNumber(summary.pricesWithNegativeMargin)} márgenes negativos,{' '}
          {formatNumber(summary.pricesAboveList)} precios sobre lista y{' '}
          {formatNumber(summary.duplicatePriceRecords)} registros duplicados.
        </div>
      )}
    </AtlasCard>
  )
}
