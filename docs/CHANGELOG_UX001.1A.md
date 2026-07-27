# UX-001.1A — Semantic Design Tokens

## Objective

Introduce a semantic token layer above the existing primitive tokens without breaking current consumers.

## Added

- `src/tokens/semantic/colors.ts`
- `src/tokens/semantic/spacing.ts`
- `src/tokens/semantic/radius.ts`
- `src/tokens/semantic/shadows.ts`
- `src/tokens/semantic/typography.ts`
- `src/tokens/semantic/index.ts`
- `src/tokens/semantic/semanticTokens.test.ts`

## Updated

- `src/tokens/colors.ts`
  - Preserves all existing token keys.
  - Adds intelligence, overlay, inverse text, neutral and state palettes.
- `src/tokens/index.ts`
  - Exports the semantic token layer.

## Architectural decision

- `src/tokens` remains the single source of truth for visual tokens.
- Primitive tokens describe raw visual values.
- Semantic tokens describe UI and business meaning.
- Atlas components will consume semantic tokens during UX-001.1B.

## Compatibility

This delivery is additive. Existing imports and token names remain valid.
