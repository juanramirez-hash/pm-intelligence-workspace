// MD-003: "Mi día" blocks rendered with sample data (static markup, no
// network).

import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../../auth/AuthContext'
import type { AuthenticatedUser } from '../../auth/authTypes'
import { MyDayApiError } from '../api/myDayApi'
import type {
  MyDayActionsResponse,
  MyDayArrivalsResponse,
  MyDayBrand,
  MyDayLostCustomersResponse,
  MyDayPortfolio,
  MyDayStockAlertRow,
  MyDayStockAlertsResponse,
} from '../api/myDayTypes'
import type { MyDayBlockState } from '../hooks/useMyDayBlock'
import { MyDayPage } from '../pages/MyDayPage'
import { MyDayArrivals } from './MyDayArrivals'
import { MyDayBrandTable } from './MyDayBrandTable'
import { MyDayHeader } from './MyDayHeader'
import { MyDayKpis } from './MyDayKpis'
import { MyDayLostCustomers } from './MyDayLostCustomers'
import { MyDayPriorityActions } from './MyDayPriorityActions'
import { MyDayLowStock, MyDayOutOfStock } from './MyDayStockBlocks'

const render = (element: ReactElement) =>
  renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>)

// Text content only, with the non-breaking spaces of Intl as plain spaces.
const text = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')

function ready<T>(data: T): MyDayBlockState<T> {
  return { status: 'success', data, error: null, reload: vi.fn() }
}

const PORTFOLIO: MyDayPortfolio = {
  brands: 3,
  brandsWithTarget: 2,
  revenue: 900000,
  revenueWithTarget: 800000,
  target: 1000000,
  attainment: 0.8,
  gap: 200000,
  projectedRevenue: 1300000,
  projectedRevenueWithTarget: 1120000,
  projectedAttainment: 1.12,
  dailyGap: 33333.33,
  previousRevenue: 850000,
  revenueVariation: 50000,
  revenueVariationPercentage: 0.0588,
  grossProfit: 180000,
  grossMargin: 0.2,
  brandsRequiringAttention: 1,
  lostCustomers: 4,
}

function brand(overrides: Partial<MyDayBrand>): MyDayBrand {
  return {
    brandKey: 'UNVUNIVIEW',
    brandLabel: 'UNV (UNIVIEW)',
    revenue: 500000,
    target: { revenue: 600000, grossProfit: null, grossMargin: null, workingDays: 20 },
    attainment: 0.8333,
    gap: 100000,
    projectedRevenue: 700000,
    projectedAttainment: 1.1667,
    dailyGap: 16666.67,
    previousRevenue: 450000,
    revenueVariation: 50000,
    revenueVariationPercentage: 0.1111,
    grossProfit: 100000,
    grossMargin: 0.2,
    customers: 40,
    products: 25,
    participation: 0.55,
    lifecycleStatus: 'active',
    trendStatus: 'growing',
    requiresAttention: false,
    attentionReason: null,
    lostCustomers: 2,
    ...overrides,
  }
}

const FRESH = {
  lastImportedAt: '2026-11-26T15:00:00.000Z',
  dataCutoff: null,
  referenceDate: '2026-11-26',
  daysSince: 0,
  status: 'up-to-date' as const,
  stale: false,
}

const STALE_PURCHASES = {
  ...FRESH,
  lastImportedAt: '2026-08-26T15:00:00.000Z',
  referenceDate: '2026-08-26',
  daysSince: 92,
  status: 'stale' as const,
  stale: true,
}

function stockRow(overrides: Partial<MyDayStockAlertRow>): MyDayStockAlertRow {
  return {
    itemKey: 'AH04AUNI11',
    itemCode: 'AH04AUNI11',
    brandKey: 'UNIARCHBYUNV',
    brandLabel: 'UNIARCH BY UNV',
    catalogStatus: 'DE LINEA',
    onHand: 0,
    pendingReceiptUnits: 0,
    positions: 0,
    netUnits: 0,
    avgMonthlyUnits: 0,
    lastSaleDate: '2025-02-06',
    arrivalStatus: 'no-po',
    nextArrival: null,
    ...overrides,
  }
}

