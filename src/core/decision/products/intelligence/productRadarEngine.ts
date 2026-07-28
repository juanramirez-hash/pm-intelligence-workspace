import type { ProductRadarSignal } from './productIntelligenceTypes'

export function buildProductRadar(input: {
  isNewProduct: boolean
  inactiveMonths: number
  revenueVariation: number | null
  concentrationRisk: string
  commercialStatus: string
}): ProductRadarSignal[] {
  const signals: ProductRadarSignal[] = []
  if (input.isNewProduct) {
    signals.push({ id: 'launch', type: 'launch', title: 'Lanzamiento activo', description: 'El producto debe evaluarse por velocidad de adopción.', score: 90, confidence: 96, evidence: ['Estatus ABCDE: E'] })
  }
  if (input.revenueVariation !== null && input.revenueVariation >= 0.20) {
    signals.push({ id: 'growth', type: 'growth', title: 'Crecimiento relevante', description: 'La venta crece por encima de 20% frente al periodo anterior.', score: Math.min(100, Math.round(input.revenueVariation * 100)), confidence: 88, evidence: [`Variación: ${(input.revenueVariation * 100).toFixed(1)}%`] })
  }
  if (input.revenueVariation !== null && input.revenueVariation <= -0.25) {
    signals.push({ id: 'decline', type: 'decline', title: 'Contracción comercial', description: 'La demanda presenta una caída relevante.', score: Math.min(100, Math.round(Math.abs(input.revenueVariation) * 100)), confidence: 88, evidence: [`Variación: ${(input.revenueVariation * 100).toFixed(1)}%`] })
  }
  if (input.inactiveMonths >= 2) {
    signals.push({ id: 'inactivity', type: 'risk', title: 'Riesgo por inactividad', description: `Acumula ${input.inactiveMonths} meses sin venta.`, score: Math.min(100, input.inactiveMonths * 25), confidence: 92, evidence: [`Meses inactivo: ${input.inactiveMonths}`] })
  }
  if (input.concentrationRisk === 'critical' || input.concentrationRisk === 'high') {
    signals.push({ id: 'concentration', type: 'risk', title: 'Dependencia de clientes', description: 'La venta estimada depende de una base reducida de clientes.', score: input.concentrationRisk === 'critical' ? 90 : 75, confidence: 76, evidence: [`Riesgo de concentración: ${input.concentrationRisk}`] })
  }
  if (input.commercialStatus === 'C' || input.commercialStatus === 'D') {
    signals.push({ id: 'penetration', type: 'opportunity', title: 'Oportunidad de penetración', description: 'Existe espacio para ampliar la cobertura comercial.', score: input.commercialStatus === 'D' ? 82 : 68, confidence: 86, evidence: [`Estatus ABCDE: ${input.commercialStatus}`] })
  }
  return signals.sort((a, b) => b.score - a.score)
}
