# 0.57.0-MD-003-HOTFIX1

- Splits "PO's por llegar (14 días)" into "Por llegar (N)", soonest first, and "Atrasadas (N)", most recent first, each paged on its own. Adds the optional `status=upcoming|overdue` parameter to `GET /api/my-day/arrivals` (400 for other values); without it the response is unchanged apart from the new `status: 'all'` field, and `summary` keeps the counts of both statuses.
- Customers to recover show one "Venta del mes base" column when `basePeriods` is 1 (base revenue and monthly average were the same number) and both columns otherwise; the window reads "Compraron en agosto de 2026 y no compraron ni en septiembre ni en octubre de 2026".
- Formats every number of "Mi día" with es-MX only when the browser really has its separators, otherwise en-US (same separators), and composes the currency symbol itself, so a mobile browser without es-MX data no longer shows "$60.174.004". Adds a test that fails on any locale-less `toLocale*`, `localeCompare` or `Intl.*` call in `src/features/my-day`.
- The period selector reads "Noviembre de 2026" instead of the CSS-capitalized "Noviembre De 2026". No migrations; the backend must be restarted.

# 0.57.0-MD-003

- Adds the "Mi día" page at `/my-day` (menu entry above Executive, available to every role): data cutoff, "Mis marcas / Todas" for scope `all`, period selector (cutoff month and the 11 previous ones), four portfolio indicators, the executive brand table with links to the brand page, the 5 priority actions, customers to recover, low-stock and out-of-stock items with their next arrival, and purchase orders arriving in 14 days.
- Reads only `/api/my-day/*` and `/api/actions` through `authenticatedFetch`; it never downloads the `/api/data/*` datasets. Each block loads, fails and retries on its own; source dates, stale sources and incomplete inventory are shown in each block; hidden costs read "Sin acceso a costo", never $0.
- Moves the dataset download out of `main.tsx` into `DataHydrationGate`, which wraps every existing route: those workspaces render after the datasets load, as before, while `/my-day` and the login screen no longer download them.
- Pace colors (green ≥ 100 %, amber 90 to 99.9 %, red < 90 %) live in one constant. No backend changes or migrations.

# 0.57.0-MD-002-HOTFIX1

- Fixes the out-of-stock list of "Mi día": the raw NetSuite inventory export leaves zero cells empty even with "Show Zeros", so articles without any quantity produced no position and never reached the database (2,584 of 4,682 articles in the 26 Nov 2026 export, including 321 of the 649 `DE LINEA` items out of stock).
- Adds one record per article of the latest inventory import (`inventory_items`, migration 039), built in the frontend from the same normalized positions plus the articles without any quantity, uploaded in chunks to `POST /api/data/inventory/imports/:id/items`. No costs are stored.
- On finalize the server requires exactly `expectedItemCount` records and the same On Hand, On Order and position totals as the positions of the import (tolerance 0.0001); otherwise it answers 422 with the details, rolls the import back and keeps the previous one. Only the latest import's records are kept.
- `GET /api/my-day/stock-alerts` and `/stock-alerts/:kind` read out-of-stock and low-stock items from those records and return `inventoryCoverage`; an import loaded before this fix falls back to the positions with `complete: false` (`inventory-loaded-before-item-records`). Each row has `positions` (0 = no quantity in any branch).
- Positions, `/api/data/inventory`, its ETag, the Inventory Workspace and the V1 regression baselines are unchanged. Migration 039 includes rollback, grants for `pm_intelligence` and the startup schema requirement; it does not bump `data_cache_version`.

# 0.57.0-MD-002

- Adds `GET /api/my-day/stock-alerts` and `GET /api/my-day/stock-alerts/:kind` (`out-of-stock`, `low-stock`): `DE LINEA` items of the user's brands with zero total stock, and those with stock and 30 days of coverage or less over the last 3 months of sales, from the latest inventory import. Each row has the pending receipt from NetSuite "Cantidad Actual en Orden", the average monthly sales, the last sale date and the next purchase order arrival with its status (`scheduled`, `overdue`, `no-date`, `no-po-data`, `no-po`).
- Adds `GET /api/my-day/arrivals`: pending purchase orders expected within 14 days of the data cutoff, plus the overdue ones, with amounts by currency and no conversion; hidden costs are `null`, never 0.
- Returns the rules, the freshness of inventory, purchases and sales (stale after 7 days, same as DC-001) and data quality counts; missing catalog status is reported, never inferred.
- Adds the `view` parameter to every "Mi día" route: `mine` by default (unchanged MD-001 behavior), `all` only for scope `all` (403 otherwise, 400 for invalid values).
- Migration 038 adds `catalog_status` and `last_sale_date` to `inventory_snapshots` and `inventory_import_staging`; the inventory importer reads "Estatus" and "Fecha de ultima venta" from the raw NetSuite export. Includes rollback and the startup schema requirement; does not bump `data_cache_version`.
- Configures the "TS - Lista de PO con Item" NetSuite source (saved search 3582, Excel export) for purchase orders in the Data Center.

# 0.57.0-MD-001

- Adds `GET /api/my-day` for the "Mi día" home: for the user's brands and the data cutoff month (or `period`), revenue, quota, attainment, projected close and daily gap with Monday-to-Friday working days, variation against the previous month cut on the same working days, gross profit, margin, customers, products, share inside the user's brands, status, trend and attention, plus portfolio totals and the data cutoff.
- Adds `GET /api/my-day/lost-customers`: customers who bought a brand and have not bought it for 2 completed months, with the `/api/metrics/brands/:brand/lost-customers` rule, for all the user's brands.
- Takes the brands from the user's assignments only; scope `all` without assignments uses every brand with sales or target, and users without assignments get an empty answer (`no-brand-assignments`).
- Keeps status, trend and attention identical to the Executive brand table, with a parity test for thresholds, texts and working-day cutoffs; exports the two Executive thresholds for that test. Applies the SEC-004 API rate limit. No migrations; `/api/metrics/*` is unchanged.

# 0.57.0-R2

- Removes 60 production files in `src/` that `src/main.tsx` does not reach through static or dynamic imports (5,791 lines): Pulse and its engine, the unused atlas widgets, Brand Dashboard and its executive briefing, unused workspace and business components, `revenueComparison.ts`, `datasetHealthAdapter.ts`, `ExecutiveInsightPanel.tsx`, `salesPipeline.ts` and 10 re-export-only index files. Removes the 2 tests that only covered removed widgets. No behavior changes.
- Removes the backend routes the frontend does not call: `GET /api/data/status` and the non-chunked `POST /api/data/sales/import` and `POST /api/data/inventory/import`, with `salesImportService.js` and `inventoryImportService.js`. The refresh and timeout tests keep watching the chunked import services.
- Removes the one-off `scripts/integrate-business-routes.mjs` and the IW-006 context files, and moves the old root notes (`README_APLICACION.md`, `README_FIX.md`, `CHANGELOG_0.24.2.md`, `PRODUCT_MASTER_CONSOLIDATION_v0.24.5.md`) to `docs/archive/`.

# 0.57.0-PUR-001

- Keeps Purchasing amounts by currency and never converts or adds them across currencies (audit finding R9): totals, supplier, buyer, brand and item groups, statuses and aging carry `amountsByCurrency` (amount, lines without amount, orders, lines, quantity and overdue orders per currency code). `orderedAmountForeignCurrency`, which added every currency together, is removed.
- Normalizes currency codes (upper case, no spaces); orders without currency go to the "Sin moneda" group and are counted.
- Adds `selectPurchasingCurrencyView`: rankings, aging and statuses of one currency, ordered by the amount in that currency, leaving other currencies out.
- Purchasing Workspace: the "Monto ordenado" KPI lists every currency ("USD $1,234,567 · MXN $890,123"), a currency selector (USD by default) drives rankings and aging and shows how many orders are in other currencies, an amber notice counts orders without currency, and each purchase order shows its own currency instead of a fixed USD.
- Adds tests for mixed USD and MXN data, per-currency rankings, orders without currency, hidden costs and a no-regression baseline generated with the previous code for USD-only data. Removes the 17 `orderedAmountForeignCurrency` keys from the SEC-003C baseline; their values stay in the test, which checks that the split by currency conserves them.

# 0.57.0-DC-002

- Imports the raw NetSuite "TS - Reporte de inventario por sucursal" export as is: the parser detects its preamble (header row with "Item" and "Marca") and combines the two-row header as "<BRANCH> <METRIC>", using the merged branch cells (or the last non-empty branch). Sales detection and header-on-row-1 files are unchanged (no-regression test against a baseline generated with the previous code).
- Ignores NetSuite grouping rows such as "Inventory Item" as ignored rows, not errors.
- Maps NetSuite branches to short location names in one table (`inventoryLocationAliases.ts`), matching without case, accents, punctuation or repeated spaces; a branch without alias keeps its NetSuite name and the import panel shows "Sucursal sin alias: …" as a warning.
- Updates the inventory help line of the NetSuite sources panel: the raw export can be dropped as is.
- Adds tests with a synthetic NetSuite-shaped workbook and a local check against the real export in `tmp/` (skipped when the file is missing): 4,677 articles, 10 short branches and per-article "En Mano" equal to "Total En Mano".

# 0.57.0-DC-001

- Adds the "Fuentes de NetSuite" section at the top of the Data Center: one row per importer with the NetSuite report, an "Abrir en NetSuite" link, the last completed import, the data cutoff (latest sale date and inventory snapshot date) and a status ("Al día", "Atrasado", "Sin datos" or "Fuente sin configurar") shown with color and text.
- Configures the NetSuite sources in one place (`src/features/data-center/config/netsuiteSources.ts`) for sales, inventory, projects and project billings, each stale after 7 days; the other importers show "Fuente sin configurar".
- Computes the status with local calendar dates (browser time zone, no hours), with tests for the Mexico City evening case, stale and empty sources and unconfigured importers. Frontend only; no permission changes.

# 0.57.0-SEC-004

