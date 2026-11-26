// MD-003: "Detalle ejecutivo de mis marcas", one row per brand, by revenue.

import {
  Link,
} from 'react-router-dom'

import type {
  MyDayBrand,
} from '../api/myDayTypes'

import {
  EMPTY_VALUE,
  formatInteger,
  formatMoney,
  formatPercent,
  formatSignedPercent,
} from '../format/myDayFormat'

import {
  LIFECYCLE_CLASSES,
  LIFECYCLE_LABELS,
  PACE_TONE_CLASSES,
  TREND_CLASSES,
  TREND_LABELS,
  paceTone,
} from '../format/myDayLabels'

import {
  sortBrandsByRevenue,
} from '../format/myDaySummary'

import {
  brandPagePath,
} from '../navigation/brandPagePath'

import {
  MyDayTable,
  TD,
  TD_NUMBER,
  TH,
} from './MyDayBlock'

function AttainmentBar({ value }: { value: number | null }) {
  const width = value === null
    ? 0
    : Math.max(0, Math.min(value, 1)) * 100

  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-14 text-right tabular-nums">
        {formatPercent(value)}
      </span>
    </div>
  )
}

export function MyDayBrandTable({ brands }: { brands: readonly MyDayBrand[] }) {
  return (
    <MyDayTable minWidth="min-w-[1180px]">
      <thead>
        <tr>
          <th className={TH}>Marca</th>
          <th className={TH}>Estado</th>
          <th className={`${TH} text-right`}>Venta</th>
          <th className={TH}>Avance vs cuota</th>
          <th className={`${TH} text-right`}>Cierre por ritmo</th>
          <th className={`${TH} text-right`}>Variación</th>
          <th className={`${TH} text-right`}>GP</th>
          <th className={`${TH} text-right`}>Margen</th>
          <th className={`${TH} text-right`}>Clientes</th>
          <th className={`${TH} text-right`}>Productos</th>
          <th className={`${TH} text-right`}>Participación</th>
          <th className={TH}>Atención</th>
        </tr>
      </thead>

      <tbody>
        {sortBrandsByRevenue(brands).map((brand) => {
          const path = brandPagePath(brand.brandLabel)
          const tone = paceTone(brand.projectedAttainment)

          return (
            <tr key={brand.brandKey} data-my-day-brand={brand.brandKey}>
              <td className={`${TD} font-medium text-slate-900`}>
                {path ? (
                  <Link to={path} className="text-blue-700 hover:underline">
                    {brand.brandLabel}
                  </Link>
                ) : brand.brandLabel}
              </td>

              <td className={TD}>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${LIFECYCLE_CLASSES[brand.lifecycleStatus]}`}>
                  {LIFECYCLE_LABELS[brand.lifecycleStatus]}
                </span>
                <span className={`ml-2 text-xs font-medium ${TREND_CLASSES[brand.trendStatus]}`}>
                  {TREND_LABELS[brand.trendStatus]}
                </span>
              </td>

              <td className={TD_NUMBER}>
                <div className={brand.revenue < 0 ? 'text-rose-700' : 'text-slate-900'}>
                  {formatMoney(brand.revenue)}
                </div>
                <div className="text-xs text-slate-500">
                  de {formatMoney(brand.target?.revenue)}
                </div>
              </td>

              <td className={TD}>
                <AttainmentBar value={brand.attainment} />
              </td>

              <td className={TD_NUMBER}>
                <span
                  data-pace-tone={tone}
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${PACE_TONE_CLASSES[tone]}`}
                >
                  {formatPercent(brand.projectedAttainment)}
                </span>
                <div className="mt-0.5 text-xs text-slate-500">
                  {formatMoney(brand.projectedRevenue)}
                </div>
              </td>

              <td className={`${TD_NUMBER} ${TREND_CLASSES[brand.trendStatus]}`}>
                {formatSignedPercent(brand.revenueVariationPercentage)}
              </td>

              <td className={TD_NUMBER}>{formatMoney(brand.grossProfit)}</td>
              <td className={TD_NUMBER}>{formatPercent(brand.grossMargin)}</td>
              <td className={TD_NUMBER}>{formatInteger(brand.customers)}</td>
              <td className={TD_NUMBER}>{formatInteger(brand.products)}</td>
              <td className={TD_NUMBER}>{formatPercent(brand.participation)}</td>

              <td className={`${TD} max-w-[280px] whitespace-normal text-xs`}>
                {brand.attentionReason ?? EMPTY_VALUE}
              </td>
            </tr>
          )
        })}
      </tbody>
    </MyDayTable>
  )
}
