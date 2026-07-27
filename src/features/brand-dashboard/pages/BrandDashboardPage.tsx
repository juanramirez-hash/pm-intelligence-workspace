import {
   ArrowLeft,
  BarChart3,
  Building2,
  PackageSearch,
  Users,
} from 'lucide-react'

import {
  Link,
  useParams,
} from 'react-router-dom'

import {
  useMemo,
} from 'react'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

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
  buildBrandExecutiveBriefing,
} from '../../../core/insights/brands/buildBrandExecutiveBriefing'

import {
  ExecutiveBriefing,
} from '../../../components/business/executive-briefing'

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

function formatPercentage(
  value: number | null,
) {
  if (value === null) {
    return 'Sin comparación'
  }

  return value.toLocaleString(
    'es-MX',
    {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )
}

export function BrandDashboardPage() {
  const {
    brandId,
  } = useParams<{
    brandId: string
  }>()

  const workspace =
    useWorkspaceContext()

  const brand =
    useMemo(
      () =>
        workspace.brands?.brands.find(
          (
            item,
          ) =>
            item.brandId ===
            brandId,
        ) ?? null,
      [
        workspace.brands,
        brandId,
      ],
    )

    console.log(brand)

  if (!brand) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Marca no encontrada
          </h1>

          <p className="mt-3 text-slate-500">
            No fue posible localizar la marca "
            {brandId}".
          </p>

          <Link
            className="mt-8 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
            to="/brands"
          >
            Volver al directorio
          </Link>
        </div>
      </main>
    )
  }

  const briefing =
  buildBrandExecutiveBriefing(
    brand,
  )

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">

        <Link
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-700"
          to="/brands"
        >
          <ArrowLeft size={17} />

          Volver al directorio de marcas
        </Link>

        <WorkspaceHeader
          connected
          description="Dashboard ejecutivo con el desempeño comercial, financiero y operativo de la marca seleccionada."
          eyebrow="Brand Dashboard"
          icon={Building2}
          title={brand.brandName}
          tone="violet"
        />

<ExecutiveBriefing
  briefing={briefing}
  className="mt-6"
  priorityLabel={
    briefing.severity ===
      'critical'
      ? 'Alta'
      : briefing.severity ===
          'warning'
        ? 'Media'
        : 'Normal'
  }
  priorityReasons={[
    brand.revenueVariationPercentage !==
      null &&
    brand.revenueVariationPercentage <
      0
      ? `La venta disminuyó ${formatPercentage(
          Math.abs(
            brand.revenueVariationPercentage,
          ),
        )}.`
      : `La venta aumentó ${formatPercentage(
          Math.abs(
            brand.revenueVariationPercentage ??
              0,
          ),
        )}.`,

    brand.grossProfitVariation <
    0
      ? `El GP disminuyó ${formatCurrency(
          Math.abs(
            brand.grossProfitVariation,
          ),
        )}.`
      : `El GP aumentó ${formatCurrency(
          brand.grossProfitVariation,
        )}.`,

    brand.customerVariation <
    0
      ? `Existen ${Math.abs(
          brand.customerVariation,
        ).toLocaleString(
          'es-MX',
        )} clientes activos menos que en el periodo anterior.`
      : `Existen ${brand.customerVariation.toLocaleString(
          'es-MX',
        )} clientes activos adicionales.`,

    brand.productVariation <
    0
      ? `Se vendieron ${Math.abs(
          brand.productVariation,
        ).toLocaleString(
          'es-MX',
        )} productos menos.`
      : `Se vendieron ${brand.productVariation.toLocaleString(
          'es-MX',
        )} productos adicionales.`,
  ]}
/>

        <WorkspaceGrid
          className="mt-6"
          columns={4}
        >
          <KpiCard
            icon={BarChart3}
            subtitle="Venta del periodo actual"
            title="Venta"
            tone="blue"
            value={formatCurrency(
              brand.currentPeriod.revenue,
            )}
          />

          <KpiCard
            icon={BarChart3}
            subtitle="Utilidad bruta"
            title="Gross Profit"
            tone="emerald"
            value={formatCurrency(
              brand.currentPeriod.grossProfit,
            )}
          />

          <KpiCard
            icon={Users}
            subtitle="Clientes con compra"
            title="Clientes"
            tone="violet"
            value={brand.currentPeriod.customers.toLocaleString(
              'es-MX',
            )}
          />

          <KpiCard
            icon={PackageSearch}
            subtitle="Productos vendidos"
            title="Productos"
            tone="amber"
            value={brand.currentPeriod.products.toLocaleString(
              'es-MX',
            )}
          />
        </WorkspaceGrid>

        <WorkspaceGrid
          className="mt-6"
          columns={3}
        >
          <KpiCard
            icon={BarChart3}
            subtitle="Rentabilidad"
            title="Margen"
            tone="emerald"
            value={formatPercentage(
              brand.currentPeriod.margin,
            )}
          />

          <KpiCard
            icon={BarChart3}
            subtitle="Comparado con el periodo anterior"
            title="Variación de venta"
            tone={
              brand.revenueVariation >= 0
                ? 'emerald'
                : 'rose'
            }
              value={formatPercentage(
              brand.revenueVariationPercentage,
            )}
          />

          <KpiCard
            icon={Building2}
            subtitle="Participación sobre la venta total"
            title="Participación"
            tone="violet"
            value={formatPercentage(
              brand.revenueParticipation,
            )}
          />
        </WorkspaceGrid>

        <WorkspaceSection
          className="mt-6"
          icon={Building2}
          subtitle="Información obtenida desde Business Intelligence"
          title="Resumen ejecutivo"
          tone="violet"
        >
          <div className="grid gap-6 md:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold">
                Información general
              </h3>

              <dl className="mt-4 space-y-3 text-sm">

                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Marca
                  </dt>

                  <dd className="font-semibold">
                    {brand.brandName}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Estado
                  </dt>

                  <dd className="font-semibold">
                    {brand.lifecycleStatus}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Tendencia
                  </dt>

                  <dd className="font-semibold">
                    {brand.trendStatus}
                  </dd>
                </div>

              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold">
                Atención comercial
              </h3>

              <p className="mt-4 text-sm text-slate-600">
                {brand.requiresAttention
                  ? brand.attentionReason ??
                    'Esta marca requiere seguimiento comercial.'
                  : 'La marca no presenta alertas para este periodo.'}
              </p>
            </div>

          </div>
        </WorkspaceSection>

      </div>
    </main>
  )
}