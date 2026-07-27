# PM Intelligence Workspace — Architecture Decisions

Este documento registra las decisiones arquitectónicas activas del proyecto. Cada ADR define una regla estable para evitar duplicidad, acoplamiento entre capas y cálculos inconsistentes.

---

## ADR-008 — Convención de claves por periodo

**Estado:** Aceptado  
**Fecha:** 2026-07-25

### Decisión

Toda entidad indexada por periodo e identificador utilizará la convención:

```text
PERIOD_ID::ENTITY_ID
```

Ejemplos:

```text
2026-07::BELDEN
2026-07::123456
2026-07::SKU-001
```

### Consecuencias

- `BusinessBrandPeriod` y futuros objetivos por marca compartirán la misma convención.
- Las claves serán deterministas y aptas para búsquedas directas en `Map`.
- No se crearán variantes como `ENTITY_ID::PERIOD_ID`.

---

## ADR-009 — Entidades de negocio puras

**Estado:** Aceptado  
**Fecha:** 2026-07-25

### Decisión

Las entidades de `BusinessDataModel` almacenan únicamente hechos, identificadores y relaciones consolidadas.

Pueden contener:

- importes;
- cantidades;
- identificadores;
- periodos;
- relaciones y conjuntos de identificadores.

No pueden contener:

- health score;
- target attainment;
- forecast;
- variaciones calculadas;
- rankings contextuales;
- narrativa, recomendaciones o diagnósticos.

### Consecuencias

Los indicadores derivados se implementan fuera de las entidades, en Business Metrics o Business Intelligence según su responsabilidad.

---

## ADR-010 — Business Cube como capa analítica

**Estado:** Aceptado  
**Fecha:** 2026-07-25

### Decisión

El Business Cube se mantiene entre `BusinessRepository` y las capas de métricas e inteligencia.

```text
BusinessDataModel
        ↓
BusinessRepository
        ↓
Business Cube
        ↓
Business Metrics
        ↓
Business Intelligence
        ↓
Workspaces / UI
```

El Cube:

- consulta únicamente mediante el Repository;
- centraliza agregaciones y consultas multidimensionales;
- expone contratos tipados;
- no lee archivos, estado React, Zustand ni filas normalizadas;
- no genera narrativa ni recomendaciones.

---

## ADR-011 — Métricas oficiales reutilizables

**Estado:** Aceptado  
**Fecha:** 2026-07-25

### Decisión

Las métricas compartidas del Cube se exponen mediante `BusinessCubeMetrics`. Ningún Workspace, componente React o módulo de Intelligence deberá duplicar sus fórmulas.

La primera implementación oficial incluye:

- `grossMargin`;
- `averageTicket`;
- `periodVariation`.

Las métricas porcentuales se representan como razones decimales:

```text
0.25  = 25%
-0.10 = -10%
```

La conversión a texto porcentual corresponde exclusivamente a la capa de presentación.

### Reglas de nulabilidad

Una métrica devuelve `null` cuando carece de una base matemáticamente válida:

- margen con venta igual a cero;
- ticket promedio sin documentos;
- variación con periodo anterior igual a cero;
- entradas no finitas.

### Extensiones futuras

Las métricas siguientes requieren contratos y dominios adicionales antes de implementarse:

- target attainment;
- run rate contra días laborales;
- business health score;
- forecast.

No se agregarán implementaciones provisionales con datos incompletos.

---

## ADR-012 — Registro único de métricas del Cube

**Estado:** Aceptado  
**Fecha:** 2026-07-26

### Decisión

Las métricas ejecutables del Business Cube se registran en `periodMetricRegistry`.
El motor genérico no implementa fórmulas ni mantiene un `switch` por métrica.

Las métricas aditivas suman filas. Las métricas derivadas, como margen y ticket
promedio, calculan su total usando los hechos agregados y nunca sumando razones.

### Consecuencias

