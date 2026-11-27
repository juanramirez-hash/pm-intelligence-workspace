// MB-001: context that BrandFrame gives to the tab (brand of the URL, period
// and the loaded header), and the tab of an address.

import {
  createContext,
  useContext,
} from 'react'

import type {
  BrandHeaderResponse,
  BrandTabId,
} from '../api/brandsTypes'

import {
  BRAND_TABS,
} from '../format/brandsFormat'

/** Tab of /brands/:brandId/<tab>; null for any other address. */
export function tabOfPath(pathname: string): BrandTabId | null {
  const last = pathname.split('/').filter(Boolean).at(-1)

  return BRAND_TABS.find((tab) => tab.id === last)?.id ?? null
}

export interface BrandContextValue {
  // The brand as written in the URL.
  routeBrand: string
  // Period of the URL (null = the cutoff month, server default).
  period: string | null
  header: BrandHeaderResponse
}

export const BrandContext = createContext<BrandContextValue | null>(null)

export function useBrandContext(): BrandContextValue {
  const value = useContext(BrandContext)

  if (!value) {
    throw new Error('useBrandContext must be used inside BrandFrame')
  }

  return value
}
