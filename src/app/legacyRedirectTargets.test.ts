// NAV-001: old attention addresses go to the Panorama ejecutivo, keeping the
// query string and the hash.

import { describe, expect, it } from 'vitest'

import {
  brandIndexTarget,
  legacyAttentionTarget,
  salesTarget,
} from './legacyRedirectTargets'

describe('NAV-001 legacy redirects', () => {
  it('moves /attention/:domain under /executive with its parameters', () => {
    expect(legacyAttentionTarget('brands', '?view=attention&preset=month&anchor=2026-07')).toBe(
      '/executive/attention/brands?view=attention&preset=month&anchor=2026-07',
    )
    expect(legacyAttentionTarget('customers', '', '#tabla')).toBe('/executive/attention/customers#tabla')
    expect(legacyAttentionTarget(undefined)).toBe('/executive')
  })
})

describe('MB-001 redirects', () => {
  it('/sales goes to the brand directory', () => {
    expect(salesTarget()).toBe('/brands')
    expect(salesTarget('?x=1', '#a')).toBe('/brands?x=1#a')
  })

  it('/brands/:brandId opens the Ventas tab and keeps the period (old links keep working)', () => {
    expect(brandIndexTarget('UNV (UNIVIEW)')).toBe('/brands/UNV%20(UNIVIEW)/ventas')
    expect(brandIndexTarget('GEOVISION', '?period=2026-09')).toBe('/brands/GEOVISION/ventas?period=2026-09')
    expect(brandIndexTarget(undefined)).toBe('/brands')
  })
})
