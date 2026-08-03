# PL-013 — Cost & Exchange Rate Sensitivity Stress Test

## Objective

Extend the catalog-independent Pricing Laboratory with explicit cost and
exchange-rate stress testing. PL-013 answers what happens to GP, Gross Margin
and factor feasibility when a candidate list architecture remains fixed while
cost or FX assumptions deteriorate.

PL-013 remains a simulation-only analytical layer. It does not fetch live FX,
update costs, persist assumptions or publish prices.

## Methodology

```text
price-cost-fx-stress-v1
```

The input reuses a valid PL-009 batch and adds:

- source-cost currency;
- reporting currency;
- explicit reference exchange rate;
- explicit quantities per product;
- one or more cost/FX scenarios;
- one or more commercial tiers;
- one or more candidate common list factors.

## Fixed-list stress behavior

Candidate list prices are fixed with the base cost and the reference exchange
rate:

```text
Candidate list price = Base source cost × Reference FX × Common list factor
```

Each scenario independently calculates stressed cost:

```text
Stressed reporting cost = Base source cost × (1 + Cost change) × Scenario FX
```

The candidate list price is not recalculated with the stressed cost. This is
what makes margin and GP exposure visible.

The exchange rate is defined as reporting-currency units per one source-cost
currency unit. Every rate is caller supplied.

## Calculation matrix

The engine creates the deterministic Cartesian matrix:

```text
Scenario × Common List Factor × Commercial Tier × Product
```

Every cell publishes:

- fixed candidate list price;
- stressed cost;
- net selling price after tier discount;
- unit and weighted GP;
- unit and consolidated Gross Margin;
- weighted net factor;
- volume-based compliance coverage;
- mathematical factor required under the scenario;
- factor gap;
- limiting product;
- feasibility classification.

Commercial tiers support independent minimum Gross Margin or minimum unit GP
objectives. Tier labels contain no numeric policy.

## Critical scenario

The critical scenario is the one that produces the greatest mathematical factor
requirement across the evaluated tiers and products. This is a diagnostic
threshold, not a recommendation, approval or publication instruction.

## Export

PL-013 generates a six-sheet workbook:

1. `Resumen Ejecutivo`;
2. `Matriz Stress`;
3. `Detalle por Producto`;
4. `Resumen Escenarios`;
5. `Resumen por Factor`;
6. `Metadatos`.

It also generates an independent print/PDF document. Both outputs include:

```text
SIMULACIÓN SIN EFECTO COMERCIAL
```

## Isolation

```ts
executionMode: 'simulation-only'

isolation: {
  mutatesCatalogPrice: false,
  mutatesSourceCost: false,
  persistsStressTest: false,
  fetchesLiveExchangeRate: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-013 does not:

- query or infer a live exchange rate;
- update source costs or currency data;
- create products, brands, factors or prices;
- persist stress assumptions;
- write Product Master, Data Center, IndexedDB or Business Repository;
- affect Sales, Inventory, Forecast or Purchasing;
- recommend, approve or publish a commercial parameter.

## Coverage

Automated tests validate:

- the `Scenario × Factor × Tier` matrix;
- fixed-list behavior under cost and FX stress;
- explicit conversion and cost variation;
- quantity-weighted totals and consolidated margin;
- factor feasibility and critical-scenario detection;
- invalid FX and cost-change validation;
- input immutability and isolation;
- draft conversion;
- six-sheet export;
- visual component construction.
