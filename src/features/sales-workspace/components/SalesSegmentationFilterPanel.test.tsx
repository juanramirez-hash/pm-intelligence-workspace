import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  SalesSegmentationFilterPanel,
} from './SalesSegmentationFilterPanel'

describe('SW-003 SalesSegmentationFilterPanel', () => {
  it('publica las cinco dimensiones y los filtros activos', () => {
    const markup =
      renderToStaticMarkup(
        <SalesSegmentationFilterPanel
          activeFilters={[
            {
              dimension: 'brand',
              id: 'UNV',
              label: 'UNV (UNIVIEW)',
            },
          ]}
          filters={{
            periodId: '2026-03',
            comparisonMode: 'previous-period',
            brandIds: ['UNV'],
          }}
          onClearDimension={() => undefined}
          onDimensionChange={() => undefined}
          onReset={() => undefined}
          onSearchTermChange={() => undefined}
          options={{
            brands: [
              {
                id: 'UNV',
                label: 'UNV (UNIVIEW)',
                revenue: 100,
              },
            ],
            customers: [],
            products: [],
            locations: [],
            salesRepresentatives: [],
          }}
        />,
      )

    expect(markup).toContain(
      'data-sales-workspace-component="segmentation-filter-panel"',
    )
    expect(markup).toContain('Marca')
    expect(markup).toContain('Cliente')
    expect(markup).toContain('Producto')
    expect(markup).toContain('Ubicación')
    expect(markup).toContain('Vendedor')
    expect(markup).toContain('UNV (UNIVIEW)')
  })
})
