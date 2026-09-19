import type { BrandWorkspaceViewModel } from './brandWorkspaceViewModel'

export interface BrandCommercialPlanRequest {
  title: string
  description: string
  code?: string
  reasonCodes?: readonly string[]
  evidence?: readonly string[]
  type?: 'customer' | 'product' | 'commercial'
  entityId?: string | null
}
export interface BrandCommercialPlanStep {
  action: string
  owner: string
  timing: string
  completion: string
}
export function buildBrandCommercialPlan(
  workspace: BrandWorkspaceViewModel,
  request: BrandCommercialPlanRequest,
) {
  const codes = [request.code ?? '', ...(request.reasonCodes ?? []), ...(request.evidence ?? [])]
  const has = (...tokens: string[]) => codes.some((code) => tokens.some((token) =>
    code === token || code.startsWith(`${token}.`),
  ))
  const kind = request.type === 'customer' || has('contact-lost-customers', 'lost-customers', 'health.customers', 'recover-lost-customers')
    ? 'customers'
    : request.type === 'product' || has('review-lost-products', 'lost-products', 'health.products', 'reactivate-lost-products')
      ? 'products'
      : has('protect-gross-margin', 'margin-below-target', 'margin-deterioration', 'health.margin', 'health.grossProfit')
        ? 'margin'
        : has('close-revenue-gap', 'revenue-below-target', 'health.revenue', 'health.forecast', 'health.pace', 'health.trend')
          ? 'revenue'
          : 'follow-up'
  const step = (action: string, owner: string, timing: string, completion: string): BrandCommercialPlanStep =>
    ({ action, owner, timing, completion })
  const steps: BrandCommercialPlanStep[] = kind === 'customers' ? [
    step('Revisar el historial de los clientes seleccionados y confirmar quién lleva cada cuenta.', 'Product Manager y Ventas', 'Hoy', 'Lista priorizada con responsable y contacto validado.'),
    step('Contactar al cliente y registrar la causa de la ausencia de recompra: demanda, precio, disponibilidad o competencia.', 'Ejecutivo de cuenta', 'Próximos 2 días laborables', 'Causa confirmada y siguiente contacto acordado.'),
    step('Preparar una propuesta para la necesidad confirmada; validar existencias, plazo y margen antes de ofrecer.', 'Ventas y Product Manager', 'Tras el contacto', 'Cotización con importe, GP estimado y fecha tentativa validada.'),
    step('Dar seguimiento hasta pedido o cierre sin venta, registrando el resultado.', 'Ejecutivo de cuenta', 'Seguimiento diario', 'Clientes reactivados, venta y GP realmente facturados.'),
  ] : kind === 'products' ? [
    step('Validar inventario utilizable, precio, demanda y estatus de cada producto sin actividad.', 'Product Manager e Inventarios', 'Hoy', 'Diagnóstico por SKU; disponibilidad confirmada.'),
    step('Identificar clientes con compra previa o necesidad compatible y preparar una oferta o sustituto validado.', 'Product Manager y Ventas', 'Próximos 2 días laborables', 'Lista de cuentas y propuesta con margen revisado.'),
    step('Revisar pedidos, facturación y rotación de los productos seleccionados.', 'Product Manager', 'Cada semana', 'Productos reactivados y venta/GP incremental medidos.'),
  ] : kind === 'margin' ? [
    step('Ordenar operaciones por contribución de GP y revisar descuentos, costos y mezcla de productos.', 'Product Manager y Ventas', 'Hoy', 'Operaciones que explican la presión de margen identificadas.'),
    step('Validar una mezcla alternativa y condiciones comerciales dentro de las autorizaciones vigentes.', 'Product Manager y responsable comercial', 'Próximos 2 días laborables', 'Propuesta con venta, GP y margen estimados; aprobaciones requeridas registradas.'),
    step('Priorizar cotizaciones con contribución positiva y comparar el margen facturado contra la meta vigente.', 'Ventas y Product Manager', 'Seguimiento diario', 'GP y margen reales; descuentos y desviaciones documentados.'),
  ] : kind === 'revenue' ? [
    step('Validar cuota, venta acumulada, brecha y días restantes del periodo con el responsable de la marca.', 'Product Manager', 'Hoy', 'Objetivo y ritmo diario de recuperación confirmados.'),
    step('Revisar cotizaciones y pedidos abiertos con Ventas; separar los que pueden facturarse dentro del periodo.', 'Ventas y Product Manager', 'Hoy', 'Cartera con importe, GP, responsable y fecha viable; sin duplicar oportunidades.'),
    step('Contactar cuentas prioritarias y resolver bloqueos de inventario, crédito y entrega antes de comprometer el cierre.', 'Ejecutivo de cuenta con las áreas involucradas', 'Próximos 2 días laborables', 'Próxima acción y fecha acordadas por oportunidad.'),
    step('Contrastar facturación diaria contra el ritmo requerido y reasignar esfuerzos a oportunidades viables.', 'Product Manager y responsable comercial', 'Cada día laborable hasta el cierre', 'Venta, GP y brecha actualizados; compromisos pendientes revisados.'),
  ] : [
    step('Revisar la evidencia que originó esta recomendación y confirmar su alcance para la marca.', 'Product Manager', 'Hoy', 'Problema, datos de soporte y objetivo medible documentados.'),
    step('Definir acciones, responsables y fechas con el equipo comercial.', 'Product Manager y Ventas', 'Próximos 2 días laborables', 'Acciones acordadas con indicador de seguimiento.'),
    step('Evaluar el resultado con venta, GP, margen y actividad real; ajustar la propuesta.', 'Product Manager', 'Cada semana', 'Resultado registrado y decisión de continuar o ajustar.'),
  ]
  const customerRows = workspace.tables.lostCustomers.filter((row) => !request.entityId || row.id === request.entityId).slice(0, 5)
  const productRows = workspace.tables.lostProducts.filter((row) => !request.entityId || row.id === request.entityId).slice(0, 5)
  return {
    kind, title: request.title, reason: request.description, steps,
    metrics: [
      ['Meta mensual', workspace.forecast.revenueTargetLabel],
      ['Venta acumulada', workspace.forecast.actualRevenueLabel],
      ['Brecha de venta', workspace.forecast.revenueGapLabel],
      ['Días laborables restantes', workspace.forecast.remainingWorkingDaysLabel],
      ['Venta diaria requerida', workspace.forecast.requiredDailyRevenueLabel],
    ],
    customers: kind === 'customers' ? customerRows : [],
    products: kind === 'products' ? productRows : [],
    lossContext: workspace.lossEvaluation?.basePeriodId
      ? `Base histórica: ${workspace.lossEvaluation.basePeriodId}. Sin actividad en los meses completos ${workspace.lossEvaluation.inactivityPeriodIds.join(' y ')}. La venta histórica no representa venta comprometida.`
      : 'No hay una ventana histórica suficiente para identificar recuperación de clientes o productos.',
  }
}
