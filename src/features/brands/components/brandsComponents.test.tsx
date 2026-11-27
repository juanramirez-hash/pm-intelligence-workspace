// MB-001: the brand page views rendered with sample data (static markup, no
// network): costs hidden as "—" (never $0), missing values, a brand without
// sales, errors, the annual quota note and the Pronóstico link.

import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type {
  BrandDirectoryRow,
  BrandHeaderResponse,
  BrandMonthOverMonth,
  BrandSeriesMonth,
  BrandYearOverYear,
  BrandYearWindow,
} from '../api/brandsTypes'
import { BrandsDirectoryTable } from '../pages/BrandsDirectoryPage'
import { BrandErrorState } from './BrandFrame'
import { BrandFrameView } from './BrandFrame'
import {
  AnnualClose,
  BrandIndicators,
  BrandOpenActions,
  DocumentsTable,
  MonthComparison,
  MonthlySeries,
  YearComparison,
} from './BrandSalesTab'
import { CustomersTable, ProductsTable } from './BrandListTabs'
import { BrandsApiError } from '../api/brandsApi'

const render = (element: ReactElement) =>
  renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>)

const text = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')

const BRAND = {
  brandKey: 'UNVUNIVIEW',
  brandLabel: 'UNV (UNIVIEW)',
  revenue: 300000,
  target: { revenue: 400000, grossProfit: null, grossMargin: null, workingDays: 21 },
  previousRevenue: 250000,
  revenueVariation: 50000,
  revenueVariationPercentage: 0.2,
  grossProfit: 60000,
  grossMargin: 0.2,
  customers: 12,
  products: 30,
  lifecycleStatus: 'active' as const,
  trendStatus: 'growing' as const,
  requiresAttention: false,
  attentionReason: null,
  lostCustomers: 3,
  attainment: 0.75,
  gap: 100000,
  projectedRevenue: 420000,
  projectedAttainment: 1.05,
  dailyGap: 9000,
}

function header(overrides: Partial<BrandHeaderResponse> = {}): BrandHeaderResponse {
  return {
    ok: true,
    brandKey: 'UNVUNIVIEW',
    brandLabel: 'UNV (UNIVIEW)',
    period: '2026-11',
    periods: ['2026-11', '2026-10'],
    dataCutoff: '2026-11-24',
    costHidden: false,
    hasSalesInPeriod: true,
    lastSaleDate: '2026-11-23',
    brand: BRAND,
    team: { pms: [{ id: 7, name: 'Luis Mayorga' }], assistants: [{ id: 5, name: 'Olivia López' }] },
    actions: {
      total: 2,
      overdue: 1,
      immediateOpen: 0,
      rows: [{
        id: 9, title: 'Llamar al cliente grande', priority: 'high', status: 'open', horizon: 'week',
        dueDate: '2026-11-20', ownerName: 'Luis Mayorga', daysOverdue: 4,
      }],
    },
    ...overrides,
  }
}

const WINDOW = (year: number, revenue: number, grossProfit: number | null, extra: Partial<BrandYearWindow> = {}): BrandYearWindow => ({
  year,
  periodId: `${year}-11`,
  dateFrom: `${year}-11-01`,
  dateTo: `${year}-11-24`,
  workingDays: 17,
  revenue,
  grossProfit,
  grossMargin: grossProfit === null ? null : grossProfit / revenue,
  quantity: 10,
  documents: 5,
  customers: 4,
  products: 3,
  rowCount: 9,
  ...extra,
})

const VARIATION = { revenue: { amount: 100, percentage: 0.1 }, grossProfit: { amount: 10, percentage: 0.05 }, grossMarginPoints: 1.2, customers: { amount: 1, percentage: 0.1 }, products: { amount: 0, percentage: 0 } }

