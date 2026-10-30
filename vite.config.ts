import {
  readFileSync,
} from 'node:fs'

import {
  defineConfig,
} from 'vite'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Read package.json directly so the version is available even when the
// build does not run through npm (npm_package_version would be missing).
function readAppVersion(): string {
  const packageJson = JSON.parse(
    readFileSync(
      new URL('./package.json', import.meta.url),
      'utf8',
    ),
  ) as { version?: unknown }

  if (
    typeof packageJson.version !== 'string' ||
    packageJson.version.trim() === ''
  ) {
    throw new Error(
      'package.json does not define a valid version',
    )
  }

  return packageJson.version
}

// Shared with vitest.config.ts so tests see the same build-time constants.
export const appDefine = {
  __APP_VERSION__: JSON.stringify(
    readAppVersion(),
  ),
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  define: appDefine,
})
