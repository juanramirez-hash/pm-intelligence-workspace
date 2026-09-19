import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { BrandDecisionEngine, buildBrandWorkspaceViewModel } from '../../../core/decision'
import { buildBrandCommercialComparison } from '../../../core/decision/brands/brandCommercialComparison'
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
      workspace: decision ? buildBrandWorkspaceViewModel(
        decision, buildBrandCommercialComparison(workspace.repository, decision),
      ) : null,
      accessDenied: false,
    }
  }, [brandId, user, workspace.repository, workspace.currentPeriodId])
}
