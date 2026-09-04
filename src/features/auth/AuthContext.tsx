import {
  type ReactNode,
} from 'react'

import {
  type AuthenticatedUser,
} from './authTypes'

import {
  AuthContext,
} from './authContextValue'

interface AuthProviderProps {
  user: AuthenticatedUser
  children: ReactNode
}

export function AuthProvider({
  user,
  children,
}: AuthProviderProps) {
  return (
    <AuthContext.Provider
      value={{
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}