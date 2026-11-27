import {
  createBrowserRouter,
  type RouteObject,
} from 'react-router-dom'

import {
  WorkspaceRouteGuard,
} from '../features/auth/WorkspaceRouteGuard'

import {
  AppShell,
} from '../layouts/AppShell'

import {
  DataHydrationGate,
} from './DataHydrationGate'

import {
  BrandIndexRedirect,
  LegacyAttentionRedirect,
  MyDayRedirect,
  SalesRedirect,
} from './legacyRedirects'

const loadMyDay = async () => {
  const module =
    await import(
      '../features/my-day/pages/MyDayPage'
    )

  return {
    Component:
      module.MyDayPage,
  }
}

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

// MB-001: the brand page. Directory and the Ventas, Clientes and Productos
// tabs read only /api/brands/* and stay outside DataHydrationGate.
const loadBrandsDirectory = async () => {
  const module =
    await import(
      '../features/brands/pages/BrandsDirectoryPage'
    )

  return {
    Component:
      module.BrandsDirectoryPage,
  }
}

const loadBrandTabsLayout = async () => {
  const module =
    await import(
      '../features/brands/pages/BrandPages'
    )

  return {
    Component:
      module.BrandTabsLayout,
  }
}

const loadBrandSales = async () => {
  const module =
    await import(
      '../features/brands/pages/BrandPages'
    )

  return {
    Component:
      module.BrandSalesPage,
  }
}

const loadBrandCustomers = async () => {
  const module =
    await import(
      '../features/brands/pages/BrandPages'
    )

  return {
    Component:
      module.BrandCustomersPage,
  }
}

const loadBrandProducts = async () => {
  const module =
    await import(
      '../features/brands/pages/BrandPages'
    )

  return {
    Component:
      module.BrandProductsPage,
  }
}

// MB-001: Inteligencia keeps the browser calculation (Decision Core), so its
// route stays inside DataHydrationGate.
const loadBrandIntelligenceTab = async () => {
  const module =
    await import(
      '../features/brands/pages/BrandIntelligenceRoute'
    )

  return {
    Component:
      module.BrandIntelligenceRoute,
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

const loadActionsWorkspace = async () => {
  const module =
    await import(
      '../features/actions/pages/ActionsWorkspacePage'
    )

  return {
    Component:
      module.ActionsWorkspacePage,
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

// Routes that need the /api/data/* datasets; withDataHydrationGate wraps
// them in DataHydrationGate.
const workspaceRoutes: RouteObject[] =
  [
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
              // NAV-001: "/" is "Mi día"; the Panorama ejecutivo moves here.
              path: 'executive',
              lazy:
                loadExecutiveWorkspace,
            },
            {
              path:
                'executive/attention/:domain',
              lazy:
                loadExecutiveAttentionQueue,
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
              path:
                'brands/:brandId/inteligencia',
              lazy:
                loadBrandIntelligenceTab,
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
              workspaceId="actions"
            />
          ),
          children: [
            {
              path: 'actions',
              lazy:
                loadActionsWorkspace,
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
  ]

// MD-003: "Mi día" reads only /api/my-day/* and /api/actions, so it stays
// outside DataHydrationGate and never downloads the datasets.
// NAV-001: it is the home page ("/"), where everyone lands after the login.
const myDayRoute: RouteObject = {
  element: (
    <WorkspaceRouteGuard
      workspaceId="my-day"
    />
  ),
  children: [
    {
      index: true,
      lazy:
        loadMyDay,
    },
  ],
}

// MB-001: /brands and the Ventas, Clientes and Productos tabs read only
// /api/brands/*: outside DataHydrationGate, so no dataset is downloaded.
const brandsRoute: RouteObject = {
  element: (
    <WorkspaceRouteGuard
      workspaceId="brands"
    />
  ),
  children: [
    {
      path: 'brands',
      lazy:
        loadBrandsDirectory,
    },
    {
      path: 'brands/:brandId',
      lazy:
        loadBrandTabsLayout,
      children: [
        {
          index: true,
          element: <BrandIndexRedirect />,
        },
        {
          path: 'ventas',
          lazy:
            loadBrandSales,
        },
        {
          path: 'clientes',
          lazy:
            loadBrandCustomers,
        },
        {
          path: 'productos',
          lazy:
            loadBrandProducts,
        },
      ],
    },
  ],
}

// NAV-001: old addresses keep working (bookmarks). Outside the gate: a
// redirect never downloads the datasets.
const legacyRedirects: RouteObject[] = [
  {
    path: 'my-day',
    element: <MyDayRedirect />,
  },
  {
    path: 'attention/:domain',
    element: <LegacyAttentionRedirect />,
  },
  {
    // MB-001: the Ventas workspace is replaced by the brand page.
    path: 'sales',
    element: <SalesRedirect />,
  },
]

/**
 * Keeps every existing workspace route inside DataHydrationGate (they need
 * the datasets, as before) and adds "Mi día" and the redirects outside of it.
 */
export function withDataHydrationGate(
  routes: RouteObject[],
): RouteObject[] {
  return routes.map((root) => ({
    ...root,
    children: [
      myDayRoute,
      brandsRoute,
      ...legacyRedirects,
      {
        element: <DataHydrationGate />,
        children: root.children ?? [],
      },
    ],
  }) as RouteObject)
}

export const appRoutes =
  withDataHydrationGate(workspaceRoutes)

export const router =
  createBrowserRouter(appRoutes)