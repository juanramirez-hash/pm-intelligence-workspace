export type AuthenticatedUserRole =
  | 'admin'
  | 'manager'
  | 'pm'
  | 'engineering'
  // NAV-002: sees the brands of its linked PMs.
  | 'assistant'

// NAV-002B: 'legacy' (analyst and viewer) was removed. 'pricing' is not used
// by any role since migration 029; it is kept for now (reported apart).
export type AuthenticatedUserScope =
  | 'all'
  | 'assigned'
  | 'pricing'

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