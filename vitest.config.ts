import {
  defineConfig,
} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',

    globals: false,

    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
    ],

    coverage: {
      enabled: false,
    },
  },
})