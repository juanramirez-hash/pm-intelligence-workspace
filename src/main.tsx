import { StrictMode } from 'react'
import {
  createRoot,
} from 'react-dom/client'

import App from './app/App'
import './index.css'

import {
  useDataCenterStore,
} from './features/data-center/store/dataCenterStore'

async function bootstrapApplication():
  Promise<void> {
  await useDataCenterStore
    .getState()
    .hydratePersistedData()

  const rootElement =
    document.getElementById(
      'root',
    )

  if (!rootElement) {
    throw new Error(
      'No se encontró el elemento raíz de la aplicación.',
    )
  }

  createRoot(
    rootElement,
  ).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrapApplication()