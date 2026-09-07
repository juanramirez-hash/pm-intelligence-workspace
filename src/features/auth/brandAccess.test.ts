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