- Regenerates the session on `/signin/google` before saving the user, to prevent session fixation (audit finding S5).
- Verifies the Google CSRF token on `/signin/google`: the `g_csrf_token` form field and cookie must exist and match, or the login redirects to `/?auth_error=csrf` without verifying the credential. Cookies are read with a minimal parser, without cookie-parser.
- Removes the unused `POST /api/auth/google` (the login uses the Google redirect flow).
- Adds `express-rate-limit` (audit finding S6): 20 sign-in attempts per 15 minutes per IP (then `/?auth_error=rate_limited`), and 120 requests per minute per user on `/api/search` and `/api/data/sales/analytics/*` (then 429 JSON).
- Limits request bodies to 100 kb JSON and 20 kb forms; import routes (chunks, `/import`, `targets/import` and `POST /api/data/exchange-rates`) accept 10 MB only after authentication and the import permission. Oversized bodies answer 413 JSON.
- Sets `statement_timeout` (2 min) and `idle_in_transaction_session_timeout` (1 min) on the PostgreSQL pool, and 15 min with `SET LOCAL` in the import transactions that refresh aggregates (audit finding S8, timeouts).
- Shows the `csrf` and `rate_limited` login errors on the login page. No migrations.

# 0.57.0-OPS-001

- Checks the database schema before the backend listens (`server/db/schemaCheck.js`): every table and column in `REQUIRED_SCHEMA` (today `data_cache_version` from migration `036` and `app_roles.cost_access` from `037`) must exist. A missing one logs "Falta la migración NNN: …" and exits with code 1 without retrying, so `systemctl status` shows the failure instead of every request answering 500.
- Retries every 5 seconds, up to 24 times, while PostgreSQL is not reachable, so the backend does not fail when it starts before PostgreSQL after a server reboot.
- Adds `server/scripts/apply-migration.sh`: verified `pg_dump` backup as `postgres` (stops below 1 MB), applies the migration as `postgres` in one transaction, stops on any `psql` error, lists the schema requirements still missing and does not restart the service.
- Documents in CLAUDE.md that `app_users`, `app_roles` and `app_user_brand_assignments` belong to `postgres`, the migration script and the 13 Nov 2026 incident (migration `037` not applied, empty backup, `/api/auth/me` answering 500).

# 0.57.0-SEC-003C

- Keeps hidden or missing costs as NULL from the builders to the screens: inventory position and snapshot values, purchase order amounts, inventory analytics, inventory risks and opportunities, the inventory catalog summary, purchasing analytics, forecast inventory intelligence, the Forecast Workspace summary and the Data Center inventory summary.
- Totals add only the present values, count the missing ones and are NULL only when every value is missing; with complete data every result is unchanged (no-regression test against a baseline generated with the previous code).
- Computes inventory value concentration and its score weight only over positions with value; positions without value add +0, and the concentration risk is skipped when no value is present.
- Shows "Sin acceso a costo" for costs outside the user's scope, "Sin dato" for missing costs of visible brands and "Valor de tus marcas" / "Monto de tus marcas" for mixed-brand totals of assigned users in Inventory, Forecast, Purchasing and the Data Center; a NULL cost is never shown as $0.
- Adds the cost scope note to the Inventory and Forecast Excel exports and leaves hidden values empty.
- Reloads the page when an administrator removes their own administrator role or disables their own account in Settings.

# 0.57.0-SEC-003B

- Rejects (400) any change of scope, write access or status on system roles (admin and analyst) in `PATCH /api/settings/roles/:roleKey`, matching what the Settings UI already blocks.
- Makes `PATCH /api/settings/users/:id` transactional like the DELETE: locks the acting user, the target user and every active administrator with `FOR UPDATE` in id order, rechecks that the acting user is still an active administrator (403), and returns 409 "Debe quedar al menos un administrador activo" when the change would demote or deactivate the last active administrator. Administrators can demote themselves while another one remains.
- Adds the "Ver costos" column to Settings > Roles, sending `costAccess`; admin controls stay disabled with the note "El rol Administrador siempre conserva acceso total".
- Asks "Vas a quitarte permisos de administrador. ¿Continuar?" before an administrator changes their own role or disables their own account.
- Adds `costAccess` to `AuthenticatedUser` and `resolveCostVisibility` / `normalizeBrandKey` to the frontend brand access helpers, with a parity test against the server normalizer (including the STREAMAX alias).
- Adds automated coverage for system role protection, active administrator protection and frontend cost visibility. No migrations.

# 0.57.0-SEC-003A

- Adds `app_roles.cost_access` (migration `037`, with rollback): admin, manager and pm see costs; engineering does not (audit finding S1).
- Exposes `req.authUser.costAccess` and adds `resolveCostScope` (`none`, `all` or `assigned` brands) plus a shared SQL cost visibility condition based on `brand_key()`.
- Hides costs outside the user's cost scope in `GET /api/data/*`: pricing rows (an empty dataset with the same shape when there is no cost access), inventory `unit_cost` and `inventory_value`, product `average_cost_usd`, `total_value`, `inventory_value_mxn` and `inventory_value_usd`, and purchase order `amount_foreign_currency`. Other columns and rows do not change.
- Customers, projects and project billings stay complete for every role (business decision).
- Adds the cost scope to the ETag of pricing, inventory, products and purchases, and bumps `DATASET_RESPONSE_FORMAT_VERSION` to 2.
- Settings roles API returns `cost_access` and accepts `costAccess` in PATCH; the admin role cannot lose cost access. The Settings UI ships in SEC-003B.
- Adds automated coverage for the cost scope, the cost-scoped datasets and ETags, the inventory route, the roles API and empty pricing hydration, plus read-only verification queries in `server/scripts/sec003aVerification.sql`.
- Deploy: apply migration `037` before restarting the backend.

# 0.57.0-SEC-002

- Removes unused `axios` and `@tanstack/react-query` dependencies (audit finding S4); this also drops the vulnerable `follow-redirects`.
- Replaces `xlsx` 0.18.5 (npm, no fix available) with the official SheetJS 0.20.3 tarball from `cdn.sheetjs.com`.
- Applies `npm audit fix` in the root (vite 8.3.8, react-router 7.18.5, vitest 4.1.12, postcss 8.5.32, nanoid 3.3.20, source-map-js 1.2.2) and in `server/` (proxy-addr 2.0.8, body-parser 2.4.0, qs 6.17.1).
- `npm audit --omit=dev` reports 0 vulnerabilities in the root and in `server/`.
- Loads `importService` on demand in the Data Center store (`executeImport` is now async) so `xlsx` (492 kB) stays out of the initial bundle; startup JS drops to 482 kB.
- No migrations; deploy requires `npm ci` in the root and in `server/`. Confirms production build, lint and 768 automated tests without errors.

# 0.57.0-SEC-001

- Restricts Data Center imports (`POST /api/data/*/import`, `/api/data/*/imports/*`, `/api/data/targets/import`) and `POST /api/data/exchange-rates` to team-wide users (`scope = 'all'`) with write access through the new `requireDataImportAccess` middleware (audit finding S2). PMs keep creating and editing actions.
- Lets read-only roles use Sales segmentation: `POST /api/data/sales/analytics/*` (summary, group-by, filter-options, detail-rows) no longer requires write access (audit finding S3). The Sales router still applies authentication, user loading and brand scope validation.
- Adds `isReadOnlyDataPost` to identify read-only POST routes under `/api/data`.
- Adds automated coverage for `requireDataImportAccess` and `isReadOnlyDataPost`.
- Backend only; no migrations. Confirms production build, lint and 768 automated tests without errors.

# 0.57.0-SQL-002

- Adds a SQL analytics diagnostics script and service to migrate Sales Workspace segmentation from the in-memory Business Data Model to PostgreSQL.
- Adds server-side Sales segmentation summary, group-by, filters, faceted filter options and detail rows.
- Exposes the segmentation through Sales Analytics API routes for summary, group-by, filter options and detail rows.
- Adds a Sales Workspace overlay that loads filter options and detail rows from the SQL analytics API for the selected period and filters.
- Persists historical fallback product owners in the materialized view `sales_fallback_owner_candidates` (migration `035`), with its rollback script in `server/migrations/rollback/`.
- Refreshes the fallback owner cache before COMMIT in full and chunked sales imports and in product chunk imports.
- Makes the period filter safe to apply before product reconciliation: fallback owners now come from the persisted historical cache instead of the selected period.
- Preserves assigned brand scope in persisted owner selection through `scope_brand_key`.
- Validates migration `035` on the test database with 546,520 sales: 960 of 960 fallback owners match the previous calculation and the cache refresh takes about 5.3 seconds.
- Adds automated coverage for segmentation summary, group-by, filters, filter options, detail rows, the Sales Analytics routes and the persisted fallback owner cache.
- Confirms production build, lint and 731 automated tests without errors; deployed to production on October 30, 2026.

# 0.57.0-BRAND

- Adds commercial comparison and commercial plans to Brand Intelligence through the brand decision engine.
- Canonicalizes the historical STREAMAX identity so `MERIVA TECHNOLOGY - STREAMAX` resolves to `STREAMAX - MERIVA` in the business model, brand scope and business aggregates (migration `033`).
- Preserves the canonical STREAMAX label in business aggregates.
- Consolidates Brand Intelligence content inside Brand Workspace and restores the brand intelligence drilldown.
- Adds year-over-year, year-to-date and annual projection comparison to Brand Intelligence.
- Adds automated coverage for commercial comparison, commercial plans, the brand decision engine and server-side brand scope.

# 0.57.0-ACTIONS

- Adds server-side business aggregates by brand and period and by brand, customer and period as materialized views refreshed through `refresh_business_aggregates` (migration `031`).
- Adds PM actions with events, owners, status, due dates and comments (migration `032`), protected by brand scope and write-access middleware.
- Exposes action routes for actions, comments and the scorecard, and metric routes for brands, brand comparison and lost customers.
- Uses the canonical product name when counting active products in business metrics.
- Adds the Actions Workspace and connects Sales commercial opportunities to the action center.
- Assigns rule-generated actions to the PM assigned to the brand.
- Preserves business aggregate ownership so the application role can refresh them (migration `034`).
- Adds automated coverage for action creation, updates, comments, scorecard, brand scope, write access and workspace access.

# 0.57.0-SETTINGS

