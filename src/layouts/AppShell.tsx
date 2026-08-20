import {
  useEffect,
  useState,
} from 'react'

import {
  Outlet,
} from 'react-router-dom'

import {
  LoginPage,
} from '../features/auth/LoginPage'

import {
  Sidebar,
} from './Sidebar'

import {
  Topbar,
} from './Topbar'

interface AuthenticatedUser {
  id: number
  email: string
  name: string | null
  role: 'admin' | 'analyst' | 'viewer'
}

interface AuthState {
  loading: boolean
  user: AuthenticatedUser | null
}

export function AppShell() {
  const [
    auth,
    setAuth,
  ] = useState<AuthState>({
    loading: true,
    user: null,
  })

  useEffect(() => {
    let active = true

    const loadSession = async () => {
      try {
        const response = await fetch(
          '/api/auth/me',
          {
            credentials: 'include',
          },
        )

        if (!active) {
          return
        }

        if (response.status === 401) {
          setAuth({
            loading: false,
            user: null,
          })

          return
        }

        const result = await response.json()

        if (
          !response.ok ||
          result.authenticated !== true ||
          !result.user
        ) {
          setAuth({
            loading: false,
            user: null,
          })

          return
        }

        setAuth({
          loading: false,
          user: result.user,
        })
      } catch {
        if (!active) {
          return
        }

        setAuth({
          loading: false,
          user: null,
        })
      }
    }

    void loadSession()

    return () => {
      active = false
    }
  }, [])

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">
          Verificando acceso...
        </p>
      </div>
    )
  }

  if (!auth.user) {
    return <LoginPage />
  }

  return (
    <div
      data-app-shell="true"
      className="min-h-screen bg-slate-50 text-slate-950"
    >
      <Sidebar />

      <div
        data-app-shell-content="true"
        className="min-h-screen lg:pl-72"
      >
        <Topbar />

        <main
          data-app-main="true"
          className="px-5 py-6 sm:px-8 lg:px-10"
        >
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
