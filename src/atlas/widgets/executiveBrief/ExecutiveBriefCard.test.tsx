import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ExecutiveBrief,
} from '../../../core/business/executiveBrief'

import {
  ExecutiveBriefCard,
} from './ExecutiveBriefCard'

const explanation = {
  ruleId: 'EB-RULE-001',
  rationale: 'La variación es negativa.',
  evidence: [
    {
      label: 'Variación',
      value: '-5.0%',
    },
  ],
}

const brief: ExecutiveBrief = {
  id: '2026-07::brand-workspace::executive-brief',
  entityType: 'brand-workspace',
  periodId: '2026-07',
  generatedAt: '2026-07-27T10:00:00.000Z',
  locale: 'es-MX',
  title: 'Resumen ejecutivo · 2026-07',
  summary: 'La venta del periodo requiere seguimiento.',
  health: {
    score: null,
    status: 'not-available',
    label: 'Pendiente de modelo consolidado',
  },
  highlights: [
    {
      id: 'highlight-1',
      category: 'revenue',
      severity: 'neutral',
      title: 'Venta consolidada',
      description: '$19,300,000',
      confidence: 100,
      explanation,
    },
  ],
  risks: [
    {
      id: 'risk-1',
      category: 'growth',
      severity: 'critical',
      title: 'Portafolio en descenso',
      description: '39 marcas presentan variación negativa.',
      confidence: 92,
      explanation,
    },
  ],
  opportunities: [
    {
      id: 'opportunity-1',
      category: 'recovery',
      severity: 'positive',
      title: 'Recuperación comercial',
      description: 'Existe potencial para reactivar marcas.',
      confidence: 85,
      explanation,
    },
  ],
  recommendations: [
    {
      id: 'recommendation-1',
      category: 'growth',
      severity: 'attention',
      title: 'Priorizar recuperación',
      description: 'Intervenir marcas en descenso antes de ampliar portafolio.',
      confidence: 92,
      explanation,
    },
  ],
}

describe('ExecutiveBriefCard', () => {
  it('renders the deterministic brief and explainability controls', () => {
    const markup = renderToStaticMarkup(
      <ExecutiveBriefCard brief={brief} />,
    )

    expect(markup).toContain('data-atlas-component="executive-brief-card"')
    expect(markup).toContain('Resumen ejecutivo')
    expect(markup).toContain('Highlights')
    expect(markup).toContain('Riesgos')
    expect(markup).toContain('Oportunidades')
    expect(markup).toContain('Priorizar recuperación')
    expect(markup).toContain('EB-RULE-001')
    expect(markup).toContain('Confianza')
  })
})
