import {
  createContext,
} from 'react'

import {
  type AuthenticatedUser,
} from './authTypes'

export interface AuthContextValue {
  user: AuthenticatedUser
}

export const AuthContext =
  createContext<
    AuthContextValue | null
  >(null)