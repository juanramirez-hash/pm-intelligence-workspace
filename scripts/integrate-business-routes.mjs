import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { resolve } from 'node:path'

// Run from the repository root. Only the explicit --apply option writes files.
const root = process.cwd()
const filename = resolve(root, 'server/index.js')
const source = await readFile(filename, 'utf8')
await access(resolve(root, 'server/registerBusinessRoutes.js'))
const hasImport = /import\s*\{\s*registerBusinessRoutes\s*\}\s*from\s*['"]\.\/registerBusinessRoutes\.js['"]/.test(source)
const hasCall = /registerBusinessRoutes\(app,\s*pool\)/.test(source)
if (hasImport && hasCall) {
  console.log('Las rutas ya están registradas; no se modificó el archivo.')
} else {
  if (hasImport || hasCall) throw new Error('Hay una integración parcial; revisar server/index.js antes de continuar.')
  const anchor = /app\.use\(\s*['"]\/api\/data['"]\s*,/.exec(source)
  if (!anchor || !source.includes('app.listen(')) throw new Error('No se encontró la estructura esperada de server/index.js; no se modificó.')
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  const insertion = `registerBusinessRoutes(app, pool)${newline}${newline}`
  let updated = source.slice(0, anchor.index) + insertion + source.slice(anchor.index)
  const dotenv = /import ['"]dotenv\/config['"]/ 
  if (!dotenv.test(updated)) throw new Error('No se encontró dotenv/config; no se modificó.')
  updated = updated.replace(dotenv, (match) => `${match}${newline}import { registerBusinessRoutes } from './registerBusinessRoutes.js'`)
  if (!process.argv.includes('--apply')) {
    console.log('Verificación correcta. Se añadirá un import y la conexión antes de /api/data. Para aplicar: node scripts/integrate-business-routes.mjs --apply')
  } else {
    await mkdir(resolve(root, 'tmp'), { recursive: true })
    const backup = resolve(root, 'tmp', `index.before-business-routes-${Date.now()}.js`)
    await writeFile(backup, source, { flag: 'wx' })
    await writeFile(filename, updated)
    console.log('server/index.js actualizado. Respaldo local:', backup)
    console.log('Siguiente validación: npm run test -- tests/services/businessActions.test.js')
  }
}
