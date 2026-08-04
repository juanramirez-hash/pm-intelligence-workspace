import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  MemoryRouter,
} from 'react-router-dom'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ExecutiveWorkspaceHealth,
} from '../types/executiveWorkspaceTypes'

import {
  ExecutiveDataHealthSummary,
} from './ExecutiveDataHealthSummary'

const health:
  ExecutiveWorkspaceHealth = {
  readyDatasets: 8,
  totalDatasets: 12,
  coveragePercentage: 67,
  systemReady: true,
  importStatus: 'completed',
  lastImportedAt:
    '2026-08-03T20:00:00.000Z',
}

describe(
  'ExecutiveDataHealthSummary',
  () => {
    it('renders a compact summary and links to Data Center', () => {
      const markup =
        renderToStaticMarkup(
          <MemoryRouter>
            <ExecutiveDataHealthSummary
              health={health}
            />
          </MemoryRouter>,
        )

      expect(markup).toContain(
        'data-executive-component="data-health-summary"',
      )

      expect(markup).toContain(
        '8 de 12 fuentes',
      )

      expect(markup).toContain(
        'href="/data-center"',
      )

      expect(markup).not.toContain(
        'Ventas</h3>',
      )
    })
  },
)
