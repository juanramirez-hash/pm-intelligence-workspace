// MD-003: every existing workspace route stays inside DataHydrationGate (it
// needs the /api/data/* datasets, as before); "Mi día" stays outside.

import { readFileSync } from 'node:fs'

import type { RouteObject } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

// The browser router needs a DOM; the route tree is what is checked here.
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createBrowserRouter: (routes: RouteObject[]) => ({ routes }),
}))

import { DataHydrationGate } from '../../src/app/DataHydrationGate'
import { appRoutes } from '../../src/app/router'

interface RouteInfo {
  path: string
  gated: boolean
  workspaceId: string | null
}

function collect(routes: RouteObject[], parent = '', gated = false, workspaceId: string | null = null): RouteInfo[] {
  return routes.flatMap((route) => {
    const element = route.element as { type?: unknown, props?: { workspaceId?: string } } | undefined
    const inGate = gated || element?.type === DataHydrationGate
    const workspace = element?.props?.workspaceId ?? workspaceId
    const path = route.index
      ? parent || '/'
      : route.path
        ? `${parent === '/' ? '' : parent}/${route.path.replace(/^\//, '')}`.replace(/\/+/g, '/')
        : parent
    const own: RouteInfo[] = route.index || (route.path && route.path !== '/')
      ? [{ path, gated: inGate, workspaceId: workspace }]
      : []

    return [...own, ...collect(route.children ?? [], path, inGate, workspace)]
  })
}

const routes = collect(appRoutes)

describe('MD-003 routes and DataHydrationGate', () => {
  it('keeps /my-day outside the gate, guarded by the my-day workspace', () => {
    expect(routes.find((route) => route.path === '/my-day')).toEqual({
      path: '/my-day',
      gated: false,
      workspaceId: 'my-day',
    })
  })

  it('keeps every other route inside the gate, Executive still at /', () => {
    const others = routes.filter((route) => route.path !== '/my-day')

    expect(others.map((route) => route.path)).toEqual([
      '/',
      '/attention/:domain',
      '/sales',
      '/brands',
      '/brands/:brandId',
      '/customers',
      '/customers/:customerId',
      '/products',
      '/products/:productId',
      '/pricing',
      '/forecast',
      '/inventory',
      '/purchasing',
      '/actions',
      '/data-center',
      '/data-quality/products',
      '/settings',
    ])
    expect(others.every((route) => route.gated)).toBe(true)
    expect(others.find((route) => route.path === '/')?.workspaceId).toBe('executive')
  })

  it('no longer loads the datasets before rendering', () => {
    const main = readFileSync(new URL('../../src/main.tsx', import.meta.url), 'utf8')
    const gate = readFileSync(new URL('../../src/app/DataHydrationGate.tsx', import.meta.url), 'utf8')

    expect(main).not.toContain('hydratePersistedData')
    expect(main).not.toContain('dataCenterStore')
    expect(gate).toContain('hydratePersistedData()')
    expect(gate).toContain('Cargando datos…')
  })
})
