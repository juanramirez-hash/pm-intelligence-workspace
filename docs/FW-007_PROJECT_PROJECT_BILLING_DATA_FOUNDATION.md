# FW-007 — Project & Project Billing Data Foundation

## Estado

- **Versión:** 0.35.0
- **Dominio:** Forecast / Data Center / Business Core
- **Objetivo:** incorporar proyectos, facturación histórica de proyectos y tipos de cambio mensuales como fuentes oficiales y auditables.

## 1. Contexto

Forecast Workspace ya dispone de baseline estadístico, escenarios, cobertura de inventario, UI y exportación. Sin embargo, el cierre comercial no puede considerarse definitivo mientras no separe:

1. venta transaccional;
2. facturación real originada por proyectos;
3. pipeline maduro pendiente de facturar.

FW-007 no modifica todavía la fórmula del Forecast. Construye la fundación de datos necesaria para que FW-008 realice la conciliación documento–proyecto–ventas y FW-009 implemente el Forecast consciente de proyectos.

## 2. Fuentes incorporadas

### 2.1 Proyectos

Importador construido contra el reporte real `TSMisProyectosPMsResults641.xls`.

Campos de negocio principales:

- `Internal ID` e `ID` del proyecto;
- cliente, usuario final y responsables;
- marca principal;
- `Status` y probabilidad de cierre;
- fecha estimada de cierre;
- **fecha estimada de facturación**;
- **monto por cerrar**;
- moneda;
- indicador de proyecto repetido.

Clasificación oficial:

| Status | Etapa de Forecast | Tratamiento futuro |
|---|---|---|
| 01–02 | `early` | Excluido del Forecast oficial |
| 03–04 | `potential` | Upside visible, no comprometido |
| 05–06 | `mature` | Pipeline maduro pendiente |
| 07 | `realized` | Excluido del pipeline abierto |
| 08 | `cancelled` | Excluido |

La carga funciona como **upsert por Internal ID**. Una carga semanal actualiza el snapshot vigente sin duplicar proyectos.

### 2.2 Facturación de proyectos

Importador construido contra el reporte real `TSFacturasporproyectoporitemResults754.xls`, con historia desde enero de 2025 hasta julio de 2026.

Se conserva la granularidad por artículo para auditoría y se materializa además un documento agregado por:

```text
Internal ID del documento
```

El índice de conciliación futuro utiliza:

```text
Document Number
```

Reglas:

- facturas `F...` se clasifican como `invoice`;
- notas de crédito `NC...` se clasifican como `credit_note`;
- documentos anulados se conservan con `isVoided = true`;
- duplicados exactos de origen se consolidan por una llave determinística de línea;
- una nueva carga reemplaza las líneas de los documentos presentes y conserva otros documentos históricos.

El importe fuente se conserva únicamente para auditoría. La facturación oficial en MXN se obtendrá en FW-008 desde Sales Repository, enlazando por número de documento.

### 2.3 Tipos de cambio

Data Center incorpora importador y editor manual para registrar:

- periodo `AAAA-MM`;
- moneda origen;
- moneda destino;
- tipo de cambio;
- fuente o referencia;
- fecha efectiva y fecha de registro.

Regla operativa inicial:

```text
USD → MXN
```

No existe tipo de cambio predeterminado ni oculto. Cuando falta la tasa del periodo, la conversión devuelve un resultado explícito `missing_rate` y no incorpora el pipeline a cálculos oficiales.

## 3. Persistencia local

IndexedDB avanza a versión 7 e incorpora:

- `projectMetadata`;
- `projectBillingMetadata`;
- `projectBillingChunks`;
- `exchangeRateMetadata`.

La facturación de proyectos se guarda en bloques de 2,500 líneas para evitar objetos monolíticos y mantener una recuperación verificable por conteo total.

## 4. Business Core

Nuevas entidades:

- `BusinessProject`;
- `BusinessProjectBillingDocument`;
- `BusinessProjectBillingLine`;
- `BusinessExchangeRate`.

Nuevas colecciones materializadas en `BusinessDataModel`:

```text
projects
projectBillings
projectBillingLines
exchangeRates
```

Nuevas APIs de `BusinessRepository`:

```text
repository.projects
repository.projectBillings
repository.exchangeRates
```

Consultas incluidas:

- proyectos por periodo estimado de facturación;
- pipeline maduro y potencial por periodo;
- documentos y líneas por periodo;
- búsqueda por número de documento;
- documentos activos para conciliación;
- proyectos históricos huérfanos;
- tipos de cambio por periodo;
- conversión auditable y bloqueo por tasa ausente.

## 5. Validación con los archivos reales

La implementación fue verificada contra los encabezados y filas de ambos reportes recibidos:

### Proyectos

- 3,772 proyectos procesados;
- 365 proyectos activos en etapas 01–06;
- 128 proyectos maduros en etapas 05–06;
- `PROY3807` reconocido como etapa madura, fecha 2026-07-31 y USD 1,000 por cerrar.

### Facturación de proyectos

- 11,035 filas de origen;
- 11,016 líneas únicas después de consolidar 19 duplicados exactos;
- 2,830 documentos;
- 487 proyectos;
- 2,623 facturas;
- 207 notas de crédito;
- 62 documentos anulados;
- cobertura del 2025-01-02 al 2026-07-31.

## 6. Fuera de alcance

FW-007 no realiza todavía:

- conciliación contra las filas del repositorio de ventas;
- separación de venta transaccional y venta por proyectos;
- cálculo de revenue o GP oficial por proyecto;
- conversión automática del pipeline dentro del Forecast;
- modificación de escenarios, baseline o KPIs de Forecast;
- distribución del monto pendiente entre SKU o marcas secundarias.

## 7. Siguientes entregas

- **FW-008 — Project Billing Reconciliation:** enlazar documentos de proyectos con ventas en MXN y separar venta transaccional.
- **FW-009 — Project-Aware Forecast Engine:** combinar Forecast transaccional, facturación real de proyectos y pipeline maduro convertido.
- **FW-010 — Forecast UI & Export Final Closure:** visualizar componentes por origen y ampliar la exportación ejecutiva.
