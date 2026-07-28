import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SmartBrandDirectory } from './SmartBrandDirectory'

const brand = {
  brandId: 'UNV', brandName: 'UNV', lifecycleStatus: 'active' as const, trendStatus: 'growing' as const,
  currentPeriod: { revenue: 1000, grossProfit: 300, quantity: 1, documents: 1, customers: 2, products: 3, margin: 30 },
  previousPeriod: { revenue: 900, grossProfit: 250, quantity: 1, documents: 1, customers: 2, products: 3, margin: 27.8 },
  revenueVariation: 100, revenueVariationPercentage: 11.1, grossProfitVariation: 50, grossProfitVariationPercentage: 20,
  marginVariation: 2.2, customerVariation: 0, productVariation: 0, historicalRevenue: 1900, historicalGrossProfit: 550,
  historicalQuantity: 2, historicalCustomers: 2, historicalProducts: 3, revenueParticipation: 10, requiresAttention: false, attentionReason: null,
}

describe('SmartBrandDirectory', () => {
  it('renders a brand and its action', () => {
    const html = renderToStaticMarkup(<SmartBrandDirectory brands={[brand]} totalBrands={1} filters={{ search: '', lifecycle: 'all', trend: 'all', requiresAttention: false }} sortField="revenue" sortDirection="desc" onSearchChange={() => undefined} onLifecycleChange={() => undefined} onTrendChange={() => undefined} onAttentionChange={() => undefined} onSortFieldChange={() => undefined} onSortDirectionChange={() => undefined} onResetFilters={() => undefined} onSelectBrand={() => undefined} />)
    expect(html).toContain('Centro operativo de marcas')
    expect(html).toContain('Abrir inteligencia de marca')
    expect(html).toContain('UNV')
  })
})
