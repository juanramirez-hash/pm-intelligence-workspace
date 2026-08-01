# Public Business Core API

## Punto de entrada recomendado

```ts
import {
  BusinessNarrativeEngine,
  BusinessSnapshotEngine,
  BusinessHealthScoreEngine,
  BusinessRepository,
  formatBusinessPercent,
} from '@/core/business'
```

## Contratos estables

Los siguientes módulos forman la API pública del Core:

- `attainment`
- `builders`
- `cube`
- `formatting`
- `forecast`
- `health`
- `metrics`
- `models`
- `narrative`
- `repository`
- `snapshots`
- `targets`

## Forecast API

`BusinessRepository` expone el baseline oficial mediante:

```ts
repository.forecast.getFoundation()
repository.forecast.getPortfolioBaselineProjection()
repository.forecast.getBaselineProjections('brand')
repository.forecast.getBaselineProjections('product')
repository.forecast.findBaselineProjection('brand', brandId)
repository.forecast.findBaselineProjection('product', productId)

repository.forecast.getInventoryIntelligenceReport()
repository.forecast.getProductInventoryInsights()
repository.forecast.findProductInventoryInsight(productId)
repository.forecast.getTopInventoryIntelligence(limit)
repository.forecast.findInventoryInsightsByCoverage(status)
```

Los resultados se devuelven clonados. Ningún Workspace debe modificar escenarios, pesos, confianza, cobertura, señales o métodos dentro del Core.

`getInventoryIntelligenceReport()` utiliza la proyección oficial de FW-002 y el corte activo de Inventory. Las unidades `inTransit` y `onOrder` se tratan como entradas agregadas sin fecha hasta que Purchasing Visibility esté conectado.


## Project Billing Reconciliation API

FW-008 expone la separación histórica por origen mediante:

```ts
repository.salesTransactions.getAllDocuments()
repository.salesTransactions.findDocument(documentNumber)
repository.salesTransactions.getLinesByDocument(documentNumber)
repository.salesTransactions.getLinesByPeriod(periodId)

repository.projectBillingReconciliation.getReport()
repository.projectBillingReconciliation.getPeriods()
repository.projectBillingReconciliation.findPeriod(periodId)
repository.projectBillingReconciliation.getBrandPeriods(brandId)
repository.projectBillingReconciliation.getDocumentsByStatus(status)
repository.projectBillingReconciliation.findProject(projectId)
repository.projectBillingReconciliation.findCustomer(customerId)
```

La conciliación utiliza `Document Number` como vínculo y toma Revenue, GP, cantidad, periodo, cliente y marca de Sales Repository. El importe fuente del reporte de proyectos se conserva para auditoría, pero no sustituye los importes oficiales ya normalizados en MXN.

Los documentos faltantes, anulados o conflictivos no se descuentan de la venta transaccional. Esta regla mantiene la identidad:

```text
Venta total = Venta transaccional + Facturación de proyectos conciliada
```

## Regla de consumo

Los Workspaces no deben importar archivos internos como:

```text
core/business/health/healthComponents
core/business/narrative/executiveRisks
core/business/cube/engine/executors/...
```

Deben consumir la fachada pública o el `index.ts` oficial del módulo.

## Estabilidad

- Los contratos exportados por la fachada se consideran públicos.
- Los archivos internos pueden reorganizarse sin afectar consumidores.
- Todo breaking change futuro requiere ADR, versión y migración documentada.
