# FW-010 — Forecast UI & Export Final Closure

## Objetivo

Cerrar Forecast Workspace conectando la experiencia visual, el resumen ejecutivo, la impresión y la exportación Excel al motor `project-aware-v1` implementado en FW-009.

## Fórmula publicada

```text
Forecast combinado MXN
=
Forecast transaccional
+ Facturación real de proyectos
+ Pipeline maduro pendiente
```

El pipeline potencial de status 03–04 permanece visible como upside y no se suma al cierre oficial.

## Experiencia de usuario

La ruta `/forecast` publica de forma separada:

- venta total real;
- venta transaccional real;
- facturación real de proyectos;
- Forecast transaccional;
- pipeline maduro 05–06;
- cierre Project-Aware combinado;
- pipeline potencial bruto y ponderado;
- objetivo, cumplimiento, brecha, GP, margen y confianza;
- cobertura y prioridades de inventario.

## Pipeline de proyectos

Cada contribución visible conserva:

- ID y nombre del proyecto;
- marca principal;
- status y etapa de Forecast;
- tratamiento incluido, upside, bloqueado o excluido;
- fecha estimada de facturación;
- monto y moneda originales;
- tipo de cambio del periodo;
- monto convertido y ponderado en MXN;
- GP y margen estimados;
- fuente del margen;
- estado de conversión e incidencias.

## Disponibilidad oficial

El Workspace muestra estado `blocked` cuando `project-aware-v1` detecta una incidencia bloqueante. El resultado permanece visible para auditoría, pero la interfaz lo identifica explícitamente como provisional.

Los controles incluyen conciliación documental, conflictos factura–proyecto, notas de crédito anómalas, documentos anulados presentes en ventas, proyectos maduros sin fecha, monto o moneda, tipos de cambio faltantes y proyectos repetidos.

## Exportación Excel 2.0

El libro contiene siete hojas:

1. Resumen Ejecutivo.
2. Forecast por Marca.
3. Pipeline de Proyectos.
4. Riesgos por Producto.
5. Oportunidades.
6. Cobertura y Balance.
7. Metodología y Fuentes.

La exportación refleja el escenario, filtros, componentes por origen, calidad, tasas, incidencias, explainability y limitaciones activas. Los rankings exportan todos los registros coincidentes, aunque la pantalla conserve un Top 10 ejecutivo.

## Impresión y PDF

La salida de navegador oculta controles interactivos, repite encabezados de tablas y distribuye en páginas independientes el pipeline, calidad, cobertura, marcas, prioridades y metodología.

## Restricciones preservadas

- El pipeline abierto no genera cantidades ni demanda por SKU porque el reporte no contiene detalle confiable de artículos.
- La facturación real se asigna por la marca efectiva de las líneas de ventas.
- El pipeline pendiente se asigna a la Marca principal.
- Purchasing continúa como fuente futura opcional y no bloqueante.
- Los Workspaces no recalculan fórmulas del Business Core.

## Cierre

Con FW-010, Forecast Workspace queda cerrado funcionalmente desde la fundación de datos hasta la lectura ejecutiva, auditoría, exportación e impresión. El siguiente dominio estratégico es Pricing Laboratory Workspace.
