import type {
  BusinessDataModel,
  BusinessPeriod,
} from '../models';

function createPeriod(
  id: string,
  year: number,
  month: number,
  revenue: number,
): BusinessPeriod {
  const normalizedMonth =
    String(month).padStart(2, '0');

  return {
    id,
    year,
    month,

    periodStart:
      `${year}-${normalizedMonth}-01`,

    periodEnd:
      `${year}-${normalizedMonth}-28`,

    revenue,
    grossProfit: 0,
    quantity: 0,
    documents: 0,

    customers: new Set(),
    brands: new Set(),
    products: new Set(),
  };
}

/**
 * Modelo mínimo reutilizable para pruebas del Business Core.
 */
export function createMinimalBusinessModel():
  BusinessDataModel {
  const january =
    createPeriod(
      '2026-01',
      2026,
      1,
      100,
    );

  const february =
    createPeriod(
      '2026-02',
      2026,
      2,
      250,
    );

  return {
    generatedAt:
      '2026-02-28T12:00:00.000Z',

    periodStart:
      '2026-01-01',

    periodEnd:
      '2026-02-28',

    totals: {
      revenue: 350,
      grossProfit: 0,
      quantity: 0,
      documents: 0,
    },

    customers: new Map(),

    customerPeriods:
      new Map(),

    brands: new Map(),

    brandPeriods:
      new Map(),

    products: new Map(),

    periods: new Map([
      [january.id, january],
      [february.id, february],
    ]),

    documentNumbers:
      new Set(),

    locations:
      new Set(),

    salesRepresentatives:
      new Set(),

    currencies:
      new Set(),

    processedRows: 0,
    ignoredRows: 0,
  };
}