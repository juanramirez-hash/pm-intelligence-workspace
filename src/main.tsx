import { StrictMode } from 'react'
import {
  createRoot,
} from 'react-dom/client'

import App from './app/App'
import './index.css'

// MD-003: the datasets are no longer loaded before rendering;
// DataHydrationGate (src/app/router.tsx) loads them for the routes that
// need them.
async function bootstrapApplication():
  Promise<void> {
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