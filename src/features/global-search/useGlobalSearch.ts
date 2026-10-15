import {
  useEffect,
  useState,
} from 'react'

import {
  searchGlobalCatalog,
} from './repositories/globalSearchRepository'

import type {
  GlobalSearchGroup,
} from './repositories/globalSearchRepository'

const SEARCH_DELAY_MS = 180

export function useGlobalSearch(
  query: string,
) {
  const [
    groups,
    setGroups,
  ] = useState<
    GlobalSearchGroup[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    const normalizedQuery =
      query.trim()

    if (
      normalizedQuery.length < 2
    ) {
      setGroups([])
      setLoading(false)
      setError(null)

      return
    }

    const controller =
      new AbortController()

    const timer =
      window.setTimeout(
        () => {
          setLoading(true)
          setError(null)

          void searchGlobalCatalog(
            normalizedQuery,
            controller.signal,
          )
            .then(
              (results) => {
                if (
                  controller.signal
                    .aborted
                ) {
                  return
                }

                setGroups(
                  results,
                )
              },
            )
            .catch(
              (searchError) => {
                if (
                  controller.signal
                    .aborted
                ) {
                  return
                }

                setGroups([])

                setError(
                  searchError instanceof
                    Error
                    ? searchError.message
                    : 'No se pudo realizar la búsqueda',
                )
              },
            )
            .finally(
              () => {
                if (
                  !controller.signal
                    .aborted
                ) {
                  setLoading(
                    false,
                  )
                }
              },
            )
        },
        SEARCH_DELAY_MS,
      )

    return () => {
      window.clearTimeout(
        timer,
      )

      controller.abort()
    }
  }, [query])

  return {
    groups,
    loading,
    error,
  }
}