function stockAlerts(overrides: Partial<MyDayStockAlertsResponse> = {}): MyDayStockAlertsResponse {
  return {
    ok: true,
    view: 'mine',
    dataCutoff: '2026-11-24',
    brandSource: 'assigned',
    salesWindow: { from: '2026-08-25', to: '2026-11-24', days: 92, months: 3 },
    sources: { inventory: FRESH, purchases: STALE_PURCHASES, sales: FRESH },
    inventoryCoverage: { complete: true, source: 'items', articles: 4682, articlesWithPositions: 2098, reason: null },
    limit: 10,
    outOfStock: {
      total: 649,
      hasMore: true,
      complete: true,
      rows: [
        stockRow({
          itemKey: 'OUT', itemCode: 'OUT', avgMonthlyUnits: 15.33, pendingReceiptUnits: 50,
          arrivalStatus: 'scheduled',
          nextArrival: {
            date: '2026-12-03', purchaseOrderNumber: 'PO-7', supplierName: 'Proveedor', status: 'Pending Receipt',
            shipmentStatus: 'EN ADUANA', overdue: false, hasOverduePurchaseOrders: false,
          },
        }),
        stockRow({}),
        stockRow({ itemKey: 'MISSING', itemCode: 'MISSING', pendingReceiptUnits: 5, arrivalStatus: 'no-po-data', lastSaleDate: null }),
      ],
    },
    lowStock: {
      total: 1,
      hasMore: false,
      complete: true,
      rows: [stockRow({ itemKey: 'LOW', itemCode: 'LOW', onHand: 9, coverageDays: 9, avgDailyUnits: 1, arrivalStatus: 'no-po' })],
    },
    ...overrides,
  }
}

const USER: AuthenticatedUser = {
  id: 1,
  email: 'pm@example.com',
  name: 'PM',
  role: 'pm',
  roleName: 'Product Manager',
  scope: 'assigned',
  writeAccess: true,
  costAccess: true,
  brandIds: ['UNV (UNIVIEW)'],
}

describe('MD-003 header and indicators', () => {
  it('always shows the cutoff and hides "Mis marcas / Todas" without scope all', () => {
    const props = {
      dataCutoff: '2026-11-24',
      view: 'mine' as const,
      onViewChange: vi.fn(),
      period: null,
      onPeriodChange: vi.fn(),
    }
    const withoutAll = render(<MyDayHeader {...props} canViewAll={false} />)
    const withAll = render(<MyDayHeader {...props} canViewAll />)

    expect(text(withoutAll)).toContain('Datos al corte: 24 nov 2026')
    expect(withoutAll).not.toContain('data-my-day-view-toggle')
    expect(text(withAll)).toContain('Mis marcas')
    expect(text(withAll)).toContain('Todas')
    // Cutoff month and the 11 previous ones.
    expect(withAll.match(/<option /g)).toHaveLength(12)
    // MD-003-HOTFIX1: first letter only, and no CSS capitalize.
    expect(text(withAll)).toContain('Noviembre de 2026')
    expect(text(withAll)).toContain('Diciembre de 2025')
    expect(withAll).not.toContain('capitalize')
  })

  it('shows quota, pace and gap of the brands with target, with the note', () => {
    const html = text(render(
      <MyDayKpis
        portfolio={PORTFOLIO}
        workingDays={{ elapsed: 15, total: 21, remaining: 6, holidaysExcluded: false }}
        periodStatus="open"
      />,
    ))

    expect(html).toContain('Venta del mes $900,000')
    expect(html).toContain('Cuota $1,000,000')
    expect(html).toContain('Avance 80.0%')
    expect(html).toContain('Esperado a la fecha 71.4%')
    // Pace of the brands with target; every brand as secondary text.
    expect(html).toContain('Cierre por ritmo $1,120,000')
    expect(html).toContain('112.0% de la cuota · Todas las marcas $1,300,000')
    expect(html).toContain('Brecha diaria $33,333')
    expect(html).toContain('6 días hábiles restantes')
    expect(html).toContain('Cuota, avance, ritmo y brecha consideran solo marcas con meta (2 de 3)')
  })
})

