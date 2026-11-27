export type AuthenticatedUserRole =
  | 'admin'
  | 'analyst'
  | 'viewer'
  | 'manager'
  | 'pm'
  | 'engineering'
  // NAV-002: sees the brands of its linked PMs.
  | 'assistant'

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

  costAccess: boolean

  brandIds: string[]
}