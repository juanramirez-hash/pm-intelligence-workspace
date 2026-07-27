import { Spacing } from '../spacing'

export const SemanticSpacing = {
  page: {
    inline: Spacing.lg,

    block: Spacing.lg,

    inlineWide: Spacing.xl,

    blockWide: Spacing.xl,
  },

  section: {
    gap: Spacing['2xl'],

    contentGap: Spacing.lg,

    headerGap: Spacing.sm,
  },

  card: {
    compact: Spacing.md,

    default: Spacing.lg,

    spacious: Spacing.xl,

    contentGap: Spacing.md,
  },

  control: {
    compact: Spacing.sm,

    default: Spacing.md,

    groupGap: Spacing.sm,
  },

  navigation: {
    itemGap: Spacing.xs,

    groupGap: Spacing.lg,

    contentGap: Spacing.md,
  },
} as const