describe('MB-001 frame', () => {
  it('shows team, cutoff, period selector, the four tabs and Pronóstico as a link to /forecast marked MB-002', () => {
    const html = render(
      <BrandFrameView routeBrand="UNVUNIVIEW" period={null} header={header()} activeTab="ventas" onPeriodChange={() => {}}>
        <p>contenido</p>
      </BrandFrameView>,
    )
    const content = text(html)

    expect(content).toContain('UNV (UNIVIEW)')
    expect(content).toContain('PM: Luis Mayorga')
    expect(content).toContain('Auxiliar: Olivia López')
    expect(content).toContain('Datos al corte: 24 nov 2026')
    expect(content).toContain('Noviembre de 2026')

    for (const tab of ['ventas', 'clientes', 'productos', 'inteligencia']) {
      expect(html).toContain(`/brands/UNV%20(UNIVIEW)/${tab}`)
    }

    expect(html).toContain('href="/forecast?brand=UNV%20(UNIVIEW)"')
    expect(content).toContain('Pronóstico MB-002')
    expect(html).toMatch(/aria-current="page"[^>]*data-brand-tab="ventas"|data-brand-tab="ventas"[^>]*aria-current="page"/)
  })

  it('keeps the period in the tab links', () => {
    const html = render(
      <BrandFrameView routeBrand="UNVUNIVIEW" period="2026-09" header={header()} activeTab="clientes" onPeriodChange={() => {}}>
        <p>x</p>
      </BrandFrameView>,
    )

    expect(html).toContain('/ventas?period=2026-09')
  })

  it('shows the brand of the URL while the header loads', () => {
    const html = render(
      <BrandFrameView routeBrand="GEOVISION" period={null} header={null} activeTab="ventas" onPeriodChange={() => {}}>
        <p>Cargando</p>
      </BrandFrameView>,
    )

    expect(text(html)).toContain('GEOVISION')
  })
})

describe('MB-001 errors', () => {
  it('shows the server message of a 403', () => {
    const html = render(<BrandErrorState error={new BrandsApiError(403, 'Marca fuera del alcance del usuario')} />)

    expect(text(html)).toContain('Acceso restringido')
    expect(text(html)).toContain('Marca fuera del alcance del usuario')
    expect(html).toContain('href="/brands"')
  })

  it('shows "Marca no encontrada" for a 404', () => {
    const html = render(<BrandErrorState error={new BrandsApiError(404, 'Marca no encontrada')} />)

    expect(text(html)).toContain('Marca no encontrada')
    expect(html).not.toContain('Reintentar')
  })

  it('offers to retry other errors', () => {
    const html = render(<BrandErrorState error={new BrandsApiError(500, 'Falló')} onRetry={() => {}} />)

    expect(text(html)).toContain('Reintentar')
  })
})

describe('MB-001 indicators and actions', () => {
  it('shows the four indicators with the quota and the projection', () => {
    const html = render(<BrandIndicators header={header()} />)
    const content = text(html)

    expect(content).toContain('$300,000')
    expect(content).toContain('75.0% de la cuota de $400,000')
    expect(content).toContain('$420,000')
    expect(content).toContain('$60,000')
    expect(content).toContain('Margen 20.0%')
    expect(content).toContain('12 · 30')
  })

  it('shows "—" and the note, never $0, when the cost is hidden', () => {
    const html = render(<BrandIndicators header={header({ costHidden: true, brand: { ...BRAND, grossProfit: null as unknown as number, grossMargin: null } })} />)
    const gross = text(html.split('data-brand-indicator="gross-profit"')[1] ?? '')

    expect(gross).toContain('—')
    expect(gross).toContain('No tienes acceso a costos de esta marca')
    expect(gross).not.toContain('$0')
  })

  it('shows a brand without sales (GEOVISION) with missing values', () => {
    const html = render(
      <BrandIndicators
        header={header({
          brandLabel: 'GEOVISION',
          hasSalesInPeriod: false,
          brand: { ...BRAND, revenue: 0, target: null, attainment: null, projectedRevenue: null, projectedAttainment: null, customers: 0, products: 0, lifecycleStatus: 'inactive', trendStatus: 'without_comparison' },
        })}
      />,
    )
    const content = text(html)

    expect(content).toContain('Sin ventas en el periodo')
    expect(content).toContain('Sin cuota registrada')
    expect(text(html.split('data-brand-indicator="projected"')[1] ?? '')).toContain('—')
  })

  it('says there is no sales data when the brand row is missing', () => {
    expect(text(render(<BrandIndicators header={header({ brand: null })} />))).toContain('No hay ventas importadas')
  })

  it('lists the open actions with overdue days and a link to Acciones', () => {
    const html = render(<BrandOpenActions header={header()} />)
    const content = text(html)

    expect(content).toContain('2 abiertas · 1 vencidas')
    expect(content).toContain('Llamar al cliente grande')
    expect(content).toContain('4 d de atraso')
    expect(html).toContain('href="/actions"')
  })
})

