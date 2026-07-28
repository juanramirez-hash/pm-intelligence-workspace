import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  OpportunityRadar,
} from '../../../core/business/opportunityRadar'

import {
  OpportunityRadarCard,
} from './OpportunityRadarCard'

const radar: OpportunityRadar = {
  id: '2026-07::brand-workspace::opportunity-radar',
  entityType: 'brand-workspace',
  periodId: '2026-07',
  generatedAt: '2026-07-30T18:00:00.000Z',
  totalImpact: 1_400_000,
  criticalCount: 1,
  highCount: 0,
  opportunities: [
    {
      id: 'opportunity-1',
      entityType: 'brand',
      entityId: 'brand-1',
      entityName: 'UNV',
      type: 'recovery',
      priority: 'critical',
      title: 'Recuperar venta perdida',
      description: 'La marca concentra una pérdida relevante.',
      impact: 1_400_000,
      confidence: 92,
      effort: 55,
      score: 91,
      explanation: {
        ruleId: 'OP-R-001',
        rationale: 'La pérdida absoluta requiere atención prioritaria.',
        evidence: [
          {
            label: 'Pérdida',
            value: '$1,400,000',
          },
        ],
      },
    },
  ],
}

describe('OpportunityRadarCard', () => {
  it('renders prioritized opportunities and explainability', () => {
    const markup = renderToStaticMarkup(
      <OpportunityRadarCard radar={radar} />,
    )

    expect(markup).toContain('data-atlas-component="opportunity-radar-card"')
    expect(markup).toContain('Opportunity Radar')
    expect(markup).toContain('Oportunidades prioritarias')
    expect(markup).toContain('UNV')
    expect(markup).toContain('Recuperar venta perdida')
    expect(markup).toContain('OP-R-001')
    expect(markup).toContain('Opportunity score 91 de 100')
  })
})
