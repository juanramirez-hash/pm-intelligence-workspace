# PL-012 — Volume-Weighted Pricing & Portfolio Mix Simulation

## Objective

Extend the catalog-independent Pricing Laboratory with explicit volume and
portfolio-mix assumptions. PL-012 answers how a factor and discount behave when
products contribute different expected quantities instead of the one-unit basis
used by PL-009 through PL-011.

PL-012 remains a simulation-only analytical layer. Quantities do not become
Forecast, budget, demand, inventory, purchase commitments or commercial prices.

## Methodology

```text
price-portfolio-mix-v1
```

The input reuses a valid PL-009 batch:

- provisional products and costs;
- explicit discounts;
- the explicit objective used by the batch;
- one or more explicit common list factors.

It then adds one or more named mixes. Every mix contains a quantity assumption
for each product. Blank quantities are interpreted as zero; every mix must have
at least one positive quantity.

## Calculation matrix

The engine creates the deterministic Cartesian matrix:

```text
Mix × Common List Factor × Discount × Product
```

For every product it reuses `price-design-v1` and calculates unit:

- list price;
- net selling price;
- Gross Profit;
- Gross Margin;
- required list factor;
- compliance with the original explicit objective.

Unit metrics are multiplied by the captured quantity. The cell then publishes:

- assumed units;
- weighted cost;
- weighted list value;
- weighted selling value;
- weighted GP;
- consolidated Gross Margin;
- weighted net factor;
- average net selling price per unit;
- volume-weighted objective coverage;
- products with the greatest sales and GP contribution.

The consolidated margin is calculated as:

```text
Weighted Gross Margin = Total Weighted GP / Total Weighted Selling Price
```

It is not the simple average of product margins.

## Mix comparison

The interface supports any caller-defined labels, including conservative,
target and aggressive mixes. Labels have no numeric behavior.

The engine preserves input order and does not:

- rank mixes;
- select a winning factor;
- select a winning discount;
- recommend a price;
- approve a commercial architecture.

## Volume coverage

Each cell calculates volume coverage as the proportion of assumed units carried
by products that comply with the explicit objective:

```text
Volume coverage = Compliant assumed units / Total assumed units
```

This differs from product-count coverage. A high-volume product can therefore
have a materially larger effect than a low-volume product.

## Export

PL-012 generates a six-sheet workbook:

1. `Resumen Ejecutivo`;
2. `Matriz Mezcla`;
3. `Detalle por Producto`;
4. `Resumen por Mezcla`;
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
  createsProductsOrBrands: false,
  persistsPortfolioMix: false,
  writesForecast: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-012 does not:

- create products, brands, costs, factors or prices;
- persist volume assumptions or mixes;
- write Forecast or budget data;
- update Product Master, Data Center, IndexedDB or Business Repository;
- affect Sales, Inventory, Forecast or Purchasing;
- publish data to ERP;
- recommend or approve a mix, factor, discount or price.

## Coverage

Automated tests validate:

- the `Mix × Factor × Discount` matrix;
- quantity-weighted totals;
- consolidated margin and weighted net factor;
- sales and GP concentration;
- volume-based coverage;
- multiple mix ordering;
- invalid, duplicated and unknown quantities;
- input immutability and isolation;
- draft conversion;
- six-sheet export;
- visual component construction.
