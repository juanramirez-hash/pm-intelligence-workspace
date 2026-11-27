// NAV-001: Ctrl+K / Cmd+K and the search client.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const authenticatedFetch = vi.hoisted(() => vi.fn())

vi.mock('../../shared/http/authenticatedFetch', () => ({
  authenticatedFetch,
}))

import { searchGlobalCatalog } from './repositories/globalSearchRepository'
import { isSearchShortcut, searchShortcutLabel } from './searchShortcut'

const key = (overrides: Partial<KeyboardEvent>) => ({
  key: 'k', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...overrides,
})

beforeEach(() => {
  authenticatedFetch.mockReset()
})

describe('NAV-001 search shortcut', () => {
  it('reacts to Ctrl+K and Cmd+K only', () => {
    expect(isSearchShortcut(key({ ctrlKey: true }))).toBe(true)
    expect(isSearchShortcut(key({ metaKey: true, key: 'K' }))).toBe(true)
    expect(isSearchShortcut(key({}))).toBe(false)
    expect(isSearchShortcut(key({ ctrlKey: true, shiftKey: true }))).toBe(false)
    expect(isSearchShortcut(key({ ctrlKey: true, altKey: true }))).toBe(false)
    expect(isSearchShortcut(key({ ctrlKey: true, key: 'j' }))).toBe(false)
  })

  it('shows ⌘K on Mac and Ctrl K elsewhere', () => {
    expect(searchShortcutLabel('MacIntel')).toBe('⌘K')
    expect(searchShortcutLabel('iPhone')).toBe('⌘K')
    expect(searchShortcutLabel('Win32')).toBe('Ctrl K')
    expect(searchShortcutLabel('')).toBe('Ctrl K')
  })

  it('searches through authenticatedFetch (an expired session returns to the login)', async () => {
    authenticatedFetch.mockResolvedValue(new Response(JSON.stringify({
      ok: true, query: 'unv', brands: [], customers: [], products: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    await searchGlobalCatalog('unv')

    expect(authenticatedFetch).toHaveBeenCalledTimes(1)
    expect(String(authenticatedFetch.mock.calls[0]?.[0])).toBe('/api/search?q=unv')
  })
})
