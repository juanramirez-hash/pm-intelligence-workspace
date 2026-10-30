import {
  defineConfig,
} from 'vitest/config'

import {
  appDefine,
} from './vite.config'

export default defineConfig({
  define: appDefine,

  test: {
    environment: 'node',

    globals: false,

    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/**/*.test.{js,ts,tsx}',
    ],

    coverage: {
      enabled: false,
    },
  },
})