- Adds a platform administration workspace for users and roles, with role catalog and users-and-roles tables (migrations `027` and `028`).
- Adds brand assignments per user and removes the pricing role, moving its users to `pm` (migrations `029` and `030`).
- Allows administrators to edit user names and delete users.
- Exposes role scope and brand assignments to the frontend and shows the authenticated user in the sidebar.
- Resolves live authorization from PostgreSQL.
- Scopes Brand Workspace to assigned brands and blocks direct access to unassigned brands.
- Enforces workspace visibility and route guards by role.
- Enforces the authenticated brand scope in the sales route, normalizes assigned brand IDs and preserves cumulative sales history when brand access filtering applies.
- Adds automated coverage for brand access, Brand Intelligence access, workspace access, the sales route and user deletion.

# 0.57.0-SEARCH

- Enables global search from the top bar.
- Moves global search to a server-side SQL service over brands, customers and products.
- Is deployed to production as part of branch v0.57.0; no dedicated automated tests were added.

# 0.57.0-FORECAST

- Moves project billing reconciliation to the server and shows it in Data Center through a dedicated repository.
- Hydrates the project billing summary from PostgreSQL.
- Lazy-loads project billings for the legacy Forecast path and narrows the workspace store subscription.
- Keeps unresolved inventory as a Forecast quality warning.
- Ignores historical warnings when computing project status in the project-aware Forecast engine.
- Adds a top 10 project view, a collapsible quality search and collapsible methodology and source limitation panels to Forecast Workspace.
- Updates automated coverage for Forecast inventory intelligence and the project-aware Forecast engine.

# 0.57.0-UI

- Enables workspace navigation on mobile.
- Adds the Tecno top navigation with the blue and orange theme and aligns executive cards with the light blue Tecno theme.
- Moves workspace navigation to the sidebar.
- Changes layout and styling only; no business formulas or data contracts are modified.

# 0.57.0-AUTH

- Adds production Google sign-in: the server verifies the Google ID token and only allows verified emails that belong to an active user, rejecting a Google account that does not match the stored identity.
- Stores sessions in PostgreSQL with secure, `sameSite=lax` cookies that expire after eight hours.
- Adds reusable session middleware that returns 401 for unauthenticated API requests.
- Adds a logout control and shows the authenticated user initials in the top bar.
- Invalidates expired sessions in the frontend when the API answers 401.
- Hides the Express `x-powered-by` signature and reduces the health endpoint to a database check with a minimal response.
- Is deployed to production as part of branch v0.57.0; no dedicated automated tests were added.

# 0.57.0-DATA-PLATFORM

- Adds a Node and Express backend in `server/` backed by PostgreSQL, with numbered SQL migrations `001` to `026` for datasets, import audit, staging tables and logical identities.
- Centralizes the PostgreSQL connection pool and adds a protected data status endpoint.
- Adds an import audit service that tracks each dataset import through its lifecycle, including cancellations.
- Adds incremental and chunked sales imports with staging tables and raises the JSON payload limit for chunk uploads.
- Supports partial sales imports in append mode, deduplicating rows, replacing matching rows and tracking inserted rows.
- Allows cancelling a sales chunk import, including automatic cancellation with a beacon when the user leaves the page.
- Hydrates the sales store from PostgreSQL through a remote read service that loads the latest completed import and rehydrates consolidated sales after partial imports.
- Persists inventory, sales targets, Product Master, purchase orders, purchase requests, projects, project billings, exchange rates, pricing and customers in PostgreSQL, with chunked inventory imports and a replace-orders mode for purchase orders.
- Labels each migrated dataset as PostgreSQL storage in Data Center and aligns import status with the persistence lifecycle.
- Formats dataset periods without timezone shifts and supports decimal elapsed days in purchase requests.
- Supports the native NetSuite sales export in the spreadsheet parser and sales normalizer.
- Removes the redundant business calendar dataset from dataset definitions and Executive readiness.
- Adds automated coverage for customer master import, the native NetSuite sales export, the spreadsheet parser and the server-side sales read service.

# 0.57.0-FIXES

- Resolves the buying customer from the grouped customer name during sales normalization.
- Compares open periods at an equivalent cutoff in Executive Workspace.
- Shows active customers in the Sales summary and KPI card.
- Removes a stale PulsePage backup from the published `public/` assets.
- Adds repository guidance in `CLAUDE.md` and ignores operational data, Master Files, patches and credential files in Git.
- Adds and updates automated coverage for sales customer identity and the Executive analysis period, navigation and attention queues.

# 0.56.0-PVW-002

- Adds Purchasing analytics with totals, purchase request to purchase order linkage and request-to-order cycle, exposed through `PurchasingAnalyticsQueries`.
- Adds Purchasing Workspace with manual Data Center routing and connects Data Center purchasing datasets to the workspace repository.
- Adds purchasing inventory intelligence with purchase order status and integrates it into the workspace with supply action detail.
- Adds forecast overbuy intelligence and surfaces it in Purchasing Workspace.
- Adds automated coverage for purchasing analytics, inventory intelligence, forecast overbuy intelligence and their repository queries.

# 0.56.0-FIXES

- Aligns Purchasing readiness in Executive Workspace and enables `.tsx` tests in Vitest.
- Separates the Sales forecast from the run-rate projection in the workspace, executive summary and export.
- Compares open Sales periods at an equivalent working-day cutoff.
- Aligns equivalent-period analytics in Brand Intelligence and the Brand Workspace UI.
- Adds automated coverage for Brand Intelligence and updates Sales executive summary, Sales export and Forecast pipeline tests.

# 0.55.0-PVW-001

- Adds normalized import contracts for purchase orders and purchase requests, with schemas, column aliases, normalizers, validators and Data Center plugins.
- Persists purchasing datasets in Data Center and upgrades IndexedDB to version 9.
- Adds Purchasing entities, builders, indexes, queries and quality reports to the Business Core.
- Uses `purchaseOrderNumber` from `Document Number` and `purchaseRequestNumber` from `ID` as canonical business identities, keeping `Internal ID` only for technical traceability.
- Does not add the visual Purchasing Workspace, consultative analytics or decision engines.
- Adds automated coverage for the purchase order and purchase request import plugins.

# 0.54.1-EW-001-HOTFIX1

- Converts Executive Workspace from a passive dashboard into an operational navigation layer with direct access to Sales, Inventory, Forecast, Pricing, Purchasing preparation and Data Center.
- Replaces the former Trends placeholders with real monthly sales evolution and a real Top 10 customer ranking derived from Business Repository data.
- Consolidates duplicated data-health content into a compact executive summary while keeping dataset-level administration inside Data Center.
- Reorders the executive page so the analysis period and commercial priorities appear before technical readiness and platform health.
- Adds a global analysis-period selector for one month, trailing three months, trailing six months and current year, with previous/next navigation over available periods.
- Applies the selected period consistently to commercial performance, products, brands, customers, trends and Brand Intelligence.
- Separates the attention KPI from the analyzed universe so totals no longer masquerade as commercial priorities.
- Adds product attention analysis with growing, declining, recovered, new and inactive-or-lost classifications.
- Corrects customer lifecycle semantics using historical first purchase, prior activity and explicit inactivity thresholds of 90 days and loss thresholds of 180 days.
- Prevents a customer from being marked lost merely because they did not purchase in the immediately following month.
- Publishes the exact entity IDs behind every attention KPI and preserves those IDs as read-only output contracts.
- Adds contextual attention queues for products, brands and customers, carrying the selected period and comparison through the URL.
- Ensures each attention card opens the exact filtered records represented by its KPI instead of the complete directory.
- Adds search, pagination, attention reasons, return navigation and record-level drill-down inside the contextual queues.
- Preserves read-only behavior: the hotfix does not modify Business Repository facts, persist classifications or automate commercial actions.
- Confirms production build, lint and directed tests without errors after the read-only entity ID construction fix.

# 0.54.0-EW-001

- Establishes `executive-workspace-v1` as an independent Executive Workspace contract instead of an alias of `WorkspaceContextModel`.
- Adds deterministic readiness for Sales, Inventory, Forecast, Pricing and Purchasing with `ready`, `partial`, `not_available` and `blocked` states.
- Publishes required, active and missing datasets, last update, freshness and explainable issues for every executive domain.
- Applies explicit freshness windows of 10 days for weekly sources, 40 days for monthly sources and 400 days for annual sources.
- Adds domain-level executive health: ready domains, total domains, coverage percentage and Purchasing readiness.
- Requires normalized purchase orders, purchase requests, Inventory, Product Master and a ready Forecast before Purchasing can be activated.
- Replaces the Executive hook delegation to `useWorkspaceContext()` with its own builder over Data Center state while preserving existing executive fields.
- Adds the multidomain readiness panel with coverage, source status, freshness and explicit Purchasing limitations.
- Preserves read-only behavior: no Purchasing entities, recommendations, dates, persistence or cross-domain writes are introduced.
- Adds eight automated tests covering readiness, errors, stale data, Purchasing activation, builder integration and visual construction.

# 0.53.0-PL-015

- Adds `price-corridor-margin-floor-v1` for explicit price-floor, maximum-discount and safety-corridor analysis.
- Supports reference purchase cost or explicit landed cost as the analytical cost basis.
- Keeps candidate list prices fixed from the reference cost and evaluates cost and exchange-rate stress without repricing automatically.
- Supports simultaneous minimum Gross Margin and minimum unit GP floors; the governing floor is the greater calculated net price.
- Calculates product-level price floor, maximum supported discount, corridor width, safety distance, required list factor, GP and Gross Margin.
- Builds the deterministic `Scenario × Common List Factor × Commercial Tier × Product` matrix with volume-weighted coverage and limiting-product detection.
- Classifies every product as above floor, exactly at floor or below floor without hidden commercial buffers.
- Adds an interactive corridor builder inside the PL-009 batch workflow with explicit quantities, cost basis, scenarios, tiers, floors and factors.
- Adds a six-sheet Excel export and dedicated print/PDF document, both labeled `SIMULACIÓN SIN EFECTO COMERCIAL`.
- Preserves strict isolation: no live exchange rate is fetched and no floor, discount, factor, cost or price is approved, persisted or published.
- Adds automated coverage for governing floors, maximum discounts, FX stress, required factors, validation, immutability, draft conversion, export and visual construction.

