# CLAUDE.md — PM Intelligence Workspace

Guía de contexto para Claude Code. Léela completa al iniciar cada sesión.

## 1. Qué es este proyecto

PM Intelligence Workspace es una plataforma interna de Tecnosinergia (mayorista B2B de sistemas de seguridad electrónica en México) para que los Product Managers analicen ventas, clientes, marcas, productos, inventario, forecast, precios y compras.

- Dueño del proyecto: Juan Ramírez, Gerente de PM's.
- Usuarios: equipo de PMs y dirección.
- Idioma de trabajo: **español** (respuestas, documentación y mensajes al usuario).
- Nombres de código, tipos y commits: en inglés, siguiendo lo que ya existe en el repo.

## 2. Fuente de verdad

Cuando haya diferencias, prevalece en este orden:

```text
Código actual
→ Pruebas automatizadas
→ Configuración de rutas y package.json
→ Documentación vigente en docs/
→ Historial de Git
→ Este CLAUDE.md / Archivos Maestros
→ Conversaciones previas
```

Si algo de este archivo contradice el código, **el código manda**. Avisa la diferencia y propone actualizar este archivo.

## 3. Ambientes y despliegue

| Ambiente | Dónde | Qué se hace |
|---|---|---|
| Local | Windows, CMD + VS Code | Desarrollo, build, lint, tests, commit y `push` a GitHub |
| GitHub | `juanramirez-hash/pm-intelligence-workspace` | Fuente central del código |
| Producción | Servidor Linux vía SSH | `git pull`, build y publicación del frontend, migraciones manuales y reinicio del backend (ver §12) |

Reglas de despliegue:

- Claude Code trabaja **solo en el ambiente local**.
- Nunca ejecutar comandos SSH, ni conectarse, ni modificar el servidor de producción.
- Nunca hacer `push` sin autorización explícita del usuario en ese momento.
- El usuario es quien hace el `pull` en producción.

## 4. Stack tecnológico

Stack de referencia (verificar versiones exactas en `package.json`):

- React 19, React Router 7, Vite 8, TypeScript 6
- Zustand 5, TanStack Query 5
- HeroUI 3, Tailwind 4
- XLSX (importación de archivos), idb (IndexedDB)
- Vitest (pruebas), oxlint (lint)

Backend (`server/`, paquete propio con su `package.json`):

- Node + Express 5, PostgreSQL vía `pg` (`server/db/pool.js`)
- Sesiones con `express-session` + `connect-pg-simple`; login con Google (`google-auth-library`)
- Configuración en `server/.env` (ignorado por Git; nunca leerlo ni commitearlo)
- `server/package.json` no tiene script de tests: las pruebas del backend viven en `tests/services/` y corren con el `npm run test` de la raíz

Comandos de validación obligatorios después de cada cambio:

```bash
npm run build
npm run lint
npm run test
```

> Verificar los nombres reales de los scripts en `package.json` al iniciar.

## 5. Arquitectura obligatoria

```text
Fuentes operativas (archivos Excel/CSV)
→ Data Center (importadores + IndexedDB)
→ Business Data Model (entidades)
→ BusinessRepository / Cube / Engines
→ Workspace Models
→ UI y exportaciones
```

Capa de servidor (en curso en la rama v0.57.0, "production platform foundation"):

- `server/routes/`: API REST por dominio (sales, salesAnalytics, inventory, targets, products, customers, pricing, purchases, purchaseRequests, projects, projectBillings, exchangeRates, actions, search, metrics, dataStatus, settingsUsers, settingsRoles).
- `server/services/`: importación por chunks con tablas staging, agregados de negocio (`refresh_business_aggregates`), analítica de ventas en SQL, búsqueda global y conciliación de facturación de proyectos.
- `server/middleware/`: `requireAuth`, `requireAdmin`, `requireBrandScope`, `requireWriteAccess` (usuarios, roles y asignación de marcas por PM).
- `server/migrations/`: SQL numerado `NNN_descripcion.sql` (último en Git: `036`). Las migraciones nuevas van con el siguiente número; nunca editar una ya aplicada.