describe('MB-001 month against month', () => {
  const MONTH: BrandMonthOverMonth = {
    available: true,
    costHidden: false,
    current: { dateFrom: '2026-11-01', dateTo: '2026-11-24', workingDays: 17, revenue: 300000, grossProfit: 60000, grossMargin: 0.2, quantity: 5, documents: 20, customers: 12, products: 30 },
    previous: { dateFrom: '2026-10-01', dateTo: '2026-10-23', workingDays: 17, revenue: 250000, grossProfit: 50000, grossMargin: 0.2, quantity: 4, documents: 18, customers: 10, products: 28 },
    variations: {
      revenue: { amount: 50000, percentage: 0.2 },
      grossProfit: { amount: 10000, percentage: 0.2 },
      grossMarginPoints: 0,
      customers: { amount: 2, percentage: 0.2 },
      products: { amount: 2, percentage: 0.07 },
      documents: { amount: 2, percentage: 0.11 },
    },
  }

  it('shows both windows with dates and working days', () => {
    const content = text(render(<MonthComparison data={MONTH} />))

    expect(content).toContain('1 nov 2026 – 24 nov 2026 · 17 días hábiles')
    expect(content).toContain('1 oct 2026 – 23 oct 2026 · 17 días hábiles')
    expect(content).toContain('$300,000')
    expect(content).toContain('+20.0%')
  })

  it('shows "—" for gross profit and margin when the cost is hidden', () => {
    const hidden: BrandMonthOverMonth = {
      ...MONTH,
      costHidden: true,
      current: { ...MONTH.current!, grossProfit: null, grossMargin: null },
      previous: { ...MONTH.previous!, grossProfit: null, grossMargin: null },
      variations: { ...MONTH.variations!, grossProfit: { amount: null, percentage: null }, grossMarginPoints: null },
    }
    const html = render(<MonthComparison data={hidden} />)
    const row = (label: string) => text(html.split(`>${label}</td>`)[1]?.split('</tr>')[0] ?? '')

    expect(row('Utilidad bruta')).not.toContain('$')
    expect(row('Utilidad bruta')).toContain('—')
    expect(row('Margen')).toContain('—')
    expect(text(html)).not.toContain('$0')
  })

  it('says there is no comparable window when the server has none', () => {
    expect(text(render(<MonthComparison data={{ available: false, costHidden: false }} />))).toContain('No hay una ventana comparable')
  })
})

describe('MB-001 year against year', () => {
  const SLOTS = {
    current: WINDOW(2026, 300000, 60000),
    previousYear: WINDOW(2025, 250000, 50000),
    twoYearsBack: null,
    variations: { vsPreviousYear: VARIATION, vsTwoYearsBack: null },
  }
  const YEAR: BrandYearOverYear = {
    available: true,
    currentYear: 2026,
    closed: false,
    description: 'Comparativo contra el mismo día hábil de los años anteriores.',
    costHidden: false,
    monthly: SLOTS,
    ytd: SLOTS,
    annual: {
      projection: {
        year: 2026, revenue: 3600000, grossProfit: 720000, grossMargin: 0.2,
        historicalRevenueCompletionRatio: 0.9, historicalGrossProfitCompletionRatio: 0.9, historicalYearsUsed: [2025],
      },
      previousYear: WINDOW(2025, 3000000, 600000, { dateFrom: '2025-01-01', dateTo: '2025-12-31' }),
      twoYearsBack: null,
      target: { revenue: 4000000, monthsWithTarget: 10, monthsInYear: 12, complete: false, projectedAttainment: 0.9, ytdAttainment: 0.7 },
      projectionVariations: { vsPreviousYear: VARIATION, vsTwoYearsBack: null },
    },
  }

  it('shows the three selectors and the equivalent month with dates and working days', () => {
    const html = render(<YearComparison data={YEAR} />)
    const content = text(html)

    for (const label of ['Mes equivalente', 'Acumulado YTD', 'Cierre anual']) {
      expect(content).toContain(label)
    }

    expect(content).toContain('1 nov 2026 – 24 nov 2026 · 17 días hábiles')
    expect(content).toContain('1 nov 2025 – 24 nov 2025 · 17 días hábiles')
  })

  it('shows a missing year as "—" with its reason, never as 0', () => {
    const content = text(render(<YearComparison data={YEAR} />))

    expect(content).toContain('Sin ventas ese año')
    expect(content).toContain('—')
  })

  it('annual close shows the projection, the history used and "N de 12 meses" when the quota is incomplete', () => {
    const content = text(render(<AnnualClose data={YEAR.annual!} hidden={false} />))

    expect(content).toContain('Proyección 2026')
    expect(content).toContain('$3,600,000')
    expect(content).toContain('Cierre 2025')
    expect(content).toContain('Cierre 2024')
    expect(content).toContain('Cuota anual $4,000,000 (Cuota de 10 de 12 meses)')
    expect(content).toContain('Avance al corte 70.0%')
    expect(content).toContain('Cierre proyectado 90.0%')
    expect(content).toContain('Proyección con el avance histórico de 2025')
  })

  it('does not mention months when the quota is complete', () => {
    const complete = { ...YEAR.annual!, target: { ...YEAR.annual!.target!, monthsWithTarget: 12, complete: true } }
    const content = text(render(<AnnualClose data={complete} hidden={false} />))

    expect(content).toContain('Cuota anual $4,000,000')
    expect(content).not.toContain('de 12 meses')
  })

  it('says there is no annual quota and no projection when they are missing', () => {
    const content = text(render(<AnnualClose data={{ ...YEAR.annual!, projection: null, target: null }} hidden={false} />))

    expect(content).toContain('Sin cuota anual registrada')
    expect(content).toContain('No hay años anteriores con ventas para proyectar el cierre')
  })

  it('hides gross profit and margin without cost access', () => {
    const html = render(<AnnualClose data={YEAR.annual!} hidden />)
    const gross = text(html.split('>Utilidad bruta</td>')[1]?.split('</tr>')[0] ?? '')

    expect(gross).not.toContain('$')
    expect(gross).toContain('—')
  })

  it('explains when the comparison is not available', () => {
    expect(text(render(<YearComparison data={{ available: false, currentYear: 2026, costHidden: false, description: 'Sin ventas.' }} />))).toContain('Sin ventas.')
  })
})