# 0.52.0-PL-014

- Adds `price-landed-cost-waterfall-v1` for explicit landed-cost construction before catalog publication.
- Applies purchase cost, FX, freight, insurance, tariff, customs, handling, domestic logistics, financing, rebates and other caller-defined components in deterministic order.
- Supports percentages over purchase cost or accumulated subtotal, fixed amounts per unit, and fixed totals allocated by quantity or purchase-cost value.
- Keeps candidate list prices fixed against an explicit reference purchase-cost or reference landed-cost basis while stress scenarios vary purchase cost, FX and component magnitude.
- Builds the deterministic `Scenario × Common List Factor × Commercial Tier × Product` matrix with landed cost, selling value, GP, Gross Margin, objective coverage and mathematical factor requirement.
- Publishes a product-level waterfall and component-level cost, GP and margin impact without creating accounting entries.
- Identifies the critical scenario, limiting tier and limiting product without ranking or recommending a commercial decision.
- Adds an interactive landed-cost builder inside the PL-009 batch workflow with explicit quantities, component scope, scenarios, tiers and factors.
- Adds a six-sheet Excel export and dedicated print/PDF document, both labeled `SIMULACIÓN SIN EFECTO COMERCIAL`.
- Preserves strict isolation: no live exchange rate is fetched and no cost, landed cost, component, factor or price is persisted or published.
- Adds automated coverage for sequential waterfalls, allocations, scoped components, stress behavior, validation, immutability, draft conversion, export and visual construction.

# 0.51.1-PL-013-HOTFIX1

- Corrects the PL-013 automated test expectation for `convertedBaseCost`.
- Confirms that the converted base cost uses the explicit reference exchange rate: `base cost × reference FX`.
- Preserves stressed cost calculation as `base cost × (1 + cost change) × scenario FX`.
- Does not modify `price-cost-fx-stress-v1`, formulas, contracts, UI, exports or architectural isolation.

# 0.51.0-PL-013

- Adds `price-cost-fx-stress-v1` for explicit cost and exchange-rate stress testing before catalog publication.
- Fixes candidate list prices against the base cost and an explicit reference exchange rate, then measures margin and GP erosion under each stress scenario.
- Builds the deterministic `Scenario × Common List Factor × Commercial Tier × Product` matrix.
- Supports multiple explicit cost-change rates, exchange rates, factors, commercial discounts and minimum margin or GP objectives.
- Calculates weighted cost impact, selling value, GP, consolidated Gross Margin, volume coverage and the mathematical factor required under every scenario.
- Identifies the critical scenario, tier and product without ranking or recommending a commercial decision.
- Adds an interactive stress-test builder inside the PL-009 batch workflow with explicit quantities, currencies, reference FX and scenario FX values.
- Adds a six-sheet Excel export and dedicated print/PDF document, both labeled `SIMULACIÓN SIN EFECTO COMERCIAL`.
- Preserves strict isolation: no live exchange rate is fetched and no cost, currency, factor or price is persisted or published.
- Adds automated coverage for fixed-list stress behavior, FX conversion, cost variation, weighted totals, feasibility, validation, immutability, draft conversion, export and visual construction.

# 0.50.0-PL-012

- Adds `price-portfolio-mix-v1` for explicit volume-weighted Pricing Laboratory simulations before catalog creation.
- Builds the deterministic `Mix × Common List Factor × Discount × Product` matrix by reusing `price-design-v1`.
- Supports multiple caller-defined mixes with explicit quantities per product; labels such as conservative, target or aggressive contain no numeric policy.
- Calculates weighted cost, list value, selling value, GP, consolidated Gross Margin, weighted net factor and average selling price.
- Publishes volume-based objective coverage, which weights compliance by assumed units instead of product count.
- Identifies the products with the largest sales and GP contribution in every mix-factor-discount cell without ranking a winning scenario.
- Adds mix-level and factor-level summaries across all captured assumptions.
- Adds an interactive portfolio-mix builder inside the PL-009 batch workflow.
- Adds a six-sheet Excel export and dedicated print/PDF document, both labeled `SIMULACIÓN SIN EFECTO COMERCIAL`.
- Preserves strict isolation: quantities do not create Forecast, budget, demand, inventory, commitments, products, costs or prices.
- Adds automated coverage for weighting, concentration, volume coverage, validation, immutability, draft conversion, export and visual construction.

# 0.49.0-PL-011

- Adds `price-tier-ladder-v1` for commercial ladders where every tier has its own explicit discount and minimum objective.
- Supports tier objectives for minimum Gross Margin or minimum unit GP without embedding Silver, Gold, Platinum or other numeric policies.
- Calculates the mathematical list factor required by every product at every tier and identifies the limiting product for each level.
- Publishes the global minimum factor as the greatest tier minimum and identifies the limiting commercial tier and product.
- Evaluates optional candidate common factors against the entire `Factor × Tier × Product` matrix while preserving input order.
- Classifies each factor-tier cell as fully feasible, partially feasible, not feasible or invalid and exposes coverage, GP, margin and exceptions.
- Adds an interactive discount-ladder builder inside the PL-009 batch workflow with dynamic tiers, explicit objectives and opt-in factor references.
- Adds a six-sheet Excel export and dedicated print/PDF document, both labeled `SIMULACIÓN SIN EFECTO COMERCIAL`.
- Preserves simulation isolation: no tier, factor, product, cost or price is persisted, approved, recommended or published.
- Adds automated coverage for mixed margin/GP tiers, limiting levels, feasibility, validation, draft parsing, export and visual rendering.

# 0.48.0-PL-010

- Adds `price-batch-sensitivity-v1` to evaluate multiple explicit common list factors against every product and discount from a PL-009 batch.
- Builds the deterministic `Factor × Discount × Product` calculation matrix by reusing `price-design-v1`.
- Publishes the mathematical minimum factor per discount and the global minimum across discounts without treating either value as a recommendation or approval.
- Classifies each Factor × Discount cell as fully feasible, partially feasible, not feasible or invalid and exposes coverage, exceptions and factor gap.
- Adds aggregate selling price, GP, Gross Margin and minimum/maximum product margin for every sensitivity cell, assuming one unit per product.
- Adds factor-level summaries for fully feasible discounts, partial coverage, non-feasible discounts and total product exceptions.
- Extends the PL-009 interface with an explicit factor input, an opt-in action to add the current batch factor, matrix tables and explainability.
- Adds a six-sheet Excel export and a dedicated print/PDF document, both labeled `SIMULACIÓN SIN EFECTO COMERCIAL`.
- Preserves simulation isolation: no factor, product, cost or price is persisted, approved, recommended or published.
- Adds automated coverage for calculations, minimum thresholds, feasibility, validation, draft parsing, export and visual rendering.

# 0.47.0-PL-009

- Adds `price-batch-design-v1` for multi-product price design before catalog creation.
- Builds the Cartesian matrix of products and explicit discounts while reusing `price-design-v1` for every calculation.
- Calculates the individual list factor required by each product and discount, then compares it with one common list factor for the brand.
- Supports three explicit common-factor strategies: protect all with the maximum required factor, average required factors, or evaluate a caller-supplied factor.
- Publishes aggregate cost, list price, net selling price, GP and Gross Margin by discount, assuming one unit of each product and no volume projection.
- Identifies every row that falls below the explicit objective without ranking, recommending or approving a commercial parameter.
- Adds manual product rows and tabular paste from Excel for model, SKU, cost and notes.
- Adds a five-sheet Excel export and a dedicated print/PDF document, both labeled `SIMULACIÓN SIN EFECTO COMERCIAL`.
- Preserves full simulation isolation: the batch does not create products or brands, persist designs, write Repository data or affect other Workspaces.
- Adds automated coverage for matrix calculation, factor strategies, compliance, aggregation, validation, paste parsing, export, print and visual rendering.

# 0.46.0-PL-008

- Reopens Pricing Laboratory to correct the catalog-only source limitation identified after PL-007.
- Adds `price-design-v1` for products and brands that do not yet exist in Product Master or Business Repository.
- Calculates price list, net selling price, list factor, net factor, unit GP and Gross Margin from an explicit cost and discount.
- Supports six explicit design objectives: target margin, target GP, target net selling price, list factor, net factor and known list price.
- Distinguishes `Factor de lista = Precio de lista / Costo` from `Factor neto = Precio de venta / Costo` to prevent ambiguous commercial interpretation.
- Adds a new `/pricing` source mode: `Nuevo producto / marca`, independent from catalog price availability.
- Adds an in-memory matrix to compare 32%, 34% or any other user-supplied discount as separate designs.
- Produces a transient `BusinessPrice` only as an isolated calculation artifact; it is not inserted into Product Master, Business Repository, Data Center or IndexedDB.
- Embeds no default discount, margin, GP, factor or list price. All numeric assumptions remain explicit.
- Adds automated coverage for every inverse calculation route, validation, isolation, negative-GP warnings, visual rendering and draft conversion.

# 0.45.0-PL-007

- Adds `pricing-executive-comparison-v1` to build an explicit documentary selection of calculable Pricing Laboratory scenarios.
- Keeps the current price as the immutable baseline and preserves Workspace order without ranking or recommending a winner.
- Adds a Report selector to each calculable temporary or stored scenario; invalid and non-calculable rows cannot enter the executive output.
- Adds an on-screen executive matrix with current price, selected scenarios, deltas, discount, GP, margin, guardrails and signals.
- Adds an Excel workbook with five sheets: Executive Summary, Comparison, Guardrails and Signals, Assumptions and Traceability, and Metadata.
- Adds print/PDF behavior focused on the executive comparison and hides the interactive builder and scenario controls from the printed document.
- Includes an obligatory `SIMULACIÓN SIN EFECTO COMERCIAL` disclaimer in the screen, workbook and print view.
- Preserves the `simulation-only` isolation contract: exporting or printing does not mutate, approve, persist or publish prices.
- Adds automated coverage for selection, ordering, blocked scenarios, invalid selections, immutability, workbook contents and executive rendering.
- Closes Pricing Laboratory functionally from PL-001 through PL-007 without adding Price DNA or automatic recommendations.

# 0.44.0-PL-006