Reglas de arquitectura:

- Las entidades contienen hechos, identificadores, relaciones y objetivos; **no KPIs derivados**.
- Los Workspaces consumen BusinessRepository/Core, **no filas normalizadas**.
- La UI solo representa resultados; **no duplica fórmulas de negocio**.
- Thresholds, benchmarks, lead times, coberturas y estados deben ser explícitos y configurables, nunca "números mágicos" escondidos.
- Los datos faltantes se muestran como faltantes; **no se infieren en silencio**.
- Toda clasificación debe ser explicable y trazable a los datos fuente.

## 6. Dominios del producto

Estado verificado contra el código el 29 oct 2026: `package.json` en **0.56.0**, rama `feature/production-platform-foundation-v0.57.0`. `docs/ROADMAP.md` (v0.55.0) y `docs/CHANGELOG.md` (0.54.1) van atrasados respecto al código.

| Dominio | Ruta | Estado |
|---|---|---|
| Executive Workspace | `/` (+ `attention/:domain`) | Cerrado (EW-001 + HOTFIX1) |
| Sales Workspace | `/sales` | Cerrado (SW-001 a SW-006); analítica migrando a SQL (SQL-002) |
| Brand Workspace | `/brands` (+ `:brandId`) | Operativo |
| Customer Intelligence | `/customers` | Migrado a BusinessRepository / `customerPeriods` |
| Product Workspace | `/products` | Operativo |
| Pricing Laboratory | `/pricing` | PL-001 a PL-015 completados |
| Forecast Workspace | `/forecast` | Cerrado (FW-001 a FW-010) |
| Inventory Workspace | `/inventory` | Cerrado (IW-001 a IW-006.1) |
| Purchasing Workspace | `/purchasing` | PVW-001 (foundation) completado; evolución consultiva sin definir |
| Actions Workspace | `/actions` | Operativo (acciones por PM de marca) |
| Data Center | `/data-center` (+ `data-quality/products`) | 11 importadores · IndexedDB v9 |
| Settings | `/settings` | Usuarios y roles |

Importadores del Data Center (`src/features/data-center/engine/importPluginRegistry.ts`): `sales`, `targets`, `inventory`, `purchase-orders`, `purchase-requests`, `pricing`, `product-master`, `customer-master`, `project-billings`, `projects`, `exchange-rates`.

Base IndexedDB: `pm-intelligence-workspace`, versión 9 (`DATA_CENTER_DATABASE_VERSION` en `src/features/data-center/persistence/dataCenterDatabase.ts`).

### Reglas de negocio ya definidas

Ciclo de vida de clientes (Executive Workspace):

- **Inactivo:** 90 a 179 días sin compra.
- **Perdido:** 180 días o más sin compra.
- **Nuevo:** primera compra histórica dentro de la ventana.
- **Recuperado:** compra actual con historial previo y sin actividad en la ventana comparable.

Selector global de periodo: Mes, Últimos 3 meses, Últimos 6 meses, Año actual, con comparación automática contra la ventana equivalente anterior.

### Purchasing (PVW)

- Es **visibility-only**: analítico y de lectura.
- Nunca crear, aprobar, cancelar ni modificar órdenes de compra.
- Nunca modificar inventario, costos ni precios.
- No inventar lead times, fechas, proveedores ni cantidades.
- No definir columnas ni contratos sin revisar los archivos operativos reales.

## 7. Nomenclatura de versiones y sprints

- Versión semántica en `package.json` (ej. `0.54.1`, `0.57.0`).
- Sprints por dominio con prefijo y número: `EW-001`, `SW-006`, `IW-006.1`, `FW-010`, `PL-015`, `PVW-001`.
- Correcciones sobre un sprint: sufijo `-HOTFIX1`, `-HOTFIX2`.
- Ramas: `feature/<nombre-del-dominio>-v<versión>` (ej. `feature/production-platform-foundation-v0.57.0`).
- Commits estilo Conventional Commits: `feat(...)`, `fix(...)`, `docs(...)`, etc.
- Cada sprint tiene su documento en `docs/` y se registra en `docs/ROADMAP.md` y `docs/CHANGELOG.md`.

