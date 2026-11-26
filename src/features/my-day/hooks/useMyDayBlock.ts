// MD-003: loads one block of "Mi día". Each block has its own loading,
// error and data; a failing block does not affect the others. The request
// is cancelled when the key changes or the block unmounts.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

export interface MyDayBlockState<T> {
  status: 'loading' | 'success' | 'error'
  data: T | null
  error: Error | null
  reload: () => void
}

export function useMyDayBlock<T>(
  // Reloads whenever the key changes (view, period, page...). null = idle.
  key: string | null,
  loader: (signal: AbortSignal) => Promise<T>,
): MyDayBlockState<T> {
  const loaderRef = useRef(loader)
  const [reloadToken, setReloadToken] = useState(0)
  const [state, setState] = useState<Omit<MyDayBlockState<T>, 'reload'>>({
    status: 'loading',
    data: null,
    error: null,
  })

  loaderRef.current = loader

  useEffect(() => {
    if (key === null) {
      return undefined
    }

    const controller = new AbortController()

    setState((previous) => ({ status: 'loading', data: previous.data, error: null }))

    loaderRef.current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'success', data, error: null })
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error : new Error('No se pudo cargar la información.'),
        })
      })

    return () => controller.abort()
  }, [key, reloadToken])

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  return { ...state, reload }
}
