# FW-005 - Forecast Workspace UI

## Objetivo

Convertir `ForecastWorkspaceModel` en la interfaz visual oficial de Forecast Workspace sin recalcular formulas de negocio dentro de React.

La pagina consume exclusivamente:

```text
Business Repository
        |
        v
Forecast Baseline Engine
        |
        v
Forecast Inventory Intelligence
        |
        v
ForecastWorkspaceModel
        |
        v
ForecastWorkspacePage
```

## Ruta

`/forecast` deja de utilizar `PlaceholderPage` y carga de forma diferida:

```ts
ForecastWorkspacePage
```

## Executive Hero

El encabezado presenta:

- cierre proyectado;
- cumplimiento esperado;
- brecha contra objetivo;
- margen y GP proyectados;
- score de confianza;
- venta acumulada, objetivo, ritmo diario y avance laboral;
- periodo, corte de ventas y corte de inventario;
- estado listo, parcial o no disponible.

## Escenarios

El selector permite cambiar entre:

- conservador;
- esperado;
- acelerado.

La UI solo cambia `scenarioId` y vuelve a solicitar el modelo FW-004. No modifica pesos, factores ni datos base.

## Filtros

La pagina permite filtrar por:

- texto;
- marca;
- cobertura;
- prioridad;
- confianza.

Los filtros afectan inventario, cobertura, marcas y rankings. La proyeccion consolidada del portafolio permanece oficial.

## Secciones visuales

1. KPIs ejecutivos.
2. Segmentacion del Forecast.
3. Mapa de cobertura.
4. Balance de demanda y suministro.
5. Forecast ejecutivo por marca.
6. Prioridades de riesgo.
7. Oportunidades de intervencion.
8. Explainability.
9. Limitaciones y calidad de fuente.

## Navegacion

Los contratos de FW-004 se representan como enlaces a:

- `/brands/:brandId`;
- `/products/:productId`;
- expediente del producto sustituto cuando esta conciliado.

## Estados sin datos

Cuando no existe Business Repository o proyeccion consolidada, la pagina conserva el shell y muestra la razon de indisponibilidad, limitaciones y acceso a Data Center.

## Restricciones

- No introduce formulas nuevas.
- No modifica Forecast Baseline Engine.
- No modifica Forecast Inventory Intelligence.
- No inventa fechas para `In Transit` u `On Order`.
- No implementa exportacion Excel; corresponde a FW-006.
- No convierte recomendaciones en acciones automaticas.
