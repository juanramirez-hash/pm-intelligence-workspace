import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '../layouts/AppShell'
import { ExecutiveWorkspacePage } from '../features/executive-workspace/ExecutiveWorkspacePage'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'
import { DataCenterPage } from '../features/data-center/DataCenterPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <ExecutiveWorkspacePage />,
      },
      {
        path: 'sales',
        element: (
          <PlaceholderPage
            title="Sales Workspace"
            description="Ventas, tendencias, comparativos y desempeño comercial."
          />
        ),
      },
      {
        path: 'brands',
        element: (
          <PlaceholderPage
            title="Brand Workspace"
            description="Gestión integral de marcas y desempeño comercial."
          />
        ),
      },
      {
        path: 'customers',
        element: (
          <PlaceholderPage
            title="Customer Workspace"
            description="Desarrollo, recuperación y comportamiento de clientes."
          />
        ),
      },
      {
        path: 'products',
        element: (
          <PlaceholderPage
            title="Product Workspace"
            description="Desempeño, crecimiento y oportunidades por producto."
          />
        ),
      },
      {
        path: 'pricing',
        element: (
          <PlaceholderPage
            title="Pricing Workspace"
            description="Márgenes, descuentos y oportunidades de rentabilidad."
          />
        ),
      },
      {
        path: 'forecast',
        element: (
          <PlaceholderPage
            title="Forecast Workspace"
            description="Proyección de venta y cumplimiento de objetivos."
          />
        ),
      },
      {
        path: 'inventory',
        element: (
          <PlaceholderPage
            title="Inventory Workspace"
            description="Rotación, cobertura, riesgo y oportunidades de inventario."
          />
        ),
      },
      {
        path: 'purchasing',
        element: (
          <PlaceholderPage
            title="Purchasing Workspace"
            description="Órdenes, solicitudes y seguimiento de abastecimiento."
          />
        ),
      },
      {
        path: 'data-center',
        element: <DataCenterPage />,
      },
      {
        path: 'settings',
        element: (
          <PlaceholderPage
            title="Settings"
            description="Configuración de la plataforma y preferencias."
          />
        ),
      },
    ],
  },
])