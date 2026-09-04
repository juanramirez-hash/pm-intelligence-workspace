export type AuthenticatedUserRole =
  | 'admin'
  | 'analyst'
  | 'viewer'
  | 'manager'
  | 'pm'
  | 'engineering'

export type AuthenticatedUserScope =
  | 'all'
  | 'assigned'
  | 'pricing'
  | 'legacy'

export interface AuthenticatedUser {
  id: number
  email: string
  name: string | null

  role: AuthenticatedUserRole

  roleName: string

  scope:
    AuthenticatedUserScope

  writeAccess: boolean

  brandIds: string[]
}