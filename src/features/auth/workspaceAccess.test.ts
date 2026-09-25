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
      : role === 'pm' ||
          role === 'engineering'
        ? 'assigned'
        : 'legacy'

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
        'analyst',
        'viewer',
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
      'sales',
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

  it('keeps legacy roles aligned with approved matrix', () => {
    const analyst =
      buildUser('analyst')

    const viewer =
      buildUser('viewer')

    expect(
      canAccessWorkspace(
        analyst,
        'pricing',
      ),
    ).toBe(true)

    expect(
      canAccessWorkspace(
        viewer,
        'pricing',
      ),
    ).toBe(false)

    expect(
      canAccessWorkspace(
        analyst,
        'data-center',
      ),
    ).toBe(false)

    expect(
      canAccessWorkspace(
        viewer,
        'data-center',
      ),
    ).toBe(false)
  })
})