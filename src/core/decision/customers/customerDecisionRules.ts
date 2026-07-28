import type {
  CustomerDecisionEvidence,
  CustomerDecisionInsight,
  CustomerHealthComponent,
  CustomerHealthScore,
  CustomerRecommendationPriority,
  CustomerRecommendedAction,
  CustomerRiskLevel,
} from './customerDecisionTypes'

export interface CustomerDecisionSignals {
  customerName: string
  selectedBrandName: string
  inactiveMonths: number
  currentRevenue: number
  previousRevenue: number
  revenueVariation: number | null
  currentDocuments: number
  previousDocuments: number
  documentVariation: number | null
  currentProducts: number
  previousProducts: number
  productRetention: number | null
  currentBrands: number
  historicalBrands: number
  activePeriodRate: number
  timelinePeriods: number
  activePeriods: number
  recoveryPotential: number
  inactiveProducts: number
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function variationScore(
  variation: number | null,
): number {
  if (variation === null) return 55
  return clamp(60 + variation * 80)
}

export function buildCustomerHealthScore(
  signals: CustomerDecisionSignals,
): CustomerHealthScore {
  const activityScore =
    signals.inactiveMonths === 0
      ? 100
      : signals.inactiveMonths === 1
        ? 65
        : signals.inactiveMonths === 2
          ? 35
          : 10

  const trendScore = variationScore(
    signals.revenueVariation,
  )

  const frequencyScore = variationScore(
    signals.documentVariation,
  )

  const portfolioScore =
    signals.productRetention === null
      ? signals.currentProducts > 0
        ? 70
        : 25
      : clamp(
          signals.productRetention * 100,
        )

  const stabilityScore = clamp(
    signals.activePeriodRate * 100,
  )

  const components: CustomerHealthComponent[] = [
    {
      id: 'activity',
      label: 'Actividad reciente',
      score: activityScore,
      weight: 0.3,
      explanation:
        signals.inactiveMonths === 0
          ? 'El cliente registra actividad en el periodo actual.'
          : `El cliente acumula ${signals.inactiveMonths} meses sin actividad.`,
    },
    {
      id: 'trend',
      label: 'Tendencia de venta',
      score: trendScore,
      weight: 0.25,
      explanation:
        signals.revenueVariation === null
          ? 'No existe una base comparable suficiente.'
          : `La variación de venta es ${round(signals.revenueVariation * 100)}%.`,
    },
    {
      id: 'frequency',
      label: 'Frecuencia de compra',
      score: frequencyScore,
      weight: 0.2,
      explanation:
        signals.documentVariation === null
          ? 'No existe una base comparable de documentos.'
          : `La variación en documentos es ${round(signals.documentVariation * 100)}%.`,
    },
    {
      id: 'portfolio',
      label: 'Continuidad de portafolio',
      score: portfolioScore,
      weight: 0.15,
      explanation:
        signals.productRetention === null
          ? 'No existe un portafolio anterior comparable.'
          : `El cliente conserva ${round(signals.productRetention * 100)}% de los productos del periodo anterior.`,
    },
    {
      id: 'stability',
      label: 'Recurrencia histórica',
      score: stabilityScore,
      weight: 0.1,
      explanation: `El cliente estuvo activo en ${signals.activePeriods} de ${signals.timelinePeriods} periodos observados.`,
    },
  ]

  const score = round(
    components.reduce(
      (total, component) =>
        total + component.score * component.weight,
      0,
    ),
  )

  if (score >= 80) {
    return {
      score,
      level: 'strong',
      label: 'Relación sólida',
      components,
    }
  }

  if (score >= 60) {
    return {
      score,
      level: 'healthy',
      label: 'Relación saludable',
      components,
    }
  }

  if (score >= 35) {
    return {
      score,
      level: 'attention',
      label: 'Requiere atención',
      components,
    }
  }

  return {
    score,
    level: 'critical',
    label: 'Relación crítica',
    components,
  }
}

function evidence(
  metric: string,
  label: string,
  value: number | string | null,
  comparison?: number | string | null,
): CustomerDecisionEvidence {
  return {
    metric,
    label,
    value,
    comparison,
  }
}

export function buildCustomerRisks(
  signals: CustomerDecisionSignals,
): CustomerDecisionInsight[] {
  const risks: CustomerDecisionInsight[] = []

  if (signals.inactiveMonths >= 2) {
    risks.push({
      id: 'risk-inactivity',
      ruleId: 'customer.inactivity',
      category: 'activity',
      severity:
        signals.inactiveMonths >= 3
          ? 'critical'
          : 'high',
      title: 'Riesgo de abandono',
      description: `${signals.customerName} no registra recompra de ${signals.selectedBrandName}.`,
      rationale: 'La ausencia de actividad durante varios periodos incrementa el riesgo de pérdida comercial.',
      impact: signals.recoveryPotential,
      confidence: 95,
      evidence: [
        evidence(
          'inactiveMonths',
          'Meses sin actividad',
          signals.inactiveMonths,
        ),
        evidence(
          'lastRevenue',
          'Venta del periodo actual',
          signals.currentRevenue,
        ),
      ],
    })
  }

  if (
    signals.revenueVariation !== null &&
    signals.revenueVariation <= -0.2
  ) {
    risks.push({
      id: 'risk-revenue-decline',
      ruleId: 'customer.revenue-decline',
      category: 'revenue',
      severity:
        signals.revenueVariation <= -0.5
          ? 'high'
          : 'medium',
      title: 'Caída relevante de venta',
      description: 'La compra del cliente disminuyó frente al periodo anterior.',
      rationale: 'Una contracción material de venta puede anticipar pérdida de participación o sustitución por otro proveedor.',
      impact: Math.max(
        0,
        signals.previousRevenue - signals.currentRevenue,
      ),
      confidence: 90,
      evidence: [
        evidence(
          'revenueVariation',
          'Variación de venta',
          signals.revenueVariation,
        ),
        evidence(
          'currentRevenue',
          'Venta actual',
          signals.currentRevenue,
          signals.previousRevenue,
        ),
      ],
    })
  }

  if (
    signals.documentVariation !== null &&
    signals.documentVariation <= -0.25
  ) {
    risks.push({
      id: 'risk-frequency-decline',
      ruleId: 'customer.frequency-decline',
      category: 'frequency',
      severity: 'medium',
      title: 'Pérdida de frecuencia',
      description: 'El cliente está comprando con menor recurrencia.',
      rationale: 'La reducción de documentos suele aparecer antes que la pérdida total de venta.',
      impact: Math.max(
        0,
        signals.previousRevenue - signals.currentRevenue,
      ),
      confidence: 85,
      evidence: [
        evidence(
          'documentVariation',
          'Variación de documentos',
          signals.documentVariation,
        ),
        evidence(
          'currentDocuments',
          'Documentos actuales',
          signals.currentDocuments,
          signals.previousDocuments,
        ),
      ],
    })
  }

  if (
    signals.productRetention !== null &&
    signals.productRetention < 0.6
  ) {
    risks.push({
      id: 'risk-portfolio-contraction',
      ruleId: 'customer.portfolio-contraction',
      category: 'portfolio',
      severity: 'medium',
      title: 'Contracción del portafolio',
      description: 'El cliente dejó de comprar una parte relevante de su mezcla anterior.',
      rationale: 'La pérdida de productos activos reduce la profundidad de la cuenta y eleva el riesgo de sustitución.',
      impact: signals.recoveryPotential,
      confidence: 82,
      evidence: [
        evidence(
          'productRetention',
          'Retención de productos',
          signals.productRetention,
        ),
        evidence(
          'currentProducts',
          'Productos actuales',
          signals.currentProducts,
          signals.previousProducts,
        ),
      ],
    })
  }

  return risks.sort(
    (left, right) => right.impact - left.impact,
  )
}

export function buildCustomerOpportunities(
  signals: CustomerDecisionSignals,
): CustomerDecisionInsight[] {
  const opportunities: CustomerDecisionInsight[] = []

  if (
    signals.inactiveMonths > 0 &&
    signals.recoveryPotential > 0
  ) {
    opportunities.push({
      id: 'opportunity-recovery',
      ruleId: 'customer.recovery',
      category: 'recovery',
      severity: 'high',
      title: 'Recuperación de recompra',
      description: 'Existe valor histórico suficiente para justificar una acción de recuperación.',
      rationale: 'El potencial se estima con base en la venta reciente de periodos activos, sin inventar demanda adicional.',
      impact: signals.recoveryPotential,
      confidence: 80,
      evidence: [
        evidence(
          'recoveryPotential',
          'Potencial de recuperación',
          signals.recoveryPotential,
        ),
        evidence(
          'inactiveMonths',
          'Meses sin actividad',
          signals.inactiveMonths,
        ),
      ],
    })
  }

  if (
    signals.revenueVariation !== null &&
    signals.revenueVariation >= 0.15
  ) {
    opportunities.push({
      id: 'opportunity-growth',
      ruleId: 'customer.growth',
      category: 'growth',
      severity: 'positive',
      title: 'Acelerar crecimiento',
      description: 'El cliente presenta una expansión material frente al periodo anterior.',
      rationale: 'La tendencia positiva permite plantear una siguiente venta antes de que se enfríe el impulso comercial.',
      impact: signals.currentRevenue * 0.15,
      confidence: 88,
      evidence: [
        evidence(
          'revenueVariation',
          'Variación de venta',
          signals.revenueVariation,
        ),
      ],
    })
  }

  if (
    signals.inactiveProducts > 0 &&
    signals.inactiveMonths <= 1
  ) {
    opportunities.push({
      id: 'opportunity-product-recovery',
      ruleId: 'customer.product-recovery',
      category: 'cross-sell',
      severity: 'medium',
      title: 'Recuperar productos abandonados',
      description: 'El cliente mantiene actividad, pero dejó de comprar productos de su portafolio histórico.',
      rationale: 'La cuenta sigue activa, por lo que la recuperación de referencias tiene menor fricción que una reactivación completa.',
      impact: signals.recoveryPotential,
      confidence: 78,
      evidence: [
        evidence(
          'inactiveProducts',
          'Productos abandonados',
          signals.inactiveProducts,
        ),
      ],
    })
  }

  if (
    signals.historicalBrands <= 1 &&
    signals.currentRevenue > 0
  ) {
    opportunities.push({
      id: 'opportunity-brand-cross-sell',
      ruleId: 'customer.brand-cross-sell',
      category: 'cross-sell',
      severity: 'medium',
      title: 'Ampliar mezcla de marcas',
      description: 'El cliente compra una mezcla de marcas limitada.',
      rationale: 'Una cuenta activa con baja diversificación permite explorar marcas complementarias sin depender de recuperar actividad.',
      impact: signals.currentRevenue * 0.1,
      confidence: 65,
      evidence: [
        evidence(
          'historicalBrands',
          'Marcas históricas',
          signals.historicalBrands,
        ),
      ],
    })
  }

  return opportunities.sort(
    (left, right) => right.impact - left.impact,
  )
}

function priorityFromSeverity(
  severity: CustomerDecisionInsight['severity'],
): CustomerRecommendationPriority {
  if (severity === 'critical') return 'immediate'
  if (severity === 'high') return 'high'
  if (severity === 'medium') return 'medium'
  return 'routine'
}

export function buildCustomerRecommendedActions(
  risks: readonly CustomerDecisionInsight[],
  opportunities: readonly CustomerDecisionInsight[],
): CustomerRecommendedAction[] {
  const primaryRisk = risks[0]
  const primaryOpportunity = opportunities[0]
  const actions: CustomerRecommendedAction[] = []

  if (primaryRisk) {
    actions.push({
      id: `action-${primaryRisk.id}`,
      code: 'mitigate-customer-risk',
      priority: priorityFromSeverity(
        primaryRisk.severity,
      ),
      title: 'Ejecutar contacto comercial dirigido',
      description: 'Contactar al cliente con una propuesta basada en su última mezcla, frecuencia y productos abandonados.',
      expectedOutcome: 'Reducir el riesgo detectado y recuperar actividad medible en el siguiente periodo.',
      reasonIds: [primaryRisk.id],
    })
  }

  if (primaryOpportunity) {
    actions.push({
      id: `action-${primaryOpportunity.id}`,
      code: 'develop-customer-opportunity',
      priority: priorityFromSeverity(
        primaryOpportunity.severity,
      ),
      title: primaryOpportunity.title,
      description: primaryOpportunity.description,
      expectedOutcome: 'Convertir la oportunidad en venta incremental o mayor profundidad de portafolio.',
      reasonIds: [primaryOpportunity.id],
    })
  }

  if (actions.length === 0) {
    actions.push({
      id: 'action-maintain-customer',
      code: 'maintain-customer',
      priority: 'routine',
      title: 'Mantener seguimiento de cuenta',
      description: 'Conservar la cadencia comercial y revisar oportunidades de mezcla antes del siguiente periodo.',
      expectedOutcome: 'Sostener la recurrencia y detectar cambios tempranos.',
      reasonIds: [],
    })
  }

  return actions
}

export function resolveCustomerRisk(
  risks: readonly CustomerDecisionInsight[],
  inactiveMonths: number,
): {
  level: CustomerRiskLevel
  label: string
  probability: number
} {
  const topSeverity = risks[0]?.severity

  if (
    topSeverity === 'critical' ||
    inactiveMonths >= 3
  ) {
    return {
      level: 'critical',
      label: 'Riesgo crítico',
      probability: 35,
    }
  }

  if (
    topSeverity === 'high' ||
    inactiveMonths >= 2
  ) {
    return {
      level: 'high',
      label: 'Riesgo alto',
      probability: 55,
    }
  }

  if (
    topSeverity === 'medium' ||
    inactiveMonths === 1
  ) {
    return {
      level: 'medium',
      label: 'Atención',
      probability: 72,
    }
  }

  return {
    level: 'low',
    label: 'Activo',
    probability: 88,
  }
}
