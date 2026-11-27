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
- Zustand 5
- HeroUI 3, Tailwind 4
- XLSX (SheetJS 0.20.3 desde `cdn.sheetjs.com`, fuera del registro de npm: `npm audit` no lo revisa; importación de archivos), idb (IndexedDB)
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

- `server/routes/`: API REST por dominio (sales, salesAnalytics, inventory, targets, products, customers, pricing, purchases, purchaseRequests, projects, projectBillings, exchangeRates, actions, search, metrics, myDay, brands, dataStatus, settingsUsers, settingsRoles). `dataStatus` (`GET /api/status/data-cutoff`) solo pide sesión y devuelve fechas: el corte de ventas y la última carga de ventas, inventario y compras.
- `server/services/`: importación por chunks con tablas staging, agregados de negocio (`refresh_business_aggregates`), analítica de ventas en SQL, búsqueda global y conciliación de facturación de proyectos.
- `server/middleware/`: `requireAuth`, `requireAdmin`, `requireBrandScope`, `requireWriteAccess` (usuarios, roles y asignación de marcas por PM).
- Roles (NAV-002B): `admin`, `manager`, `pm`, `engineering` y `assistant`. Los roles heredados `analyst` y `viewer` y el alcance `legacy` se retiraron (migración 041). El alcance `pricing` ya no lo usa ningún rol desde la 029 y sigue aceptado en `app_roles.scope` (pendiente de decidir).
- Marcas efectivas (NAV-002): `server/services/effectiveBrands.js` es la única regla. Cada usuario tiene sus asignaciones; el rol `assistant` ("Auxiliar") hereda además las de sus PMs vinculados en `app_user_pm_links` (solo PMs activos con rol `pm`). `loadAuthenticatedUser` (y con él `requireBrandScope`, `resolveCostScope` y `/api/auth/me`) y Acciones (`actionService.lockUser`) usan esa misma regla.
- `server/migrations/`: SQL numerado `NNN_descripcion.sql` (último en Git: `042`). Las migraciones nuevas van con el siguiente número; nunca editar una ya aplicada.

Navegación del frontend (NAV-001):

- "Mi día" es la página de inicio (`/`) y donde todos aterrizan después del login; el Panorama ejecutivo vive en `/executive` y su cola de atención en `/executive/attention/:domain`. `/my-day` y `/attention/:domain` redirigen a las rutas nuevas conservando los parámetros (`src/app/legacyRedirects.tsx`).
- `DataHydrationGate` (`src/app/router.tsx`) descarga los datasets de `/api/data/*` solo para las rutas que los necesitan; "Mi día", las redirecciones y la ficha de marca (directorio y pestañas Ventas, Clientes y Productos, MB-001) quedan fuera.
- El menú sale de `src/layouts/navigation/navigationConfig.ts` (secciones Inicio, Mi trabajo, Análisis temporal, Gerencia y Administración). Mostrar u ocultar una entrada no cambia permisos: los permisos siguen en `src/features/auth/workspaceAccess.ts`.
- Los títulos de pantalla de la barra superior y de la pestaña también salen de `navigationConfig.ts`. Menú, títulos, encabezados (h1 y eyebrow), breadcrumbs y botones "Volver" van en español (prueba `tests/architecture/navigationSpanish.test.ts`).

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
| Sales Workspace | `/sales` | Reemplazado por la ficha de marca (MB-001): `/sales` redirige a `/brands`; el código sigue en el repo hasta MB-001B |
| Brand Workspace | `/brands`, `/brands/:brandId/(ventas|clientes|productos|inteligencia)` | MB-001: directorio y pestañas Ventas, Clientes y Productos servidos por `/api/brands/*` fuera de `DataHydrationGate`; Inteligencia sigue calculándose en el navegador (dentro del gate) hasta MB-003; Pronóstico enlaza a `/forecast` (MB-002) |
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
| Entrada (20 nov 2026) | El tráfico entra por un túnel de Cloudflare (`cloudflared`) a nginx en `127.0.0.1:8080`; no hay exposición directa a internet |
| Configuración nginx (20 nov 2026) | `/etc/nginx/sites-enabled/pm-intelligence` es un enlace a `/etc/nginx/sites-available/pm-intelligence` (única fuente). Antes era una copia aparte |
| `X-Forwarded-Proto` (20 nov 2026) | `proxy_set_header X-Forwarded-Proto https` es **obligatorio** en `/api/` y `/signin/google`: sin él la cookie de sesión `secure` no se guarda y nadie puede iniciar sesión |
| IP real (20 nov 2026) | nginx usa `set_real_ip_from 127.0.0.1` y `real_ip_header CF-Connecting-IP` para que `req.ip` sea la IP real (límite de intentos de login) |
| Tamaño de cuerpo (20 nov 2026) | `client_max_body_size 10m` en nginx; Express limita a 100 KB fuera de las rutas de importación |
| Cabeceras de seguridad (20 nov 2026) | En nginx; la CSP está en `Content-Security-Policy-Report-Only` hasta revisar la consola |
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

