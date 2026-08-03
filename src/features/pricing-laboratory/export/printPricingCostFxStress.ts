import type {
  PriceCostFxStressCell,
  PriceCostFxStressResult,
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

function percentage(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value)
}

function feasibility(cell: PriceCostFxStressCell): string {
  switch (cell.feasibility) {
    case 'fully_feasible': return 'Factible'
    case 'partially_feasible': return 'Parcial'
    case 'not_feasible': return 'No factible'
    case 'invalid': return 'No calculable'
  }
}

export function buildPricingCostFxStressPrintDocument(
  result: PriceCostFxStressResult,
): string {
  const currency = result.input.reportingCurrency

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Pricing Cost and FX Stress</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #475569; font-size: 11px; margin-bottom: 14px; }
  .warning { border: 1px solid #fda4af; background: #fff1f2; color: #9f1239; padding: 10px; font-weight: 700; margin: 12px 0; }
  .cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 12px 0; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
  .card span { display: block; color: #64748b; font-size: 9px; text-transform: uppercase; }
  .card strong { display: block; margin-top: 4px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 7.5px; }
  th, td { border: 1px solid #cbd5e1; padding: 5px; text-align: left; }
  th { background: #f1f5f9; }
  tr { break-inside: avoid; }
  .footer { margin-top: 12px; color: #64748b; font-size: 9px; }
</style>
</head>
<body>
  <h1>Pricing Laboratory · Cost & Exchange Rate Sensitivity Stress Test</h1>
  <div class="sub">${escapeHtml(result.input.brandName ?? 'Nueva marca')} · ${escapeHtml(result.input.sourceCostCurrency)} → ${escapeHtml(currency)}</div>
  <div class="warning">SIMULACIÓN SIN EFECTO COMERCIAL</div>
  <div class="cards">
    <div class="card"><span>Escenarios</span><strong>${result.summary.scenarioCount}</strong></div>
    <div class="card"><span>Niveles</span><strong>${result.summary.tierCount}</strong></div>
    <div class="card"><span>Factores</span><strong>${result.summary.factorCount}</strong></div>
    <div class="card"><span>Escenario crítico</span><strong>${escapeHtml(result.criticalScenarioLabel ?? '—')}</strong></div>
    <div class="card"><span>Factor máximo requerido</span><strong>${result.summary.globalMaximumRequiredFactor?.toFixed(4) ?? '—'}x</strong></div>
  </div>
  <table>
    <thead><tr><th>Escenario</th><th>Δ costo</th><th>TC</th><th>Factor</th><th>Nivel</th><th>Descuento</th><th>Costo stress</th><th>Venta</th><th>GP</th><th>Margen</th><th>Cobertura</th><th>Factibilidad</th></tr></thead>
    <tbody>${result.cells.map((cell) => `<tr><td>${escapeHtml(cell.scenarioLabel)}</td><td>${escapeHtml(percentage(cell.costChangeRate))}</td><td>${escapeHtml(cell.exchangeRate.toFixed(4))}</td><td>${escapeHtml(cell.commonListFactor.toFixed(4))}x</td><td>${escapeHtml(cell.tierLabel)}</td><td>${escapeHtml(percentage(cell.discountRate))}</td><td>${escapeHtml(money(cell.stressedCostTotal, currency))}</td><td>${escapeHtml(money(cell.totalSellingPrice, currency))}</td><td>${escapeHtml(money(cell.totalGrossProfit, currency))}</td><td>${escapeHtml(percentage(cell.grossMargin))}</td><td>${escapeHtml(percentage(cell.volumeCoverageRate))}</td><td>${escapeHtml(feasibility(cell))}</td></tr>`).join('')}</tbody>
  </table>
  <div class="footer">Los tipos de cambio y variaciones son supuestos explícitos. No se consultaron tasas en vivo y no se modificó ningún costo o precio real.</div>
</body>
</html>`
}

export function printPricingCostFxStress(
  result: PriceCostFxStressResult,
): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    throw new Error('No fue posible abrir la vista imprimible.')
  }

  printWindow.document.open()
  printWindow.document.write(buildPricingCostFxStressPrintDocument(result))
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
