// NAV-001: old attention addresses go to the Panorama ejecutivo, keeping the
// query string and the hash.

import { describe, expect, it } from 'vitest'

import { legacyAttentionTarget } from './legacyRedirectTargets'

describe('NAV-001 legacy redirects', () => {
  it('moves /attention/:domain under /executive with its parameters', () => {
    expect(legacyAttentionTarget('brands', '?view=attention&preset=month&anchor=2026-07')).toBe(
      '/executive/attention/brands?view=attention&preset=month&anchor=2026-07',
    )
    expect(legacyAttentionTarget('customers', '', '#tabla')).toBe('/executive/attention/customers#tabla')
    expect(legacyAttentionTarget(undefined)).toBe('/executive')
  })
})