- Replaces the `/pricing` placeholder with the lazy-loaded Pricing Laboratory interface.
- Adds product search, explicit product selection and isolated currency selection without FX conversion.
- Adds an in-memory scenario builder for Promotion, Silver, Gold, Platinum, Project and Custom templates.
- Requires explicit selling price, discount, target margin, target GP, factor or compounded additional-discount inputs; no numeric commercial defaults are embedded.
- Adds optional warning or blocking guardrails for minimum margin, minimum GP, minimum/maximum selling price and maximum discount.
- Presents current price facts, scenario comparisons, deltas, status, signals, guardrails and deterministic explainability from `pricing-workspace-v1`.
- Allows local scenario selection, removal and reset while keeping stored scenarios read-only.
- Keeps all UI state in React memory and preserves the `simulation-only` contract: no price mutation, persistence, Repository writes or cross-Workspace writes.
- Renames the navigation label to `Pricing Laboratory` to avoid presenting the feature as price administration.
- Adds tests for visual input conversion, explicit guardrails, validation, formatting and comparison rendering.

# 0.43.0-PL-005

- Adds `pricing-workspace-v1` as the UI-independent model for Pricing Laboratory.
- Selects the current `BusinessPrice` by product and explicit currency through `BusinessRepository.prices`.
- Publishes product and currency options without reading normalized import rows directly.
- Orchestrates PL-004 template configurations and read-only stored scenarios in one ordered comparison model.
- Keeps current metrics, scenario metrics, deltas, guardrails, signals, template issues, explainability and selection state in a single contract for the future `/pricing` UI.
- Requires explicit currency selection when a product has more than one monetary channel; no cross-currency fallback or conversion is performed.
- Preserves disabled, not-applicable, invalid, valid, warning and blocked scenario classifications without choosing a commercial winner.
- Adds explicit `awaiting_selection`, `ready`, `partial` and `unavailable` Workspace states.
- A requested scenario is selected only when its key exists; PL-005 never auto-selects a recommended price.
- Re-evaluates stored scenarios in memory and never writes changes back to `BusinessPriceScenario`.
- Declares the same `simulation-only` isolation contract and documents that PL-005 does not recommend, approve, persist or publish prices.
- Adds automated tests for selection, multi-currency isolation, template/stored orchestration, invalid configurations, blocking guardrails, missing selections and output immutability.

# 0.42.1-PL-004-HOTFIX1

- Corrige la prueba de aislamiento del catálogo de plantillas para evitar optional chaining inseguro antes de mutar la copia de prueba.
- Conserva la misma verificación de inmutabilidad: modificar una copia no altera una segunda lectura del catálogo.
- No modifica definiciones, porcentajes, guardrails, motor de escenarios, precios, persistencia ni ningún Workspace.
- El hotfix es exclusivamente de calidad estática y elimina la advertencia `no-unsafe-optional-chaining` de Oxlint.

# 0.42.0-PL-004

- Adds `pricing-template-v1` for explicit Silver, Gold, Platinum, promotion, project and custom laboratory configurations.
- Publishes a metadata-only template catalog with no embedded discounts, margins, prices or approval thresholds.
- Requires every template to provide an explicit Price Engineering basis before evaluation.
- Adds caller-supplied guardrail profiles and deterministic precedence: defaults, profile, then template-specific overrides.
- Supports optional brand, product and currency scope so commercial assumptions remain contextual instead of global.
- Separates evaluated, disabled, not-applicable and invalid template dispositions.
- Detects duplicate configuration IDs, invalid scopes and missing or duplicated guardrail profiles.
- Preserves order, source references, notes, explainability and full simulation-only isolation.
- Adds catalog and engine tests for scope, guardrail precedence, warnings, blocking rules, invalid profiles and immutability.
- PL-004 does not persist templates, publish prices, approve changes or write to Data Center, Business Repository or any other Workspace.

# 0.41.0-PL-003

- Adds `price-engineering-v1` as a pure, deterministic calculation engine.
- Evaluates disposable scenarios from selling price, list discount, target Gross Margin, target Gross Profit, selling-price factor and additional compounded discount.
- Publishes unit GP, Gross Margin, discount, list factor, selling-price factor and deltas against the current price.
- Applies only caller-supplied guardrails; no hidden Silver, Gold, Platinum, approval or commercial policy is embedded.
- Separates warning, blocking and invalid results with deterministic explainability.
- Adapts persisted `BusinessPriceScenario` records into simulations without writing results back.
- Preserves source currency and performs no exchange-rate conversion or mixed-currency calculation.
- Declares an explicit `simulation-only` isolation contract: no mutation of BusinessPrice, repository, Data Center or any other Workspace.
- Adds inverse pricing math and automated tests for target margin, target GP, factor, compounded discount, guardrails, invalid inputs and immutability.

# 0.40.0-PL-002

- Adds the Pricing import plugin for canonical and ERP dual-currency sources.
- Normalizes independent MXN and USD price facts without hidden currency conversion.
- Uses `Purchase Price` with `Precio Lista (MXN)` for MXN and gates the foreign-currency cost channel by the declared purchase currency.
- Prevents MXN costs from being paired with USD list prices and reports skipped cross-currency rows.
- Defaults Selling Price to List Price only when the source does not publish a current selling price; no promotion or Pricing Group is inferred.
- Preserves effective-date, source-row, channel, model, purchase-currency and quantity-schedule traceability.
- Reconciles Pricing against Product Master and publishes coverage, missing products and brand differences.
- Recalculates Pricing reconciliation when Product Master changes and during local hydration.
- Persists Pricing independently through IndexedDB schema version 8.
- Activates Pricing in Data Catalog, Data Center summaries, Workspace Context and `BuildBusinessIntelligenceOptions`.
- Adds import, detection, source-isolation, reconciliation and dataset-registry tests.
- Validates the source contract against the real ERP cost and price workbook.
- PL-002 does not include recommendations, commercial Pricing Group rules, simulator, Price DNA, Workspace UI or export.

# 0.39.0-PL-001

- Pricing becomes a first-class Business Core domain through `BusinessPrice` and `BusinessPriceScenario`.
- Defines explicit semantics for cost, list price, selling price, unit Gross Profit, gross margin, discount rate and pricing factor.
- Adds stored comparison scenarios that never mutate the base price fact.
- Publishes standard scenario and Pricing Group identifiers for current, promotion, Silver, Gold, Platinum, project and custom cases.
- Adds `buildBusinessPrices()` with deterministic normalization, basic derivations, duplicate handling and auditable quality issues.
- Integrates prices, scenarios, summary and quality metadata into `BusinessDataModel`.
- Adds prebuilt indexes by product, brand, currency, margin band, Pricing Group, Gross Margin, unit Gross Profit, current product/currency price and price scenarios.
- Adds `repository.prices` queries and BusinessRepository facade methods.
- Adds unit and integration tests for math contracts, builder validation, scenario isolation, indexes and repository queries.
- PL-001 does not include Data Center import, Price Engineering Engine, recommendations, Price DNA, UI or export.

# 0.38.3-FW-010-HOTFIX3

- Corrige la cobertura del periodo actual cuando todos los documentos pendientes se encuentran despues del corte de Ventas.
- Los documentos `pending_cutoff` permanecen fuera del universo elegible de conciliacion y ya no provocan una cobertura artificial de 0%.
- Cuando el periodo no contiene documentos elegibles —conciliados, faltantes dentro del corte o conflictivos— la cobertura se publica como 100%, porque no existe rezago conciliable.
- Se conserva el conteo independiente de documentos pendientes por diferencia de corte y todos los bloqueos materiales definidos en FW-010 Hotfix 2.
- No modifica venta transaccional, facturacion de proyectos, Forecast Project-Aware, pipeline, GP, escenarios, UI ni exportacion Excel.

# 0.38.2-FW-010-HOTFIX2

- Ajusta Project Billing Reconciliation para evaluar diferencias por corte temporal, periodo y materialidad financiera.
- Los documentos de Facturacion de proyectos posteriores al corte de Ventas se clasifican como `pending_cutoff`; permanecen auditables y no bloquean el Forecast actual.
- Los documentos historicos faltantes o conflictivos reducen confianza y generan advertencias, pero no impiden publicar el cierre del periodo vigente.
- Los documentos anulados solo bloquean cuando conservan Revenue, GP o cantidad material en Ventas; los anulados con contribucion cero se clasifican como informacion.
- La cobertura de conciliacion se separa entre periodo actual e historico, excluyendo del denominador los documentos pendientes por diferencia de corte.
- Data Center muestra ambos cortes, pendientes por corte, anulados con impacto, anulados en cero y excepciones historicas.
- Forecast Workspace prioriza incidencias del periodo actual y limita la lista visual; la exportacion Excel conserva el detalle completo.
- Se preservan los bloqueos por faltantes actuales dentro del corte, conflictos actuales, notas de credito con signo anomalo, tipo de cambio faltante y pipeline maduro invalido.

# 0.38.1-FW-010-HOTFIX1

- Corrige el fixture de `buildForecastWorkspace.test.ts` para representar una fundacion Project-Aware completa.
- El caso listo incorpora un proyecto y un documento historicos fuera de los periodos relevantes, sin alterar Forecast, facturacion actual ni pipeline.
- Conserva el bloqueo productivo cuando Proyectos o Facturacion de proyectos realmente no estan disponibles.
- No modifica formulas, disponibilidad oficial en produccion, UI, exportacion ni contratos del Business Core.

# 0.38.0-FW-010