- Todas las dimensiones reutilizan las mismas definiciones de métrica.
- Agregar una métrica mensual requiere una definición única y pruebas.
- `grossMargin` y `averageTicket` mantienen consistencia matemática entre filas y total.

---

## ADR-013 — Objetivos comerciales como entidades de primer nivel

**Estado:** Aceptado  
**Fecha:** 2026-07-26

### Contexto

El sistema necesita comparar hechos comerciales contra objetivos mensuales sin convertir los objetivos en métricas calculadas, estado de interfaz o propiedades de las entidades de venta.

### Decisión

Los objetivos comerciales de marca se representan mediante `BusinessBrandTarget` y forman parte de `BusinessDataModel` a través del índice `brandTargets`.

Cada objetivo usa la clave canónica:

```text
PERIOD_ID::BRAND_ID
```

Ejemplo:

```text
2026-07::BELDEN
```

La entidad puede almacenar exclusivamente valores declarados por el negocio:

- objetivo de venta;
- objetivo de GP;
- objetivo de margen;
- días laborales del periodo.

No almacena resultados derivados como cumplimiento, venta diaria esperada, run rate, forecast, health score o semáforos.

### Reglas

- `periodId` debe usar el formato `YYYY-MM`.
- `brandId` se normaliza con la misma convención de identificadores del Business Model.
- Los importes objetivo deben ser finitos y mayores o iguales a cero.
- El margen objetivo se expresa como razón decimal entre `0` y `1`.
- Los días laborales deben ser enteros mayores que cero.
- Debe existir al menos un objetivo de venta, GP o margen.
- En duplicados se conserva el primer registro válido y se reporta una incidencia estructurada.

### Consecuencias

- `BusinessDataModel` incorpora `brandTargets` sin mezclar objetivos con `brandPeriods`.
- El cálculo de cumplimiento se implementará posteriormente en Business Metrics o Business Intelligence.
- El Repository podrá añadir un Query Object especializado sin modificar esta entidad.
- La carga desde Excel o Data Center será un adaptador posterior; el núcleo ya recibe entradas normalizadas y tipadas.

---

## ADR-014 — Consultas de objetivos mediante un Query Object especializado

**Estado:** Aceptado  
**Fecha:** 2026-07-26

### Contexto

`BusinessDataModel` ya almacena objetivos comerciales de marca en el índice
`brandTargets`. Los consumidores necesitan consultar esos objetivos por marca,
periodo y clave compuesta sin acceder directamente a la estructura interna del
modelo ni reconstruir índices en cada módulo.

### Decisión

Business Repository expone el Query Object `CommercialTargetQueries` mediante
la propiedad pública:

```ts
repository.targets
```

El Query Object ofrece las operaciones oficiales:

- `getAll()`;
- `findBrandTarget(brandId, periodId)`;
- `findPeriodTargets(periodId)`;
- `findTargetsByBrand(brandId)`;
- `exists(brandId, periodId)`;
- `getAvailablePeriods()`;
- `getTargetedBrands()`.

Las búsquedas directas utilizan la clave canónica `PERIOD_ID::BRAND_ID`. Las
consultas por marca y periodo utilizan índices construidos una sola vez al crear
el Repository. Las colecciones devueltas son copias para impedir que un
consumidor modifique los índices internos.

### Límites

`CommercialTargetQueries` sólo recupera entidades declaradas. No calcula:

- cumplimiento;
- variación contra objetivo;
- run rate;
- venta diaria esperada;
- forecast;
- health score;
- estados o semáforos.

### Consecuencias

- Los consumidores dejan de leer directamente `model.brandTargets`.
- Las consultas por marca y periodo son consistentes y reutilizables.
- El futuro Target Attainment Engine puede depender del Repository sin conocer
  la implementación del índice.
- Business Repository conserva Query Objects especializados por dominio.

---

## ADR-015 — Target Attainment como motor derivado y puro

**Estado:** Aceptado  
**Fecha:** 2026-07-26

### Contexto

