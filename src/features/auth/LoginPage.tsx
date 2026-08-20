import {
  useEffect,
  useRef,
  useState,
} from 'react'

const GOOGLE_CLIENT_ID =
  '272847053181-9oqofh2ka6792s8hb0uh48kkcvk06mm6.apps.googleusercontent.com'

const GOOGLE_LOGIN_URI =
  'https://pm.botintelligence.cloud/signin/google'

interface GoogleAccountsId {
  initialize: (options: {
    client_id: string
    ux_mode: 'redirect'
    login_uri: string
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      theme: string
      size: string
      shape: string
      text: string
      width: number
    },
  ) => void
}

interface GoogleAccounts {
  id: GoogleAccountsId
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts
    }
  }
}

export function LoginPage() {
  const buttonRef =
    useRef<HTMLDivElement | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    let active = true

    const params =
      new URLSearchParams(
        window.location.search,
      )

    const authError =
      params.get('auth_error')

    if (authError === 'unauthorized') {
      setError(
        'Tu cuenta de Google no está autorizada para acceder a PM Intelligence.',
      )
    } else if (authError) {
      setError(
        'No fue posible iniciar sesión con Google.',
      )
    }

    const renderGoogleButton = () => {
      if (
        !active ||
        !window.google ||
        !buttonRef.current
      ) {
        return
      }

      buttonRef.current.innerHTML = ''

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        ux_mode: 'redirect',
        login_uri: GOOGLE_LOGIN_URI,
      })

      window.google.accounts.id.renderButton(
        buttonRef.current,
        {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          width: 320,
        },
      )

      setLoading(false)
    }

    if (window.google) {
      renderGoogleButton()

      return () => {
        active = false
      }
    }

    const existingScript =
      document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      )

    if (existingScript) {
      existingScript.addEventListener(
        'load',
        renderGoogleButton,
      )

      return () => {
        active = false
        existingScript.removeEventListener(
          'load',
          renderGoogleButton,
        )
      }
    }

    const script =
      document.createElement('script')

    script.src =
      'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.addEventListener(
      'load',
      renderGoogleButton,
    )

    script.addEventListener(
      'error',
      () => {
        if (!active) {
          return
        }

        setLoading(false)
        setError(
          'No fue posible cargar el acceso con Google.',
        )
      },
    )

    document.head.appendChild(script)

    return () => {
      active = false
      script.removeEventListener(
        'load',
        renderGoogleButton,
      )
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
            PM
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
            PM Intelligence
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Plataforma de inteligencia comercial y
            operativa.
          </p>
        </div>

        <div className="mt-8">
          <p className="mb-4 text-center text-sm text-slate-600">
            Inicia sesión con una cuenta de Google
            autorizada.
          </p>

          <div className="flex min-h-11 justify-center">
            <div ref={buttonRef} />

            {loading && (
              <p className="text-sm text-slate-400">
                Cargando acceso con Google...
              </p>
            )}
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700">
              {error}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs leading-5 text-slate-400">
          El acceso está limitado a usuarios
          previamente autorizados por PM Intelligence.
        </p>
      </div>
    </div>
  )
}