describe('MB-001 series and documents', () => {
  const months: BrandSeriesMonth[] = [
    { periodId: '2026-09', hasSales: false, partial: false, revenue: null, grossProfit: null, grossMargin: null, customers: null, products: null, documents: null, quantity: null, target: null, attainment: null },
    { periodId: '2026-10', hasSales: true, partial: false, revenue: 250000, grossProfit: 50000, grossMargin: 0.2, customers: 10, products: 20, documents: 15, quantity: 4, target: { revenue: 300000, grossProfit: null, grossMargin: null }, attainment: 250000 / 300000 },
    { periodId: '2026-11', hasSales: true, partial: true, revenue: 300000, grossProfit: 60000, grossMargin: 0.2, customers: 12, products: 30, documents: 20, quantity: 5, target: null, attainment: null },
  ]

  it('shows a month without sales as "—" and without quota as "Sin cuota"', () => {
    const html = render(<MonthlySeries months={months} />)
    const row = (period: string) => text(html.split(`data-series-month="${period}"`)[1]?.split('</li>')[0] ?? '')

    expect(row('2026-09')).toContain('—')
    expect(row('2026-09')).not.toContain('$0')
    expect(row('2026-10')).toContain('$250,000')
    expect(row('2026-10')).toContain('83.3%')
    expect(row('2026-11')).toContain('Sin cuota')
  })

  it('renders the 24 months the server sends', () => {
    const many = Array.from({ length: 24 }, (_, index) => ({
      ...months[1]!,
      periodId: `${2025 + Math.floor((index + 0) / 12)}-${String((index % 12) + 1).padStart(2, '0')}`,
    }))

    expect((render(<MonthlySeries months={many} />).match(/data-series-month=/g) ?? []).length).toBe(24)
  })

  const documents = {
    total: 1, lines: 2, revenue: 900, grossProfit: 180, hasMore: false,
    rows: [{
      documentNumber: 'F-1', saleDate: '2026-11-20', customerId: 'C-1', customerName: 'Cliente Uno', salesRep: null,
      location: null, lines: 2, quantity: 3, revenue: 900, grossProfit: 180 as number | null,
    }],
  }

  it('lists documents with the missing values as "—"', () => {
    const content = text(render(<DocumentsTable documents={documents} hidden={false} />))

    expect(content).toContain('F-1')
    expect(content).toContain('Cliente Uno')
    expect(content).toContain('$180')
    expect(content).toContain('—')
  })

  it('hides gross profit in the documents without cost access', () => {
    const html = render(<DocumentsTable documents={{ ...documents, rows: [{ ...documents.rows[0]!, grossProfit: null }] }} hidden />)

    expect(text(html)).not.toContain('$180')
    expect(text(html)).not.toContain('$0')
  })
})

