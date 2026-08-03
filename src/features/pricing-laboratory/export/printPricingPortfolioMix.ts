import type {
  PricePortfolioMixCell,
  PricePortfolioMixResult,
} from '../../../core/business/pricing'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function money(
  value: number | null | undefined,
  currency: string,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function percentage(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value)
}

function feasibility(
  cell: PricePortfolioMixCell,
): string {
  switch (cell.feasibility) {
    case 'fully_feasible':
      return 'Factible'
    case 'partially_feasible':
      return 'Parcial'
    case 'not_feasible':
      return 'No factible'
    case 'invalid':
      return 'No calculable'
  }
}

function rowHtml(
  cell: PricePortfolioMixCell,
  currency: string,
): string {
  return `
    <tr>
      <td>${escapeHtml(cell.mixLabel)}</td>
      <td>${escapeHtml(cell.commonListFactor.toFixed(4))}x</td>
      <td>${escapeHtml(percentage(cell.discountRate))}</td>
      <td>${escapeHtml(cell.totalUnits.toLocaleString('es-MX'))}</td>
      <td>${escapeHtml(money(cell.totalSellingPrice, currency))}</td>
      <td>${escapeHtml(money(cell.totalGrossProfit, currency))}</td>
      <td>${escapeHtml(percentage(cell.grossMargin))}</td>
      <td>${escapeHtml(cell.weightedNetFactor.toFixed(4))}x</td>
      <td>${escapeHtml(percentage(cell.volumeCoverageRate))}</td>
      <td>${escapeHtml(cell.topSalesProductLabel ?? '—')}</td>
      <td>${escapeHtml(feasibility(cell))}</td>
    </tr>`
}

export function buildPricingPortfolioMixPrintDocument(
  result: PricePortfolioMixResult,
): string {
  const currency = result.input.currency
  const generatedAt = new Date().toLocaleString('es-MX')

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Pricing Portfolio Mix</title>
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
  <h1>Pricing Laboratory · Simulación ponderada por volumen y mezcla</h1>
  <div class="sub">${escapeHtml(result.input.brandName ?? 'Nueva marca')} · ${escapeHtml(currency)} · ${escapeHtml(generatedAt)}</div>
  <div class="warning">SIMULACIÓN SIN EFECTO COMERCIAL</div>
  <div class="cards">
    <div class="card"><span>Mezclas</span><strong>${result.summary.mixCount}</strong></div>
    <div class="card"><span>Factores</span><strong>${result.summary.factorCount}</strong></div>
    <div class="card"><span>Descuentos</span><strong>${result.summary.discountCount}</strong></div>
    <div class="card"><span>Unidades asumidas</span><strong>${escapeHtml(result.summary.totalAssumedUnitsAcrossMixes.toLocaleString('es-MX'))}</strong></div>
    <div class="card"><span>Celdas factibles</span><strong>${result.summary.fullyFeasibleCellCount}</strong></div>
  </div>
  <table>
    <thead>
      <tr><th>Mezcla</th><th>Factor</th><th>Descuento</th><th>Unidades</th><th>Venta</th><th>GP</th><th>Margen</th><th>Factor neto</th><th>Cobertura</th><th>Mayor impacto venta</th><th>Factibilidad</th></tr>
    </thead>
    <tbody>${result.cells.map((cell) => rowHtml(cell, currency)).join('')}</tbody>
  </table>
  <div class="footer">Las cantidades son supuestos temporales y no crean Forecast, presupuesto, demanda o compromiso. El análisis no recomienda, aprueba ni publica precios.</div>
</body>
</html>`
}

export function printPricingPortfolioMix(
  result: PricePortfolioMixResult,
): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    throw new Error('No fue posible abrir la vista imprimible.')
  }

  printWindow.document.open()
  printWindow.document.write(buildPricingPortfolioMixPrintDocument(result))
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