describe('MD-003 brand table', () => {
  it('orders by revenue, links the brand page and shows missing values as "—"', () => {
    const html = render(
      <MyDayBrandTable
        brands={[
          brand({ brandKey: 'UNASSIGNED', brandLabel: '- Unassigned -', revenue: -1500, target: null,
            attainment: null, projectedAttainment: null, projectedRevenue: null, revenueVariationPercentage: null,
            grossMargin: null, lifecycleStatus: 'lost', trendStatus: 'without_comparison',
            attentionReason: 'Marca con venta en el periodo anterior y sin actividad en el periodo actual.' }),
          brand({}),
          brand({ brandKey: 'STREAMAXMERIVA', brandLabel: 'STREAMAX - MERIVA', revenue: 200000, projectedAttainment: 0.95, trendStatus: 'declining' }),
        ]}
      />,
    )
    const order = [...html.matchAll(/data-my-day-brand="([^"]+)"/g)].map((match) => match[1])

    expect(order).toEqual(['UNVUNIVIEW', 'STREAMAXMERIVA', 'UNASSIGNED'])
    expect(html).toContain('href="/brands/UNV%20(UNIVIEW)"')
    expect(html).toContain('href="/brands/STREAMAX%20-%20MERIVA"')
    expect(html).toContain('href="/brands/-%20UNASSIGNED%20-"')
    expect(html).toContain('data-pace-tone="green"')
    expect(html).toContain('data-pace-tone="amber"')
    expect(html).toContain('data-pace-tone="none"')

    const content = text(html)

    expect(content).toContain('Activa')
    expect(content).toContain('Crece')
    expect(content).toContain('Perdida')
    expect(content).toContain('Sin comparativo')
    expect(content).toContain('-$1,500')
    expect(content).toContain('de —')
    expect(content).toContain('+11.1%')
    expect(content).toContain('Marca con venta en el periodo anterior')
  })
})

describe('MD-003-HOTFIX1 customers to recover', () => {
  const response = (basePeriods: number): MyDayLostCustomersResponse => ({
    ok: true,
    period: '2026-11',
    dataCutoff: '2026-11-24',
    inactivePeriods: 2,
    basePeriods,
    limit: 5,
    offset: 0,
    window: basePeriods > 1
      ? { baseFrom: '2026-06', baseTo: '2026-08', inactiveFrom: '2026-09', inactiveTo: '2026-10' }
      : { baseFrom: '2026-08', baseTo: '2026-08', inactiveFrom: '2026-09', inactiveTo: '2026-10' },
    hasMore: false,
    rows: [{
      brandKey: 'UNVUNIVIEW', brandLabel: 'UNV (UNIVIEW)', customerId: 'C-1', customerName: 'Cliente Uno',
      baseRevenue: 90000, baseGrossProfit: 9000, activeMonths: basePeriods, lastSaleDate: '2026-08-20',
      avgMonthlyRevenue: 90000 / basePeriods,
    }],
  })

  it('shows one "Venta del mes base" column with one base month', () => {
    const content = text(render(<MyDayLostCustomers state={ready(response(1))} view="mine" period={null} />))

    expect(content).toContain('Venta del mes base')
    expect(content).not.toContain('Prom. mensual')
    expect(content.match(/\$90,000/g)).toHaveLength(1)
    expect(content).toContain('Compraron en agosto de 2026 y no compraron ni en septiembre ni en octubre de 2026')
  })

  it('shows base revenue and the monthly average with more base months', () => {
    const content = text(render(<MyDayLostCustomers state={ready(response(3))} view="mine" period={null} />))

    expect(content).toContain('Venta base')
    expect(content).toContain('Prom. mensual')
    expect(content).toContain('$30,000')
    expect(content).toContain('Compraron entre junio y agosto de 2026 y no compraron ni en septiembre ni en octubre de 2026')
  })
})