## 8. Protocolo de trabajo

1. Trabajar **un paso a la vez**.
2. Antes de modificar, explicar qué archivos se van a crear o cambiar y por qué.
3. **No avanzar al siguiente paso sin confirmación del usuario.**
4. Después de cada cambio: build, lint y test. Reportar el resultado.
5. No inventar modelos, campos, datos, thresholds ni reglas. Si falta información, preguntar.
6. No eliminar código existente sin justificarlo.
7. Mantener compatibilidad con BusinessRepository y la arquitectura vigente.
8. Separar claramente: implementación → validación funcional → documentación → cierre Git.

## 9. Reglas de Git

- **Nunca usar `git add .`** — agregar archivos de forma explícita.
- Los Archivos Maestros (`docs/PM_Intelligence_Archivo_Maestro_*`) se quedan **fuera de Git** a propósito.
- Nunca commitear archivos de datos de negocio (`.xls`, `.xlsx`, `.csv` de ventas, clientes, compras) ni archivos con credenciales o contraseñas.
- Nunca leer ni abrir archivos de credenciales, `.env` ni archivos `.txt` con contraseñas.
- No hacer `commit`, `push`, merge ni cambio de versión sin validación funcional previa del usuario.
- Revisar `git status` antes de cualquier operación de Git.
- No reescribir historial (`rebase`, `reset --hard`, `push --force`) sin autorización explícita.
- No agregar la línea `Co-Authored-By` (ni otras líneas de atribución) en los mensajes de commit.

## 10. Al iniciar una sesión nueva

Sin modificar archivos, primero revisa y resume:

1. `package.json`: versión y scripts.
2. Rama actual, HEAD, upstream y `git status`.
3. `docs/ROADMAP.md` y `docs/CHANGELOG.md`: último sprint cerrado y siguiente pendiente.
4. `src/app/router.tsx`: workspaces y rutas activas.
5. Registro de importadores del Data Center y versión de IndexedDB.

Luego responde:

- A) Estado real encontrado.
- B) Diferencias contra este CLAUDE.md.
- C) Siguiente paso recomendado (uno solo).

## 11. Mantenimiento de este archivo

Actualizar este CLAUDE.md cuando ocurra:

- Un commit funcional validado que cierre un sprint.
- Un cambio de versión.
- Una decisión arquitectónica relevante.
- Nuevos importadores, entidades o workspaces.

Mantenerlo corto: lo detallado va en `docs/`.

## 12. Migraciones y despliegue

Claude Code **nunca** ejecuta migraciones ni comandos en producción; solo prepara el SQL y los comandos para que el usuario los corra.

### Servidor de producción

| Elemento | Valor |
|---|---|
| Repo | `/home/nexus/apps/pm-intelligence-workspace` (usuario `nexus`) |
| Backend | Servicio systemd `pm-intelligence-api.service` (no pm2). `WorkingDirectory`: `server/`. Escucha en `127.0.0.1:3001`. `Restart=on-failure` |
| Frontend | Nginx, sitio `pm-intelligence`, dominio `pm.botintelligence.cloud`. Sirve `/opt/pm-intelligence-workspace/dist`; `/api/` y `/signin/google` van a `127.0.0.1:3001` |
| Compresión | nginx comprime JSON, CSS y JS (gzip en el sitio `pm-intelligence`, 30 oct 2026). Respaldo de la configuración anterior en `~/respaldos/nginx-pm-intelligence-*.conf` |
| `/opt/pm-intelligence-workspace` | Clon viejo de `main`: **solo se usa su `dist/`** |
| n8n | Corre en el mismo servidor: respaldos, restauraciones y refresh de vistas se hacen **fuera de horario** |

```bash
sudo systemctl restart pm-intelligence-api               # reiniciar
systemctl status pm-intelligence-api --no-pager          # verificar
journalctl -u pm-intelligence-api -n 50 --no-pager       # logs
```

### Despliegue