Los hechos mensuales de marca y los objetivos comerciales ya están disponibles a
través de Business Repository. Los consumidores necesitan comparar ambos mundos
sin duplicar fórmulas en Workspaces, componentes o narrativas ejecutivas.

### Decisión

El cumplimiento comercial se calcula mediante `TargetAttainmentEngine`, una
capa derivada que recibe `BusinessRepository` y produce
`BusinessTargetAttainment`.

El motor no modifica `BusinessDataModel` ni guarda KPIs derivados. Sus resultados
incluyen:

- cumplimiento y variación de venta;
- cumplimiento y variación de GP;
- cumplimiento y variación de margen;
- venta esperada al día;
- variación contra el plan temporal;
- proyección lineal al cierre;
- estado de desempeño.

Los días laborales transcurridos se reciben explícitamente mediante
`TargetAttainmentOptions`. El motor no consulta la fecha del sistema ni infiere
calendarios, para conservar resultados deterministas y testeables.

### Reglas matemáticas

- `attainment = actual / target` cuando el objetivo es distinto de cero.
- `variance = actual - target`.
- `expectedToDate = targetRevenue × elapsedWorkingDays / workingDays`.
- `projectedPeriodEnd = actualRevenue / elapsedWorkingDays × workingDays`.
- Un objetivo igual a cero conserva variación, pero no genera razón de cumplimiento.
- Si faltan días válidos, el ritmo y la proyección se reportan como no evaluables.
- Si existe objetivo pero no hechos, los valores aditivos reales se consideran cero
  y `hasActual` permanece en `false`.

### Consecuencias

- UI, Health Score, Executive Brief y Copilot podrán reutilizar un único contrato.
- Business Entities continúan siendo puras y sin KPIs.
- Las comparaciones son deterministas y no dependen del reloj del dispositivo.
- Business Snapshot podrá incorporar el resultado sin recalcular fórmulas.

---

## ADR-016 — Business Snapshot como contrato oficial de consumo

**Estado:** Aceptado  
**Fecha:** 2026-07-26

### Contexto

Los consumidores visuales y analíticos necesitan hechos, objetivos y resultados
de cumplimiento para una misma marca y periodo. Coordinar múltiples consultas en
cada Workspace duplicaría lógica de orquestación y aumentaría el riesgo de
inconsistencias.

### Decisión

Se introduce `BusinessSnapshotEngine` como capa derivada y de sólo lectura.
`getBrandSnapshot()` consolida, en un único contrato:

- identidad de marca y periodo;
- hechos mensuales;
- métricas reutilizables del Business Cube;
- objetivos declarados;
- resultado oficial de Target Attainment.

El Snapshot no se persiste dentro de `BusinessDataModel` y no modifica entidades.
Su marca temporal se deriva de `BusinessDataModel.generatedAt`, evitando depender
del reloj del dispositivo.

### Regla de consumo

> La UI no interpreta el negocio; representa Business Snapshots.

React, Workspaces, Health Score, Executive Brief y Copilot no deben recalcular
margen, ticket promedio, cumplimiento, variación, ritmo o forecast lineal.

### Consecuencias

- Brand Workspace contará con un contrato único y estable.
- Health Score y Executive Brief podrán consumir la misma fotografía del negocio.
- Los resultados permanecen testeables y deterministas.
- El patrón puede extenderse posteriormente a Customer, Product y Executive
  Snapshots sin convertir el motor actual en una abstracción prematura.

---

## ADR-017 — Business Health Score explicable y configurable

**Estado:** Aceptado  
**Fecha:** 2026-07-26

### Contexto

Brand Workspace necesita una señal ejecutiva comparable entre marcas sin ocultar
las causas del resultado. Un número opaco, calculado dentro de React o basado en
umbrales implícitos, dificultaría su auditoría y mantenimiento.

### Decisión

Se introduce `BusinessHealthScoreEngine` como motor derivado que consume
exclusivamente `BusinessBrandSnapshot`. El resultado contiene:

