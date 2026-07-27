import {
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs'
import {
  join,
  relative,
  resolve,
} from 'node:path'

import {
  describe,
  expect,
  it,
} from 'vitest'

const businessRoot = resolve(
  process.cwd(),
  'src/core/business',
)

const forbiddenImportTokens = [
  'react',
  '/components/',
  '/layouts/',
  '/pages/',
  '/hooks/',
  '/stores/',
]

function collectTypeScriptFiles(
  directory: string,
): string[] {
  return readdirSync(directory)
    .flatMap((entry: string) => {
      const path = join(directory, entry)

      if (statSync(path).isDirectory()) {
        return collectTypeScriptFiles(path)
      }

      return path.endsWith('.ts')
        && !path.endsWith('.test.ts')
        ? [path]
        : []
    })
}

function collectImportSpecifiers(
  source: string,
): readonly string[] {
  const specifiers: string[] = []
  const importPattern = /(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/gu

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2]

    if (specifier) {
      specifiers.push(specifier)
    }
  }

  return specifiers
}

describe('Business Core architecture boundaries', () => {
  it('no depende de React ni de capas de presentacion', () => {
    const violations = collectTypeScriptFiles(
      businessRoot,
    ).flatMap((path) => {
      const source = readFileSync(path, 'utf8')

      return collectImportSpecifiers(source)
        .flatMap((specifier) =>
          forbiddenImportTokens
            .filter((token) =>
              specifier === token
              || specifier.includes(token),
            )
            .map((token) => ({
              file: relative(businessRoot, path),
              specifier,
              token,
            })),
        )
    })

    expect(violations).toEqual([])
  })
})
