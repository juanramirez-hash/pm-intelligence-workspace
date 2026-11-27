// NAV-001: menu, top bar, browser tab, page headers (h1 and eyebrow),
// breadcrumbs and "Volver" buttons in Spanish; the top bar and the menu
// never load the datasets. Section titles inside the pages are out of
// scope (MB-001, PR-001).

import {
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  NAVIGATION,
  NAVIGATION_BRAND,
  screenTitle,
} from '../../src/layouts/navigation/navigationConfig'

const SRC = fileURLToPath(new URL('../../src/', import.meta.url))

const ENGLISH =
  /\b(Workspace|Intelligence|Settings|Data Center|Data Operations|Execution Management|Quality Gate|Platform Administration|Price Engineering|Data Quality|Attention Queue|Home|Dashboard)\b/

function tsxFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)

    if (statSync(path).isDirectory()) {
      return tsxFiles(path)
    }

    return name.endsWith('.tsx') && !name.includes('.test.') ? [path] : []
  })
}

// Pages: every */pages/*.tsx plus the pages that live at a feature root.
const PAGE_FILES = [
  ...tsxFiles(join(SRC, 'features')).filter((path) => /[\\/]pages[\\/]/.test(path)),
  join(SRC, 'features', 'executive-workspace', 'ExecutiveWorkspacePage.tsx'),
  join(SRC, 'features', 'data-center', 'DataCenterPage.tsx'),
  join(SRC, 'features', 'settings', 'SettingsPage.tsx'),
  join(SRC, 'features', 'executive-workspace', 'components', 'ExecutiveAttentionContextBanner.tsx'),
]

function headerTexts(source: string): string[] {
  const texts: string[] = []

  for (const match of source.matchAll(/eyebrow="([^"]+)"/g)) texts.push(match[1]!)
  for (const match of source.matchAll(/<h1[^>]*>\s*([^<{]+?)\s*</g)) texts.push(match[1]!)
  // Breadcrumbs: { label: '…', href: '…' }.
  for (const match of source.matchAll(/label:\s*'([^']+)',?\s*href:/g)) texts.push(match[1]!)
  // "Volver …" links.
  for (const match of source.matchAll(/(Volver[^<'"{]*)/g)) texts.push(match[1]!.trim())

  return texts.filter(Boolean)
}

describe('NAV-001 Spanish navigation', () => {
  it('names every menu entry and section in Spanish', () => {
    const labels = [
      NAVIGATION_BRAND.tagline,
      ...NAVIGATION.flatMap((section) => [section.label, ...section.items.map((item) => item.label)]),
    ]

    expect(labels.filter((label) => ENGLISH.test(label))).toEqual([])
  })

  it('titles the top bar and the browser tab in Spanish', () => {
    const paths = ['/', '/executive', '/executive/attention/brands', '/brands', '/brands/X', '/customers',
      '/customers/X', '/products', '/products/X', '/actions', '/sales', '/forecast', '/inventory',
      '/pricing', '/purchasing', '/data-center', '/data-quality/products', '/settings']

    expect(paths.map(screenTitle).filter((title) => ENGLISH.test(title))).toEqual([])

    const topbar = readFileSync(join(SRC, 'layouts', 'Topbar.tsx'), 'utf8')
    const sidebar = readFileSync(join(SRC, 'layouts', 'Sidebar.tsx'), 'utf8')

    expect(topbar).not.toMatch(/>\s*Workspace\s*</)
    expect(sidebar).not.toMatch(/>\s*(Settings|Data Center|Workspaces)\s*</)
    expect(topbar).toContain("'Buscar cliente, modelo o marca'")
  })

  it('uses Spanish h1, eyebrow, breadcrumbs and "Volver" links on every screen', () => {
    expect(PAGE_FILES.length).toBeGreaterThan(15)

    const english = PAGE_FILES.flatMap((file) =>
      headerTexts(readFileSync(file, 'utf8'))
        .filter((text) => ENGLISH.test(text))
        .map((text) => `${relative(SRC, file)}: ${text}`),
    )

    expect(english).toEqual([])
  })

  it('keeps the top bar and the menu away from the datasets', () => {
    const files = [
      join(SRC, 'layouts', 'AppShell.tsx'),
      join(SRC, 'layouts', 'Topbar.tsx'),
      join(SRC, 'layouts', 'Sidebar.tsx'),
      join(SRC, 'layouts', 'navigation', 'navigationConfig.ts'),
      join(SRC, 'layouts', 'dataCutoff', 'DataCutoffBadge.tsx'),
      join(SRC, 'layouts', 'dataCutoff', 'dataCutoffApi.ts'),
      join(SRC, 'features', 'global-search', 'repositories', 'globalSearchRepository.ts'),
    ]

    for (const file of files) {
      const source = readFileSync(file, 'utf8')

      expect({ file: relative(SRC, file), match: /dataCenterStore|useWorkspaceContext|apiDataRepository|['"`]\/api\/data/.exec(source)?.[0] ?? null })
        .toEqual({ file: relative(SRC, file), match: null })
    }
  })
})
