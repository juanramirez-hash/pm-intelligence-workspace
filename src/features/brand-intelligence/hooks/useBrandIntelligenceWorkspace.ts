import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { BrandDecisionEngine, buildBrandWorkspaceViewModel } from '../../../core/decision'
import { useWorkspaceContext } from '../../workspaces/shared/hooks/useWorkspaceContext'
import { useAuth } from '../../auth/useAuth'
import { canAccessBrand } from '../../auth/brandAccess'

export function useBrandIntelligenceWorkspace() {
  const { brandId } = useParams<{ brandId: string }>()
  const { user } = useAuth()
  const workspace = useWorkspaceContext()
  return useMemo(() => {
    const accessDenied = Boolean(brandId && !canAccessBrand(user, brandId))
    if (accessDenied || !brandId || !workspace.repository || !workspace.currentPeriodId) {
      return { brandId: brandId ?? null, workspace: null, accessDenied }
    }
    const decision = new BrandDecisionEngine(workspace.repository).evaluate(brandId, workspace.currentPeriodId)
    return {
      brandId,
      // MB-001B: the year over year comparison is served by the server
      // (Ventas tab), so it is no longer built in the browser.
      workspace: decision ? buildBrandWorkspaceViewModel(decision) : null,
      accessDenied: false,
    }
  }, [brandId, user, workspace.repository, workspace.currentPeriodId])
}
