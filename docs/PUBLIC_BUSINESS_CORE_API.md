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
- `pricing`
- `repository`
- `snapshots`
- `targets`

## Pricing API

PL-001 publishes the Price Core through:

```ts
repository.prices.getAll()
repository.prices.findById(priceId)
repository.prices.getByProduct(productId)
repository.prices.findCurrentByProduct(productId, currency)
repository.prices.getByBrand(brandId)
repository.prices.getByCurrency(currency)
repository.prices.getByMarginBand(marginBand)
repository.prices.getByPricingGroup(groupId)
repository.prices.findByMargin(minimum, maximum)
repository.prices.findByGrossProfit(minimum, maximum)
repository.prices.getScenarios(priceId)
repository.prices.findScenario(scenarioId)
repository.prices.getScenariosByPricingGroup(groupId)
repository.prices.getSummary()
repository.prices.getQualityIssues()
```

BusinessRepository facade methods:

```ts
repository.getPrices()
repository.getPricingSummary()
repository.findCurrentPriceByProduct(productId, currency)
```

Rates are decimal fractions. Gross Margin uses selling price as denominator,
Gross Profit is a unit amount, Discount Rate is measured from List Price and
Pricing Factor is List Price divided by Cost. Scenario records are independent
from their base price and cannot mutate it through repository results.

PL-001 does not publish recommendations, minimum price, target price or
commercial Pricing Group policies. Those contracts belong to later Pricing
Laboratory sprints.

### Pricing source integration

PL-002 feeds the same public contracts through Data Center:

```ts
buildBusinessIntelligence(rows, {
  prices: normalizedPricing,
})
```

The importer owns spreadsheet detection, aliases, source-currency isolation
and persistence. Business Core continues to own all price mathematics and
quality rules.

For the ERP dual-currency source, MXN and USD are independent facts. A USD
price is built only from an explicit foreign-currency cost when the purchase
currency is USD; no hidden exchange rate or mixed-currency calculation is
allowed. `Quantity Pricing Schedule` remains source metadata and does not
become a commercial Pricing Group automatically.

Pricing is persisted in Data Center IndexedDB and re-enters Core exclusively
through `BuildBusinessIntelligenceOptions.prices`. Workspaces must consume
`BusinessRepository.prices`, not `NormalizedPricingRow[]`.

### Price Engineering Laboratory

PL-003 publishes a calculation-only engine through the public `pricing` module:

```ts
evaluatePriceLaboratory({
  price,
  scenarios,
  defaultGuardrails,
})

new PriceEngineeringEngine().evaluate({
  price,
  scenarios,
})
```

Supported scenario bases are `selling_price`, `discount_rate`,
`target_gross_margin`, `target_gross_profit`, `selling_price_factor` and
`additional_discount`. Additional discounts can be compounded over List Price
or over the current Selling Price.

The engine returns metrics, deltas, signals, explainability and a status of
`valid`, `warning`, `blocked` or `invalid`. Blocking behavior exists only when
the caller supplies a blocking guardrail. PL-003 does not embed commercial
thresholds or infer Silver, Gold or Platinum discounts.

Every result declares:

```ts
executionMode: 'simulation-only'
isolation: {
  mutatesSourcePrice: false,
  persistsScenarioResults: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

The engine preserves the source currency and performs no exchange-rate
conversion. Results are disposable laboratory calculations and are not price
master changes, approvals or commercial instructions.

### Pricing Group Templates and Commercial Guardrails

PL-004 publishes metadata-only templates and a simulation adapter:

```ts
getStandardPricingLaboratoryTemplates()
findPricingLaboratoryTemplateDefinition('SILVER')

evaluatePricingTemplateSet({
  price,
  templates,
  guardrailProfiles,
  defaultGuardrails,
})

