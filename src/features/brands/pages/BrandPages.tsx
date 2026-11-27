// MB-001: route elements of the brand page. The tabs of Ventas, Clientes and
// Productos live under one BrandFrame (an Outlet) outside DataHydrationGate.
// Inteligencia is BrandIntelligenceRoute.tsx, its own chunk, so these tabs do
// not load the Decision Core code.

import {
  BrandFrame,
} from '../components/BrandFrame'

import {
  BrandCustomersTab,
  BrandProductsTab,
} from '../components/BrandListTabs'

import {
  BrandSalesTab,
} from '../components/BrandSalesTab'

export function BrandTabsLayout() {
  return <BrandFrame />
}

export function BrandSalesPage() {
  return <BrandSalesTab />
}

export function BrandCustomersPage() {
  return <BrandCustomersTab />
}

export function BrandProductsPage() {
  return <BrandProductsTab />
}
