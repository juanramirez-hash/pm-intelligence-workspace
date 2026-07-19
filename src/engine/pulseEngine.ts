import {
  evaluatePulseRules,
  type PulseBusinessData,
} from '../features/pulse/rules/pulseRules'
import { evaluateOpportunityRules } from '../features/pulse/rules/opportunityRules'
import type {
  BusinessHealthResult,
  ExecutiveBriefResult,
  PulseEngineInput,
  PulseEngineResult,
} from './types'

function evaluateBusinessHealth(
  input: PulseEngineInput,
): BusinessHealthResult {
  const score = Math.min(Math.max(input.healthScore, 0), 100)

  const status: BusinessHealthResult['status'] =
    score >= 80
      ? 'healthy'
      : score >= 60
        ? 'warning'
        : 'critical'

  const trend: BusinessHealthResult['trend'] =
    input.salesGrowth > 0
      ? 'up'
      : input.salesGrowth < 0
        ? 'down'
        : 'stable'

  return {
    score,
    status,
    trend,
    change: input.healthChange,
    description:
      input.forecastAchievement < 90
        ? 'La salud general del portafolio permanece estable, aunque el forecast requiere atención para proteger el cierre mensual.'
        : 'Los principales indicadores del portafolio permanecen dentro de los parámetros definidos.',
  }
}

function createExecutiveBrief(
  input: PulseEngineInput,
  recommendationCount: number,
  opportunityCount: number,
): ExecutiveBriefResult {
  const criticalAlerts = input.alerts.filter(
    (alert) => alert.severity === 'critical',
  ).length

  const firstAlert = [...input.alerts].sort(
    (firstAlert, secondAlert) =>
      secondAlert.priorityScore - firstAlert.priorityScore,
  )[0]

  return {
    title: `Resumen ejecutivo para ${input.userName}`,

    summary:
      `El motor detectó ${criticalAlerts} alertas críticas, ` +
      `${recommendationCount} acciones recomendadas y ` +
      `${opportunityCount} oportunidades comerciales. ` +
      `El Business Health actual es de ${input.healthScore}/100.`,

    recommendation: firstAlert
      ? `Prioriza ${firstAlert.brand}: ${firstAlert.title.toLowerCase()}. Esta acción tiene el mayor nivel de prioridad detectado actualmente.`
      : 'No existen alertas críticas. Mantén el seguimiento de los indicadores principales.',
  }
}

export const PulseEngine = {
  evaluate(input: PulseEngineInput): PulseEngineResult {
    const businessData: PulseBusinessData = {
      forecastAchievement: input.forecastAchievement,
      inventoryCoverageDays: input.inventoryCoverageDays,
      grossProfit: input.grossProfit,
      salesGrowth: input.salesGrowth,
      inactiveCustomers: input.inactiveCustomers,
      excessInventoryValue: input.excessInventoryValue,
    }

    const recommendations = evaluatePulseRules(businessData)

    const opportunities = evaluateOpportunityRules(
      input.opportunitySources,
    )

    const alerts = [...input.alerts].sort(
      (firstAlert, secondAlert) =>
        secondAlert.priorityScore - firstAlert.priorityScore,
    )

    return {
      executiveBrief: createExecutiveBrief(
        input,
        recommendations.length,
        opportunities.length,
      ),
      businessHealth: evaluateBusinessHealth(input),
      alerts,
      recommendations,
      opportunities,
    }
  },
}