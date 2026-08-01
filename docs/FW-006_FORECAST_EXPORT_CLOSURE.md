# FW-006 - Forecast Export, Executive Summary & Closure

## Objetivo

Cerrar funcionalmente Forecast Workspace con una salida ejecutiva reproducible que conserve el escenario, los filtros, los cortes y la metodologia oficial del Business Core.

La exportacion consume exclusivamente:

```text
ForecastWorkspaceModel
        |
        +--> ForecastExecutiveSummary
        |
        +--> ForecastExecutiveExportPayload
        |
        +--> XLSX bajo demanda
```

No se recalculan formulas de Forecast dentro del exportador.

## Resumen ejecutivo

`buildForecastExecutiveSummary()` genera una lectura deterministica con:

- escenario activo;
- contexto de filtros;
- panorama de cierre y cumplimiento;
- perspectiva comercial y de cobertura;
- hallazgos de cierre, brecha, riesgo, balance y sustitucion.

El resumen no altera `ForecastWorkspaceModel` ni publica recomendaciones distintas a las ya disponibles en el modelo.

## Libro Excel

El boton `Exportar Excel` genera:

```text
PM-Intelligence-Forecast-{periodo}-{escenario}.xlsx
```

El archivo contiene seis hojas.

### 1. Resumen Ejecutivo

- periodo y escenario;
- corte de ventas e inventario;
- filtros aplicados;
- resumen y perspectiva;
- KPIs comerciales y operativos;
- hallazgos;
- comparacion de escenarios.

### 2. Forecast por Marca

- venta actual y proyectada;
- GP, cantidad y margen;
- objetivo, cumplimiento y brecha;
- confianza;
- productos criticos, agotados, faltantes y exceso;
- cobertura promedio;
- navegacion a Brand Workspace.

### 3. Riesgos por Producto

Incluye todos los riesgos que coinciden con el escenario y filtros activos, no solo el Top 10 visible en pantalla.

### 4. Oportunidades

Incluye todas las oportunidades filtradas, rutas al producto y al sustituto conciliado.

### 5. Cobertura y Balance

- demanda esperada y restante;
- disponible y entradas agregadas;
- saldos despues de demanda;
- valor total y afectado;
- Superseded y recuperaciones;
- distribucion por estado de cobertura.

### 6. Metodologia y Fuentes

- metodologia `baseline-v1` y `forecast-inventory-v1`;
- fuentes utilizadas;
- escenario y filtros;
- explainability;
- limitaciones;
- Purchasing como fuente futura opcional.

## Exportacion bajo demanda

`xlsx` se carga dinamicamente solo al solicitar el archivo. La pantalla conserva estados de generacion, exito y error.

## Impresion y PDF

Se incorporan reglas especificas para:

- ocultar controles interactivos;
- expandir la tabla por marca;
- repetir encabezados de tabla;
- iniciar marcas, prioridades y metodologia en paginas nuevas;
- evitar cortes internos de tarjetas cuando sea posible.

## Restricciones

- No modifica Forecast Baseline Engine.
- No modifica Forecast Inventory Intelligence.
- No introduce fechas de llegada para `In Transit` u `On Order`.
- No sustituye Purchasing Visibility.
- No ejecuta acciones automaticas sobre inventario, precios o compras.

## Cierre

Con FW-006 quedan completadas:

- FW-001 Data Foundation;
- FW-002 Baseline Projection;
- FW-003 Coverage & Risk;
- FW-004 Workspace Model;
- FW-005 Workspace UI;
- FW-006 Export, Executive Summary & Closure.

Forecast Workspace queda listo para alimentar Pricing Laboratory y, posteriormente, Executive Workspace.
