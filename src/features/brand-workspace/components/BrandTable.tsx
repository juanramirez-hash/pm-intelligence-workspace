import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Minus,
} from 'lucide-react'

import type {
  BrandIntelligenceItem,
  BrandLifecycleStatus,
  BrandTrendStatus,
} from '../../../core/analytics/brands'

interface BrandTableProps {
  brands: BrandIntelligenceItem[]

  selectedBrandId?: string | null

  onSelectBrand?: (
    brandId: string,
  ) => void
}

const lifecycleLabels:
  Record<
    BrandLifecycleStatus,
    string
  > = {
    active: 'Activa',
    new: 'Nueva',
    recovered: 'Recuperada',
    inactive: 'Inactiva',
    lost: 'Perdida',
  }

const lifecycleStyles:
  Record<
    BrandLifecycleStatus,
    string
  > = {
    active:
      'bg-blue-50 text-blue-700',

    new:
      'bg-violet-50 text-violet-700',

    recovered:
      'bg-emerald-50 text-emerald-700',

    inactive:
      'bg-slate-100 text-slate-600',

    lost:
      'bg-rose-50 text-rose-700',
  }

const trendLabels:
  Record<
    BrandTrendStatus,
    string
  > = {
    growing: 'Crecimiento',
    declining: 'Descenso',
    stable: 'Estable',
    without_comparison:
      'Sin comparación',
  }

function formatCurrency(
  value: number,
) {
  return value.toLocaleString(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    },
  )
}

function formatNumber(
  value: number,
) {
  return value.toLocaleString(
    'es-MX',
    {
      maximumFractionDigits: 0,
    },
  )
}

function formatPercentage(
  value: number | null,
) {
  if (value === null) {
    return '—'
  }

  return `${value.toLocaleString(
    'es-MX',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )}%`
}

function TrendIndicator({
  trend,
  variation,
}: {
  trend: BrandTrendStatus
  variation: number | null
}) {
  if (
    trend ===
    'without_comparison'
  ) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Minus size={14} />

        Sin comparación
      </div>
    )
  }

  if (trend === 'growing') {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <ArrowUpRight size={14} />

        {formatPercentage(
          variation,
        )}
      </div>
    )
  }

  if (trend === 'declining') {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
        <ArrowDownRight
          size={14}
        />

        {formatPercentage(
          variation,
        )}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      <Minus size={14} />

      {formatPercentage(
        variation,
      )}
    </div>
  )
}

export function BrandTable({
  brands,
  selectedBrandId,
  onSelectBrand,
}: BrandTableProps) {
  if (brands.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-slate-800">
          No se encontraron marcas
        </p>

        <p className="mt-2 text-xs text-slate-500">
          Ajusta los filtros o la
          búsqueda para mostrar
          resultados.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-[1380px] w-full border-collapse text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marca
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estado
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Venta
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                GP
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Margen
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Clientes
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Productos
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Participación
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Variación
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tendencia
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Atención
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Detalle
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {brands.map(
              (brand) => {
                const isSelected =
                  selectedBrandId ===
                  brand.brandId

                return (
                  <tr
                    className={[
                      'transition-colors hover:bg-slate-50',

                      isSelected
                        ? 'bg-violet-50/60'
                        : '',
                    ].join(' ')}
                    key={
                      brand.brandId
                    }
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            brand.brandName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            brand.brandId
                          }
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={[
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',

                          lifecycleStyles[
                            brand
                              .lifecycleStatus
                          ],
                        ].join(' ')}
                      >
                        {
                          lifecycleLabels[
                            brand
                              .lifecycleStatus
                          ]
                        }
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(
                        brand
                          .currentPeriod
                          .revenue,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatCurrency(
                        brand
                          .currentPeriod
                          .grossProfit,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatPercentage(
                        brand
                          .currentPeriod
                          .margin,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatNumber(
                        brand
                          .currentPeriod
                          .customers,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatNumber(
                        brand
                          .currentPeriod
                          .products,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatPercentage(
                        brand.revenueParticipation,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <TrendIndicator
                        trend={
                          brand.trendStatus
                        }
                        variation={
                          brand
                            .revenueVariationPercentage
                        }
                      />
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {
                          trendLabels[
                            brand
                              .trendStatus
                          ]
                        }
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {brand.requiresAttention ? (
                        <div
                          className="inline-flex items-center justify-center text-amber-600"
                          title={
                            brand.attentionReason ??
                            'Requiere atención comercial'
                          }
                        >
                          <AlertTriangle
                            size={18}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        aria-label={`Abrir detalle de ${brand.brandName}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        onClick={() =>
                          onSelectBrand?.(
                            brand.brandId,
                          )
                        }
                        type="button"
                      >
                        <ArrowRight
                          size={16}
                        />
                      </button>
                    </td>
                  </tr>
                )
              },
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">
          {brands.length.toLocaleString(
            'es-MX',
          )}{' '}
          marcas mostradas
        </p>
      </div>
    </div>
  )
}