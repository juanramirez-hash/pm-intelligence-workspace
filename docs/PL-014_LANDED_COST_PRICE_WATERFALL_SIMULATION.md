# PL-014 — Landed Cost & Price Waterfall Simulation

## Objective

Extend the catalog-independent Pricing Laboratory with an explicit landed-cost
waterfall. PL-014 calculates how purchase cost, exchange rate, logistics,
customs, financing and rebates build the analytical unit cost used to evaluate
price architecture, GP and Gross Margin.

PL-014 remains simulation-only. It does not register landed cost, update source
costs, fetch live exchange rates or publish prices.

## Methodology

```text
price-landed-cost-waterfall-v1
```

The input reuses a valid PL-009 batch and adds:

- source-cost currency;
- reporting currency;
- explicit reference exchange rate;
- explicit quantities per product;
- an ordered list of landed-cost components;
- one or more purchase-cost, FX and component stress scenarios;
- one or more commercial tiers;
- one or more candidate common list factors;
- an explicit list-price basis.

## Ordered waterfall

The waterfall begins with converted purchase cost:

```text
Purchase cost in reporting currency
=
Source purchase cost × Exchange rate
```

Components are then applied in the exact order supplied by the caller. Every
component declares:

- label and category;
- add or subtract direction;
- calculation basis;
- numeric value;
- optional product scope;
- notes.

Supported calculation bases are:

1. percentage of purchase cost;
2. percentage of current accumulated subtotal;
3. fixed amount per unit;
4. fixed total allocated by quantity;
5. fixed total allocated by purchase-cost value.

A percentage of current subtotal uses the subtotal that exists immediately
before that component. Changing component order can therefore change the
result, and the order is always preserved in the output.

Rebates and bonifications are represented with explicit `subtract` direction.
No category silently changes sign or embeds a rate.

## Reference and stress behavior

Candidate list prices are fixed from one explicit reference basis:

```text
Reference purchase cost
or
Reference landed cost
```

```text
Candidate list price
=
Selected reference basis × Common list factor
```

Each scenario independently applies:

```text
Adjusted purchase cost
=
Source purchase cost × (1 + purchase-cost change) × Scenario FX
```

and scales component magnitude with:

```text
Effective component value
=
Captured component value × (1 + component change)
```

The candidate list price is not recalculated under stress. This exposes landed
cost, GP and margin erosion instead of hiding it through automatic repricing.

## Calculation matrix

The engine creates the deterministic matrix:

```text
Scenario × Common List Factor × Commercial Tier × Product
```

Every cell publishes:

- reference and stressed purchase cost;
- reference and stressed landed cost;
- landed-cost uplift and absolute impact;
- fixed candidate list price;
- net selling value after tier discount;
- unit and weighted GP;
- unit and consolidated Gross Margin;
- weighted net factor on landed cost;
- volume-based objective coverage;
- mathematical factor required;
- factor gap;
- limiting product;
- component-level cost, GP and margin impact;
- feasibility classification.

Commercial tiers support independent minimum Gross Margin or minimum unit GP
objectives. Every discount, objective and factor is caller supplied.

## Component impact

For a fixed selling price:

```text
Component GP impact = - Component cost impact
```

A positive landed-cost component reduces GP. A subtractive rebate increases GP.
The margin impact is calculated against the net selling price of the evaluated
product and tier.

These impacts are analytical decomposition, not accounting entries.

## Export

PL-014 generates a six-sheet workbook:

1. `Resumen Ejecutivo`;
2. `Waterfall Componentes`;
3. `Matriz Landed Cost`;
4. `Detalle por Producto`;
5. `Resumen Escenario Factor`;
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
  persistsLandedCost: false,
  fetchesLiveExchangeRate: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-014 does not:

- create accounting, customs or inventory records;
- register landed cost;
- query or infer live exchange rates;
- update source costs or currency data;
- create products, brands, factors or prices;
- persist components or stress assumptions;
- write Product Master, Data Center, IndexedDB or Business Repository;
- affect Sales, Inventory, Forecast or Purchasing;
- recommend, approve or publish a commercial parameter.

## Coverage

Automated tests validate:

- sequential percentage and fixed-component calculations;
- allocation by quantity and purchase-cost value;
- scoped components;
- rebates and GP impact;
- fixed-list behavior under cost, FX and component stress;
- factor requirement and limiting-product detection;
- invalid product scopes;
- input immutability and isolation;
- draft conversion;
- six-sheet export;
- visual component construction.
