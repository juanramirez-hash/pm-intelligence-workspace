// SRCH-HOTFIX1: the route of a brand result uses the brand name (normalized
// like the business model), not the server's brand_key.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const authenticatedFetch = vi.hoisted(() => vi.fn())

vi.mock('../../../shared/http/authenticatedFetch', () => ({
  authenticatedFetch,
}))

import { searchGlobalCatalog } from './globalSearchRepository'

async function searchBrands(brands: Array<{ id: string, name: string, score: number }>) {
  authenticatedFetch.mockResolvedValue(new Response(JSON.stringify({
    ok: true, query: 'marca', brands, customers: [], products: [],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

  const groups = await searchGlobalCatalog('marca')

  return groups.find((group) => group.type === 'brand')!.items
}

beforeEach(() => {
  authenticatedFetch.mockReset()
})

describe('SRCH-HOTFIX1 brand search results', () => {
  it('routes a brand with spaces and signs by its name, keeping the id as key', async () => {
    const [result] = await searchBrands([{ id: 'UNVUNIVIEW', name: 'UNV (UNIVIEW)', score: 0 }])

    expect(result?.route).toBe('/brands/UNV%20(UNIVIEW)')
    expect(result?.route).toBe(`/brands/${encodeURIComponent('UNV (UNIVIEW)')}`)
    // Unchanged: key, shown name and secondary text.
    expect(result).toMatchObject({
      id: 'UNVUNIVIEW',
      type: 'brand',
      primary: 'UNV (UNIVIEW)',
      secondary: 'ID UNVUNIVIEW',
    })
  })

  it('falls back to the id when the name is empty', async () => {
    const [result] = await searchBrands([{ id: 'UNVUNIVIEW', name: '', score: 0 }])

    expect(result?.route).toBe('/brands/UNVUNIVIEW')
    expect(result).toMatchObject({ id: 'UNVUNIVIEW', primary: 'UNVUNIVIEW' })
  })

  it('normalizes the name like the business model (case, spaces, STREAMAX alias)', async () => {
    const results = await searchBrands([
      { id: 'HIKVISION', name: ' Hik  Vision ', score: 0 },
      { id: 'UNVUNIVIEW', name: 'unv  (uniview) ', score: 1 },
      { id: 'STREAMAXMERIVA', name: 'Meriva Technology - Streamax', score: 2 },
    ])

    expect(results.map((result) => result.route)).toEqual([
      '/brands/HIK%20VISION',
      '/brands/UNV%20(UNIVIEW)',
      '/brands/STREAMAX%20-%20MERIVA',
    ])
  })

  it('keeps the current route of a one-word brand (AJAX)', async () => {
    const [result] = await searchBrands([{ id: 'AJAX', name: 'AJAX', score: 0 }])

    expect(result?.route).toBe('/brands/AJAX')
    // Same route the old code built from the id.
    expect(result?.route).toBe(`/brands/${encodeURIComponent('AJAX')}`)
    expect(result).toMatchObject({ id: 'AJAX', primary: 'AJAX', secondary: 'Marca' })
  })
})