- score normalizado de 0 a 100;
- clasificación ejecutiva;
- componentes explicables;
- valor real, benchmark, peso e impacto de cada componente;
- recomendaciones estructuradas;
- metadatos deterministas heredados del Snapshot.

Los pesos se definen mediante `BusinessHealthWeights` y pueden sustituirse por
configuración sin modificar el motor. La ponderación predeterminada es:

| Componente | Peso |
|---|---:|
| Venta | 25 |
| GP | 20 |
| Margen | 15 |
| Forecast | 15 |
| Ritmo | 10 |
| Clientes | 5 |
| Productos | 5 |
| Tendencia | 5 |

### Componentes no evaluables

Clientes, productos y tendencia requieren benchmarks explícitos. El motor no
inventa mínimos ni interpreta un conteo aislado como saludable. Cuando un
componente carece de benchmark, se marca `not-evaluable` y su peso se excluye del
denominador. El score se renormaliza únicamente sobre dimensiones evaluables.

### Clasificación

- 95–100: Excelente.
- 85–94.9: Muy saludable.
- 70–84.9: Saludable.
- 55–69.9: Atención.
- 40–54.9: Riesgo.
- Menor a 40: Crítico.
- Sin componentes evaluables: No evaluable.

### Consecuencias

- La UI puede explicar por qué una marca obtiene determinada calificación.
- El Copilot podrá usar componentes y recomendaciones sin reinterpretar KPIs.
- Los pesos pueden evolucionar por decisión comercial sin cambiar las fórmulas.
- No se crean benchmarks arbitrarios dentro del Core.
- Health Score permanece desacoplado de React y de la persistencia.

---

## ADR-018 — Narrative Engine determinístico sobre contratos derivados

**Estado:** Aceptado  
**Fecha:** 2026-07-26

### Contexto

Los Workspaces requieren explicar el estado del negocio sin duplicar reglas de
interpretación en React, reportes, notificaciones o Copilot. Generar narrativa
directamente desde filas, Repository o componentes visuales produciría textos
inconsistentes y difíciles de auditar.

### Decisión

Se introduce `BusinessNarrativeEngine` como fachada determinística. El motor
consume exclusivamente un `BusinessBrandSnapshot` y su `BusinessHealthScore`
correspondiente, valida que ambos contratos pertenezcan a la misma entidad y
produce un `BusinessExecutiveBrief` estructurado.

El Brief contiene:

- resumen ejecutivo;
- clasificación y score de salud;
- fortalezas;
- riesgos;
- oportunidades;
- recomendaciones;
- metadatos determinísticos heredados del Snapshot.

Los textos se construyen mediante reglas explícitas. El módulo no utiliza IA,
no accede al Repository, no lee filas normalizadas y no depende de React.

### Consecuencias

- La misma narrativa puede utilizarse en Brand Workspace, PDF, correo, chat y
  contexto de Copilot.
- Los resultados son reproducibles y testeables.
- La UI representa el Brief sin interpretar KPIs.
- Un futuro LLM podrá enriquecer la conversación, pero no sustituirá la lectura
  base auditable del Core.

---

## ADR-019 — Public Business Core Facade and Architecture Boundaries

**Estado:** Aceptado  
**Fecha:** 2026-07-26

### Contexto

El Sprint B incorporará Workspaces React que consumirán múltiples motores del Business Core. Sin una fachada estable, la UI podría depender de archivos internos y aumentar el acoplamiento.

### Decisión

1. `src/core/business/index.ts` será la fachada pública principal.
2. Cada módulo conservará su barrel export local.
3. El Business Core no puede depender de React ni de capas de presentación.
4. Los formatos de números, porcentajes y monedas se centralizan en `business/formatting`.
5. Los límites se verifican mediante pruebas automatizadas.

### Consecuencias

- Los Workspaces disponen de contratos estables.
- Los módulos internos pueden reorganizarse con menor impacto.
- El formato es consistente entre Narrative y futuros Workspaces.
- Las regresiones arquitectónicas se detectan durante `npm run test`.
