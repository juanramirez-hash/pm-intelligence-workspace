// NAV-001: redirects of the addresses that moved, keeping the query string
// and the hash (bookmarks and shared links keep working).
//   /my-day             → /
//   /attention/:domain  → /executive/attention/:domain

import {
  Navigate,
  useLocation,
  useParams,
} from 'react-router-dom'

import {
  legacyAttentionTarget,
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
