export type SettingsUserRole =
  | 'admin'
  | 'analyst'
  | 'viewer'
  | 'manager'
  | 'pm'
  | 'engineering'

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