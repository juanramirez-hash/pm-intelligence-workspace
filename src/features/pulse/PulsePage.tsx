import {
  AlertTriangle,
  CircleDollarSign,
  PackageCheck,
  Target,
  TrendingUp,
} from 'lucide-react'

import { ActionCard } from '../../atlas/components/ActionCard'
import { AtlasCard } from '../../atlas/components/AtlasCard'
import { MetricCard } from '../../atlas/components/MetricCard'
import { StatusBadge } from '../../atlas/components/StatusBadge'

import { PageHeader } from '../../atlas/layout/PageHeader'
import { SectionHeader } from '../../atlas/layout/SectionHeader'

import { AIRecommendationsCard } from '../../atlas/widgets/AIRecommendationsCard'
import { BusinessHealthCard } from '../../atlas/widgets/BusinessHealthCard'
import { CriticalAlertsCard } from '../../atlas/widgets/CriticalAlertsCard'
import { ExecutiveBriefCard } from '../../atlas/widgets/ExecutiveBriefCard'
import { OpportunityRadarCard } from '../../atlas/widgets/OpportunityRadarCard'

import { PulseEngine } from '../../engine/pulseEngine'
import type { PulseEngineInput } from '../../engine/types'

const metrics = [
  {
    label: 'Venta acumulada',
    value: '$18.4 M',
    change: '+8.4%',
    trend: 'up' as const,
    icon: CircleDollarSign,
  },
  {
    label: 'Gross Profit',
    value: '28.6%',
    change: '+1.2 pts',
    trend: 'up' as const,
    icon: TrendingUp,
  },
  {
    label: 'Cumplimiento',
    value: '91.2%',
    change: '-3.8 pts',
    trend: 'down' as const,
    icon: Target,
  },
  {
    label: 'Inventario saludable',
    value: '76%',
    change: '+4.1%',
    trend: 'up' as const,
    icon: PackageCheck,
  },
]

const priorities = [
  {
    brand: 'UNV',
    detail: 'Forecast debajo del objetivo mensual',
    priority: 'Crítico',
  },
  {
    brand: 'ENSON',
    detail: 'Inventario con cobertura superior a 150 días',
    priority: 'Alto',
  },
  {
    brand: 'TP-LINK',
    detail: 'Caída de margen en línea empresarial',
    priority: 'Alto',
  },
]

const criticalAlerts = [
  {
    id: 'unv-forecast',
    brand: 'UNV',
    category: 'Forecast',
    title: 'Desviación contra el objetivo mensual',
    detail:
      'El forecast proyecta un cierre 9% debajo del objetivo definido para el mes.',
    impact: '$840,000',
    priorityScore: 96,
    severity: 'critical' as const,
    dueLabel: 'Hoy',
  },
  {
    id: 'enson-inventory',
    brand: 'ENSON',
    category: 'Inventario',
    title: 'Cobertura superior a 150 días',
    detail:
      'Existen 14 SKUs con inventario excedente y potencial de recuperación mediante promoción.',
    impact: '$1.8 M',
    priorityScore: 92,
    severity: 'high' as const,
    dueLabel: '48 horas',
  },
  {
    id: 'tplink-margin',
    brand: 'TP-LINK',
    category: 'Pricing',
    title: 'Caída de margen en línea empresarial',
    detail:
      'El margen disminuyó 2.4 puntos y se encuentra debajo del objetivo definido.',
    impact: '$320,000',
    priorityScore: 87,
    severity: 'high' as const,
    dueLabel: 'Esta semana',
  },
]

const pulseEngineInput: PulseEngineInput = {
  userName: 'Juan',

  healthScore: 87,
  healthChange: '+3 pts vs ayer',

  forecastAchievement: 81,
  inventoryCoverageDays: 168,
  inventoryHealth: 76,
  grossProfit: 28.6,
  salesGrowth: 8.4,
  inactiveCustomers: 17,
  excessInventoryValue: 1_800_000,

  alerts: criticalAlerts,

  opportunitySources: [
    {
      brand: 'UNV',
      salesGrowth: 4.2,
      inactiveCustomers: 12,
      recoverableCustomerValue: 1_200_000,
      excessInventoryValue: 280_000,
      forecastGapValue: 840_000,
      marginRecoveryValue: 90_000,
    },
    {
      brand: 'TP-LINK',
      salesGrowth: 9.6,
      inactiveCustomers: 8,
      recoverableCustomerValue: 820_000,
      excessInventoryValue: 140_000,
      forecastGapValue: 0,
      marginRecoveryValue: 320_000,
    },
    {
      brand: 'ENSON',
      salesGrowth: -2.1,
      inactiveCustomers: 5,
      recoverableCustomerValue: 340_000,
      excessInventoryValue: 1_800_000,
      forecastGapValue: 0,
      marginRecoveryValue: 120_000,
    },
  ],
}

const pulse = PulseEngine.evaluate(pulseEngineInput)

export function PulsePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Viernes, 17 de julio"
        title="Buenos días, Juan"
        description="Estas son las prioridades comerciales que requieren tu atención."
        actions={
          <AtlasCard className="flex items-center gap-4 px-5 py-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={23} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Health Score global
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {pulse.businessHealth.score}

                <span className="text-sm font-medium text-slate-400">
                  /100
                </span>
              </p>
            </div>
          </AtlasCard>
        }
      />

      <ExecutiveBriefCard
        title={pulse.executiveBrief.title}
        summary={pulse.executiveBrief.summary}
        recommendation={pulse.executiveBrief.recommendation}
      />

      <BusinessHealthCard
        score={pulse.businessHealth.score}
        status={pulse.businessHealth.status}
        trend={pulse.businessHealth.trend}
        change={pulse.businessHealth.change}
        description={pulse.businessHealth.description}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, change, trend, icon }) => (
          <MetricCard
            key={label}
            label={label}
            value={value}
            change={change}
            trend={trend}
            icon={icon}
          />
        ))}
      </section>

      <CriticalAlertsCard alerts={pulse.alerts} />

      <AIRecommendationsCard
        recommendations={pulse.recommendations}
      />

      <OpportunityRadarCard
        opportunities={pulse.opportunities}
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <AtlasCard className="p-6">
          <SectionHeader
            title="Prioridades de atención"
            description="Ordenadas por impacto y urgencia."
            action={
              <StatusBadge tone="danger">
                {priorities.length} críticas
              </StatusBadge>
            }
          />

          <div className="mt-6 space-y-3">
            {priorities.map(({ brand, detail, priority }) => (
              <div
                key={`${brand}-${detail}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {brand}
                  </p>

                  <p className="truncate text-sm text-slate-500">
                    {detail}
                  </p>
                </div>

                <StatusBadge
                  tone={priority === 'Crítico' ? 'danger' : 'warning'}
                >
                  {priority}
                </StatusBadge>
              </div>
            ))}
          </div>
        </AtlasCard>

        <AtlasCard className="p-6">
          <SectionHeader
            title="¿Qué debo hacer ahora?"
            description="Recomendaciones priorizadas para hoy."
          />

          <div className="mt-6 space-y-4">
            <ActionCard
              title="Revisar Forecast UNV"
              description="Existe una brecha estimada de 9% contra el objetivo mensual."
              tone="info"
            />

            <ActionCard
              title="Activar inventario ENSON"
              description="14 SKUs tienen potencial para promoción inmediata."
              tone="success"
            />
          </div>
        </AtlasCard>
      </section>
    </div>
  )
}