- Se aplican **manualmente** en producción: el usuario entra por SSH y corre `bash server/scripts/apply-migration.sh server/migrations/NNN_descripcion.sql` (respaldo verificado con `pg_dump` + migración como `postgres`; no reinicia el backend).
- La aplicación usa el usuario de PostgreSQL `pm_intelligence`, pero **no es dueño de todos los objetos**: `app_users`, `app_roles` y `app_user_brand_assignments` son de `postgres`. Por eso las migraciones se aplican como `postgres` con el script. Las restricciones de escritura son de código.
- Lección (13 nov 2026): la 037 falló por "must be owner of table app_roles" y el `pg_dump` salió en 0 bytes; el backend se reinició con código nuevo y `/api/auth/me` respondió 500. Desde OPS-001 el script se detiene ante un respaldo de menos de 1 MB o un error de `psql`, y el backend no arranca si falta una migración.
- Toda migración que agregue una tabla o columna que el código lea se agrega a `REQUIRED_SCHEMA` en `server/db/schemaCheck.js`: al arrancar, el backend verifica esa lista y termina con código 1 (visible en `systemctl status` y `journalctl`) si falta algo.
- No hay tabla de control de migraciones; el número del archivo (`NNN_`) es la referencia.
- Cada migración nueva lleva su rollback en `server/migrations/rollback/` con el mismo número (`NNN_descripcion.rollback.sql`).
- Toda migración nueva debe probarse primero fuera de producción.
- Procedimiento obligatorio en producción:
  1. `git pull`
  2. `bash server/scripts/apply-migration.sh server/migrations/NNN_descripcion.sql`: respalda en `~/respaldos/pm_intelligence_db_pre_<NNN>_<fecha>.dump`, se detiene si el respaldo pesa menos de 1 MB, aplica con `sudo -u postgres psql -d pm_intelligence_db -v ON_ERROR_STOP=1 -1` y lista los requisitos de esquema que sigan faltando.
  3. Si el script falla, **no** reiniciar el backend.
  4. Verificar los objetos creados.
  5. Reiniciar el backend **después** de migrar (`sudo systemctl restart pm-intelligence-api`).
  6. Validación funcional en la interfaz.

> Algunas migraciones (017–023, 026 y 031 en adelante) traen su propio `BEGIN;` … `COMMIT;` alrededor de todo el archivo. Con `-1`, psql muestra dos `WARNING` (transacción ya iniciada / no hay transacción en curso). Son esperados: la migración sigue siendo atómica porque su propio bloque la cubre completa. Las que no lo traen dependen de `-1` para ser atómicas.

### Caché HTTP de `/api/data/*` (desde la migración 036)

- Los `GET /api/data/<dataset>` responden con `Cache-Control: private, no-cache` y un ETag débil calculado **antes** de consultar los datos, a partir de: imports completados del dataset en `data_imports`, alcance y marcas del usuario (ventas), alcance de costos del usuario (pricing, inventory, products y purchases; desde SEC-003A), versión de formato de respuesta (`DATASET_RESPONSE_FORMAT_VERSION` en `server/services/datasetCacheService.js`) y la versión manual de datos (`public.data_cache_version`). Si coincide con `If-None-Match`, el servidor responde 304 sin consultar las tablas.
- Si no puede leer ese estado, responde como antes, con `no-store`. Desde OPS-001 el backend no arranca sin la 036.
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
