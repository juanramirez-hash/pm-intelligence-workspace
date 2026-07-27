import type {
  BrandIntelligenceSummary,
} from '../../analytics/brands'

import type {
  ExecutiveBriefItem,
} from './executiveBriefTypes'

function formatCurrency(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return 'Sin comparación'
  }

  return value.toLocaleString('es-MX', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

function clampConfidence(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

function portfolioConfidence(
  summary: BrandIntelligenceSummary,
): number {
  if (summary.totalBrands <= 0) {
    return 0
  }

  return clampConfidence(
    70 + Math.min(25, summary.activeBrands / 2),
  )
}

export function buildExecutiveBriefHighlights(
  summary: BrandIntelligenceSummary,
): readonly ExecutiveBriefItem[] {
  const items: ExecutiveBriefItem[] = []

  items.push({
    id: 'executive-brief.highlight.revenue',
    category: 'revenue',
    severity:
      (summary.revenueVariationPercentage ?? 0) >= 0
        ? 'positive'
        : 'neutral',
    title: 'Venta consolidada del periodo',
    description:
      `El portafolio generó ${formatCurrency(summary.currentPeriodRevenue)} durante ${summary.currentPeriodId}.`,
    confidence: summary.totalBrands > 0 ? 100 : 60,
    explanation: {
      ruleId: 'BRIEF-H-001',
      rationale:
        'La venta consolidada corresponde a la suma de la actividad registrada por marca en el periodo actual.',
      evidence: [
        {
          label: 'Venta actual',
          value: formatCurrency(summary.currentPeriodRevenue),
        },
        {
          label: 'Periodo',
          value: summary.currentPeriodId,
        },
      ],
    },
  })

  if (summary.growingBrands > 0) {
    items.push({
      id: 'executive-brief.highlight.growing-brands',
      category: 'growth',
      severity: 'positive',
      title: 'Marcas con crecimiento',
      description:
        `${summary.growingBrands.toLocaleString('es-MX')} marcas registran variación positiva frente al periodo comparable anterior.`,
      confidence: portfolioConfidence(summary),
      explanation: {
        ruleId: 'BRIEF-H-002',
        rationale:
          'Se consideran en crecimiento las marcas cuya variación supera el umbral estable configurado por Brand Intelligence.',
        evidence: [
          {
            label: 'En crecimiento',
            value: summary.growingBrands.toLocaleString('es-MX'),
          },
          {
            label: 'Marcas activas',
            value: summary.activeBrands.toLocaleString('es-MX'),
          },
        ],
      },
    })
  }

  if (summary.newBrands > 0 || summary.recoveredBrands > 0) {
    items.push({
      id: 'executive-brief.highlight.activation',
      category: 'recovery',
      severity: 'positive',
      title: 'Actividad comercial incorporada',
      description:
        `${summary.newBrands.toLocaleString('es-MX')} marcas nuevas y ${summary.recoveredBrands.toLocaleString('es-MX')} recuperadas aportaron actividad al periodo.`,
      confidence: portfolioConfidence(summary),
      explanation: {
        ruleId: 'BRIEF-H-003',
        rationale:
          'La lectura combina marcas con primera actividad registrada y marcas que reanudaron actividad después de un periodo sin venta.',
        evidence: [
          {
            label: 'Nuevas',
            value: summary.newBrands.toLocaleString('es-MX'),
          },
          {
            label: 'Recuperadas',
            value: summary.recoveredBrands.toLocaleString('es-MX'),
          },
        ],
      },
    })
  }

  return items
}

export function buildExecutiveBriefRisks(
  summary: BrandIntelligenceSummary,
): readonly ExecutiveBriefItem[] {
  const items: ExecutiveBriefItem[] = []

  if (
    summary.revenueVariationPercentage !== null &&
    summary.revenueVariationPercentage < 0
  ) {
    items.push({
      id: 'executive-brief.risk.revenue-contraction',
      category: 'revenue',
      severity:
        summary.revenueVariationPercentage <= -0.1
          ? 'critical'
          : 'attention',
      title: 'Contracción de venta',
      description:
        `La venta disminuyó ${formatPercent(Math.abs(summary.revenueVariationPercentage))} y representa ${formatCurrency(summary.revenueVariation)} frente al periodo anterior.`,
      confidence: 100,
      explanation: {
        ruleId: 'BRIEF-R-001',
        rationale:
          'La variación consolidada es negativa respecto al periodo inmediatamente anterior.',
        evidence: [
          {
            label: 'Variación porcentual',
            value: formatPercent(summary.revenueVariationPercentage),
          },
          {
            label: 'Variación absoluta',
            value: formatCurrency(summary.revenueVariation),
          },
        ],
      },
    })
  }

  if (summary.decliningBrands > summary.growingBrands) {
    const decliningShare = summary.activeBrands > 0
      ? summary.decliningBrands / summary.activeBrands
      : 0

    items.push({
      id: 'executive-brief.risk.portfolio-deterioration',
      category: 'portfolio',
      severity: decliningShare >= 0.5 ? 'critical' : 'attention',
      title: 'Deterioro extendido del portafolio',
      description:
        `${summary.decliningBrands.toLocaleString('es-MX')} marcas están en descenso frente a ${summary.growingBrands.toLocaleString('es-MX')} en crecimiento.`,
      confidence: portfolioConfidence(summary),
      explanation: {
        ruleId: 'BRIEF-R-002',
        rationale:
          'El número de marcas en descenso supera al de marcas con crecimiento, señal de presión distribuida en el portafolio.',
        evidence: [
          {
            label: 'En descenso',
            value: summary.decliningBrands.toLocaleString('es-MX'),
          },
          {
            label: 'En crecimiento',
            value: summary.growingBrands.toLocaleString('es-MX'),
          },
          {
            label: 'Participación en descenso',
            value: formatPercent(decliningShare),
          },
        ],
      },
    })
  }

  if (summary.brandsRequiringAttention > 0) {
    items.push({
      id: 'executive-brief.risk.attention-load',
      category: 'portfolio',
      severity:
        summary.brandsRequiringAttention >= Math.max(1, summary.activeBrands / 2)
          ? 'critical'
          : 'attention',
      title: 'Carga elevada de atención comercial',
      description:
        `${summary.brandsRequiringAttention.toLocaleString('es-MX')} marcas cumplen criterios de atención y requieren priorización operativa.`,
      confidence: portfolioConfidence(summary),
      explanation: {
        ruleId: 'BRIEF-R-003',
        rationale:
          'Brand Intelligence marcó estas entidades mediante reglas determinísticas de tendencia, actividad y deterioro.',
        evidence: [
          {
            label: 'Requieren atención',
            value: summary.brandsRequiringAttention.toLocaleString('es-MX'),
          },
          {
            label: 'Marcas activas',
            value: summary.activeBrands.toLocaleString('es-MX'),
          },
        ],
      },
    })
  }

  if (summary.brandsWithoutComparison > 0) {
    items.push({
      id: 'executive-brief.risk.comparison-coverage',
      category: 'data-quality',
      severity: 'attention',
      title: 'Cobertura comparativa incompleta',
      description:
        `${summary.brandsWithoutComparison.toLocaleString('es-MX')} marcas no cuentan con una base comparable suficiente para clasificar su tendencia.`,
      confidence: 100,
      explanation: {
        ruleId: 'BRIEF-R-004',
        rationale:
          'Una marca sin venta comparable anterior no permite calcular una variación porcentual confiable.',
        evidence: [
          {
            label: 'Sin comparación',
            value: summary.brandsWithoutComparison.toLocaleString('es-MX'),
          },
        ],
      },
    })
  }

  return items
}

export function buildExecutiveBriefOpportunities(
  summary: BrandIntelligenceSummary,
): readonly ExecutiveBriefItem[] {
  const items: ExecutiveBriefItem[] = []

  if (summary.decliningBrands > 0) {
    items.push({
      id: 'executive-brief.opportunity.recovery',
      category: 'recovery',
      severity: 'neutral',
      title: 'Recuperación focalizada de marcas',
      description:
        `Las ${summary.decliningBrands.toLocaleString('es-MX')} marcas en descenso forman una cartera priorizable para acciones de recuperación.`,
      confidence: portfolioConfidence(summary),
      explanation: {
        ruleId: 'BRIEF-O-001',
        rationale:
          'Las marcas con descenso ya tienen actividad o historia comercial y pueden ordenarse por impacto absoluto para intervenir primero las de mayor valor.',
        evidence: [
          {
            label: 'Marcas recuperables',
            value: summary.decliningBrands.toLocaleString('es-MX'),
          },
          {
            label: 'Variación consolidada',
            value: formatCurrency(summary.revenueVariation),
          },
        ],
      },
    })
  }

  if (summary.growingBrands > 0) {
    items.push({
      id: 'executive-brief.opportunity.scale-growth',
      category: 'growth',
      severity: 'positive',
      title: 'Escalar marcas con tracción positiva',
      description:
        `${summary.growingBrands.toLocaleString('es-MX')} marcas muestran crecimiento y pueden utilizarse para compensar parcialmente la contracción del portafolio.`,
      confidence: portfolioConfidence(summary),
      explanation: {
        ruleId: 'BRIEF-O-002',
        rationale:
          'La expansión sobre marcas con tracción observable reduce la dependencia exclusiva de acciones de recuperación.',
        evidence: [
          {
            label: 'En crecimiento',
            value: summary.growingBrands.toLocaleString('es-MX'),
          },
          {
            label: 'Venta actual',
            value: formatCurrency(summary.currentPeriodRevenue),
          },
        ],
      },
    })
  }

  if (summary.inactiveBrands > 0 || summary.lostBrands > 0) {
    items.push({
      id: 'executive-brief.opportunity.reactivate-portfolio',
      category: 'recovery',
      severity: 'neutral',
      title: 'Reactivar cobertura del portafolio',
      description:
        `${summary.inactiveBrands.toLocaleString('es-MX')} marcas inactivas y ${summary.lostBrands.toLocaleString('es-MX')} perdidas representan cobertura potencial a evaluar.`,
      confidence: portfolioConfidence(summary),
      explanation: {
        ruleId: 'BRIEF-O-003',
        rationale:
          'Las marcas sin actividad actual pueden revisarse para distinguir oportunidades recuperables de portafolio no estratégico.',
        evidence: [
          {
            label: 'Inactivas',
            value: summary.inactiveBrands.toLocaleString('es-MX'),
          },
          {
            label: 'Perdidas',
            value: summary.lostBrands.toLocaleString('es-MX'),
          },
        ],
      },
    })
  }

  return items
}

export function buildExecutiveBriefRecommendations(
  summary: BrandIntelligenceSummary,
): readonly ExecutiveBriefItem[] {
  const items: ExecutiveBriefItem[] = []

  if (summary.decliningBrands > summary.growingBrands) {
    items.push({
      id: 'executive-brief.recommendation.recover-before-expand',
      category: 'recovery',
      severity: 'critical',
      title: 'Priorizar recuperación antes de ampliar portafolio',
      description:
        'Ordena las marcas en descenso por pérdida absoluta de venta y asigna responsables y acciones a las de mayor impacto.',
      confidence: clampConfidence(80 + Math.min(15, summary.decliningBrands)),
      explanation: {
        ruleId: 'BRIEF-A-001',
        rationale:
          'La cantidad de marcas en descenso supera a las que crecen; dispersar recursos en expansión puede diluir la recuperación del ingreso existente.',
        evidence: [
          {
            label: 'En descenso',
            value: summary.decliningBrands.toLocaleString('es-MX'),
          },
          {
            label: 'En crecimiento',
            value: summary.growingBrands.toLocaleString('es-MX'),
          },
          {
            label: 'Brecha de venta',
            value: formatCurrency(summary.revenueVariation),
          },
        ],
      },
    })
  }

  if (
    summary.revenueVariationPercentage !== null &&
    summary.revenueVariationPercentage <= -0.05
  ) {
    items.push({
      id: 'executive-brief.recommendation.review-commercial-drivers',
      category: 'revenue',
      severity: 'critical',
      title: 'Revisar impulsores de la caída de venta',
      description:
        'Contrasta disponibilidad, precio, clientes compradores y productos activos en las marcas que concentran la mayor pérdida.',
      confidence: 95,
      explanation: {
        ruleId: 'BRIEF-A-002',
        rationale:
          'Una contracción igual o superior a 5% requiere identificar causas operativas antes de definir promociones o ajustes de portafolio.',
        evidence: [
          {
            label: 'Variación de venta',
            value: formatPercent(summary.revenueVariationPercentage),
          },
          {
            label: 'Pérdida absoluta',
            value: formatCurrency(summary.revenueVariation),
          },
        ],
      },
    })
  }

  if (summary.growingBrands > 0) {
    items.push({
      id: 'executive-brief.recommendation.protect-growth',
      category: 'growth',
      severity: 'positive',
      title: 'Proteger la continuidad de las marcas en crecimiento',
      description:
        'Verifica inventario, órdenes abiertas y cobertura comercial de las marcas con mayor crecimiento antes de incrementar demanda.',
      confidence: portfolioConfidence(summary),
      explanation: {
        ruleId: 'BRIEF-A-003',
        rationale:
          'La continuidad de abastecimiento protege la tracción positiva y evita que el crecimiento se convierta en venta no atendida.',
        evidence: [
          {
            label: 'Marcas en crecimiento',
            value: summary.growingBrands.toLocaleString('es-MX'),
          },
        ],
      },
    })
  }

  if (items.length === 0) {
    items.push({
      id: 'executive-brief.recommendation.maintain-monitoring',
      category: 'general',
      severity: 'neutral',
      title: 'Mantener monitoreo del portafolio',
      description:
        'Conserva la revisión periódica de venta, tendencia y cobertura hasta contar con una señal material que requiera intervención.',
      confidence: summary.totalBrands > 0 ? 85 : 50,
      explanation: {
        ruleId: 'BRIEF-A-004',
        rationale:
          'No se activaron reglas de deterioro o crecimiento con prioridad suficiente para recomendar una intervención específica.',
        evidence: [
          {
            label: 'Marcas analizadas',
            value: summary.totalBrands.toLocaleString('es-MX'),
          },
        ],
      },
    })
  }

  return items
}