- Forecast Workspace consume `project-aware-v1` como fuente comercial oficial y deja de presentar la proyección mezclada anterior.
- Executive Hero y KPIs separan Forecast transaccional, facturación real de proyectos, pipeline maduro pendiente y cierre combinado.
- Estado `blocked` y alerta ejecutiva cuando conciliación, tipo de cambio, fechas, montos o duplicidad impiden publicar un Forecast oficial.
- Nuevo panel de composición por origen con documentos conciliados, proyectos incluidos y condición oficial/provisional.
- Nuevo panel auditable de Pipeline de proyectos con status, tratamiento, fecha estimada, moneda, tipo de cambio, monto MXN, ponderación, GP estimado e incidencias.
- Nuevo panel de calidad con cobertura de conciliación, bloqueos, tipos de cambio faltantes, cobertura de GP estimado y detalle de issues.
- Tabla por marca ampliada con Forecast transaccional, proyecto facturado, pipeline maduro, cierre combinado y upside potencial.
- Resumen ejecutivo determinístico actualizado con siete hallazgos Project-Aware.
- Exportación Excel versión 2.0 con siete hojas y nueva hoja `Pipeline de Proyectos`; incluye componentes por origen, calidad, metodología, tasas e incidencias.
- Corrección del formateador de Excel para aplicar formatos numéricos correctamente después de la columna Z.
- Impresión/PDF ajustada para composición, pipeline, calidad, cobertura, marcas, prioridades y metodología.
- Pruebas visuales y de exportación ampliadas para composición, pipeline, calidad, escenarios y siete hojas.
- Forecast Workspace queda cerrado funcionalmente de FW-001 a FW-010.

# 0.37.0-FW-009

- Nuevo motor determinístico `project-aware-v1` para reconstruir el cierre mensual por origen de venta.
- El baseline estadístico se recalcula con series transaccionales después de separar la facturación conciliada de proyectos por periodo y marca.
- La fórmula oficial queda definida como Forecast transaccional + Facturación real de proyectos + Pipeline maduro pendiente.
- Los proyectos `05 Esperando OC` y `06 Surtido parcialmente` se incorporan al 100% mediante `Monto por cerrar` y `Fecha estimada de facturación`.
- Los proyectos `03 Pendiente por usuario final` y `04 Pendiente por integrador` permanecen como upside separado; se muestra monto bruto y monto ponderado con la probabilidad declarada.
- El pipeline USD se convierte a MXN con la tasa exacta del periodo; no existe tipo de cambio predeterminado ni oculto.
- La facturación real conserva Revenue, GP, cantidad, marca y cliente provenientes de Ventas en MXN.
- El GP pendiente se estima con margen histórico de proyectos por marca, proyecto portafolio, marca general o portafolio, en ese orden.
- Controles bloqueantes para documentos sin conciliar, conflictos factura-proyecto, notas de crédito con signo anómalo, anulados presentes en Ventas, proyectos maduros sin fecha, monto, moneda o tipo de cambio.
- API pública ampliada con `getProjectAwareReport()`, proyección de portafolio, proyecciones por marca y búsqueda por marca.
- FW-009 no modifica todavía la UI ni la exportación ejecutiva; FW-010 consumirá estos contratos y cerrará Forecast Workspace.

# 0.36.0-FW-008

- Materializa líneas y documentos de ventas dentro de `BusinessDataModel` para conciliación transaccional sin exponer `NormalizedSalesRow[]` a consumidores.
- Nuevo motor determinístico de conciliación por `Document Number` entre Facturación de proyectos y Sales Repository.
- Revenue, GP, cantidad, cliente, marca y periodo oficiales provienen exclusivamente de las ventas ya normalizadas en MXN.
- Separa por periodo y marca la venta total, facturación neta de proyectos y venta transaccional.
- Las notas de crédito conservan el signo registrado en ventas; los documentos anulados no se clasifican como facturación de proyectos.
- Los documentos ausentes o vinculados a más de un proyecto quedan bloqueados para impedir doble conteo.
- Controles de calidad para cobertura, proyectos huérfanos, discrepancias de periodo y cliente, notas de crédito con signo anómalo y anulados presentes en ventas.
- `BusinessRepository` incorpora `salesTransactions` y `projectBillingReconciliation` con consultas por periodo, marca, proyecto, cliente, documento y status.
- Data Center muestra conciliación histórica, participación de proyectos, venta transaccional y auditoría documental.
- FW-008 no modifica todavía Forecast Baseline ni suma pipeline abierto; prepara las series limpias para FW-009.

# 0.35.0-FW-007

- Data Center incorpora importadores productivos para Proyectos, Facturación de proyectos y Tipos de cambio.
- El importador de Proyectos clasifica status 01–02 como tempranos, 03–04 como potenciales, 05–06 como maduros, 07 como realizados y 08 como cancelados.
- Los proyectos se actualizan mediante upsert por Internal ID y conservan fecha estimada de facturación, monto por cerrar, moneda y controles de calidad.
- La facturación de proyectos conserva líneas auditables, consolida duplicados exactos y materializa documentos por factura, proyecto, periodo, estado y moneda.
- Facturas, notas de crédito y documentos anulados se identifican sin calcular todavía el revenue oficial; la conciliación monetaria queda reservada para FW-008.
- Nuevo editor mensual USD→MXN sin tipo de cambio oculto, con fuente auditable y bloqueo explícito cuando falta una tasa.
- IndexedDB versión 7 persiste proyectos, facturación en chunks y tipos de cambio.
- BusinessDataModel incorpora BusinessProject, BusinessProjectBillingDocument, BusinessProjectBillingLine y BusinessExchangeRate.
- BusinessRepository expone `projects`, `projectBillings` y `exchangeRates` con índices por proyecto, documento, periodo, etapa y par de monedas.
- Data Catalog y Workspace Context reconocen las tres nuevas fuentes.
- Validación contra los reportes reales: 3,772 proyectos, 11,035 líneas de facturación de origen, 2,830 documentos y cobertura 2025-01 a 2026-07.
- FW-007 no modifica todavía la fórmula del Forecast; prepara FW-008, FW-009 y FW-010.

# 0.34.1-FW-006-HOTFIX1

- Ajusta la narrativa ejecutiva del estado `on-track` para mencionar explícitamente que el cierre se encuentra en ritmo de cumplimiento del objetivo.
- Alinea `buildForecastExecutiveSummary()` con el contrato de prueba y con la terminología utilizada en el resumen ejecutivo y la exportación Excel.
- No modifica cálculos, escenarios, filtros, KPIs, estructura del libro ni datos del Forecast Workspace.

# 0.34.0-FW-006

- Cierra funcionalmente Forecast Workspace con resumen ejecutivo deterministico y exportacion Excel bajo demanda.
- Nuevo boton `Exportar Excel` conectado al escenario y filtros activos sin modificar los datos base.
- Libro ejecutivo con seis hojas: Resumen Ejecutivo, Forecast por Marca, Riesgos por Producto, Oportunidades, Cobertura y Balance, y Metodologia y Fuentes.
- La exportacion incluye todos los riesgos y oportunidades que coinciden con la seleccion, mientras la UI conserva rankings visuales Top 10.
- Incorpora escenario, periodo, cortes, filtros, metodologia, explainability, limitaciones y rutas de navegacion.
- Formatos numericos de moneda, porcentaje, unidades y filtros automaticos en hojas tabulares.
- Impresion/PDF mejorada con saltos de pagina, tabla por marca expandida y exclusion del panel interactivo de filtros.
- Pruebas para resumen ejecutivo, estructura del libro, nomenclatura, navegacion y fuentes.
- Forecast Workspace queda cerrado de FW-001 a FW-006 sobre Business Repository.

# 0.33.0-FW-005

- Sustituye el placeholder de `/forecast` por Forecast Workspace conectado a `ForecastWorkspaceModel`.
- Executive Hero con cierre proyectado, cumplimiento, brecha, margen y score de confianza.
- Selector interactivo de escenarios conservador, esperado y acelerado sin modificar los datos base.
- KPIs de venta, GP, demanda, disponibilidad y productos criticos.
- Filtros por busqueda, marca, cobertura, prioridad y confianza.
- Mapa visual de cobertura y balance entre demanda restante, disponibilidad y entradas agregadas.
- Tabla ejecutiva por marca con objetivo, cumplimiento, confianza, cobertura y riesgo.
- Rankings navegables de riesgo y oportunidad con acceso a Brand Workspace, Product Workspace y sustitutos.
- Paneles de explainability, limitaciones y estados sin datos.
- Diseno responsive, impresion/PDF y pruebas de componentes visuales.
- FW-005 consume exclusivamente FW-004; no duplica formulas de Forecast ni inventa fechas de Purchasing.

# 0.32.0-FW-004

- Nuevo `ForecastWorkspaceModel` como contrato único para la futura interfaz de Forecast Workspace.
- Selector contractual de escenarios conservador, esperado y acelerado sin duplicar fórmulas del Business Core.
- Resumen ejecutivo consolidado de venta, GP, cantidad, margen, objetivo, cumplimiento, brecha, ritmo laboral y confianza.
- Agregación ejecutiva por marca con proyección, objetivo, cobertura, criticidad y navegación a Brand Workspace.
- KPIs de inventario recalculados sobre filtros de marca, cobertura, prioridad, confianza y búsqueda.
- Rankings separados de riesgo y oportunidad con navegación a Product Workspace y al sustituto resuelto.
- Contratos explícitos de periodos, filtros, opciones, explainability, limitaciones y estados vacío/parcial/listo.
- Nuevo hook `useForecastWorkspace()` conectado exclusivamente a `BusinessRepository` mediante Workspace Context.
- Pruebas para composición, cambio de escenario, filtros, navegación y ausencia de Repository.
- FW-004 no incorpora UI ni recalcula Forecast Baseline o Forecast Inventory Intelligence.

# 0.31.0-FW-003

- Nueva capa `forecast-inventory-v1` para cruzar demanda proyectada, inventario activo y Product Master por producto.
- Calcula demanda restante, cobertura disponible y cobertura con entradas agregadas en meses y días laborales.
- Clasifica stockout, brecha para el cierre, cobertura baja, cobertura balanceada, exceso e inventario sin demanda proyectada.
- Genera señales priorizadas y explicables de riesgo, oportunidad y contexto.
- Detecta inventario en productos Superseded, referencias no resueltas y sustitutos con disponibilidad.
- `inTransit` y `onOrder` se mantienen como entradas agregadas sin inventar fechas de llegada mientras Purchasing no esté conectado.
- La ausencia global de inventario produce estado `partial` y nunca se interpreta automáticamente como stock cero.
- API pública ampliada en `repository.forecast` para reporte, detalle por producto, ranking y filtros de cobertura.
- Pruebas para shortage, stockout, inbound recovery, exceso, Superseded, sustitución, ausencia de inventario y aislamiento de resultados.

