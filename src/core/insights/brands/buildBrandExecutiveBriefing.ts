import type {
  BrandIntelligenceItem,
} from '../../analytics/brands'

export type BrandBriefingSeverity =
  | 'positive'
  | 'neutral'
  | 'warning'
  | 'critical'

export type BrandBriefingFindingKind =
  | 'revenue'
  | 'grossProfit'
  | 'customers'
  | 'products'
  | 'margin'
  | 'participation'

export type BrandBriefingFindingTone =
  | 'positive'
  | 'neutral'
  | 'warning'
  | 'critical'

export interface BrandExecutiveFinding {
  kind: BrandBriefingFindingKind

  label: string

  value: string

  detail?: string

  tone: BrandBriefingFindingTone
}

export interface BrandExecutiveBriefing {
  severity: BrandBriefingSeverity

  title: string

  headline: string

  summary: string

  diagnosis: string

  findings: BrandExecutiveFinding[]

  recommendations: string[]
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

function formatCompactCurrency(
  value: number,
) {
  const absoluteValue =
    Math.abs(value)

  if (absoluteValue >= 1_000_000) {
    return `$${(
      absoluteValue /
      1_000_000
    ).toLocaleString(
      'es-MX',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )} M`
  }

  if (absoluteValue >= 1_000) {
    return `$${(
      absoluteValue /
      1_000
    ).toLocaleString(
      'es-MX',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      },
    )} K`
  }

  return formatCurrency(
    absoluteValue,
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

function formatSignedPercentage(
  value: number | null,
) {
  if (value === null) {
    return 'Sin comparación'
  }

  const formattedValue =
    formatPercentage(
      Math.abs(value),
    )

  if (value > 0) {
    return `+${formattedValue}`
  }

  if (value < 0) {
    return `-${formattedValue}`
  }

  return formattedValue
}

function formatSignedNumber(
  value: number,
) {
  const absoluteValue =
    Math.abs(value).toLocaleString(
      'es-MX',
      {
        maximumFractionDigits: 0,
      },
    )

  if (value > 0) {
    return `+${absoluteValue}`
  }

  if (value < 0) {
    return `-${absoluteValue}`
  }

  return absoluteValue
}

function getSeverity(
  brand: BrandIntelligenceItem,
): BrandBriefingSeverity {
  const revenueVariation =
    brand.revenueVariationPercentage

  if (
    brand.requiresAttention &&
    revenueVariation !== null &&
    revenueVariation <= -0.25
  ) {
    return 'critical'
  }

  if (
    brand.requiresAttention ||
    (
      revenueVariation !== null &&
      revenueVariation < 0
    )
  ) {
    return 'warning'
  }

  if (
    revenueVariation !== null &&
    revenueVariation > 0.05
  ) {
    return 'positive'
  }

  return 'neutral'
}

function buildHeadline(
  brand: BrandIntelligenceItem,
  severity: BrandBriefingSeverity,
) {
  if (
    severity === 'critical'
  ) {
    return `${brand.brandName} presenta un deterioro importante en su desempeño comercial durante el periodo analizado.`
  }

  if (
    severity === 'warning'
  ) {
    return `${brand.brandName} presenta señales de atención en su desempeño comercial.`
  }

  if (
    severity === 'positive'
  ) {
    return `${brand.brandName} presenta una evolución favorable en su desempeño comercial.`
  }

  if (
    brand.trendStatus ===
    'without_comparison'
  ) {
    return `${brand.brandName} todavía no cuenta con un periodo anterior comparable.`
  }

  return `${brand.brandName} mantiene un desempeño comercial relativamente estable.`
}

function buildSummary(
  brand: BrandIntelligenceItem,
) {
  const revenuePercentage =
    formatPercentage(
      Math.abs(
        brand.revenueVariationPercentage ??
          0,
      ),
    )

  const revenueAmount =
    formatCompactCurrency(
      brand.revenueVariation,
    )

  const gpPercentage =
    formatPercentage(
      Math.abs(
        brand.grossProfitVariationPercentage ??
          0,
      ),
    )

  const margin =
    brand.currentPeriod.margin !==
    null
      ? formatPercentage(
          brand.currentPeriod.margin,
        )
      : null

  if (
    brand.trendStatus ===
    'declining'
  ) {
    return `La venta disminuyó ${revenuePercentage}, equivalente a ${revenueAmount}, acompañada por una reducción del ${gpPercentage} en el GP. ${
      margin
        ? `Aunque la marca conserva un margen bruto de ${margin}, la disminución de clientes activos y del portafolio vendido indica una pérdida de volumen comercial.`
        : 'La disminución de clientes activos y del portafolio vendido indica una pérdida de volumen comercial.'
    }`
  }

  if (
    brand.trendStatus ===
    'growing'
  ) {
    return `La venta aumentó ${revenuePercentage}, equivalente a ${revenueAmount}, acompañada por una variación del ${gpPercentage} en el GP. ${
      margin
        ? `El margen bruto actual se ubica en ${margin}.`
        : ''
    }`
  }

  if (
    brand.trendStatus ===
    'without_comparison'
  ) {
    return `La marca registra ventas por ${formatCurrency(
      brand.currentPeriod.revenue,
    )}, pero todavía no existe un periodo anterior comparable para determinar su evolución.`
  }

  return `La venta mantiene un comportamiento relativamente estable frente al periodo anterior. ${
    margin
      ? `El margen bruto actual se ubica en ${margin}.`
      : ''
  }`
}

function buildDiagnosis(
  brand: BrandIntelligenceItem,
) {
  const margin =
    brand.currentPeriod.margin

  const decliningVolume =
    brand.customerVariation < 0 ||
    brand.productVariation < 0

  const stableMargin =
    brand.marginVariation !==
      null &&
    brand.marginVariation >
      -0.01

  if (
    brand.trendStatus ===
      'declining' &&
    decliningVolume &&
    stableMargin
  ) {
    return `La evidencia disponible indica que el principal problema no parece ser el margen, sino la disminución del volumen comercial. La reducción simultánea de clientes activos y del portafolio vendido sugiere que la prioridad debe centrarse en recuperar actividad comercial antes de considerar ajustes de precios.`
  }

  if (
    brand.trendStatus ===
      'declining' &&
    decliningVolume
  ) {
    return `La caída está acompañada por una reducción de clientes activos y productos vendidos. Esto sugiere una contracción de la actividad comercial que requiere identificar dónde se concentra la pérdida de volumen.`
  }

  if (
    brand.trendStatus ===
      'growing' &&
    brand.customerVariation > 0
  ) {
    return `El crecimiento está acompañado por una ampliación de la base activa de clientes. Conviene identificar los clientes y productos que explican el resultado para replicar el desempeño.`
  }

  if (
    margin !== null &&
    brand.marginVariation !==
      null &&
    brand.marginVariation < -0.01
  ) {
    return `El desempeño requiere revisar no solo el volumen, sino también la rentabilidad. La variación negativa del margen puede estar relacionada con mezcla de producto, descuentos o condiciones comerciales.`
  }

  return `El desempeño debe revisarse considerando conjuntamente venta, GP, clientes activos, productos vendidos y margen bruto.`
}

function getVariationTone(
  value: number,
): BrandBriefingFindingTone {
  if (value < 0) {
    return 'critical'
  }

  if (value > 0) {
    return 'positive'
  }

  return 'neutral'
}

function buildFindings(
  brand: BrandIntelligenceItem,
): BrandExecutiveFinding[] {
  const findings:
    BrandExecutiveFinding[] = []

  findings.push({
    kind: 'revenue',

    label: 'Venta',

    value:
      formatSignedPercentage(
        brand.revenueVariationPercentage,
      ),

    detail:
      brand.revenueVariation === 0
        ? 'Sin variación monetaria'
        : `${
            brand.revenueVariation > 0
              ? '+'
              : '-'
          }${formatCompactCurrency(
            brand.revenueVariation,
          )}`,

    tone:
      getVariationTone(
        brand.revenueVariation,
      ),
  })

  findings.push({
    kind: 'grossProfit',

    label: 'Gross Profit',

    value:
      formatSignedPercentage(
        brand.grossProfitVariationPercentage,
      ),

    detail:
      brand.grossProfitVariation ===
      0
        ? 'Sin variación monetaria'
        : `${
            brand.grossProfitVariation >
            0
              ? '+'
              : '-'
          }${formatCompactCurrency(
            brand.grossProfitVariation,
          )}`,

    tone:
      getVariationTone(
        brand.grossProfitVariation,
      ),
  })

  findings.push({
    kind: 'customers',

    label: 'Clientes activos',

    value:
      formatSignedNumber(
        brand.customerVariation,
      ),

    detail:
      'vs. periodo anterior',

    tone:
      getVariationTone(
        brand.customerVariation,
      ),
  })

  findings.push({
    kind: 'products',

    label: 'Productos vendidos',

    value:
      formatSignedNumber(
        brand.productVariation,
      ),

    detail:
      'vs. periodo anterior',

    tone:
      getVariationTone(
        brand.productVariation,
      ),
  })

  findings.push({
    kind: 'margin',

    label: 'GP %',

    value:
      formatPercentage(
        brand.currentPeriod.margin,
      ),

    detail:
      brand.marginVariation ===
      null
        ? 'Margen actual'
        : `${formatSignedPercentage(
            brand.marginVariation,
          )} vs. periodo anterior`,

    tone:
      brand.marginVariation !==
        null &&
      brand.marginVariation < -0.01
        ? 'warning'
        : 'neutral',
  })

  findings.push({
    kind: 'participation',

    label: 'Participación',

    value:
      formatPercentage(
        brand.revenueParticipation,
      ),

    detail:
      'sobre la venta total',

    tone: 'neutral',
  })

  return findings
}

function buildRecommendations(
  brand: BrandIntelligenceItem,
) {
  const recommendations: string[] =
    []

  if (
    brand.customerVariation < 0
  ) {
    recommendations.push(
      'Priorizar la recuperación de clientes activos que dejaron de comprar la marca.',
    )
  }

  if (
    brand.productVariation < 0
  ) {
    recommendations.push(
      'Identificar los productos que dejaron de venderse y revisar disponibilidad, precio y demanda.',
    )
  }

  if (
    brand.grossProfitVariationPercentage !==
      null &&
    brand.revenueVariationPercentage !==
      null &&
    brand.grossProfitVariationPercentage <
      brand.revenueVariationPercentage
  ) {
    recommendations.push(
      'Revisar la mezcla de producto y los descuentos, porque el GP presenta una presión mayor que la venta.',
    )
  }

  if (
    brand.revenueVariationPercentage !==
      null &&
    brand.revenueVariationPercentage <
      0 &&
    brand.currentPeriod.margin !==
      null &&
    brand.marginVariation !== null &&
    brand.marginVariation > -0.01
  ) {
    recommendations.push(
      'Priorizar la recuperación de volumen antes de modificar precios, ya que el margen se mantiene relativamente estable.',
    )
  }

  if (
    brand.trendStatus ===
    'growing'
  ) {
    recommendations.push(
      'Identificar los clientes y productos que explican el crecimiento para replicar el resultado.',
    )
  }

  if (
    recommendations.length === 0
  ) {
    recommendations.push(
      'Mantener seguimiento periódico de los principales clientes y productos de la marca.',
    )
  }

  return recommendations
}

export function buildBrandExecutiveBriefing(
  brand: BrandIntelligenceItem,
): BrandExecutiveBriefing {
  const severity =
    getSeverity(
      brand,
    )

  return {
    severity,

    title:
      `¿Qué pasó con ${brand.brandName}?`,

    headline:
      buildHeadline(
        brand,
        severity,
      ),

    summary:
      buildSummary(
        brand,
      ),

    diagnosis:
      buildDiagnosis(
        brand,
      ),

    findings:
      buildFindings(
        brand,
      ),

    recommendations:
      buildRecommendations(
        brand,
      ),
  }
}