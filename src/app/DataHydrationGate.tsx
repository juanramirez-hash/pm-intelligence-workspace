// MD-003: loads the /api/data/* datasets (hydratePersistedData) only for the
// routes that need them. It used to run in main.tsx before rendering, so
// every page, the login screen included, downloaded every dataset. The
// existing workspaces render exactly as before: only after the store is
// hydrated. "Mi día" ("/", NAV-001) lives outside this gate. Removing the global
// download for good is C-001.

import {
  useEffect,
} from 'react'

import {
  Outlet,
} from 'react-router-dom'

import {
  useDataCenterStore,
} from '../features/data-center/store/dataCenterStore'

export function DataHydrationGate() {
  const isHydrated = useDataCenterStore((store) => store.isHydrated)

  useEffect(() => {
    // Runs once per session: the store ignores repeated calls while
    // hydrating or once hydrated.
    void useDataCenterStore.getState().hydratePersistedData()
  }, [])

  if (!isHydrated) {
    return (
      <div
        data-data-hydration="loading"
        className="flex min-h-[50vh] items-center justify-center"
      >
        <p className="text-sm text-slate-400">
          Cargando datos…
        </p>
      </div>
    )
  }

  return <Outlet />
}