new PricingTemplateEngine().evaluate({
  price,
  templates,
})
```

The standard template identifiers are `PROMOTION`, `SILVER`, `GOLD`,
`PLATINUM`, `PROJECT` and `CUSTOM`. Definitions contain labels, scenario kinds,
Pricing Group identifiers and suggested basis types only. They never contain
discounts, prices, margins, GP targets, floor prices or approval thresholds.

Every configuration must provide an explicit `PriceEngineeringScenarioBasis`.
Optional scope can restrict a simulation by brand, product and currency.
Guardrail precedence is deterministic and explicit: default guardrails, then
the selected profile, then template-specific guardrails. More specific layers
replace a guardrail of the same type and produce an auditable information
signal.

Template results are classified as `evaluated`, `disabled`, `not_applicable`
or `invalid`. The adapter delegates calculations to `price-engineering-v1` and
preserves the same `simulation-only` isolation contract. PL-004 does not
persist templates or results and cannot update any price or Workspace.

### Pricing Laboratory Workspace Model

PL-005 publishes the UI-independent orchestration model from the feature
boundary:

```ts
import {
  buildPricingLaboratoryWorkspace,
} from '@/features/pricing-laboratory'

const workspace = buildPricingLaboratoryWorkspace(
  repository,
  {
    productId: 'P-1',
    currency: 'MXN',
    templates,
    guardrailProfiles,
    defaultGuardrails,
    includeStoredScenarios: true,
    selectedScenarioKey: 'TEMPLATE:SILVER-MXN',
  },
)
```

The builder consumes `BusinessRepository.prices`; it never consumes
`NormalizedPricingRow[]`. When a product has multiple currencies, the caller
must select one explicitly. A single available currency may be resolved
without conversion because no monetary channel is mixed.

The model exposes product and currency options, the source-price context,
ordered template and stored-scenario rows, explicit selection, summary counts,
issues, signals, explainability and limitations. Stored scenarios are read and
re-evaluated in memory only.

Workspace statuses are `awaiting_selection`, `ready`, `partial` and
`unavailable`. Scenario evaluation statuses remain `valid`, `warning`,
`blocked` and `invalid`; blocked scenarios are comparable results and do not
become price changes.

PL-005 does not rank scenarios, calculate a recommended winner, approve a
commercial condition, persist a simulation or write to any other Workspace.
Every result preserves the `simulation-only` isolation contract.

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

repository.forecast.getProjectAwareReport()
repository.forecast.getProjectAwarePortfolioProjection()
repository.forecast.getProjectAwareBrandProjections()
repository.forecast.findProjectAwareBrandProjection(brandId)
```

Los resultados se devuelven clonados. Ningún Workspace debe modificar escenarios, pesos, confianza, cobertura, señales o métodos dentro del Core.

`getInventoryIntelligenceReport()` utiliza la proyección oficial de FW-002 y el corte activo de Inventory. Las unidades `inTransit` y `onOrder` se tratan como entradas agregadas sin fecha hasta que Purchasing Visibility esté conectado.


### Project-Aware Forecast

FW-009 publica `project-aware-v1` como contrato de cierre comercial por origen:

```text
Forecast total = Forecast transaccional + Facturación real de proyectos + Pipeline maduro pendiente
```

El baseline transaccional reutiliza `baseline-v1`, pero consume series limpiadas por FW-008. La facturación real se incorpora con Revenue y GP provenientes de Ventas en MXN. El pipeline abierto utiliza `Monto por cerrar`, `Fecha estimada de facturación` y el tipo de cambio mensual registrado en Data Center.

Los status 05–06 forman parte del cierre oficial. Los status 03–04 se publican como upside bruto y ponderado, pero no se agregan a los escenarios oficiales. Solo las incidencias materiales del periodo actual dejan `officialAvailable` en `false`. Las excepciones históricas reducen confianza y los documentos posteriores al corte de Ventas quedan pendientes de la siguiente carga.


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

La conciliación distingue cuatro tratamientos:

- `matched`: se descuenta de la venta transaccional y se clasifica como facturación de proyectos.
- `pending_cutoff`: el documento es posterior al corte de Ventas; permanece pendiente y no bloquea el cierre actual.
- `missing_sales_document` o `conflict`: no se descuenta hasta resolver la conciliación. Solo bloquea cuando corresponde al periodo actual dentro del corte vigente.
- `voided`: no se descuenta. Solo bloquea si el documento conserva Revenue, GP o cantidad material en Ventas; con contribución cero queda como información.

Las diferencias históricas permanecen auditables y reducen confianza sin bloquear por sí solas. Esta regla mantiene la identidad:

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
