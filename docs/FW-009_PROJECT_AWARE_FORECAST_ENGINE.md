# FW-009 — Project-Aware Forecast Engine

## Objetivo

Reconstruir el Forecast mensual separando la venta recurrente o transaccional de la facturación originada por proyectos y del pipeline maduro aún pendiente de facturar.

## Fórmula oficial

```text
Forecast total MXN
=
Forecast transaccional
+
Facturación real de proyectos
+
Pipeline maduro pendiente
```

La fórmula evita proyectar dos veces la facturación de proyectos y conserva trazabilidad sobre el origen de cada componente.

## Componentes

### Forecast transaccional

- Se construye con las series históricas reconciliadas de FW-008.
- Excluye los documentos identificados y conciliados como facturación de proyectos.
- Reutiliza `baseline-v1`: ritmo del periodo, promedio histórico, tendencia reciente y referencia estacional.
- Mantiene escenarios Conservador, Esperado y Acelerado.

### Facturación real de proyectos

- Se obtiene de Sales Repository mediante `Document Number`.
- Revenue, GP, cantidad, periodo, cliente y marca ya están normalizados en MXN.
- Las notas de crédito conservan el signo de Ventas.
- Los anulados no contribuyen.
- Los documentos faltantes o conflictivos bloquean el carácter oficial del forecast.

### Pipeline maduro pendiente

Se incluyen al 100%:

- `05 Esperando OC`.
- `06 Surtido parcialmente`.

Condiciones:

- Fecha estimada de facturación dentro del periodo actual.
- Monto por cerrar mayor que cero.
- Proyecto no repetido.
- Moneda declarada.
- Tipo de cambio disponible cuando la moneda no sea MXN.

### Pipeline potencial

Los status siguientes permanecen separados:

- `03 Pendiente por usuario final`.
- `04 Pendiente por integrador`.

Se publican dos valores:

- Upside bruto convertido a MXN.
- Upside ponderado por la Probabilidad de cierre declarada.

No forman parte de los escenarios oficiales de FW-009.

## Conversión monetaria

```text
Monto por cerrar MXN
=
Monto por cerrar origen
×
Tipo de cambio del periodo estimado de facturación
```

- MXN utiliza factor 1.
- USD y otras monedas requieren una tasa explícita del periodo.
- No existe tasa predeterminada ni conversión oculta.
- La ausencia de tasa bloquea el proyecto maduro y marca `officialAvailable = false`.

## GP estimado del pipeline

El margen de referencia se resuelve en este orden:

1. Margen histórico de facturación de proyectos para la marca.
2. Margen histórico de facturación de proyectos del portafolio.
3. Margen histórico general de la marca.
4. Margen histórico general del portafolio.

Cuando no existe referencia, Revenue puede seguir visible, pero el GP queda incompleto y el forecast se clasifica como parcial.

## Cantidad y cobertura

El reporte de proyectos abiertos no contiene detalle confiable por SKU. Por ello:

- El pipeline pendiente aporta cero unidades.
- No se distribuye artificialmente entre productos.
- Forecast Inventory Intelligence conserva su demanda por producto basada en el baseline existente.
- FW-010 mostrará esta limitación de forma explícita.

## Controles bloqueantes

- Facturación de proyecto no localizada en Ventas.
- Documento vinculado a más de un proyecto activo.
- Nota de crédito con Revenue positivo.
- Documento anulado todavía presente en Ventas.
- Proyecto maduro sin fecha estimada de facturación.
- Monto por cerrar inválido.
- Moneda ausente.
- Tipo de cambio ausente.
- Proyecto maduro marcado como repetido.

Los resultados provisionales siguen disponibles para auditoría, pero no se consideran oficiales.

## API pública

```ts
repository.forecast.getProjectAwareReport()
repository.forecast.getProjectAwarePortfolioProjection()
repository.forecast.getProjectAwareBrandProjections()
repository.forecast.findProjectAwareBrandProjection(brandId)
```

También existe el método de fachada:

```ts
repository.getProjectAwareForecastReport()
```

## Contratos principales

- `ProjectAwareForecastReport`.
- `ProjectAwareForecastProjection`.
- `ProjectAwareForecastScenarioProjection`.
- `ProjectAwareForecastProjectContribution`.
- `ProjectAwareForecastPipelineSummary`.
- `ProjectAwareForecastQualityProfile`.

## Estado de cierre

FW-009 entrega el motor, calidad, escenarios, explainability y API. No modifica todavía la pantalla `/forecast` ni las hojas del exportador. Ese cierre corresponde a FW-010.
