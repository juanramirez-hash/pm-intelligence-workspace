import { describe, expect, it } from 'vitest'

import {
  SemanticColors,
  SemanticRadius,
  SemanticShadows,
  SemanticSpacing,
  SemanticTypography,
} from './index'

import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '../index'

describe('Semantic Design Tokens', () => {
  it('references primitive colors instead of duplicating core values', () => {
    expect(SemanticColors.canvas.background).toBe(Colors.background)
    expect(SemanticColors.status.healthy.foreground).toBe(Colors.green[700])
    expect(SemanticColors.status.critical.foreground).toBe(Colors.red[700])
    expect(SemanticColors.accent.intelligence).toBe(Colors.intelligence)
  })

  it('maps layout roles to the primitive spacing scale', () => {
    expect(SemanticSpacing.page.inline).toBe(Spacing.lg)
    expect(SemanticSpacing.section.gap).toBe(Spacing['2xl'])
    expect(SemanticSpacing.card.default).toBe(Spacing.lg)
  })

  it('maps component roles to primitive radius and shadow scales', () => {
    expect(SemanticRadius.card).toBe(Radius.lg)
    expect(SemanticRadius.badge).toBe(Radius.full)
    expect(SemanticShadows.card).toBe(Shadows.sm)
    expect(SemanticShadows.floating).toBe(Shadows.lg)
  })

  it('keeps typography roles connected to the existing scale', () => {
    expect(SemanticTypography.executive.title).toBe(Typography.pageTitle)
    expect(SemanticTypography.content.body).toBe(Typography.body)
  })
})
