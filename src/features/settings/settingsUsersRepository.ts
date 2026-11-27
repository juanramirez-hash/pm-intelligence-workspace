export type SettingsUserRole =
  | 'admin'
  | 'manager'
  | 'pm'
  | 'engineering'
  | 'assistant'

// NAV-002B: role preselected when creating a user. It was 'viewer'; now the
// role with the least privilege left (no write access, assigned brands only).
export const DEFAULT_NEW_USER_ROLE: SettingsUserRole = 'engineering'

// NAV-002: PMs of an assistant and its effective brands.
export interface SettingsUserPm {
  id: number
  name: string | null
  email: string
  // Only active users with the pm role give brands.
  counts: boolean
}

export interface SettingsEffectiveBrand {
  brandId: string
  own: boolean
  fromPms: Array<{ id: number, name: string | null, email: string | null }>
}

export interface SettingsUserPms {
  role: SettingsUserRole
  pmUserIds: number[]
  pms: SettingsUserPm[]
  effectiveBrands: SettingsEffectiveBrand[]
}

export interface SettingsUser {
  id: number
  email: string
  name: string | null
  role: SettingsUserRole
  active: boolean
  created_at: string
  last_login_at: string | null
}

export interface CreateSettingsUserInput {
  email: string
  name: string | null
  role: SettingsUserRole
  active?: boolean
}

export interface UpdateSettingsUserInput {
  name?: string | null
  role?: SettingsUserRole
  active?: boolean
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response =
    await fetch(
      input,
      {
        credentials: 'include',
        ...init,
      },
    )

  const payload =
    await response
      .json()
      .catch(() => null)

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return payload as T
}

export async function loadSettingsUsers():
  Promise<SettingsUser[]> {
  const result =
    await requestJson<{
      ok: true
      users: SettingsUser[]
    }>(
      '/api/settings/users',
    )

  return result.users
}

export async function createSettingsUser(
  input: CreateSettingsUserInput,
): Promise<SettingsUser> {
  const result =
    await requestJson<{
      ok: true
      user: SettingsUser
    }>(
      '/api/settings/users',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(input),
      },
    )

  return result.user
}

export async function updateSettingsUser(
  userId: number,
  input: UpdateSettingsUserInput,
): Promise<SettingsUser> {
  const result =
    await requestJson<{
      ok: true
      user: SettingsUser
    }>(
      `/api/settings/users/${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(input),
      },
    )

  return result.user
}
export async function loadSettingsUserBrands(
  userId: number,
): Promise<string[]> {
  const result =
    await requestJson<{
      ok: true
      brandIds: string[]
    }>(
      `/api/settings/users/${userId}/brands`,
    )

  return result.brandIds
}

export async function loadSettingsUserPms(
  userId: number,
): Promise<SettingsUserPms> {
  const result =
    await requestJson<{ ok: true } & SettingsUserPms>(
      `/api/settings/users/${userId}/pms`,
    )

  return {
    role: result.role,
    pmUserIds: result.pmUserIds,
    pms: result.pms,
    effectiveBrands: result.effectiveBrands,
  }
}

export async function updateSettingsUserPms(
  userId: number,
  pmUserIds: number[],
): Promise<number[]> {
  const result =
    await requestJson<{
      ok: true
      pmUserIds: number[]
    }>(
      `/api/settings/users/${userId}/pms`,
      {
        method: 'PUT',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          pmUserIds,
        }),
      },
    )

  return result.pmUserIds
}

export async function updateSettingsUserBrands(
  userId: number,
  brandIds: string[],
): Promise<string[]> {
  const result =
    await requestJson<{
      ok: true
      brandIds: string[]
    }>(
      `/api/settings/users/${userId}/brands`,
      {
        method: 'PUT',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          brandIds,
        }),
      },
    )

  return result.brandIds
}

export async function deleteSettingsUser(
  userId: number,
): Promise<void> {
  await requestJson<{
    ok: true
    deletedUserId: number
  }>(
    `/api/settings/users/${userId}`,
    { method: 'DELETE' },
  )
}
