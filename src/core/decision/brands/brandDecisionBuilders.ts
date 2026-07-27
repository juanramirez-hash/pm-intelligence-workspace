import type {
  BusinessExecutiveBrief,
} from '../../business'

import type {
  BrandCommercialPriority,
  BrandDecisionInsight,
  BrandLostCustomer,
  BrandLostProduct,
  BrandRecommendedAction,
  BrandRecommendedActionPriority,
} from './brandDecisionTypes'

function toDecisionInsight(
  item: BusinessExecutiveBrief['risks'][number],
): BrandDecisionInsight {
  return {
    code: item.code,
    category: item.category,
    severity: item.severity,
    title: item.title,
    description: item.description,
  }
}

function resolveActionPriority(
  priority: BrandCommercialPriority,
): BrandRecommendedActionPriority {
  return priority.level
}

export function buildBrandRisks(
  executiveBrief: BusinessExecutiveBrief,
  lostCustomers: readonly BrandLostCustomer[],
  lostProducts: readonly BrandLostProduct[],
): BrandDecisionInsight[] {
  const risks = executiveBrief.risks.map(
    toDecisionInsight,
  )

  if (lostCustomers.length > 0) {
    risks.push({
      code: 'lost-customers-risk',
      category: 'customers',
      severity:
        lostCustomers.length >= 3
          ? 'critical'
          : 'attention',
      title: 'Pérdida de clientes activos',
      description:
        `${lostCustomers.length} ${lostCustomers.length === 1 ? 'cliente dejó' : 'clientes dejaron'} de comprar la marca frente al periodo anterior.`,
    })
  }

  if (lostProducts.length > 0) {
    risks.push({
      code: 'lost-products-risk',
      category: 'products',
      severity:
        lostProducts.length >= 5
          ? 'critical'
          : 'attention',
      title: 'Contracción del portafolio activo',
      description:
        `${lostProducts.length} ${lostProducts.length === 1 ? 'producto perdió' : 'productos perdieron'} actividad comercial frente al periodo anterior.`,
    })
  }

  return risks
}

export function buildBrandOpportunities(
  executiveBrief: BusinessExecutiveBrief,
  lostCustomers: readonly BrandLostCustomer[],
  lostProducts: readonly BrandLostProduct[],
): BrandDecisionInsight[] {
  const opportunities =
    executiveBrief.opportunities.map(
      toDecisionInsight,
    )

  if (lostCustomers.length > 0) {
    const recoverableRevenue =
      lostCustomers.reduce(
        (total, customer) =>
          total + customer.previousRevenue,
        0,
      )

    opportunities.push({
      code: 'recover-lost-customers',
      category: 'customers',
      severity: 'positive',
      title: 'Recuperación de clientes',
      description:
        `Existe una oportunidad de recuperar ${lostCustomers.length} ${lostCustomers.length === 1 ? 'cliente' : 'clientes'} que generaron ${recoverableRevenue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })} en el periodo anterior.`,
    })
  }

  if (lostProducts.length > 0) {
    opportunities.push({
      code: 'reactivate-lost-products',
      category: 'products',
      severity: 'positive',
      title: 'Reactivación de productos',
      description:
        `Revisar la disponibilidad, demanda y estrategia comercial de ${lostProducts.length} ${lostProducts.length === 1 ? 'producto que perdió' : 'productos que perdieron'} actividad.`,
    })
  }

  return opportunities
}

export function buildBrandRecommendedActions(
  executiveBrief: BusinessExecutiveBrief,
  priority: BrandCommercialPriority,
  lostCustomers: readonly BrandLostCustomer[],
  lostProducts: readonly BrandLostProduct[],
): BrandRecommendedAction[] {
  const actions: BrandRecommendedAction[] =
    executiveBrief.recommendations.map(
      (recommendation) => ({
        code: recommendation.code,
        priority:
          recommendation.severity === 'critical'
            ? 'critical'
            : recommendation.severity === 'attention'
              ? 'high'
              : 'low',
        title: recommendation.title,
        description: recommendation.description,
        reasonCodes: [recommendation.code],
      }),
    )

  if (lostCustomers.length > 0) {
    actions.push({
      code: 'contact-lost-customers',
      priority: resolveActionPriority(priority),
      title: 'Contactar clientes perdidos',
      description:
        'Priorizar el contacto con los clientes de mayor venta previa para identificar la causa de pérdida y definir una acción de recuperación.',
      reasonCodes: ['lost-customers'],
    })
  }

  if (lostProducts.length > 0) {
    actions.push({
      code: 'review-lost-products',
      priority:
        priority.level === 'critical'
          ? 'high'
          : 'medium',
      title: 'Revisar productos sin actividad',
      description:
        'Validar inventario, precio, sustitutos y demanda de los productos que dejaron de venderse antes de definir su reactivación.',
      reasonCodes: ['lost-products'],
    })
  }

  if (
    priority.reasons.some(
      (reason) =>
        reason.code === 'revenue-below-target',
    )
  ) {
    actions.push({
      code: 'close-revenue-gap',
      priority: resolveActionPriority(priority),
      title: 'Cerrar brecha de venta',
      description:
        'Definir un plan comercial de corto plazo para recuperar el cumplimiento del objetivo mensual de venta.',
      reasonCodes: ['revenue-below-target'],
    })
  }

  if (
    priority.reasons.some(
      (reason) =>
        reason.code === 'margin-below-target' ||
        reason.code === 'margin-deterioration',
    )
  ) {
    actions.push({
      code: 'protect-gross-margin',
      priority: resolveActionPriority(priority),
      title: 'Proteger el margen bruto',
      description:
        'Revisar descuentos, mezcla de producto y condiciones comerciales que están presionando el margen de la marca.',
      reasonCodes: [
        'margin-below-target',
        'margin-deterioration',
      ],
    })
  }

  const uniqueActions = new Map(
    actions.map(
      (action) => [action.code, action],
    ),
  )

  return [...uniqueActions.values()]
}
