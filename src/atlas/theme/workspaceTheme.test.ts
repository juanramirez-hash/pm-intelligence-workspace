import { describe, expect, it } from 'vitest'
import { getWorkspaceTheme } from './workspaceTheme'

describe('workspaceTheme', () => {
  it('returns the selected workspace theme', () => {
    expect(getWorkspaceTheme('sales').name).toBe('sales')
    expect(getWorkspaceTheme('brand').name).toBe('brand')
    expect(getWorkspaceTheme('inventory').hero).toContain('amber')
  })
})
