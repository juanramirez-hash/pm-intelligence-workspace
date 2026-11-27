// MB-001: the brand page never reads the /api/data/* datasets; only the
// Inteligencia route imports the page that needs them.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('MB-001 architecture', () => {
  function sources(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name)

      if (entry.isDirectory()) {
        return sources(path)
      }

      return /\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : []
    })
  }

  it('the brand page code never reads the datasets nor the business model', () => {
    for (const file of sources('src/features/brands')) {
      const code = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')

      expect(code, file).not.toContain('/api/data')
      expect(code, file).not.toMatch(/useWorkspaceContext|dataCenterStore|apiDataRepository/)
    }
  })

  it('only the Inteligencia route imports the page that needs the datasets', () => {
    const importers = sources('src/features/brands').filter((file) =>
      readFileSync(file, 'utf8').includes('brand-intelligence/pages/BrandIntelligencePage'))

    expect(importers.map((file) => file.replace(/\\/g, '/'))).toEqual(['src/features/brands/pages/BrandIntelligenceRoute.tsx'])
  })
})
