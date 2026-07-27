# PM Intelligence Workspace — Roadmap

## Estado actual

```text
Versión: v0.9.6
Sprint: Architecture Sprint A-002
Último commit: A-002.9
```

## Architecture Sprint A-002

| Commit | Alcance | Estado |
|---|---|---|
| A-002.1 | Business Cube Metrics Foundation | Completado |
| A-002.2 | Business Cube Engine Consolidation | Completado |
| A-002.3 | Business Targets Domain | Completado |
| A-002.4 | CommercialTargetQueries | Completado |
| A-002.5 | Target Attainment Engine | Completado |
| A-002.6 | Business Snapshot | Completado |
| A-002.7 | Health Score Engine | Completado |
| A-002.8 | Narrative Engine & Executive Brief | Completado |
| A-002.9 | Architecture Hardening | Completado |

## Architecture Sprint A-002 — CERRADO

El Core dispone de fachada pública, formatos compartidos y pruebas de límites arquitectónicos.

## Sprint B-001 — Brand Workspace

Después del cierre de A-002 se construirá la primera interfaz conectada al Core:

- Resumen Ejecutivo.
- Ventas.
- Objetivos.
- Health.
- Clientes.
- Productos.
- Tendencias.
- Alertas.
- Copilot.

## Criterio para v1.0.0

- Data Center con dominios prioritarios operativos.
- Business Model estable.
- Business Repository y Business Cube completos.
- Business Snapshot implementado.
- Brand, Customer y Product Intelligence sobre el modelo central.
- Executive Workspace conectado al Business Core.
- Copilot consumiendo contratos de negocio y no estructuras de UI.

## Restricciones vigentes

- Las entidades almacenan hechos, objetivos e identificadores; no KPIs derivados.
- Los Workspaces no duplican fórmulas del Business Core.
- La UI representa Snapshots y resultados derivados; no interpreta el negocio.
- Health Score no inventa benchmarks ausentes.
- Cada cambio se entrega como commit completo, compilable y documentado.

### A-002.9.1 - Architecture Test Isolation

Status: completed. Corrective hardening release separating Node-based architecture tests from production application compilation.
