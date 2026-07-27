# PM Intelligence Workspace — Release Notes

## v0.9.0 — Business Targets Foundation

**Fecha:** 2026-07-26  
**Architecture Sprint:** A-002  
**Commit:** A-002.3

### Objetivo

Incorporar los objetivos comerciales mensuales de marca como un dominio formal del Business Model, manteniendo separados los hechos reales, los objetivos declarados y los indicadores derivados.

### Entregables

- `BusinessBrandTarget` como entidad pura de negocio.
- Índice `brandTargets` con acceso por `PERIOD::BRAND`.
- Builder y validaciones para entradas normalizadas.
- Integración opcional en `buildBusinessDataModel()`.
- Incidencias estructuradas para registros inválidos o duplicados.
- Pruebas unitarias y de integración.
- ADR-013 y actualización del changelog.

### Contrato funcional

Un objetivo puede declarar uno o varios de los siguientes campos:

```text
targetRevenue
targetGrossProfit
targetGrossMargin
workingDays
```

Los valores derivados no se almacenan en la entidad.

### Compatibilidad

No hay cambios requeridos en la UI ni en los consumidores actuales. El parámetro de objetivos es opcional y las llamadas anteriores siguen siendo válidas.

### Siguiente versión prevista

`v0.9.1 / Commit A-002.4` — `CommercialTargetQueries` dentro de Business Repository.

---

## v0.9.1 — Commercial Target Queries

**Fecha:** 2026-07-26  
**Architecture Sprint:** A-002  
**Commit:** A-002.4

### Objetivo

Incorporar la API oficial de lectura de objetivos comerciales dentro de Business
Repository, evitando que los consumidores accedan directamente a los mapas del
Business Model.

### Entregables

- `CommercialTargetQueries`.
- `repository.targets`.
- Consulta por marca y periodo.
- Consulta de objetivos por periodo.
- Línea temporal de objetivos por marca.
- Catálogos de periodos y marcas con objetivos.
- Pruebas unitarias y ADR-014.

### Contrato funcional

```ts
repository.targets.findBrandTarget(
  'BELDEN',
  '2026-07',
)

repository.targets.findPeriodTargets(
  '2026-07',
)

repository.targets.findTargetsByBrand(
  'BELDEN',
)
```

El Query Object devuelve entidades puras y no incorpora indicadores derivados.

### Compatibilidad

No existen cambios requeridos en la interfaz ni en los consumidores actuales.
Las APIs anteriores del Repository permanecen disponibles sin modificaciones.

### Siguiente versión prevista

`v0.9.2 / Commit A-002.5` — Target Attainment Engine.

## v0.9.2 — Target Attainment Engine

**Fecha:** 2026-07-26  
**Architecture Sprint:** A-002  
**Commit:** A-002.5

### Objetivo

Incorporar una fuente única y determinista para comparar resultados reales contra
objetivos comerciales mensuales de marca.

### Entregables

- `TargetAttainmentEngine`.
- Cumplimiento y variación para venta, GP y margen.
- Ritmo esperado según días laborales transcurridos.
- Proyección lineal al cierre del periodo.
- Estados `not-evaluable`, `behind-plan`, `on-plan`, `ahead-of-plan` y `achieved`.
- Pruebas unitarias y ADR-015.

### Compatibilidad

El commit no altera las entidades, índices ni APIs existentes. El motor se crea
explícitamente con un `BusinessRepository` y puede adoptarse gradualmente.

### Siguiente versión prevista

`v0.9.3 — Business Snapshot`.

## v0.9.3 — Business Snapshot

**Fecha:** 2026-07-26  
**Commit:** A-002.6

Se incorpora la fotografía oficial de marca y periodo que unifica hechos,
objetivos, métricas y cumplimiento comercial. Esta versión crea el contrato que
será consumido por Health Score, Executive Brief y Brand Workspace sin trasladar
cálculos de negocio a la interfaz.

### Incluye

- `BusinessBrandSnapshot`.
- `BusinessSnapshotEngine.getBrandSnapshot()`.
- Venta, GP, margen, cantidad, documentos, clientes, productos y ticket promedio.
- Objetivos de venta, GP, margen y días laborales.
- Cumplimiento, variaciones, ritmo esperado y proyección lineal.
- Resultados deterministas basados en la fecha de generación del modelo.

### Compatibilidad

No contiene cambios incompatibles y todavía no modifica la UI.

## v0.9.4 — Business Health Score Engine

**Fecha:** 2026-07-26  
**Architecture Sprint:** A-002  
**Commit:** A-002.7

### Objetivo

Convertir el Business Snapshot en una calificación ejecutiva explicable,
configurable y reutilizable por Brand Workspace, Executive Brief y Copilot.

### Entregables

- `BusinessHealthScoreEngine.calculate(snapshot, options)`.
- Score de 0 a 100 y clasificación ejecutiva.
- Componentes ponderados de venta, GP, margen, forecast, ritmo, clientes,
  productos y tendencia.
- Renormalización automática cuando una dimensión no tiene información suficiente.
- Benchmarks explícitos para clientes, productos y tendencia.
- Recomendaciones estructuradas.
- Pruebas unitarias y ADR-017.

### Contrato funcional

```ts
const health = new BusinessHealthScoreEngine()
  .calculate(snapshot, {
    benchmarks: {
      minimumCustomers: 10,
      minimumProducts: 20,
      revenueTrendRatio: 0.94,
    },
  })
```

El motor nunca inventa benchmarks. Una dimensión sin referencia se conserva como
`not-evaluable` y no penaliza artificialmente el resultado.

### Compatibilidad

No hay cambios requeridos en la UI ni en consumidores actuales. Health Score es
una capa derivada que recibe un Snapshot ya construido.

### Siguiente versión prevista

`v0.9.5 / Commit A-002.8` — Executive Brief Engine.

---

## v0.9.5 — Narrative Engine & Executive Brief

**Fecha:** 2026-07-26  
**Architecture Sprint:** A-002  
**Commit:** A-002.8

### Objetivo

Incorporar una lectura ejecutiva reproducible para transformar Snapshot y Health
Score en conclusiones listas para ser representadas por cualquier canal.

### Entregables

- `BusinessNarrativeEngine`.
- `BusinessExecutiveBrief`.
- Fortalezas, riesgos, oportunidades y recomendaciones estructuradas.
- Resumen ejecutivo determinístico en español de México.
- Validación de contexto entre Snapshot y Health Score.
- Pruebas unitarias y ADR-018.

### Compatibilidad

No hay modificaciones visuales ni breaking changes. Brand Workspace podrá
consumir el Brief en el Sprint B-001 sin recalcular o reinterpretar indicadores.

### Siguiente versión prevista

`v0.9.6 / Commit A-002.9` — Architecture Hardening y cierre del Core Foundation.

---

## v0.9.6 — Architecture Hardening

Esta versión cierra Architecture Sprint A-002 y congela la primera API pública del Business Core.

### Incluye

- Public Business Core facade.
- Business formatters reutilizables.
- Architecture boundary tests.
- Guía de contribución y contratos públicos.
- Revisión arquitectónica previa a Brand Intelligence.

### Estado

El Core queda preparado para B-001 Brand Intelligence. React deberá consumir Snapshot, Health Score, Narrative y demás contratos únicamente mediante APIs públicas.

## 0.9.7 - Architecture Test Isolation

A-002.9.1 moves architecture validation outside the production source tree. The boundary test continues to run with Vitest while the browser build no longer compiles Node-only test infrastructure.
