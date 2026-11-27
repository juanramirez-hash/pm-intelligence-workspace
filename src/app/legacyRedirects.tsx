// NAV-001: redirects of the addresses that moved, keeping the query string
// and the hash (bookmarks and shared links keep working).
//   /my-day             → /
//   /attention/:domain  → /executive/attention/:domain
//   /sales              → /brands (MB-001)
//   /brands/:brandId    → /brands/:brandId/ventas (MB-001)

import {
  Navigate,
  useLocation,
  useParams,
} from 'react-router-dom'

import {
  brandIndexTarget,
  legacyAttentionTarget,
  salesTarget,
} from './legacyRedirectTargets'

export function MyDayRedirect() {
  const { search, hash } = useLocation()

  return <Navigate replace to={{ pathname: '/', search, hash }} />
}

export function LegacyAttentionRedirect() {
  const { domain } = useParams<{ domain: string }>()
  const { search, hash } = useLocation()

  return <Navigate replace to={legacyAttentionTarget(domain, search, hash)} />
}

export function SalesRedirect() {
  const { search, hash } = useLocation()

  return <Navigate replace to={salesTarget(search, hash)} />
}

/** /brands/:brandId opens the Ventas tab, keeping the period and the hash. */
export function BrandIndexRedirect() {
  const { brandId = '' } = useParams<{ brandId: string }>()
  const { search, hash } = useLocation()

  return <Navigate replace to={brandIndexTarget(brandId, search, hash)} />
}
