import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

export function useExecutiveWorkspace() {
  return useWorkspaceContext()
}