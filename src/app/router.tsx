import {
  createBrowserRouter,
} from 'react-router-dom'

import {
  AppShell,
} from '../layouts/AppShell'

import {
  PlaceholderPage,
} from '../shared/ui/PlaceholderPage'

const loadExecutiveWorkspace = async () => {
  const module =
    await import(
      '../features/executive-workspace/ExecutiveWorkspacePage'
    )

  return {
    Component:
      module.ExecutiveWorkspacePage,
  }
}

const loadSalesWorkspace = async () => {
  const module =
    await import(
      '../features/sales-workspace/pages/SalesWorkspacePage'
    )

  return {
    Component:
      module.SalesWorkspacePage,
  }
}

const loadBrandWorkspace = async () => {
  const module =
    await import(
      '../features/brand-workspace/pages/BrandWorkspacePage'
    )

  return {
    Component:
      module.BrandWorkspacePage,
  }
}

const loadBrandIntelligence = async () => {
  const module =
    await import(
      '../features/brand-intelligence/pages/BrandIntelligencePage'
    )

  return {
    Component:
      module.BrandIntelligencePage,
  }
}

const loadCustomerDirectory = async () => {
  const module =
    await import(
      '../features/customer-intelligence/pages/CustomerDirectoryPage'
    )

  return {
    Component:
      module.CustomerDirectoryPage,
  }
}

const loadCustomerIntelligence = async () => {
  const module =
    await import(
      '../features/customer-intelligence/pages/CustomerIntelligencePage'
    )

  return {
    Component:
      module.CustomerIntelligencePage,
  }
}

const loadProductDirectory = async () => {
  const module =
    await import(
      '../features/product-intelligence/pages/ProductDirectoryPage'
    )

  return {
    Component:
      module.ProductDirectoryPage,
  }
}

const loadProductIntelligence = async () => {
  const module =
    await import(
      '../features/product-intelligence/pages/ProductIntelligencePage'
    )

  return {
    Component:
      module.ProductIntelligencePage,
  }
}

const loadProductIdentityQuality = async () => {
  const module =
    await import(
      '../features/product-identity-quality/pages/ProductIdentityQualityPage'
    )

  return {
    Component:
      module.ProductIdentityQualityPage,
  }
}


const loadInventoryWorkspace = async () => {
  const module =
    await import(
      '../features/inventory-workspace/pages/InventoryWorkspacePage'
    )

  return {
    Component:
      module.InventoryWorkspacePage,
  }
}

const loadDataCenter = async () => {
  const module =
    await import(
      '../features/data-center/DataCenterPage'
    )

  return {
    Component:
      module.DataCenterPage,
  }
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        lazy: loadExecutiveWorkspace,
      },
      {
        path: 'sales',
        lazy: loadSalesWorkspace,
      },
      {
        path: 'brands',
        lazy: loadBrandWorkspace,
      },
      {
        path: 'brands/:brandId',
        lazy: loadBrandIntelligence,
      },
      {
        path: 'customers',
        lazy: loadCustomerDirectory,
      },
      {
        path: 'customers/:customerId',
        lazy: loadCustomerIntelligence,
      },
      {
        path: 'products',
        lazy: loadProductDirectory,
      },
      {
        path: 'products/:productId',
        lazy: loadProductIntelligence,
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
        lazy: loadInventoryWorkspace,
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
        lazy: loadDataCenter,
      },
      {
        path: 'data-quality/products',
        lazy: loadProductIdentityQuality,
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
