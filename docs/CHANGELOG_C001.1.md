# C-001.1 — Customer Core Migration

Versión: `0.21.0-C001.1`

## Objetivo

Consolidar Customer Intelligence sobre `BusinessDataModel` y `BusinessRepository`, usando `customerPeriods` como fuente temporal oficial y eliminando cualquier necesidad de calcular inteligencia directamente desde `NormalizedSalesRow[]`.

## Cambios

- Se formalizó `BusinessCustomerPeriod` como agregado mensual de cliente.
- Se agregó cobertura de ubicaciones por periodo de cliente.
- Se agregó `activePeriods` a `BusinessCustomer` para conocer meses con actividad sin recorrer filas de ventas.
- Se creó `buildCustomerPeriodIndexes()` con índices por cliente y por periodo.
- `CustomerQueries` consume los índices reutilizables del repositorio.
- Se agregaron consultas por periodo y conteo de periodos activos.
- Se ampliaron pruebas para ingresos, GP, cantidad, documentos, marcas, productos, ubicaciones e índices temporales.

## Arquitectura resultante

```text
NormalizedSalesRow[]
        ↓
buildBusinessDataModel
        ↓
BusinessDataModel.customerPeriods
        ↓
CustomerPeriodIndexes
        ↓
BusinessRepository.customer
        ↓
buildCustomerIntelligence
```

`NormalizedSalesRow[]` permanece únicamente en la frontera de importación y construcción del modelo. Customer Intelligence opera sobre entidades de negocio y consultas del repositorio.
