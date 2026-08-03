import type {
  PriceLandedCostCell,
  PriceLandedCostResult,
} from '../../../core/business/pricing'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function percentage(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value)
}

function feasibility(cell: PriceLandedCostCell): string {
  switch (cell.feasibility) {
    case 'fully_feasible': return 'Factible'
    case 'partially_feasible': return 'Parcial'
    case 'not_feasible': return 'No factible'
    case 'invalid': return 'No calculable'
  }
}

export function buildPricingLandedCostPrintDocument(
  result: PriceLandedCostResult,
): string {
  const currency = result.input.reportingCurrency
  const componentRows = result.input.components.length > 0
    ? result.input.components.map((component, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(component.label)}</td><td>${escapeHtml(component.category)}</td><td>${escapeHtml(component.direction)}</td><td>${escapeHtml(component.calculation.type)}</td><td>${escapeHtml(component.productIds?.join(', ') ?? 'Todos')}</td></tr>`).join('')
    : '<tr><td colspan="6">Sin componentes adicionales: el costo aterrizado equivale al costo de compra convertido.</td></tr>'

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Pricing Landed Cost Waterfall</title>
<style>
  @page { size: A4 landscape; margin: 9mm; }
  body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 16px 0 6px; }
  .sub { color: #475569; font-size: 11px; margin-bottom: 12px; }
  .warning { border: 1px solid #fda4af; background: #fff1f2; color: #9f1239; padding: 10px; font-weight: 700; margin: 10px 0; }
  .cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 7px; margin: 10px 0; }
  .card { border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px; }
  .card span { display: block; color: #64748b; font-size: 8px; text-transform: uppercase; }
  .card strong { display: block; margin-top: 4px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 7px; }
  th, td { border: 1px solid #cbd5e1; padding: 4px; text-align: left; }
  th { background: #f1f5f9; }
  tr { break-inside: avoid; }
  .footer { margin-top: 10px; color: #64748b; font-size: 8px; }
</style>
</head>
<body>
  <h1>Pricing Laboratory · Landed Cost & Price Waterfall Simulation</h1>
  <div class="sub">${escapeHtml(result.input.brandName ?? 'Nueva marca')} · ${escapeHtml(result.input.sourceCostCurrency)} → ${escapeHtml(currency)} · TC ref. ${escapeHtml(result.input.referenceExchangeRate)}</div>
  <div class="warning">SIMULACIÓN SIN EFECTO COMERCIAL</div>
  <div class="cards">
    <div class="card"><span>Productos</span><strong>${result.summary.productCount}</strong></div>
    <div class="card"><span>Componentes</span><strong>${result.summary.componentCount}</strong></div>
    <div class="card"><span>Escenarios</span><strong>${result.summary.scenarioCount}</strong></div>
    <div class="card"><span>Factores</span><strong>${result.summary.factorCount}</strong></div>
    <div class="card"><span>Escenario crítico</span><strong>${escapeHtml(result.criticalScenarioLabel ?? '—')}</strong></div>
    <div class="card"><span>Factor máximo requerido</span><strong>${result.summary.globalMaximumRequiredFactor?.toFixed(4) ?? '—'}x</strong></div>
  </div>
  <h2>Componentes del waterfall</h2>
  <table>
    <thead><tr><th>#</th><th>Componente</th><th>Categoría</th><th>Dirección</th><th>Base de cálculo</th><th>Alcance</th></tr></thead>
    <tbody>${componentRows}</tbody>
  </table>
  <h2>Matriz ejecutiva</h2>
  <table>
    <thead><tr><th>Escenario</th><th>Δ compra</th><th>TC</th><th>Δ componentes</th><th>Factor</th><th>Nivel</th><th>Descuento</th><th>Compra stress</th><th>Landed cost</th><th>Uplift</th><th>Venta</th><th>GP</th><th>Margen</th><th>Cobertura</th><th>Factibilidad</th><th>Limitante</th></tr></thead>
    <tbody>${result.cells.map((cell) => `<tr><td>${escapeHtml(cell.scenarioLabel)}</td><td>${escapeHtml(percentage(cell.purchaseCostChangeRate))}</td><td>${escapeHtml(cell.exchangeRate.toFixed(4))}</td><td>${escapeHtml(percentage(cell.componentChangeRate))}</td><td>${escapeHtml(cell.commonListFactor.toFixed(4))}x</td><td>${escapeHtml(cell.tierLabel)}</td><td>${escapeHtml(percentage(cell.discountRate))}</td><td>${escapeHtml(money(cell.stressedPurchaseCostTotal, currency))}</td><td>${escapeHtml(money(cell.landedCostTotal, currency))}</td><td>${escapeHtml(percentage(cell.landedCostUpliftRate))}</td><td>${escapeHtml(money(cell.totalSellingPrice, currency))}</td><td>${escapeHtml(money(cell.totalGrossProfit, currency))}</td><td>${escapeHtml(percentage(cell.grossMargin))}</td><td>${escapeHtml(percentage(cell.volumeCoverageRate))}</td><td>${escapeHtml(feasibility(cell))}</td><td>${escapeHtml(cell.limitingProductLabel ?? '—')}</td></tr>`).join('')}</tbody>
  </table>
  <div class="footer">Los componentes, cantidades, variaciones y tipos de cambio son supuestos explícitos. El precio de lista candidato permanece fijo durante el stress test. No se registró ningún costo ni se modificó ningún precio real.</div>
</body>
</html>`
}

export function printPricingLandedCost(
  result: PriceLandedCostResult,
): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    throw new Error('No fue posible abrir la vista imprimible.')
  }

  printWindow.document.open()
  printWindow.document.write(buildPricingLandedCostPrintDocument(result))
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
