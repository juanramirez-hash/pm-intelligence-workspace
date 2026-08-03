# PL-015 — Price Corridor, Maximum Discount & Margin Floor Simulation

## Objective

Convert explicit cost, Gross Margin and unit GP assumptions into auditable
price floors and discount limits for every product and commercial tier.

PL-015 answers four separate mathematical questions:

1. What is the minimum net selling price that protects the captured floor?
2. What is the maximum discount supported by the candidate list price?
3. What common list factor is required at the evaluated commercial discount?
4. How far is the candidate net price above or below the governing floor?

The result remains simulation-only. A calculated discount ceiling is not an
approval, recommendation or published commercial policy.

## Methodology

```text
price-corridor-margin-floor-v1
```

The engine receives:

- a valid PL-009 batch reference;
- source-cost and reporting currencies;
- an explicit reference exchange rate;
- purchase-cost or explicit landed-cost basis;
- quantity per product;
- one or more cost and FX scenarios;
- one or more commercial tiers;
- optional margin and GP floors per tier;
- one or more candidate common list factors.

No floor, factor, discount, exchange rate or volume is inferred from a tier
name.

## Reference cost

Two analytical bases are supported.

### Reference purchase cost

```text
Reference unit cost
=
Source purchase cost × Reference exchange rate
```

```text
Stressed unit cost
=
Source purchase cost
× (1 + cost change)
× Scenario exchange rate
```

### Explicit reference landed cost

```text
Reference unit cost
=
Explicit landed cost
```

```text
Stressed unit cost
=
Explicit landed cost
× (1 + cost change)
× (Scenario exchange rate ÷ Reference exchange rate)
```

The explicit landed cost can be produced operationally outside the module or
copied from a PL-014 simulation. PL-015 does not read or persist PL-014 state.

## Fixed candidate list price

For each common factor:

```text
Candidate list price
=
Reference unit cost × Common list factor
```

The candidate list price remains fixed during the stress scenario. This makes
cost and FX erosion visible instead of repricing automatically.

## Price floors

A tier can declare either or both constraints.

### Floor by Gross Margin

```text
Margin floor price
=
Stressed unit cost ÷ (1 - Minimum Gross Margin)
```

### Floor by unit GP

```text
GP floor price
=
Stressed unit cost + Minimum unit GP
```

### Governing floor

```text
Governing price floor
=
Maximum(Margin floor price, GP floor price)
```

When one constraint is absent, the available floor governs.

## Maximum supported discount

```text
Maximum supported discount
=
1 - (Governing price floor ÷ Candidate list price)
```

A negative result means that the candidate list price itself is below the
required net floor. The engine does not clamp this result to zero because the
negative value is analytically relevant.

## Required factor

At the tier discount:

```text
Required list factor
=
Governing price floor
÷ [Reference unit cost × (1 - Tier discount)]
```

The factor required for a tier is the maximum product requirement. The global
factor requirement is the maximum across all scenarios and tiers.

These values are mathematical thresholds only.

## Corridor and safety distance

```text
Corridor width
=
Candidate list price - Governing price floor
```

```text
Safety distance
=
Candidate net price - Governing price floor
```

```text
Candidate net price
=
Candidate list price × (1 - Tier discount)
```

The product classification is deterministic:

- `safe`: safety distance is positive;
- `at_floor`: safety distance is zero within numerical comparison tolerance;
- `below_floor`: safety distance is negative;
- `invalid`: the row cannot be calculated.

No commercial warning percentage or hidden amber buffer is embedded.

## Matrix

PL-015 builds:

```text
Scenario
× Common list factor
× Commercial tier
× Product
```

Each cell includes:

- reference and stressed cost;
- candidate list and net price;
- margin and GP floors;
- governing price floor;
- maximum supported discount;
- corridor width;
- safety distance;
- required list factor;
- GP and Gross Margin;
- volume coverage;
- limiting product;
- feasibility classification.

## Export

PL-015 generates six sheets:

1. `Resumen Ejecutivo`;
2. `Corredores Producto`;
3. `Matriz Corredor`;
4. `Pisos y Descuentos`;
5. `Resumen Escenario Factor`;
6. `Metadatos`.

It also generates a print/PDF document. Both outputs include:

```text
SIMULACIÓN SIN EFECTO COMERCIAL
```

## Isolation

```ts
executionMode: 'simulation-only'

isolation: {
  mutatesCatalogPrice: false,
  mutatesSourceCost: false,
  persistsCorridor: false,
  fetchesLiveExchangeRate: false,
  approvesDiscount: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-015 does not:

- approve or recommend a discount;
- persist price floors or corridors;
- fetch or register exchange rates;
- update costs or landed costs;
- modify product, list or selling prices;
- create commercial groups or authorization rules;
- write Product Master, Data Center, IndexedDB or Business Repository;
- affect Sales, Inventory, Forecast or Purchasing;
- publish information to ERP.

## Coverage

Automated tests validate:

- simultaneous margin and GP floors;
- governing-floor selection;
- maximum supported discount;
- corridor width and safety distance;
- cost and FX stress;
- explicit landed-cost basis;
- required-factor calculation;
- below-floor classification;
- validation, immutability and isolation;
- draft conversion;
- six-sheet export;
- visual component construction.
