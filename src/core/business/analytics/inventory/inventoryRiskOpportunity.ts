import type {
  BusinessInventoryPosition,
} from '../../entities/inventoryPosition'

export type InventoryRiskType =
  | 'negative_stock'
  | 'out_of_stock'
  | 'overcommitted'
  | 'no_available_stock'
  | 'unresolved_product'
  | 'value_concentration'

export type InventoryOpportunityType =
  | 'transfer_candidate'
  | 'purchase_review'
  | 'inbound_recovery'
  | 'commitment_release'

export type InventoryActionPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export interface InventoryRiskEvidence {
  onHand: number
  available: number
  committed: number
  inbound: number
  inventoryValue: number
  valueShare: number
}

export interface InventoryRiskSignal {
  id: string
  type: InventoryRiskType
  priority: InventoryActionPriority
  score: number
  snapshotDate: string | null
  productId: string | null
  productName: string
  brandId: string | null
  locationId: string | null
  title: string
  rationale: string
  evidence: InventoryRiskEvidence
}

export interface InventoryOpportunityEvidence {
  shortageUnits: number
  surplusUnits: number
  suggestedUnits: number
  inboundUnits: number
  inventoryValue: number
}

export interface InventoryOpportunitySignal {
  id: string
  type: InventoryOpportunityType
  priority: InventoryActionPriority
  score: number
  snapshotDate: string | null
  productId: string | null
  productName: string
  brandId: string | null
  sourceLocationId: string | null
  targetLocationId: string | null
  title: string
  rationale: string
  evidence: InventoryOpportunityEvidence
}

export interface InventoryRiskOpportunitySummary {
  risks: number
  criticalRisks: number
  highRisks: number
  opportunities: number
  transferCandidates: number
  purchaseReviews: number
  affectedProducts: number
  affectedInventoryValue: number
}

export interface InventoryRiskOpportunityReport {
  generatedAt: string
  snapshotDate: string | null
  summary: InventoryRiskOpportunitySummary
  risks: InventoryRiskSignal[]
  opportunities: InventoryOpportunitySignal[]
}

interface ProductPositionGroup {
  productId: string | null
  productName: string
  brandId: string | null
  positions: BusinessInventoryPosition[]
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0
}

