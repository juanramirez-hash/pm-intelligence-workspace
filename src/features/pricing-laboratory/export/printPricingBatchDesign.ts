import type {
  PriceBatchDesignResult,
  PriceBatchDesignRow,
} from '../../../core/business/pricing'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function money(value: number | null | undefined, currency: string): string {
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

function percentage(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value)
}

function rowHtml(
  row: PriceBatchDesignRow,
  currency: string,
): string {
  const metrics = row.commonFactorDesign?.metrics

  return `
    <tr>
      <td>${escapeHtml(row.product.model ?? row.product.id)}</td>
      <td>${escapeHtml(row.product.sku ?? '')}</td>
      <td>${escapeHtml(money(row.product.cost, currency))}</td>
      <td>${escapeHtml(percentage(row.discountRate))}</td>
      <td>${escapeHtml(row.requiredListFactor?.toFixed(4) ?? '—')}</td>
      <td>${escapeHtml(row.commonListFactor?.toFixed(4) ?? '—')}</td>
      <td>${escapeHtml(money(metrics?.listPrice, currency))}</td>
      <td>${escapeHtml(money(metrics?.sellingPrice, currency))}</td>
      <td>${escapeHtml(money(metrics?.grossProfit, currency))}</td>
      <td>${escapeHtml(percentage(metrics?.grossMargin))}</td>
      <td>${escapeHtml(row.compliance === 'meets_objective' ? 'Cumple' : row.compliance === 'below_objective' ? 'Debajo objetivo' : 'Inválido')}</td>
    </tr>`
}

export function buildPricingBatchPrintDocument(
  result: PriceBatchDesignResult,
): string {
  const currency = result.input.currency
  const generatedAt = new Date().toLocaleString('es-MX')

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Pricing Batch Matrix</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #475569; font-size: 11px; margin-bottom: 14px; }
  .warning { border: 1px solid #fda4af; background: #fff1f2; color: #9f1239; padding: 10px; font-weight: 700; margin: 12px 0; }
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
  .card span { display: block; color: #64748b; font-size: 9px; text-transform: uppercase; }
  .card strong { display: block; margin-top: 4px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 8px; }
  th, td { border: 1px solid #cbd5e1; padding: 5px; text-align: left; }
  th { background: #f1f5f9; }
  tr { break-inside: avoid; }
  .footer { margin-top: 12px; color: #64748b; font-size: 9px; }
</style>
</head>
<body>
  <h1>Pricing Laboratory · Matriz por lote</h1>
  <div class="sub">${escapeHtml(result.input.brandName ?? 'Nueva marca')} · ${escapeHtml(currency)} · ${escapeHtml(generatedAt)}</div>
  <div class="warning">SIMULACIÓN SIN EFECTO COMERCIAL</div>
  <div class="cards">
    <div class="card"><span>Factor común</span><strong>${escapeHtml(result.commonListFactor?.toFixed(4) ?? '—')}x</strong></div>
    <div class="card"><span>Productos</span><strong>${result.summary.productCount}</strong></div>
    <div class="card"><span>Descuentos</span><strong>${result.summary.discountCount}</strong></div>
    <div class="card"><span>Debajo objetivo</span><strong>${result.summary.belowObjectiveCount}</strong></div>
  </div>
  <table>
    <thead>
      <tr><th>Modelo</th><th>SKU</th><th>Costo</th><th>Descuento</th><th>Factor requerido</th><th>Factor común</th><th>Lista</th><th>Venta neta</th><th>GP</th><th>Margen</th><th>Cumplimiento</th></tr>
    </thead>
    <tbody>${result.rows.map((row) => rowHtml(row, currency)).join('')}</tbody>
  </table>
  <div class="footer">Los totales consideran una unidad por producto. El reporte no recomienda, aprueba, crea ni publica precios.</div>
</body>
</html>`
}

export function printPricingBatchDesign(
  result: PriceBatchDesignResult,
): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    throw new Error('No fue posible abrir la vista imprimible.')
  }

  printWindow.document.open()
  printWindow.document.write(buildPricingBatchPrintDocument(result))
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
