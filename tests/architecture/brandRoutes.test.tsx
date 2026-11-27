// MB-001: addresses of the brand page. Every old link to /brands/:id keeps
// working and each tab opens the right route.

import type { RouteObject } from 'react-router-dom'
import { matchRoutes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createBrowserRouter: (routes: RouteObject[]) => ({ routes }),
}))

import { appRoutes } from '../../src/app/router'
import { DataHydrationGate } from '../../src/app/DataHydrationGate'
import { BrandIndexRedirect, SalesRedirect } from '../../src/app/legacyRedirects'

const leaf = (pathname: string) => {
  const matches = matchRoutes(appRoutes, pathname)

  return matches?.at(-1)?.route
}

const paths = (pathname: string) => (matchRoutes(appRoutes, pathname) ?? []).map((match) => match.route.path ?? '(index)')

describe('MB-001 brand routes', () => {
  it('opens the Ventas tab for the old link /brands/:brandId (name, key or any spelling)', () => {
    for (const address of ['/brands/UNV%20(UNIVIEW)', '/brands/UNVUNIVIEW', '/brands/GEOVISION']) {
      const route = leaf(address)

      expect(route?.index, address).toBe(true)
      expect((route?.element as { type?: unknown } | undefined)?.type).toBe(BrandIndexRedirect)
    }
  })

  it.each(['ventas', 'clientes', 'productos'])('opens the %s tab under the brand layout, outside the gate', (tab) => {
    const matched = paths(`/brands/UNV%20(UNIVIEW)/${tab}`)

    expect(matched).toContain('brands/:brandId')
    expect(matched.at(-1)).toBe(tab)

    const gated = (matchRoutes(appRoutes, `/brands/UNV%20(UNIVIEW)/${tab}`) ?? []).some(
      (match) => (match.route.element as { type?: unknown } | undefined)?.type === DataHydrationGate,
    )

    expect(gated).toBe(false)
  })

  it('opens Inteligencia as its own route (inside the gate, see dataHydrationGate.test)', () => {
    expect(leaf('/brands/UNV%20(UNIVIEW)/inteligencia')?.path).toBe('brands/:brandId/inteligencia')
  })

  it('/brands is the directory and /sales redirects to it', () => {
    expect(leaf('/brands')?.path).toBe('brands')
    expect((leaf('/sales')?.element as { type?: unknown } | undefined)?.type).toBe(SalesRedirect)
  })
})
