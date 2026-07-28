# SW-001 — Sales Workspace Foundation

## Versión

`0.26.0`

## Objetivo

Sustituir el placeholder de `/sales` por la primera versión operativa de Sales Workspace, consumiendo exclusivamente el `BusinessRepository` y el contexto compartido de Workspaces.

## Cambios

- Se crea `src/features/sales-workspace` con separación por `engine`, `store`, `hooks`, `components`, `types`, `utils` y `pages`.
- Se incorpora un estado local Zustand para el periodo seleccionado y la base de comparación.
- Se implementa comparación contra periodo anterior o mismo mes del año anterior.
- Se publican KPIs de venta, Gross Profit, margen, cantidad, documentos y clientes activos.
- Se agrega tendencia de hasta 12 periodos.
- Se agregan rankings por marca, cliente y producto para el periodo seleccionado.
- Se integra el diagnóstico de conciliación de ventas contra Product Master de PMC-005.
- Se añade el tema visual `sales` a Atlas.
- La ruta `/sales` deja de utilizar `PlaceholderPage`.

## Regla arquitectónica

Sales Workspace no consume `NormalizedSalesRow[]` ni colecciones internas del modelo. Toda lectura analítica se realiza mediante `BusinessRepository` y `WorkspaceContext`.
