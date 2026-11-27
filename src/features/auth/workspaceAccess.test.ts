import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  AuthenticatedUser,
  AuthenticatedUserRole,
} from './authTypes'

import {
  canAccessWorkspace,
  getAccessibleWorkspaces,
} from './workspaceAccess'

function buildUser(
  role: AuthenticatedUserRole,
): AuthenticatedUser {
  const scope =
    role === 'admin' ||
    role === 'manager'
      ? 'all'
      : role === 'pm' || role === 'assistant' ||
          role === 'engineering'
        ? 'assigned'
        : 'pricing'

  return {
    id: 1,
    email: `${role}@example.com`,
    name: role,
    role,
    roleName: role,
    scope,
    writeAccess:
      role === 'admin' ||
      role === 'manager' ||
      role === 'pm',
    costAccess:
      role === 'admin' ||
      role === 'manager' ||
      role === 'pm',
    brandIds: [],
  }
}

describe('workspace access', () => {
  it('grants administrator full platform access', () => {
    const user =
      buildUser('admin')

    expect(
      getAccessibleWorkspaces(
        user,
      ),
    ).toHaveLength(13)

    expect(
      canAccessWorkspace(
        user,
        'settings',
      ),
    ).toBe(true)

    expect(
      canAccessWorkspace(
        user,
        'data-center',
      ),
    ).toBe(true)
  })

  it('keeps settings exclusive to administrator', () => {
    for (
      const role of [
        'manager',
        'pm',
        'engineering',
        'assistant',
      ] as const
    ) {
      expect(
        canAccessWorkspace(
          buildUser(role),
          'settings',
        ),
      ).toBe(false)
    }
  })

  it('grants manager operational access without settings', () => {
    const user =
      buildUser('manager')

    expect(
      canAccessWorkspace(
        user,
        'data-center',
      ),
    ).toBe(true)

    expect(
      canAccessWorkspace(
        user,
        'product-quality',
      ),
    ).toBe(true)

    expect(
      canAccessWorkspace(
        user,
        'settings',
      ),
    ).toBe(false)
  })

  it('limits product manager administrative access', () => {
    const user =
      buildUser('pm')

    expect(
      canAccessWorkspace(
        user,
        'pricing',
      ),
    ).toBe(true)

    expect(
      canAccessWorkspace(
        user,
        'purchasing',
      ),
    ).toBe(true)

    expect(
      canAccessWorkspace(
        user,
        'data-center',
      ),
    ).toBe(false)

    expect(
      canAccessWorkspace(
        user,
        'product-quality',
      ),
    ).toBe(false)

    expect(
      canAccessWorkspace(
        user,
        'settings',
      ),
    ).toBe(false)
  })

  it('limits engineering to assigned operational workspaces', () => {
    const user =
      buildUser('engineering')

    expect(
      getAccessibleWorkspaces(
        user,
      ),
    ).toEqual([
      'my-day',
      'brands',
      'customers',
      'products',
      'inventory',
      'actions',
    ])

    expect(
      canAccessWorkspace(
        user,
        'pricing',
      ),
    ).toBe(false)

    expect(
      canAccessWorkspace(
        user,
        'purchasing',
      ),
    ).toBe(false)

    expect(
      canAccessWorkspace(
        user,
        'executive',
      ),
    ).toBe(false)
  })

  // NAV-002B (migration 041): analyst and viewer no longer exist.
  it('has no access entry for the removed legacy roles', () => {
    expect(
      getAccessibleWorkspaces(buildUser('admin')),
    ).toHaveLength(13)

    // A role without an entry has no access and does not break the app.
    for (const role of ['analyst', 'viewer']) {
      const user =
        buildUser(role as AuthenticatedUserRole)

      expect(
        getAccessibleWorkspaces(user),
      ).toEqual([])
      expect(
        canAccessWorkspace(user, 'my-day'),
      ).toBe(false)
    }
  })

  it('opens "Mi día" to every role (MD-003)', () => {
    for (
      const role of [
        'admin',
        'manager',
        'pm',
        'engineering',
        'assistant',
      ] as const
    ) {
      expect(
        canAccessWorkspace(
          buildUser(role),
          'my-day',
        ),
      ).toBe(true)
    }
  })

  it('gives the assistant the PM screens without Gerencia nor Administración (NAV-002)', () => {
    expect(
      getAccessibleWorkspaces(
        buildUser('assistant'),
      ),
    ).toEqual([
      'my-day',
      'brands',
      'customers',
      'products',
      'forecast',
      'inventory',
      'actions',
    ])
  })
})