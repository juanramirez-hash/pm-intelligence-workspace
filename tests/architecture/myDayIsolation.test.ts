// MD-003: "Mi día" must not download the datasets. No file of the feature
// reads /api/data/* or the Data Center store, the business model or the
// workspace context (they need the full sales download).

import {
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../src/features/my-day/', import.meta.url))

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)

    if (statSync(path).isDirectory()) {
      return sourceFiles(path)
    }

    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

// Imports that need the full dataset download.
const FORBIDDEN_IMPORT =
  /from\s+['"][^'"]*(dataCenterStore|apiDataRepository|useWorkspaceContext|BusinessRepository|buildBusinessDataModel|core\/business\/builders)[^'"]*['"]/

// Code (comments removed) that reads the datasets.
const FORBIDDEN_CODE = /['"`]\/api\/data|hydratePersistedData/

const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('MD-003 isolation of "Mi día"', () => {
  it('reads only /api/my-day/* and /api/actions, never the datasets', () => {
    const files = sourceFiles(ROOT)

    expect(files.length).toBeGreaterThan(10)

    for (const file of files) {
      const source = withoutComments(readFileSync(file, 'utf8'))

      expect({ file, import: FORBIDDEN_IMPORT.exec(source)?.[0] ?? null }).toEqual({ file, import: null })
      expect({ file, code: FORBIDDEN_CODE.exec(source)?.[0] ?? null }).toEqual({ file, code: null })
    }

    const api = readFileSync(join(ROOT, 'api', 'myDayApi.ts'), 'utf8')
    const paths = [...api.matchAll(/'(\/api\/[^'`]*)|`(\/api\/[^`]*)`/g)].map((match) => match[1] ?? match[2])

    expect(paths.every((path) => path?.startsWith('/api/my-day') || path === '/api/actions')).toBe(true)
    expect(api).toContain('authenticatedFetch')
    expect(api).not.toMatch(/[^.]\bfetch\(/)
  })
})