# 0.30.1-FW-002-HOTFIX1

- Corrige la expectativa de prueba de `recentTrendRate`: la variación se mide contra el último periodo cerrado, no contra el promedio histórico.
- Para una venta reciente de 120 y una tendencia proyectada de 140, la tasa correcta es `0.1667` (16.67%).
- Añade una prueba directa al contrato matemático para evitar que el denominador cambie accidentalmente.
- No modifica el Forecast Baseline Engine productivo, sus pesos, escenarios ni la proyección esperada de `176.13` del caso de referencia.

# 0.30.0-FW-002

- Forecast Baseline Engine determinista para portafolio, marca y producto.
- Métodos `run-rate`, promedio histórico, tendencia lineal reciente y referencia estacional con pesos redistribuidos según disponibilidad.
- Proyección simultánea de venta, GP y cantidad, con margen derivado.
- Escenarios conservador, esperado y acelerado activados mediante banda de incertidumbre basada en confianza y volatilidad.
- Contexto contra objetivo: cumplimiento esperado, brecha y venta diaria requerida.
- Confianza explicable por historia, continuidad, ritmo laboral, avance, estacionalidad y estabilidad.
- Los meses sin actividad de una entidad se incorporan como cero dentro de periodos históricos disponibles.
- API pública en `repository.forecast` para baseline de portafolio, marca y producto.
- Conteo de días laborables centralizado y reutilizado por Brand Decision Engine.
- Pruebas deterministas de calendario, matemáticas, Engine, escenarios, consultas, aislamiento e integración.

# 0.29.0-FW-001

- Forecast se incorpora como dominio de primera clase del Business Core mediante `repository.forecast`.
- Nueva fundación determinística que declara historia disponible, periodo actual, corte de datos, continuidad mensual y baseline histórico.
- Contratos oficiales para granularidades de portafolio, marca, producto y cliente.
- Series mensuales normalizadas de venta, GP, cantidad y documentos, sin calcular todavía proyecciones.
- Registro explícito de fuentes: ventas, objetivos, días laborales, inventario, Product Master y Purchasing futuro.
- Readiness por capacidad para forecast consolidado, marca, demanda de producto, ritmo contra objetivo, cobertura de inventario y sustituciones.
- Escenarios conservador, esperado y acelerado definidos como contratos, sin multiplicadores ni resultados inventados.
- Purchasing queda marcado como fuente futura opcional y no bloqueante.
- Pruebas para foundation, series, queries, aislamiento de colecciones e integración con BusinessRepository.

# 0.28.3-PW-006.1.1

- La ruta de sustitución de catálogo se integra dentro del Executive Hero de Product Workspace.
- El panel se muestra inmediatamente debajo de Riesgo comercial y Potencial de recuperación.
- Se conserva sin cambios el diseño interno, los estados de sustitución, la navegación y las consultas de inventario.
- `ExecutiveHero` incorpora un slot reusable `metricFooter` para contenido contextual asociado a sus métricas.
- Se elimina el espacio vertical duplicado que generaba el panel como sección independiente.
- Prueba Atlas ampliada para validar el nuevo slot del Executive Hero.

# 0.28.2-PW-006.1

- Product Workspace incorpora una ruta de sustitución de catálogo conectada al Product Master.
- Expone `NETSTOCK Superseded By` y `Producto sustituto directo` dentro del expediente del SKU.
- Consulta existencia, disponibilidad y ubicaciones activas de cada producto de reemplazo desde Inventory Repository.
- Permite abrir directamente el expediente del sustituto cuando está conciliado con Product Master.
- Distingue producto vigente, Superseded con sustituto directo, Superseded sin sustituto y sustituto directo sin Superseded.
- Mantiene sin cambios Business Score, ciclo de vida, riesgo comercial y reglas de Product Decision Core.

# 0.28.1-IW-006.1

- Inventory Workspace se enriquece desde Product Master sin duplicar atributos en las posiciones de inventario.
- Nuevo filtro dinámico por `CLASIFICACION VALOR` A, B, C, D, E y productos sin clasificación.
- Nuevo filtro por estado de sustitución: Superseded, sustituto directo, ambos o sin reemplazo.
- Drill-down con categoría de valor, `NETSTOCK Superseded By`, sustituto directo y disponibilidad actual de cada reemplazo.
- Resumen ejecutivo ampliado con valor, unidades y cobertura de productos Superseded.
- Exportación Excel 1.1 con columnas de catálogo y nueva hoja `Sustituciones`.
- Pruebas unitarias para enriquecimiento, filtros, resumen y contrato de exportación.

# 0.28.0-IW-006

- Resumen ejecutivo determinístico para Inventory Workspace.
- KPIs, estado de posiciones y narrativa recalculados sobre los filtros activos.
- Exportación Excel bajo demanda con resumen, inventario por ubicación, posiciones, riesgos, oportunidades y metadatos.
- Carga dinámica de `xlsx` únicamente al solicitar la exportación.
- Pruebas unitarias para resumen ejecutivo y contrato del libro exportado.
- Cierre funcional de Inventory Workspace IW-001 a IW-006.

# 0.27.0-IQ-002

- `Name` adoptado como identidad primaria y unica del producto.
- `Marca` y `Modelo` usados para validacion y fallback controlado.
- Nuevo indice por Name, deteccion de duplicados y advertencias de atributos.
- Quality Gate ampliado con cobertura primaria por Name.
- Migracion compatible con Product Master persistido en IQ-001.

# 0.27.0-IQ-001

- Product Master registrado como dataset persistente del Data Center.
- Product Identity Quality Gate con cobertura por filas y valor de venta.
- Excepciones agrupadas y priorizadas por impacto comercial.
- Nueva ruta `/data-quality/products` y exportacion CSV.
- Integracion del Product Master persistido con BusinessRepository.

# 0.21.0-C001.1

- Customer Core Migration sobre `customerPeriods` y `BusinessRepository`.
- Índices temporales por cliente y periodo.
- Cobertura de periodos activos y ubicaciones por periodo.

# Changelog

## 0.18.0-UX002.4-P3

- Integración visible del Executive Brief en Brand Workspace.
- Generación determinística desde el Business Core mediante Workspace Context.
- Renderizado debajo del Executive Hero y antes de los KPI secundarios.

# PM Intelligence Workspace — Changelog

## 0.18.0-UX002.4-P2 — Executive Brief Atlas Widgets

- Añade la capa visual reusable del Executive Brief determinístico.
- Incorpora explainability, confianza, riesgos, oportunidades y recomendaciones.
- Mantiene la integración con Brand Workspace fuera de esta parte.


## 2026-07-25 — Commit A-002.1: Business Cube Metrics Foundation

### Added

- `BusinessCubeMetrics` con contratos para margen, ticket promedio y variación entre periodos.
- Implementaciones puras y reutilizables de las tres métricas.
- Pruebas unitarias de resultados válidos, valores negativos y divisores sin base válida.
- `docs/ARCHITECTURE_DECISIONS.md` con ADR-008 a ADR-011.

### Changed

- `buildBusinessCube()` ahora construye métricas reales mediante `buildBusinessCubeMetrics()`.

### Compatibility

- Sin cambios en `BusinessDataModel`, `BusinessRepository`, Intelligence o UI.
- Sin breaking changes en las consultas existentes del Business Cube.

## 2026-07-26 — Commit A-002.2: Business Cube Engine Consolidation

### Added

- Registro central de métricas mensuales para las nueve métricas oficiales del Cube.
- Totales agregados correctos para `grossMargin` y `averageTicket`.
- Pruebas de integración para métricas aditivas y derivadas.

### Changed

- `GenericCubeQueryEngine` ahora resuelve ejecutores mediante el registro de métricas.
- `PeriodMetricExecutor` consume `BusinessCubeMetrics` y definiciones registradas.
- `buildBusinessCube()` comparte una única instancia de métricas entre todos los motores.
- El modelo mínimo de pruebas ahora contiene hechos representativos.
- `tsconfig.json` dejó de referenciar un `tsconfig.node.json` inexistente.

### Compatibility

- Sin cambios en `BusinessDataModel`, `BusinessRepository`, Intelligence o UI.
- Las consultas existentes de `revenue` y `grossProfit` conservan su contrato.

## 2026-07-26 — Commit A-002.3: Business Targets Domain

### Added

- Entidad pura `BusinessBrandTarget`.
- Índice `brandTargets` dentro de `BusinessDataModel`.
- Contrato `BusinessBrandTargetInput` para entradas normalizadas.
- Builder `buildBusinessBrandTargets()` con validación estructurada.
- Convención reutilizable para claves `PERIOD::BRAND`.
- Pruebas unitarias e integración con `buildBusinessDataModel()`.
- `ADR-013` para formalizar los objetivos comerciales como entidades de primer nivel.
- `docs/RELEASE_NOTES.md` con el historial de la versión `v0.9.0`.

### Changed

- `buildBusinessDataModel()` acepta opcionalmente objetivos de marca sin romper las llamadas existentes.
- El modelo mínimo de pruebas incorpora un índice vacío de objetivos.
- La versión del paquete avanza a `0.9.0`.

### Compatibility

- Las llamadas existentes a `buildBusinessDataModel(rows)` conservan su comportamiento.
- No se modifica Business Repository, Business Cube, Intelligence ni UI.
- No se calculan todavía cumplimiento, run rate, forecast o health score.

## 2026-07-26 — Commit A-002.4: CommercialTargetQueries

### Added

- Query Object `CommercialTargetQueries` para objetivos comerciales de marca.
- Consulta directa por marca y periodo mediante la clave canónica `PERIOD::BRAND`.
- Índices de objetivos por marca y por periodo construidos al inicializar el Repository.
- Consultas de periodos disponibles, marcas con objetivo y existencia de objetivo.
- Pruebas unitarias de normalización, orden, aislamiento de colecciones y casos inexistentes.
- `ADR-014` y documento técnico `docs/COMMIT_A-002.4.md`.

### Changed

- `BusinessRepository` expone `repository.targets` como API oficial de consulta.
- El paquete avanza a la versión `0.9.1`.
- Release Notes y Roadmap reflejan el cierre de A-002.4.

### Compatibility

