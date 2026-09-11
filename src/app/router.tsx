import {
  createBrowserRouter,
} from 'react-router-dom'

import {
  WorkspaceRouteGuard,
} from '../features/auth/WorkspaceRouteGuard'

import {
  AppShell,
} from '../layouts/AppShell'

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

const loadExecutiveAttentionQueue = async () => {
  const module =
    await import(
      '../features/executive-workspace/pages/ExecutiveAttentionQueuePage'
    )

  return {
    Component:
      module.ExecutiveAttentionQueuePage,
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

const loadPricingLaboratory = async () => {
  const module =
    await import(
      '../features/pricing-laboratory/pages/PricingLaboratoryPage'
    )

  return {
    Component:
      module.PricingLaboratoryPage,
  }
}

const loadForecastWorkspace = async () => {
  const module =
    await import(
      '../features/forecast-workspace/pages/ForecastWorkspacePage'
    )

  return {
    Component:
      module.ForecastWorkspacePage,
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

const loadPurchasingWorkspace = async () => {
  const module =
    await import(
      '../features/purchasing-workspace/pages/PurchasingWorkspacePage'
    )

  return {
    Component:
      module.PurchasingWorkspacePage,
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

const loadSettings = async () => {
  const module =
    await import(
      '../features/settings/SettingsPage'
    )

  return {
    Component:
      module.SettingsPage,
  }
}

export const router =
  createBrowserRouter([
    {
      path: '/',
      element: <AppShell />,
      children: [
        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="executive"
            />
          ),
          children: [
            {
              index: true,
              lazy:
                loadExecutiveWorkspace,
            },
            {
              path:
                'attention/:domain',
              lazy:
                loadExecutiveAttentionQueue,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="sales"
            />
          ),
          children: [
            {
              path: 'sales',
              lazy:
                loadSalesWorkspace,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="brands"
            />
          ),
          children: [
            {
              path: 'brands',
              lazy:
                loadBrandWorkspace,
            },
            {
              path:
                'brands/:brandId',
              lazy:
                loadBrandIntelligence,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="customers"
            />
          ),
          children: [
            {
              path: 'customers',
              lazy:
                loadCustomerDirectory,
            },
            {
              path:
                'customers/:customerId',
              lazy:
                loadCustomerIntelligence,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="products"
            />
          ),
          children: [
            {
              path: 'products',
              lazy:
                loadProductDirectory,
            },
            {
              path:
                'products/:productId',
              lazy:
                loadProductIntelligence,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="pricing"
            />
          ),
          children: [
            {
              path: 'pricing',
              lazy:
                loadPricingLaboratory,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="forecast"
            />
          ),
          children: [
            {
              path: 'forecast',
              lazy:
                loadForecastWorkspace,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="inventory"
            />
          ),
          children: [
            {
              path: 'inventory',
              lazy:
                loadInventoryWorkspace,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="purchasing"
            />
          ),
          children: [
            {
              path: 'purchasing',
              lazy:
                loadPurchasingWorkspace,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="data-center"
            />
          ),
          children: [
            {
              path: 'data-center',
              lazy:
                loadDataCenter,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="product-quality"
            />
          ),
          children: [
            {
              path:
                'data-quality/products',
              lazy:
                loadProductIdentityQuality,
            },
          ],
        },

        {
          element: (
            <WorkspaceRouteGuard
              workspaceId="settings"
            />
          ),
          children: [
            {
              path: 'settings',
              lazy:
                loadSettings,
            },
          ],
        },
      ],
    },
  ])