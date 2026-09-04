export type SettingsRoleScope =
  | 'all'
  | 'assigned'
  | 'pricing'
  | 'legacy'

export interface SettingsRole {
  role_key: string
  role_name: string
  description: string | null
  scope: SettingsRoleScope
  write_access: boolean
  active: boolean
  system_role: boolean
  created_at: string
  updated_at: string
}

export interface UpdateSettingsRoleInput {
  roleName?: string
  description?: string | null
  scope?: SettingsRoleScope
  writeAccess?: boolean
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

export async function loadSettingsRoles():
  Promise<SettingsRole[]> {
  const result =
    await requestJson<{
      ok: true
      roles: SettingsRole[]
    }>(
      '/api/settings/roles',
    )

  return result.roles
}

export async function updateSettingsRole(
  roleKey: string,
  input: UpdateSettingsRoleInput,
): Promise<SettingsRole> {
  const result =
    await requestJson<{
      ok: true
      role: SettingsRole
    }>(
      `/api/settings/roles/${roleKey}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(input),
      },
    )

  return result.role
}