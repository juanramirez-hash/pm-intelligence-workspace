import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '../layouts/AppShell'
import { ExecutiveWorkspacePage } from '../features/executive-workspace/ExecutiveWorkspacePage'
import { BrandWorkspacePage } from '../features/brand-workspace/pages/BrandWorkspacePage'
import { PlaceholderPage } from '../shared/ui/PlaceholderPage'
import { DataCenterPage } from '../features/data-center/DataCenterPage'
import { BrandIntelligencePage } from '../features/brand-intelligence/pages/BrandIntelligencePage'
import { CustomerDirectoryPage } from '../features/customer-intelligence/pages/CustomerDirectoryPage'
import { CustomerIntelligencePage } from '../features/customer-intelligence/pages/CustomerIntelligencePage'
import { ProductDirectoryPage } from '../features/product-intelligence/pages/ProductDirectoryPage'
import { ProductIntelligencePage } from '../features/product-intelligence/pages/ProductIntelligencePage'

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
        element: <BrandWorkspacePage />,
      },

{
  path: 'brands/:brandId',
  element: <BrandIntelligencePage />,
},

      {
        path: 'customers',
        element: <CustomerDirectoryPage />,
      },
      {
        path: 'customers/:customerId',
        element: <CustomerIntelligencePage />,
      },
      {
        path: 'products',
        element: <ProductDirectoryPage />,
      },
      {
        path: 'products/:productId',
        element: <ProductIntelligencePage />,
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