function priorityFromScore(score: number): InventoryActionPriority {
  if (score >= 85) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function identityKey(position: BusinessInventoryPosition): string {
  return position.productId ?? position.productName
}

function signalId(parts: Array<string | null>): string {
  return parts.map((part) => part ?? 'NONE').join('::')
}

function riskEvidence(
  position: BusinessInventoryPosition,
  totalValue: number,
): InventoryRiskEvidence {
  return {
    onHand: position.onHand,
    available: position.available,
    committed: position.committed,
    inbound: position.inTransit + position.onOrder,
    inventoryValue: position.inventoryValue,
    valueShare: ratio(position.inventoryValue, totalValue),
  }
}

function addPositionRisk(
  risks: InventoryRiskSignal[],
  position: BusinessInventoryPosition,
  totalValue: number,
  type: InventoryRiskType,
  baseScore: number,
  title: string,
  rationale: string,
): void {
  const evidence = riskEvidence(position, totalValue)
  const valueWeight = Math.min(15, evidence.valueShare * 100)
  const score = clampScore(baseScore + valueWeight)

  risks.push({
    id: signalId([
      type,
      position.snapshotDate,
      identityKey(position),
      position.locationId,
    ]),
    type,
    priority: priorityFromScore(score),
    score,
    snapshotDate: position.snapshotDate,
    productId: position.productId,
    productName: position.productName,
    brandId: position.brandId,
    locationId: position.locationId,
    title,
    rationale,
    evidence,
  })
}

function groupByProduct(
  positions: readonly BusinessInventoryPosition[],
): ProductPositionGroup[] {
  const groups = new Map<string, ProductPositionGroup>()

  for (const position of positions) {
    const key = identityKey(position)
    const existing = groups.get(key)

    if (existing) {
      existing.positions.push(position)
      continue
    }

    groups.set(key, {
      productId: position.productId,
      productName: position.productName,
      brandId: position.brandId,
      positions: [position],
    })
  }

  return [...groups.values()]
}

function buildTransferOpportunities(
  groups: readonly ProductPositionGroup[],
  snapshotDate: string | null,
): InventoryOpportunitySignal[] {
  const opportunities: InventoryOpportunitySignal[] = []

  for (const group of groups) {
    const sources = group.positions
      .filter((position) => position.available > 1)
      .sort((left, right) => right.available - left.available)

    const targets = group.positions
      .filter(
        (position) =>
          position.available <= 0 &&
          position.onHand >= 0 &&
          position.inTransit + position.onOrder <= 0,
      )
      .sort((left, right) => left.available - right.available)

    if (sources.length === 0 || targets.length === 0) continue

    for (const target of targets) {
      const source = sources.find(
        (candidate) => candidate.locationId !== target.locationId,
      )

      if (!source) continue

      const shortageUnits = Math.max(1, target.committed - target.onHand)
      const surplusUnits = Math.max(0, source.available - 1)
      const suggestedUnits = Math.min(shortageUnits, surplusUnits)

      if (suggestedUnits <= 0) continue

      const score = clampScore(
        60 +
        Math.min(20, suggestedUnits * 2) +
        (target.committed > target.onHand ? 15 : 0),
      )

      opportunities.push({
        id: signalId([
          'transfer_candidate',
          snapshotDate,
          group.productId ?? group.productName,
          source.locationId,
          target.locationId,
        ]),
        type: 'transfer_candidate',
        priority: priorityFromScore(score),
        score,
        snapshotDate,
        productId: group.productId,
        productName: group.productName,
        brandId: group.brandId,
        sourceLocationId: source.locationId,
        targetLocationId: target.locationId,
        title: 'Transferencia interna sugerida',
        rationale:
          'Otra ubicación tiene disponibilidad y la ubicación destino no tiene stock utilizable ni entradas pendientes.',
        evidence: {
          shortageUnits,
          surplusUnits,
          suggestedUnits,
          inboundUnits: 0,
          inventoryValue: target.inventoryValue,
        },
      })
    }
  }

  return opportunities
}

function buildPositionOpportunities(
  positions: readonly BusinessInventoryPosition[],
): InventoryOpportunitySignal[] {
  const opportunities: InventoryOpportunitySignal[] = []

  for (const position of positions) {
    const inboundUnits = position.inTransit + position.onOrder
    const shortageUnits = Math.max(
      0,
      position.committed - Math.max(0, position.onHand),
    )

    if (
      position.available <= 0 &&
      position.onHand <= 0 &&
      inboundUnits <= 0
    ) {
      const score = clampScore(
        70 + Math.min(20, shortageUnits * 2) +
        (position.committed > 0 ? 10 : 0),
      )

      opportunities.push({
        id: signalId([
          'purchase_review',
          position.snapshotDate,
          identityKey(position),
          position.locationId,
        ]),
        type: 'purchase_review',
        priority: priorityFromScore(score),
        score,
        snapshotDate: position.snapshotDate,
        productId: position.productId,
        productName: position.productName,
        brandId: position.brandId,
        sourceLocationId: null,
        targetLocationId: position.locationId,
        title: 'Revisión de compra requerida',
        rationale:
          'La posición no tiene existencia disponible ni entradas registradas.',
        evidence: {
          shortageUnits: Math.max(1, shortageUnits),
          surplusUnits: 0,
          suggestedUnits: Math.max(1, shortageUnits),
          inboundUnits,
          inventoryValue: position.inventoryValue,
        },
      })
    } else if (position.available <= 0 && inboundUnits > 0) {
      const score = clampScore(45 + Math.min(25, inboundUnits))

      opportunities.push({
        id: signalId([
          'inbound_recovery',
          position.snapshotDate,
          identityKey(position),
          position.locationId,
        ]),
        type: 'inbound_recovery',
        priority: priorityFromScore(score),
        score,
        snapshotDate: position.snapshotDate,
        productId: position.productId,
        productName: position.productName,
        brandId: position.brandId,
        sourceLocationId: null,
        targetLocationId: position.locationId,
        title: 'Seguimiento de entrada pendiente',
        rationale:
          'La disponibilidad es nula, pero existen unidades en tránsito o en orden de compra.',
        evidence: {
          shortageUnits: Math.max(0, shortageUnits),
          surplusUnits: 0,
          suggestedUnits: 0,
          inboundUnits,
          inventoryValue: position.inventoryValue,
        },
      })
    }

    if (position.committed > position.onHand && position.onHand > 0) {
      const excessCommitment = position.committed - position.onHand
      const score = clampScore(65 + Math.min(30, excessCommitment * 3))

      opportunities.push({
        id: signalId([
          'commitment_release',
          position.snapshotDate,
          identityKey(position),
          position.locationId,
        ]),
        type: 'commitment_release',
        priority: priorityFromScore(score),
        score,
        snapshotDate: position.snapshotDate,
        productId: position.productId,
        productName: position.productName,
        brandId: position.brandId,
        sourceLocationId: null,
        targetLocationId: position.locationId,
        title: 'Revisar compromisos de inventario',
        rationale:
          'Las unidades comprometidas exceden la existencia física registrada.',
        evidence: {
          shortageUnits: excessCommitment,
          surplusUnits: 0,
          suggestedUnits: 0,
          inboundUnits,
          inventoryValue: position.inventoryValue,
        },
      })
    }
  }

  return opportunities
}

export function buildInventoryRiskOpportunityReport(
  positions: readonly BusinessInventoryPosition[],
  snapshotDate: string | null,
): InventoryRiskOpportunityReport {
  const selected = positions.filter(
    (position) => position.snapshotDate === snapshotDate,
  )
  const totalValue = selected.reduce(
    (total, position) => total + position.inventoryValue,
    0,
  )
  const risks: InventoryRiskSignal[] = []

  for (const position of selected) {
    if (position.identityStatus === 'unresolved') {
      addPositionRisk(
        risks,
        position,
        totalValue,
        'unresolved_product',
        55,
        'Producto sin conciliación',
        'La posición de inventario no está vinculada con el Product Master actual.',
      )
    }

    if (position.onHand < 0 || position.available < 0) {
      addPositionRisk(
        risks,
        position,
        totalValue,
        'negative_stock',
        90,
        'Inventario negativo',
        'La existencia física o la disponibilidad presenta un valor negativo.',
      )
      continue
    }

    if (position.committed > position.onHand) {
      addPositionRisk(
        risks,
        position,
        totalValue,
        'overcommitted',
        80,
        'Inventario sobrecomprometido',
        'Las unidades comprometidas superan la existencia física.',
      )
    }

    if (
      position.onHand <= 0 &&
      position.inTransit + position.onOrder <= 0
    ) {
      addPositionRisk(
        risks,
        position,
        totalValue,
        'out_of_stock',
        82,
        'Producto agotado',
        'No hay existencia física, disponibilidad ni entradas pendientes.',
      )
    } else if (position.onHand > 0 && position.available <= 0) {
      addPositionRisk(
        risks,
        position,
        totalValue,
        'no_available_stock',
        68,
        'Existencia física sin disponibilidad',
        'La sucursal tiene unidades en mano, pero el ERP reporta cero unidades disponibles para una nueva venta. Normalmente están comprometidas, reservadas o bloqueadas.',
      )
    }

    if (ratio(position.inventoryValue, totalValue) >= 0.2) {
      addPositionRisk(
        risks,
        position,
        totalValue,
        'value_concentration',
        50,
        'Concentración de valor',
        'Una sola posición concentra al menos 20% del valor del inventario del corte.',
      )
    }
  }

  const groups = groupByProduct(selected)
  const opportunities = [
    ...buildTransferOpportunities(groups, snapshotDate),
    ...buildPositionOpportunities(selected),
  ]

  risks.sort(
    (left, right) =>
      right.score - left.score ||
      right.evidence.inventoryValue - left.evidence.inventoryValue ||
      left.id.localeCompare(right.id),
  )

  opportunities.sort(
    (left, right) =>
      right.score - left.score ||
      right.evidence.inventoryValue - left.evidence.inventoryValue ||
      left.id.localeCompare(right.id),
  )

  const affectedProducts = new Set<string>()
  let affectedInventoryValue = 0

  for (const risk of risks) {
    affectedProducts.add(risk.productId ?? risk.productName)
    affectedInventoryValue += risk.evidence.inventoryValue
  }

  return {
    generatedAt: new Date().toISOString(),
    snapshotDate,
    summary: {
      risks: risks.length,
      criticalRisks: risks.filter(
        (risk) => risk.priority === 'critical',
      ).length,
      highRisks: risks.filter(
        (risk) => risk.priority === 'high',
      ).length,
      opportunities: opportunities.length,
      transferCandidates: opportunities.filter(
        (opportunity) => opportunity.type === 'transfer_candidate',
      ).length,
      purchaseReviews: opportunities.filter(
        (opportunity) => opportunity.type === 'purchase_review',
      ).length,
      affectedProducts: affectedProducts.size,
      affectedInventoryValue,
    },
    risks,
    opportunities,
  }
}