- Sin cambios en `BusinessDataModel`, Business Cube, Intelligence o UI.
- Las APIs existentes de `brand`, `customer` y `revenue` mantienen su contrato.
- No se calculan todavía cumplimiento, run rate, forecast o health score.

## 2026-07-26 — Commit A-002.5: Target Attainment Engine

### Added

- Motor `TargetAttainmentEngine` para comparar hechos y objetivos por marca y periodo.
- Contratos `BusinessTargetAttainment`, `BusinessMetricAttainment`,
  `BusinessRevenuePace` y `BusinessPerformanceStatus`.
- Cálculos reutilizables de cumplimiento, variación, ritmo esperado y proyección lineal.
- Opciones explícitas para días laborales transcurridos.
- Pruebas unitarias del motor, divisiones entre cero, estados y periodos sin hechos.
- `ADR-015` y documento técnico `docs/COMMIT_A-002.5.md`.

### Changed

- El paquete avanza a la versión `0.9.2`.
- Release Notes y Roadmap reflejan el cierre de A-002.5.

### Compatibility

- Sin cambios en `BusinessDataModel`, Business Repository, Business Cube o UI.
- Las APIs existentes mantienen su contrato.
- No se implementan todavía Business Snapshot, Health Score ni Executive Brief.

## 2026-07-26 — Commit A-002.6: Business Snapshot

### Added

- `BusinessSnapshotEngine` y contrato `BusinessBrandSnapshot`.
- Consolidación de hechos, objetivos y Target Attainment por marca y periodo.
- Métricas de margen y ticket promedio reutilizadas desde Business Cube.
- Opciones explícitas para días laborales transcurridos.
- Pruebas para periodos con hechos y objetivo, sólo objetivo, sólo hechos y datos inexistentes.
- `ADR-016` y documento técnico `docs/COMMIT_A-002.6.md`.

### Changed

- `BusinessRepository` expone `getGeneratedAt()` para metadatos deterministas.
- El paquete avanza a la versión `0.9.3`.
- Release Notes y Roadmap reflejan el cierre de A-002.6.

### Compatibility

- Sin cambios incompatibles en BusinessDataModel, Cube, Targets, Attainment o UI.
- La interfaz web todavía no consume el Snapshot.

## 2026-07-26 — Commit A-002.7: Business Health Score Engine

### Added

- `BusinessHealthScoreEngine` basado exclusivamente en `BusinessBrandSnapshot`.
- Ocho componentes configurables: venta, GP, margen, forecast, ritmo, clientes,
  productos y tendencia.
- Pesos predeterminados y validación de configuraciones personalizadas.
- Clasificación ejecutiva de Excelente a Crítico, incluyendo No evaluable.
- Componentes explicables con valor real, benchmark, score, peso e impacto.
- Recomendaciones estructuradas para dimensiones en atención o riesgo.
- Benchmarks opcionales para amplitud de clientes, productos y tendencia.
- Pruebas unitarias de clasificación, ponderación, renormalización y configuración.
- `ADR-017` y documento técnico `docs/COMMIT_A-002.7.md`.

### Changed

- El paquete avanza a la versión `0.9.4`.
- Release Notes y Roadmap reflejan el cierre de A-002.7.

### Compatibility

- Sin cambios incompatibles en Snapshot, Attainment, Repository, Cube o UI.
- La interfaz web todavía no representa el Health Score.

## 2026-07-26 — Commit A-002.8: Narrative Engine & Executive Brief

### Added

- `BusinessNarrativeEngine` como fachada pública de narrativa determinística.
- `BusinessExecutiveBrief` con resumen, fortalezas, riesgos, oportunidades y recomendaciones.
- Builders especializados por sección y reglas de lenguaje `es-MX`.
- Validación de correspondencia entre Snapshot y Health Score.
- Pruebas de narrativa favorable, ausencia de objetivos y contratos incompatibles.
- `ADR-018` y documento técnico `docs/COMMIT_A-002.8.md`.

### Changed

- La versión del paquete avanza a `0.9.5`.

### Compatibility

- Sin cambios en UI, Repository, Cube, Snapshot, Attainment o Health Score.
- El nuevo módulo es aditivo y se consume mediante su barrel export local.

## 2026-07-26 — Commit A-002.9: Architecture Hardening

### Added

- Fachada pública `src/core/business/index.ts`.
- Formateadores compartidos para números, porcentajes y moneda.
- Pruebas de formateadores y límites arquitectónicos.
- Documentación de API pública, Contribution Guide y Architecture Review.
- `ADR-019` para formalizar contratos y dependencias permitidas.

### Changed

- Narrative Engine reutiliza los formateadores centrales.
- La versión del paquete avanza a `0.9.6`.
- Architecture Sprint A-002 queda cerrado.

### Compatibility

- Sin breaking changes en Snapshot, Health, Narrative, Repository, Cube o UI.
- La fachada pública es aditiva y los exports locales permanecen disponibles.

## 0.9.7 - A-002.9.1

### Fixed

- Isolated the Node-based architecture-boundary test from the browser production source tree.
- Updated Vitest test discovery for the external `tests/` directory.
- Removed the TypeScript build errors caused by `node:fs`, `node:path`, and `node:url` imports under `src/`.

## 0.17.1-UX002.2

- Añade Intelligent KPI Cards y un registro declarativo reutilizable de indicadores.
- Migra los KPI secundarios de Brand Intelligence al nuevo sistema Atlas.
- Mantiene toda la lógica de negocio fuera de React.

## 0.17.2-UX002.3

- Executive Workspace Refinement.
- Executive Hero v2, KPI Cards v2, Executive Panels, Workspace Themes and Motion System.

## 0.18.0-UX002.4-P1

- Executive Brief Core determinístico para Brand Workspace.
- Reglas, explicabilidad, confianza y pruebas unitarias.
- Sin cambios de UI en esta parte.

## 0.19.0-UX002.5-P2

- Añade los widgets Atlas reutilizables para Opportunity Radar.
- Incorpora matriz impacto/urgencia y explicabilidad visual.
- Mantiene la integración con Brand Workspace fuera de esta parte.

## 0.19.0-UX002.5-P3

- Integración de Opportunity Radar en Brand Workspace.
- Conexión de Opportunity Engine con Workspace Context.
- Visualización priorizada entre Executive Brief y KPI Cards.

## 0.19.1-UX002.5-P3.1

- Corrige el recorte de tooltips en los bordes de Opportunity Matrix.
- Orienta cada tooltip hacia el espacio disponible y añade soporte de teclado.
- Mantiene intactos Opportunity Engine, scores y reglas de negocio.

## 0.20.0-UX002.6

- Smart Brand Directory integrado en Brand Workspace.
- Navegación contextual por marca, filtros y ordenamiento ejecutivo.

## 0.26.0 — SW-001 Sales Workspace Foundation

- Sales Workspace reemplaza el placeholder de `/sales`.
- Se incorpora contexto comercial por periodo, comparación temporal, KPIs, tendencia y rankings.
- La calidad de conciliación de Product Master se expone dentro del Workspace.
- El módulo consume BusinessRepository sin depender de filas normalizadas.

## 0.26.0 — SW-002 Sales Performance Analytics

- Consolida objetivos mensuales de venta, Gross Profit y margen dentro de Sales Workspace.
- Incorpora cumplimiento, esperado al corte, ritmo diario laboral y proyección de cierre.
- Añade cobertura de objetivos y una tabla priorizada de brechas por marca.
- Mantiene el Business Core congelado y consume únicamente BusinessRepository y Attainment.

## 0.26.0 — SW-003 Sales Segmentation & Drill-down

- Añade segmentación combinable por marca, cliente, producto, ubicación y vendedor.
- Incorpora búsqueda por ID o nombre y chips de filtros activos.
- Recalcula KPIs, comparación, tendencia y rankings sobre el segmento exacto.
- Permite profundizar desde rankings y presenta una tabla detallada agregada.
- Añade `SalesSegmentationQueries` y un grano analítico aditivo al Business Repository.
- Protege la integridad de cuotas desactivando objetivos cuando el filtro no puede atribuirse por marca.

## 2026-07-28 — SW-005: Commercial Opportunity Engine

### Added

- Motor comercial determinístico para convertir señales de ventas en prioridades accionables.
- Brechas de cuota, recuperación y crecimiento de clientes, crecimiento de productos y protección de margen.
- Score, prioridad, confianza, esfuerzo, impacto estimado y evidencia por oportunidad.
- Panel ejecutivo y navegación directa al segmento de marca, cliente o producto.

### Architecture

- Implementación aditiva dentro de Sales Workspace.
- Sin cambios en entidades, builders o repositorios del Business Core.
- SW-004 permanece pendiente como bloque independiente de Variance & Contribution Analysis.

## 2026-07-28 — SW-004: Variance & Contribution Analysis

### Added

- Explicación determinística de la variación comercial contra el periodo comparable.
- Contribuciones positivas y negativas por marca, cliente y producto.
- Cambios de mezcla, participación y peso relativo del movimiento.
- Clasificación de clientes nuevos, recuperados, crecientes, en baja, perdidos y estables.
- Panel ejecutivo integrado antes del Commercial Opportunity Engine.

### Architecture

- Implementación aditiva dentro de Sales Workspace.
- Consume exclusivamente BusinessRepository y Sales Segmentation Queries.
- Sin cambios en entidades, builders o repositorios del Business Core.

## 2026-07-28 — SW-006: Executive Export & Closure

### Added

- Resumen ejecutivo determinístico con lectura del periodo, perspectiva de cierre y hallazgos prioritarios.
- Exportación Excel bajo demanda con hojas de resumen, KPIs, desempeño por marca, oportunidades, contribuciones, detalle y conciliación.
- Vista de impresión optimizada para generar PDF desde el navegador.
- Acciones ejecutivas de impresión y exportación dentro de Sales Workspace.

### Performance

- Carga diferida por ruta para los principales Workspaces y Data Center.
- `xlsx` se carga dinámicamente únicamente al solicitar una exportación.
- Se elimina la dependencia estática de Data Center desde el router principal.

### Closure

- Completa los bloques SW-001 a SW-006 de Sales Workspace v0.26.0.
- Mantiene el Business Core congelado y sin cambios de contrato.
