import type {
  PriceCorridorCell,
  PriceCorridorResult,
} from '../../../core/business/pricing'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function money(value: number | null, currency: string): string {
  if (value === null) {
    return '—'
  }

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

function feasibility(cell: PriceCorridorCell): string {
  switch (cell.feasibility) {
    case 'fully_feasible': return 'Factible'
    case 'partially_feasible': return 'Parcial'
    case 'not_feasible': return 'No factible'
    case 'invalid': return 'No calculable'
  }
}

export function buildPricingCorridorPrintDocument(
  result: PriceCorridorResult,
): string {
  const currency = result.input.reportingCurrency
  const tierRows = result.input.tiers.map((tier) => `<tr><td>${escapeHtml(tier.label)}</td><td>${escapeHtml(percentage(tier.discountRate))}</td><td>${escapeHtml(percentage(tier.minimumGrossMargin))}</td><td>${escapeHtml(money(tier.minimumGrossProfit, currency))}</td></tr>`).join('')

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Pricing Price Corridor</title>
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
  <h1>Pricing Laboratory · Price Corridor, Maximum Discount & Margin Floor Simulation</h1>
  <div class="sub">${escapeHtml(result.input.brandName ?? 'Nueva marca')} · ${escapeHtml(result.input.sourceCostCurrency)} → ${escapeHtml(currency)} · TC ref. ${escapeHtml(result.input.referenceExchangeRate)}</div>
  <div class="warning">SIMULACIÓN SIN EFECTO COMERCIAL</div>
  <div class="cards">
    <div class="card"><span>Productos</span><strong>${result.summary.productCount}</strong></div>
    <div class="card"><span>Escenarios</span><strong>${result.summary.scenarioCount}</strong></div>
    <div class="card"><span>Niveles</span><strong>${result.summary.tierCount}</strong></div>
    <div class="card"><span>Factores</span><strong>${result.summary.factorCount}</strong></div>
    <div class="card"><span>Escenario crítico</span><strong>${escapeHtml(result.criticalScenarioLabel ?? '—')}</strong></div>
    <div class="card"><span>Factor mínimo global</span><strong>${result.summary.globalMaximumRequiredFactor?.toFixed(4) ?? '—'}x</strong></div>
  </div>
  <h2>Pisos comerciales</h2>
  <table>
    <thead><tr><th>Nivel</th><th>Descuento</th><th>Margen mínimo</th><th>GP mínimo</th></tr></thead>
    <tbody>${tierRows}</tbody>
  </table>
  <h2>Matriz ejecutiva</h2>
  <table>
    <thead><tr><th>Escenario</th><th>Δ costo</th><th>TC</th><th>Factor</th><th>Nivel</th><th>Descuento</th><th>Factor mínimo</th><th>Descuento máximo</th><th>Seguridad mínima</th><th>Venta</th><th>GP</th><th>Margen</th><th>Cobertura</th><th>Factibilidad</th><th>Limitante</th></tr></thead>
    <tbody>${result.cells.map((cell) => `<tr><td>${escapeHtml(cell.scenarioLabel)}</td><td>${escapeHtml(percentage(cell.costChangeRate))}</td><td>${escapeHtml(cell.exchangeRate.toFixed(4))}</td><td>${escapeHtml(cell.commonListFactor.toFixed(4))}x</td><td>${escapeHtml(cell.tierLabel)}</td><td>${escapeHtml(percentage(cell.discountRate))}</td><td>${escapeHtml(cell.minimumRequiredFactor?.toFixed(4) ?? '—')}x</td><td>${escapeHtml(percentage(cell.supportedMaximumDiscountRate))}</td><td>${escapeHtml(money(cell.minimumSafetyAmount, currency))}</td><td>${escapeHtml(money(cell.totalSellingPrice, currency))}</td><td>${escapeHtml(money(cell.totalGrossProfit, currency))}</td><td>${escapeHtml(percentage(cell.grossMargin))}</td><td>${escapeHtml(percentage(cell.volumeCoverageRate))}</td><td>${escapeHtml(feasibility(cell))}</td><td>${escapeHtml(cell.limitingProductLabel ?? '—')}</td></tr>`).join('')}</tbody>
  </table>
  <div class="footer">El piso gobernante es el mayor entre margen mínimo y GP mínimo. El descuento máximo es un límite matemático, no una autorización comercial. No se guardó ni publicó ningún precio.</div>
</body>
</html>`
}

export function printPricingCorridor(
  result: PriceCorridorResult,
): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    throw new Error('No fue posible abrir la vista imprimible.')
  }

  printWindow.document.open()
  printWindow.document.write(buildPricingCorridorPrintDocument(result))
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
