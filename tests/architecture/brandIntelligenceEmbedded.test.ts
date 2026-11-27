// MB-001B: the Inteligencia tab is embedded in the brand frame. It shows the
// Decision Core diagnosis (including the Executive Action Center) and nothing
// that already lives in Ventas, Clientes or Productos; the browser no longer
// builds the commercial comparison. /sales keeps redirecting to /brands.

import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const page = readFileSync('src/features/brand-intelligence/pages/BrandIntelligencePage.tsx', 'utf8')
const hook = readFileSync('src/features/brand-intelligence/hooks/useBrandIntelligenceWorkspace.ts', 'utf8')
const plan = readFileSync('src/features/brand-intelligence/components/BrandCommercialPlan.tsx', 'utf8')
const redirects = readFileSync('src/app/legacyRedirects.tsx', 'utf8')
const router = readFileSync('src/app/router.tsx', 'utf8')

describe('MB-001B Inteligencia tab', () => {
  it('shows the diagnosis blocks and the Executive Action Center', () => {
    for (const title of [
      'Executive Score',
      'AI Commercial Intelligence',
      'Executive Action Center',
      'Executive Brief',
      'Prioridad comercial',
      'title="Why"',
      'Riesgos',
      'Oportunidades',
      'Recommended Actions',
    ]) {
      expect(page, title).toContain(title)
    }
  })

  it('has no block that lives in another tab', () => {
    for (const removed of [
      'Forecast de cierre',
      'Daily Pace',
      'Gap Analysis',
      'Lost Customers',
      'Lost Products',
      'BrandCommercialComparisonPanel',
      'workspace.cards',
      'WorkspaceGrid',
      'KpiCard',
    ]) {
      expect(page, removed).not.toContain(removed)
    }
  })

  it('is embedded: no <main>, no "Volver", no brand header nor period of its own', () => {
    expect(page).not.toContain('<main')
    expect(page).not.toContain('Volver')
    expect(page).not.toContain('WorkspaceHeader')
    expect(page).not.toContain('currentPeriodId}')
    expect(page).toContain('data-brand-intelligence="embedded"')
    // Access and unavailable states stay inside the frame.
    expect(page).toContain('data-brand-intelligence-state="access-denied"')
    expect(page).toContain('data-brand-intelligence-state="unavailable"')
  })

  it('the hook no longer builds the commercial comparison in the browser', () => {
    expect(hook).not.toContain('buildBrandCommercialComparison')
    expect(hook).toContain('buildBrandWorkspaceViewModel(decision)')
  })

  it('the commercial plans point to the Clientes and Productos tabs', () => {
    expect(plan).toContain('El listado completo está en las pestañas Clientes y Productos, filtro Por recuperar.')
    expect(plan).not.toContain('tablas de esta página')
  })

  it('keeps the client comparison rules the server is tested against until MB-003', () => {
    expect(existsSync('src/core/decision/brands/brandCommercialComparison.ts')).toBe(true)
  })
})

describe('MB-001B removed code', () => {
  it('the old Sales and Brand workspaces and their orphans are gone', () => {
    for (const path of [
      'src/features/sales-workspace',
      'src/features/brand-workspace',
      'src/atlas/widgets/brandDirectory',
      'src/features/auth/brandIntelligenceAccess.ts',
      'src/features/auth/brandIntelligenceAccess.test.ts',
      'src/features/brand-intelligence/components/BrandCommercialComparisonPanel.tsx',
    ]) {
      expect(existsSync(path), path).toBe(false)
    }
  })

  it('/sales still redirects to /brands (bookmarks), outside the gate', () => {
    expect(redirects).toContain('export function SalesRedirect()')
    expect(router).toContain("path: 'sales'")
    expect(router).toContain('<SalesRedirect />')
    expect(router).not.toContain('sales-workspace')
  })
})