describe('MB-001 customers and products', () => {
  it('customers: revenue, variation and "—" for gross profit when hidden', () => {
    const rows = [{
      customerId: 'C-1', customerName: 'Cliente Uno', revenue: 900, previousRevenue: 600, variation: 300,
      variationPercentage: 0.5, grossProfit: null, previousGrossProfit: null, documents: 3, lastSaleDate: '2026-11-20',
    }]
    const html = render(<CustomersTable rows={rows} filter="activos" hidden />)
    const content = text(html)

    expect(content).toContain('Cliente Uno')
    expect(content).toContain('+50.0%')
    expect(content).toContain('20 nov 2026')
    expect(content).not.toContain('$0')
    expect(text(html.split('Cliente Uno')[1] ?? '')).toContain('—')
  })

  it('customers to recover show the base month and last purchase', () => {
    const content = text(render(
      <CustomersTable
        filter="por-recuperar"
        hidden={false}
        rows={[{ customerId: 'C-2', customerName: null, baseRevenue: 5000, activeMonths: 4, avgMonthlyRevenue: 1250, lastSaleDate: '2026-08-14' }]}
      />,
    ))

    expect(content).toContain('C-2')
    expect(content).toContain('$5,000')
    expect(content).toContain('14 ago 2026')
  })

  it('products: stock, pending receipt and catalog status; missing inventory is "—", never 0', () => {
    const html = render(
      <ProductsTable
        filter="vendidos"
        hidden={false}
        rows={[
          { itemKey: 'A', itemCode: 'ABC-1', model: 'M1', quantity: 9, revenue: 900, previousRevenue: 400, variation: 500, variationPercentage: 1.25, grossProfit: 90, onHand: 0, pendingReceiptUnits: 40, catalogStatus: 'DE LINEA' },
          { itemKey: 'B', itemCode: 'ZZZ-9', model: null, quantity: 1, revenue: 10, previousRevenue: 0, variation: 10, variationPercentage: null, grossProfit: 1, onHand: null, pendingReceiptUnits: null, catalogStatus: null },
        ]}
      />,
    )
    const first = text(html.split('ABC-1')[1]?.split('</tr>')[0] ?? '')
    const second = text(html.split('ZZZ-9')[1]?.split('</tr>')[0] ?? '')

    expect(first).toContain('DE LINEA')
    expect(first).toContain('40')
    expect(second).not.toContain(' 0 ')
    expect((second.match(/—/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('products hide gross profit when the cost is hidden', () => {
    const html = render(
      <ProductsTable filter="vendidos" hidden rows={[{ itemKey: 'A', itemCode: 'ABC-1', model: null, quantity: 1, revenue: 100, previousRevenue: 50, grossProfit: null }]} />,
    )

    expect(text(html)).not.toContain('$0')
  })

  it('out of stock products show the average and the last sale', () => {
    const content = text(render(
      <ProductsTable
        filter="agotados"
        hidden={false}
        rows={[{ itemKey: 'A', itemCode: 'ABC-1', model: null, onHand: 0, pendingReceiptUnits: 0, catalogStatus: 'DE LINEA', avgMonthlyUnits: 12, lastSaleDate: '2026-11-02' }]}
      />,
    ))

    expect(content).toContain('ABC-1')
    expect(content).toContain('12')
    expect(content).toContain('2 nov 2026')
  })
})

describe('MB-001 directory', () => {
  const rows: BrandDirectoryRow[] = [
    { ...BRAND, hasSalesInPeriod: true, firstSaleDate: '2019-01-02', lastSaleDate: '2026-11-23' } as BrandDirectoryRow,
    {
      ...BRAND,
      brandKey: 'GEOVISION',
      brandLabel: 'GEOVISION',
      revenue: 0,
      target: null,
      attainment: null,
      projectedRevenue: null,
      projectedAttainment: null,
      revenueVariationPercentage: null,
      grossProfit: 0,
      grossMargin: null,
      customers: 0,
      products: 0,
      lifecycleStatus: 'inactive',
      trendStatus: 'without_comparison',
      hasSalesInPeriod: false,
      firstSaleDate: '2019-03-04',
      lastSaleDate: '2026-06-18',
    } as BrandDirectoryRow,
  ]

  it('links each brand to its Ventas tab by name and lists a brand without sales with "—"', () => {
    const html = render(<BrandsDirectoryTable rows={rows} />)
    const geovision = text(html.split('data-brand-row="GEOVISION"')[1] ?? '')

    expect(html).toContain('href="/brands/UNV%20(UNIVIEW)/ventas"')
    expect(html).toContain('href="/brands/GEOVISION/ventas"')
    expect(geovision).toContain('18 jun 2026')
    expect(geovision).not.toContain('$0')
    expect((geovision.match(/—/g) ?? []).length).toBeGreaterThanOrEqual(5)
  })

  it('hides gross profit without cost access', () => {
    const html = render(<BrandsDirectoryTable rows={[rows[0]!]} costHidden />)

    expect(text(html)).not.toContain('$60,000')
    expect(text(html)).toContain('$300,000')
  })
})