describe('MD-003 side blocks', () => {
  it('lists the 5 priority actions with a link to Acciones', () => {
    const data: MyDayActionsResponse = {
      ok: true,
      rows: [
        { id: 1, brand_id: 'UNV (UNIVIEW)', brand_key: 'UNVUNIVIEW', title: 'Recuperar cliente', priority: 'critical', status: 'open', due_date: '2026-11-20', owner_name: 'PM', days_overdue: 4 },
        { id: 2, brand_id: 'HIKVISION', brand_key: 'HIKVISION', title: 'Otra marca', priority: 'critical', status: 'open', due_date: '2026-11-20', owner_name: 'PM', days_overdue: 0 },
      ],
    }
    const html = render(<MyDayPriorityActions state={ready(data)} brandKeys={['UNVUNIVIEW']} />)
    const content = text(html)

    expect(content).toContain('Recuperar cliente')
    expect(content).toContain('Crítica')
    expect(content).toContain('4 días de atraso')
    expect(content).not.toContain('Otra marca')
    expect(html).toContain('href="/actions"')
  })

  it('shows low stock with coverage and the stale purchases warning', () => {
    const content = text(render(<MyDayLowStock state={ready(stockAlerts())} view="mine" />))

    expect(content).toContain('Productos por agotarse')
    expect(content).toContain('30 días de cobertura o menos · venta promedio de 3 meses')
    expect(content).toContain('Inventario al 26 nov 2026 · Al corte · no depende del periodo')
    expect(content).toContain('9 días')
    expect(content).toContain('Sin PO')
    expect(content).toContain("Datos de compras al 26 ago 2026: pueden faltar PO's")
  })

  it('shows every out-of-stock total, "Sin PO" and "Ver todos"', () => {
    const content = text(render(<MyDayOutOfStock state={ready(stockAlerts())} view="mine" />))

    expect(content).toContain('Productos agotados')
    expect(content).toContain('649 artículos')
    expect(content).toContain('3 dic 2026 · Programada')
    expect(content).toContain('PO-7 · EN ADUANA')
    expect(content).toContain('Sin PO cargada')
    expect(content).toContain('6 feb 2025')
    expect(content).toContain('Ver todos (649)')
    expect(content).not.toContain('se cargó antes de la actualización')
  })

  it('warns when the inventory was loaded before the item records', () => {
    const data = stockAlerts({
      inventoryCoverage: {
        complete: false, source: 'positions', articles: null, articlesWithPositions: 2098,
        reason: 'inventory-loaded-before-item-records',
      },
    })

    expect(text(render(<MyDayOutOfStock state={ready(data)} view="mine" />))).toContain(
      'El inventario se cargó antes de la actualización: faltan artículos agotados; vuelve a cargarlo',
    )
  })

  it("shows PO's by currency and never $0 without cost access", () => {
    const data: MyDayArrivalsResponse = {
      ok: true,
      view: 'mine',
      dataCutoff: '2026-11-24',
      brandSource: 'assigned',
      sources: { inventory: FRESH, purchases: FRESH, sales: FRESH },
      limit: 20,
      offset: 0,
      window: { from: '2026-11-24', to: '2026-12-08', days: 14 },
      summary: {
        purchaseOrders: 2, upcoming: 1, overdue: 1, linesWithoutDate: 0,
        amountsByCurrency: {}, costHidden: true,
      },
      total: 2,
      hasMore: false,
      rows: [
        {
          purchaseOrderNumber: 'PO-1', supplierName: 'Proveedor A', statuses: ['Pending Receipt'],
          shipmentStatuses: ['EN ADUANA'], expectedReceiptDate: '2026-11-10', latestExpectedReceiptDate: '2026-11-10',
          overdue: true, brands: [{ brandKey: 'UNVUNIVIEW', brandLabel: 'UNV (UNIVIEW)' }], items: 2, lines: 2,
          amountsByCurrency: { USD: { amount: null, lines: 2, linesWithoutAmount: 0, linesHidden: 2 } }, costHidden: true,
        },
        {
          purchaseOrderNumber: 'PO-2', supplierName: 'Proveedor B', statuses: ['Pending Bill'],
          shipmentStatuses: [], expectedReceiptDate: '2026-11-30', latestExpectedReceiptDate: '2026-12-02',
          overdue: false, brands: [{ brandKey: 'UNVUNIVIEW', brandLabel: 'UNV (UNIVIEW)' }], items: 1, lines: 1,
          amountsByCurrency: { MXN: { amount: 1500, lines: 1, linesWithoutAmount: 0, linesHidden: 0 } }, costHidden: false,
        },
      ],
    }
    const html = render(
      <MyDayArrivals state={ready(data)} tab="upcoming" onTabChange={vi.fn()} offset={0} onOffsetChange={vi.fn()} />,
    )
    const content = text(html)

    expect(content).toContain("PO's por llegar (14 días)")
    expect(content).toContain('del 24 nov 2026 al 8 dic 2026')
    expect(content).toContain('Sin acceso a costo')
    expect(content).toContain('$1,500.00')
    expect(content).not.toContain('$0')
    expect(content).toContain('Sí')
    // MD-003-HOTFIX1: separate tabs with the counts of both statuses.
    expect(content).toContain('Por llegar (1)')
    expect(content).toContain('Atrasadas (1)')
    expect(html).toMatch(/aria-selected="true"[^>]*data-my-day-arrival-tab="upcoming"/)
    expect(content).toContain('de la más próxima a la más lejana')
  })

  it('pages the overdue tab on its own, most recent first, with its own empty message', () => {
    const empty: MyDayArrivalsResponse = {
      ok: true,
      view: 'mine',
      dataCutoff: '2026-11-24',
      brandSource: 'assigned',
      sources: { inventory: FRESH, purchases: FRESH, sales: FRESH },
      status: 'overdue',
      limit: 20,
      offset: 0,
      window: { from: '2026-11-24', to: '2026-12-08', days: 14 },
      summary: {
        purchaseOrders: 296, upcoming: 5, overdue: 291, linesWithoutDate: 0,
        amountsByCurrency: {}, costHidden: false,
      },
      total: 291,
      hasMore: true,
      rows: [],
    }
    const overdue = text(render(
      <MyDayArrivals state={ready({ ...empty, rows: [] })} tab="overdue" onTabChange={vi.fn()} offset={0} onOffsetChange={vi.fn()} />,
    ))

    expect(overdue).toContain('Por llegar (5)')
    expect(overdue).toContain('Atrasadas (291)')
    expect(overdue).toContain('de la más reciente a la más antigua')
    expect(overdue).toContain("Sin PO's atrasadas.")
  })

  it('keeps a failing block on its own, with the server message and retry', () => {
    const state: MyDayBlockState<MyDayStockAlertsResponse> = {
      status: 'error', data: null, error: new MyDayApiError(500, 'Fallo'), reload: vi.fn(),
    }
    const content = text(render(<MyDayLowStock state={state} view="mine" />))

    expect(content).toContain('No se pudo cargar esta sección: Fallo')
    expect(content).toContain('Reintentar')
  })
})

describe('MD-003 page', () => {
  const page = (user: AuthenticatedUser) =>
    text(render(<AuthProvider user={user}><MyDayPage /></AuthProvider>))

  it('is not available for scopes without commercial access', () => {
    for (const scope of ['pricing', 'legacy'] as const) {
      expect(page({ ...USER, scope })).toContain('Mi día no está disponible para tu tipo de acceso')
    }
  })

  it('renders every block, loading on its own, and the "al corte" note', () => {
    const content = page(USER)

    for (const title of [
      'Mi día',
      'Detalle ejecutivo de mis marcas',
      '5 acciones prioritarias',
      'Clientes por recuperar',
      'Productos por agotarse',
      'Productos agotados',
      "PO's por llegar (14 días)",
    ]) {
      expect(content).toContain(title)
    }

    expect(content).toContain("Inventario, productos por agotarse, agotados y PO's siempre van al corte")
    expect(content).not.toContain('Mis marcas')
    expect(page({ ...USER, scope: 'all' })).toContain('Mis marcas')
  })
})
