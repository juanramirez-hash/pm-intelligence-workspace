# FW-008 — Project Billing Reconciliation

## Estado

- **Versión:** 0.36.0
- **Dominio:** Forecast / Data Center / Business Core
- **Objetivo:** identificar la facturación real de proyectos dentro de Sales Repository y separar una serie histórica transaccional auditable.

## 1. Principio contable

El reporte de Facturación de proyectos identifica el origen comercial del documento. Los importes oficiales provienen del repositorio de ventas, donde Revenue y Gross Profit ya están normalizados en MXN.

```text
Venta total
=
Venta transaccional
+
Facturación neta de proyectos conciliada
```

No se suma la columna `Amount` del archivo de proyectos para calcular venta real. Ese valor permanece como evidencia de origen y conciliación.

## 2. Llave de conciliación

```text
Project Billing.Document Number
↔
Sales.Document Number
```

La comparación normaliza espacios, mayúsculas y formato de identificador. El `Internal ID` del reporte de proyectos sigue siendo la identidad del documento de origen, pero no reemplaza el número de factura para enlazar ventas.

## 3. Materialización transaccional de ventas

FW-008 incorpora dos colecciones internas al `BusinessDataModel`:

```text
salesTransactionLines
salesDocuments
```

Cada línea conserva:

- periodo y fecha;
- número de documento;
- marca real facturada;
- cliente;
- producto conciliado;
- ubicación y ejecutivo;
- moneda;
- Revenue, GP y cantidad.

Cada documento agrega sus líneas y conserva sets de periodos, marcas, clientes, productos, ubicaciones y monedas. Los Workspaces y motores posteriores consumen estas colecciones únicamente mediante `BusinessRepository`; no dependen de `NormalizedSalesRow[]`.

## 4. Estados de conciliación

| Estado | Tratamiento |
|---|---|
| `matched` | Se clasifica como facturación de proyecto usando métricas oficiales de ventas |
| `missing_sales_document` | No se descuenta de venta transaccional hasta encontrar la factura |
| `voided` | Se conserva para auditoría y su contribución de proyecto es cero |
| `conflict` | Más de un proyecto activo reclama el mismo documento; se bloquea para impedir doble conteo |

## 5. Facturas y notas de crédito

- Las facturas `F...` aportan el Revenue y GP registrado en ventas.
- Las notas de crédito `NC...` conservan el signo real del Sales Repository.
- Una nota de crédito positiva genera alerta de calidad.
- Los documentos anulados no se clasifican como facturación de proyectos.
- Si un documento anulado todavía aparece en ventas, se reporta como excepción para revisión.

La facturación neta de proyectos se obtiene naturalmente de la suma de facturas y notas de crédito conciliadas.

## 6. Asignación por marca, cliente y periodo

La atribución utiliza los datos reales de cada línea de ventas:

- **Marca:** marca del artículo facturado, no `Marca principal` del proyecto.
- **Cliente:** cliente de Sales Repository.
- **Periodo:** fecha real del documento de ventas.
- **Revenue y GP:** importes oficiales en MXN.

Esto permite que un proyecto multimarcas se distribuya correctamente según la facturación real sin inventar proporciones.

## 7. Series resultantes

El reporte de conciliación produce:

- totales generales;
- serie mensual total, proyectos y transaccional;
- serie mensual por marca;
- resumen por proyecto;
- resumen por cliente;
- auditoría por documento;
- calidad de conciliación.

Cada serie cumple:

```text
Transaccional = Total - Proyecto conciliado
```

## 8. Controles de calidad

FW-008 detecta:

- documentos de proyecto no encontrados en ventas;
- documentos relacionados con más de un proyecto;
- proyectos históricos sin maestro vigente;
- discrepancias entre periodo del reporte y periodo de ventas;
- discrepancias de cliente;
- notas de crédito con Revenue positivo;
- documentos anulados presentes en ventas;
- cobertura documental conciliada.

Los faltantes y conflictos quedan excluidos de la facturación de proyectos hasta su corrección. Esta regla es conservadora y evita reducir artificialmente la venta transaccional.

## 9. Data Center

Data Center incorpora un panel de conciliación con:

- venta total;
- facturación de proyectos;
- venta transaccional;
- cobertura documental;
- serie de los últimos periodos;
- documentos faltantes;
- conflictos factura–proyecto;
- notas de crédito;
- anulados;
- proyectos huérfanos.

El panel se activa cuando existe Facturación de proyectos cargada. Cuando faltan ventas, la cobertura queda en cero y los documentos activos aparecen como pendientes de conciliación.

## 10. Business Repository

Nuevas APIs:

```text
repository.salesTransactions
repository.projectBillingReconciliation
```

Consultas principales:

- documento y líneas de venta por número;
- líneas y documentos de venta por periodo;
- reporte completo de conciliación;
- serie por periodo;
- serie por marca;
- documentos por status;
- resumen por proyecto;
- resumen por cliente.

## 11. Fuera de alcance

FW-008 no realiza todavía:

- reconstrucción del Forecast Baseline con venta transaccional;
- incorporación del pipeline 05–06;
- conversión del monto pendiente USD→MXN dentro del Forecast;
- estimación de GP del pipeline abierto;
- modificación de escenarios;
- actualización de la UI y exportación final del Forecast.

## 12. Siguiente entrega

**FW-009 — Project-Aware Forecast Engine** utilizará las series transaccionales de FW-008 y combinará:

```text
Forecast transaccional
+
Facturación real de proyectos
+
Pipeline maduro pendiente convertido a MXN
```
