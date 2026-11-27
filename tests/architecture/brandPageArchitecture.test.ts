// MB-001: the brand page never reads the /api/data/* datasets; only the
// Inteligencia route imports the page that needs them.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('MB-001 architecture', () => {
  function sources(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name)

      if (entry.isDirectory()) {
        return sources(path)
      }

      return /\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : []
    })
  }

  it('the brand page code never reads the datasets nor the business model', () => {
    for (const file of sources('src/features/brands')) {
      const code = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')

      expect(code, file).not.toContain('/api/data')
      expect(code, file).not.toMatch(/useWorkspaceContext|dataCenterStore|apiDataRepository/)
    }
  })

  it('only the Inteligencia route imports the page that needs the datasets', () => {
    const importers = sources('src/features/brands').filter((file) =>
      readFileSync(file, 'utf8').includes('brand-intelligence/pages/BrandIntelligencePage'))

    expect(importers.map((file) => file.replace(/\\/g, '/'))).toEqual(['src/features/brands/pages/BrandIntelligenceRoute.tsx'])
  })
})

describe('MB-001C portfolio panel', () => {
  const page = readFileSync('src/features/brands/pages/BrandsDirectoryPage.tsx', 'utf8')

  it('the directory page shows the panel before the table, sharing the Mis marcas / Todas selector and the period', () => {
    expect(page).toContain('<BrandPortfolioPanel view={view} period={period} />')
    expect(page.indexOf('<BrandPortfolioPanel')).toBeLessThan(page.indexOf('title="Directorio de marcas"'))
  })

  it('the panel is keyed by the view and asks for its request key (Todas collapsed until the click)', () => {
    const panel = readFileSync('src/features/brands/components/BrandPortfolioPanel.tsx', 'utf8')

    expect(panel).toContain('<PortfolioPanel key={view} view={view} period={period} />')
    expect(panel).toContain('portfolioRequestKey(view, expanded, period)')
    expect(panel).toContain('collapsed={!active}')
    expect(panel).toContain('onExpand={() => setExpanded(true)}')
  })

  it('the Ventas tab and the directory use the same year comparison component (no copy)', () => {
    const sales = readFileSync('src/features/brands/components/BrandSalesTab.tsx', 'utf8')
    const panel = readFileSync('src/features/brands/components/BrandPortfolioPanel.tsx', 'utf8')

    expect(sales).toContain("from './BrandYearComparison'")
    expect(panel).toContain("from './BrandYearComparison'")
    expect(sales).not.toMatch(/function (YearComparison|SlotsTable|AnnualClose)/)
    expect(panel).not.toMatch(/function (YearComparison|SlotsTable|AnnualClose)/)
  })
})
