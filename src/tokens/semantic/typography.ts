import { Typography } from '../typography'

export const SemanticTypography = {
  executive: {
    title: Typography.pageTitle,

    sectionTitle: Typography.sectionTitle,

    metric: Typography.metric,
  },

  content: {
    title: Typography.sectionTitle,

    cardTitle: Typography.cardTitle,

    body: Typography.body,

    caption: Typography.caption,
  },

  navigation: {
    item: Typography.body,

    metadata: Typography.caption,
  },
} as const
