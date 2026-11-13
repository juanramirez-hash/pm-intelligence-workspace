import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  AuthenticatedUser,
} from './authTypes'

import {
  canAccessBrand,
  filterAccessibleBrandIds,
  hasAllBrandAccess,
  normalizeBrandKey,
  resolveCostVisibility,
} from './brandAccess'

function buildUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: 1,
    email: 'user@example.com',
    name: 'User',
    role: 'pm',
    roleName: 'Product Manager',
    scope: 'assigned',
    writeAccess: true,
    costAccess: true,
    brandIds: [
      'ALTER',
      'MIKROTIK',
    ],
    ...overrides,
  }
}

describe('brand access', () => {
  it('grants all brands to all-scope users', () => {
    const user =
      buildUser({
        role: 'admin',
        roleName: 'Administrador',
        scope: 'all',
      })

    expect(
      hasAllBrandAccess(user),
    ).toBe(true)

    expect(
      canAccessBrand(
        user,
        'UNV (UNIVIEW)',
      ),
    ).toBe(true)
  })

  it('limits assigned users to assigned brands', () => {
    const user =
      buildUser()

    expect(
      canAccessBrand(
        user,
        'ALTER',
      ),
    ).toBe(true)

    expect(
      canAccessBrand(
        user,
        'UNV (UNIVIEW)',
      ),
    ).toBe(false)

    expect(
      filterAccessibleBrandIds(
        user,
        [
          'ALTER',
          'UNV (UNIVIEW)',
          'MIKROTIK',
        ],
      ),
    ).toEqual([
      'ALTER',
      'MIKROTIK',
    ])
  })

  it('keeps legacy scopes unrestricted for now', () => {
    const user =
      buildUser({
        role: 'viewer',
        roleName: 'Viewer · Legacy',
        scope: 'legacy',
        writeAccess: false,
      })

    expect(
      filterAccessibleBrandIds(
        user,
        [
          'ALTER',
          'UNV (UNIVIEW)',
        ],
      ),
    ).toEqual([
      'ALTER',
      'UNV (UNIVIEW)',
    ])
  })
})

describe('cost visibility (SEC-003B)', () => {
  it('normalizes brands like the server, including the STREAMAX alias', () => {
    expect(
      normalizeBrandKey(
        'MERIVA TECHNOLOGY - STREAMAX',
      ),
    ).toBe('STREAMAXMERIVA')

    expect(
      normalizeBrandKey(
        'STREAMAX - MERIVA',
      ),
    ).toBe('STREAMAXMERIVA')

    expect(
      normalizeBrandKey(
        'UNV (UNIVIEW)',
      ),
    ).toBe('UNVUNIVIEW')

    expect(
      normalizeBrandKey('  -  '),
    ).toBeNull()
  })

  it('hides every cost without cost access', () => {
    expect(
      resolveCostVisibility(
        buildUser({
          scope: 'all',
          costAccess: false,
        }),
      ),
    ).toEqual({
      mode: 'none',
    })
  })

  it('shows every cost to all-scope users with cost access', () => {
    expect(
      resolveCostVisibility(
        buildUser({
          role: 'admin',
          scope: 'all',
        }),
      ),
    ).toEqual({
      mode: 'all',
    })
  })

  it('limits costs to normalized assigned brands', () => {
    expect(
      resolveCostVisibility(
        buildUser({
          brandIds: [
            'Alter',
            'MERIVA TECHNOLOGY - STREAMAX',
            'STREAMAX - MERIVA',
          ],
        }),
      ),
    ).toEqual({
      mode: 'assigned',
      brandKeys: [
        'ALTER',
        'STREAMAXMERIVA',
      ],
    })
  })

  it('hides costs for other scopes', () => {
    expect(
      resolveCostVisibility(
        buildUser({
          role: 'viewer',
          scope: 'legacy',
        }),
      ),
    ).toEqual({
      mode: 'none',
    })
  })
})