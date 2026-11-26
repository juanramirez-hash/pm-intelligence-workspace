// MD-003-HOTFIX1: every number, amount and date of "Mi día" is formatted
// with an explicit locale; nothing depends on the browser language. Fails
// on toLocaleString / toLocaleDateString / toLocaleTimeString /
// toLocaleUpperCase / toLocaleLowerCase / localeCompare / Intl.* without an
// explicit locale, and on the shared business formatters (they do not
// protect against browsers without es-MX data).

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

const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** Top-level arguments of the call whose "(" is at openIndex. */
function callArguments(source: string, openIndex: number): string[] {
  const args: string[] = []
  let depth = 0
  let current = ''

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index]!

    if ('([{'.includes(char)) {
      depth += 1
      if (depth === 1) continue
    } else if (')]}'.includes(char)) {
      depth -= 1
      if (depth === 0) {
        if (current.trim()) args.push(current.trim())
        return args
      }
    } else if (char === ',' && depth === 1) {
      args.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  return args
}

// Call → index of the locale argument.
const LOCALE_ARGUMENT: Array<[RegExp, number]> = [
  [/\.toLocaleString\(/g, 0],
  [/\.toLocaleDateString\(/g, 0],
  [/\.toLocaleTimeString\(/g, 0],
  [/\.toLocaleUpperCase\(/g, 0],
  [/\.toLocaleLowerCase\(/g, 0],
  [/\.localeCompare\(/g, 1],
  [/\bIntl\.[A-Za-z]+\(/g, 0],
]

export function findLocaleProblems(source: string): string[] {
  const code = withoutComments(source)
  const problems: string[] = []

  for (const [pattern, position] of LOCALE_ARGUMENT) {
    for (const match of code.matchAll(pattern)) {
      const open = (match.index ?? 0) + match[0].length - 1
      const locale = callArguments(code, open)[position]

      if (!locale || locale === 'undefined' || locale === '[]') {
        problems.push(`${match[0]}…) sin locale`)
      }
    }
  }

  if (/formatting\/businessFormatters/.test(code)) {
    problems.push('usa businessFormatters')
  }

  return problems
}

describe('MD-003-HOTFIX1 explicit locale in "Mi día"', () => {
  it('detects formats without locale', () => {
    expect(findLocaleProblems('value.toLocaleString()')).toHaveLength(1)
    expect(findLocaleProblems("value.toLocaleString('es-MX')")).toEqual([])
    expect(findLocaleProblems('new Intl.NumberFormat(undefined, { style: "percent" })')).toHaveLength(1)
    expect(findLocaleProblems('new Intl.DateTimeFormat()')).toHaveLength(1)
    expect(findLocaleProblems('new Intl.NumberFormat(NUMBER_LOCALE, {})')).toEqual([])
    expect(findLocaleProblems('a.localeCompare(String(b))')).toHaveLength(1)
    expect(findLocaleProblems("a.localeCompare(String(b), 'es-MX')")).toEqual([])
    expect(findLocaleProblems("import { formatBusinessCurrency } from '../../../core/business/formatting/businessFormatters'")).toHaveLength(1)
    // Comments do not count.
    expect(findLocaleProblems('// value.toLocaleString()')).toEqual([])
  })

  it('finds none in src/features/my-day', () => {
    const files = sourceFiles(ROOT)

    expect(files.length).toBeGreaterThan(10)

    for (const file of files) {
      expect({ file, problems: findLocaleProblems(readFileSync(file, 'utf8')) }).toEqual({
        file,
        problems: [],
      })
    }
  })
})