| Paso | Backend | Frontend |
|---|---|---|
| 1 | `git pull` | `git pull` |
| 2 | `npm ci` en `server/` si cambió `server/package.json` | `npm ci` si cambió `package.json` |
| 3 | Respaldo con `pg_dump` + migración (ver abajo) | `npm run build` en el repo de producción |
| 4 | `sudo systemctl restart pm-intelligence-api` | Respaldo: `sudo cp -a /opt/pm-intelligence-workspace/dist /opt/pm-intelligence-workspace/dist.backup-<commit>` |
| 5 | Revisar `systemctl status` y `journalctl` | Publicar: `sudo rsync -a --delete dist/ /opt/pm-intelligence-workspace/dist/` |
| 6 | Validación funcional en la interfaz | `Ctrl+F5` y validación funcional en la interfaz |

Rollback de frontend: `sudo rsync -a --delete /opt/pm-intelligence-workspace/dist.backup-<commit>/ /opt/pm-intelligence-workspace/dist/`

**Nada en `public/` debe contener respaldos, notas ni datos:** Vite copia `public/` tal cual a `dist/` y todo se publica en la web.

### Migraciones

- Se aplican **manualmente** en producción: el usuario entra por SSH y corre `psql -f`.
- La aplicación y las migraciones usan el **mismo usuario de PostgreSQL** (`pm_intelligence`), que es dueño de los objetos que crean las migraciones. Los `GRANT` a ese usuario no restringen nada: las restricciones de escritura son de código.
- No hay tabla de control de migraciones; el número del archivo (`NNN_`) es la referencia.
- Cada migración nueva lleva su rollback en `server/migrations/rollback/` con el mismo número (`NNN_descripcion.rollback.sql`).
- Toda migración nueva debe probarse primero fuera de producción.
- Procedimiento obligatorio en producción:
  1. `git pull`
  2. Respaldo con `pg_dump` antes de cualquier migración.
  3. `psql -v ON_ERROR_STOP=1 -1 -f server/migrations/NNN_descripcion.sql`
  4. Verificar los objetos creados.
  5. Reiniciar el backend **después** de migrar (`sudo systemctl restart pm-intelligence-api`).
  6. Validación funcional en la interfaz.

> Algunas migraciones (017–023, 026 y 031 en adelante) traen su propio `BEGIN;` … `COMMIT;` alrededor de todo el archivo. Con `-1`, psql muestra dos `WARNING` (transacción ya iniciada / no hay transacción en curso). Son esperados: la migración sigue siendo atómica porque su propio bloque la cubre completa. Las que no lo traen dependen de `-1` para ser atómicas.

### Caché HTTP de `/api/data/*` (desde la migración 036)

- Los `GET /api/data/<dataset>` responden con `Cache-Control: private, no-cache` y un ETag débil calculado **antes** de consultar los datos, a partir de: imports completados del dataset en `data_imports`, alcance y marcas del usuario (solo ventas), versión de formato de respuesta (`DATASET_RESPONSE_FORMAT_VERSION` en `server/services/datasetCacheService.js`) y la versión manual de datos (`public.data_cache_version`). Si coincide con `If-None-Match`, el servidor responde 304 sin consultar las tablas.
- Si no puede leer ese estado (por ejemplo, falta la 036), responde como antes, con `no-store`.
- **Toda migración que modifique datos** (INSERT, UPDATE o DELETE sobre tablas de datos) debe subir la versión de datos al final, antes de su `COMMIT`:

  ```sql
  UPDATE public.data_cache_version
  SET version = version + 1, updated_at = NOW(), note = 'NNN_descripcion'
  WHERE id = 1;
  ```

- Subirla a mano después de cualquier cambio de datos que no pase por un import (corrección con `psql`, restauración parcial):

  ```bash
  psql -U pm_intelligence -h 127.0.0.1 -d pm_intelligence_db -v ON_ERROR_STOP=1 -c "UPDATE public.data_cache_version SET version = version + 1, updated_at = NOW(), note = 'motivo' WHERE id = 1;"
  ```

- Si cambia el formato JSON de alguna respuesta de `/api/data/*`, subir `DATASET_RESPONSE_FORMAT_VERSION` en el mismo commit.
