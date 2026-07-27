import type {
  BusinessDataModel,
  BusinessPeriod,
} from '../models';

interface MinimalPeriodInput {
  id: string;
  year: number;
  month: number;
  revenue: number;
  grossProfit: number;
  quantity: number;
  documents: number;
  customers: readonly string[];
  brands: readonly string[];
  products: readonly string[];
}

function createPeriod(input: MinimalPeriodInput): BusinessPeriod {
  const normalizedMonth = String(input.month).padStart(2, '0');

  return {
    id: input.id,
    year: input.year,
    month: input.month,
    periodStart: `${input.year}-${normalizedMonth}-01`,
    periodEnd: `${input.year}-${normalizedMonth}-28`,
    revenue: input.revenue,
    grossProfit: input.grossProfit,
    quantity: input.quantity,
    documents: input.documents,
    customers: new Set(input.customers),
    brands: new Set(input.brands),
    products: new Set(input.products),
  };
}

export function createMinimalBusinessModel(): BusinessDataModel {
  const january = createPeriod({
    id: '2026-01',
    year: 2026,
    month: 1,
    revenue: 100,
    grossProfit: 20,
    quantity: 4,
    documents: 2,
    customers: ['CUSTOMER-1'],
    brands: ['BRAND-1'],
    products: ['PRODUCT-1'],
  });

  const february = createPeriod({
    id: '2026-02',
    year: 2026,
    month: 2,
    revenue: 250,
    grossProfit: 75,
    quantity: 5,
    documents: 3,
    customers: ['CUSTOMER-1', 'CUSTOMER-2'],
    brands: ['BRAND-1'],
    products: ['PRODUCT-1', 'PRODUCT-2'],
  });

  return {
    generatedAt: '2026-02-28T12:00:00.000Z',
    periodStart: '2026-01-01',
    periodEnd: '2026-02-28',
    totals: {
      revenue: 350,
      grossProfit: 95,
      quantity: 9,
      documents: 5,
    },
    customers: new Map(),
    customerPeriods: new Map(),
    customerBrandPeriods: new Map(),
    brands: new Map(),
    brandPeriods: new Map(),
    brandTargets: new Map(),
    products: new Map(),
    productPeriods: new Map(),
    periods: new Map([
      [january.id, january],
      [february.id, february],
    ]),
    documentNumbers: new Set(),
    locations: new Set(),
    salesRepresentatives: new Set(),
    currencies: new Set(),
    processedRows: 0,
    ignoredRows: 0,
  };
}
