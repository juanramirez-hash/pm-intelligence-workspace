import { Colors } from '../colors'

export const SemanticColors = {
  canvas: {
    background: Colors.background,

    foreground: Colors.text.primary,
  },

  surface: {
    default: Colors.surface,

    subtle: Colors.neutral[50],

    muted: Colors.neutral[100],

    inverse: Colors.neutral[900],

    overlay: Colors.overlay,
  },

  border: {
    subtle: Colors.neutral[200],

    default: Colors.border,

    strong: Colors.neutral[300],
  },

  text: {
    primary: Colors.text.primary,

    secondary: Colors.text.secondary,

    muted: Colors.text.muted,

    inverse: Colors.text.inverse,

    link: Colors.blue[700],
  },

  accent: {
    primary: Colors.primary,

    primaryHover: Colors.blue[700],

    intelligence: Colors.intelligence,

    intelligenceHover: Colors.violet[700],
  },

  status: {
    healthy: {
      foreground: Colors.green[700],

      surface: Colors.green[50],

      surfaceStrong: Colors.green[100],

      border: Colors.green[200],
    },

    attention: {
      foreground: Colors.amber[700],

      surface: Colors.amber[50],

      surfaceStrong: Colors.amber[100],

      border: Colors.amber[200],
    },

    critical: {
      foreground: Colors.red[700],

      surface: Colors.red[50],

      surfaceStrong: Colors.red[100],

      border: Colors.red[200],
    },

    informational: {
      foreground: Colors.sky[700],

      surface: Colors.sky[50],

      surfaceStrong: Colors.sky[100],

      border: Colors.sky[200],
    },

    intelligence: {
      foreground: Colors.violet[700],

      surface: Colors.violet[50],

      surfaceStrong: Colors.violet[100],

      border: Colors.violet[200],
    },

    neutral: {
      foreground: Colors.neutral[700],

      surface: Colors.neutral[50],

      surfaceStrong: Colors.neutral[100],

      border: Colors.neutral[200],
    },
  },

  metric: {
    positive: Colors.green[700],

    negative: Colors.red[700],

    stable: Colors.neutral[500],

    highlighted: Colors.blue[700],
  },
} as const

export type SemanticStatus = keyof typeof SemanticColors.status
