# PL-001 - Pricing Laboratory Data Foundation & Contract Definition

## Status

Completed in version `0.39.0`.

## Objective

Create Pricing as a first-class Business Core domain before adding a simulator,
recommendation engine or visual Workspace.

PL-001 does not implement a pricing calculator. It defines auditable price
facts, isolated comparison scenarios, deterministic monetary invariants,
prebuilt indexes and repository queries.

## Architecture

```text
Pricing source or future Data Center importer
                |
                v
BusinessPriceInput / BusinessPriceScenarioInput
                |
                v
buildBusinessPrices()
                |
                v
BusinessDataModel
  - prices
  - priceScenarios
  - pricingSummary
  - pricingQualityIssues
                |
                v
BusinessRepository.prices
```

The Pricing domain does not read spreadsheets, React state or Workspace
components. Future importers will normalize their source into the public input
contracts owned by the Core.

## Contracts

### BusinessPrice

An auditable price fact contains:

- canonical `productId` and `brandId`;
- declared `currency`;
- unit `cost`;
- `listPrice`;
- current `sellingPrice`;
- derived `discountRate`;
- unit `grossProfit`;
- `grossMargin` over selling price;
- `pricingFactor` as list price divided by cost;
- deterministic margin band;
- optional Pricing Group;
- effective date and source traceability.

Rates are stored as decimal fractions. `0.35` means 35 percent.

### BusinessPriceScenario

A scenario is stored separately from the base price and never mutates it.
Initial scenario kinds are:

- current;
- promotion;
- pricing group;
- project;
- custom.

Standard Pricing Group identifiers are published for:

- current;
- promotion;
- Silver;
- Gold;
- Platinum;
- project;
- custom.

PL-001 stores scenario results but does not recommend or optimize them. Those
responsibilities belong to the future Price Engineering Engine.

## Official monetary invariants

```text
Gross Profit = Selling Price - Cost
Gross Margin = Gross Profit / Selling Price
Discount Rate = 1 - Selling Price / List Price
Pricing Factor = List Price / Cost
Scenario Price = List Price x (1 - Discount Rate)
```

A zero cost produces a `null` Pricing Factor instead of an infinite value.
A zero or negative list/selling price is rejected as a blocking data issue.
Negative margin is preserved as an auditable price fact and flagged as a
warning.

## Margin bands

The foundation exposes deterministic query bands:

- negative;
- 0 to less than 20 percent;
- 20 to less than 25 percent;
- 25 to less than 30 percent;
- 30 to less than 35 percent;
- 35 percent or more.

These bands support retrieval only. They do not yet define commercial policy,
minimum margin or recommendations.

## Repository API

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

BusinessRepository also publishes:

```ts
repository.getPrices()
repository.getPricingSummary()
repository.findCurrentPriceByProduct(productId, currency)
```

All query results are isolated copies. Consumers cannot mutate internal
BusinessDataModel maps through the public API.

## Indexes

Indexes are built once per PriceQueries instance:

- prices by product;
- prices by brand;
- prices by currency;
- prices by margin band;
- prices by Pricing Group;
- prices ordered by Gross Margin;
- prices ordered by unit Gross Profit;
- current price by product and currency;
- scenarios by price;
- scenarios by Pricing Group.

Price history is sorted by effective date descending. Exact and related
queries do not repeatedly scan the complete price collection.

## Quality controls

PL-001 detects:

- invalid identifiers;
- missing currency;
- invalid cost, list price or selling price;
- invalid effective dates;
- duplicate price/scenario identifiers;
- products not found in Product Master;
- brand mismatch against Product Master;
- negative margin;
- selling price above list;
- orphan scenarios;
- inconsistent discount and selling price.

Blocking issues prevent materialization of the invalid record. Warnings retain
the fact and preserve an auditable explanation.

## Scope excluded

PL-001 does not include:

- Data Center pricing importer;
- Price Engineering Engine;
- target/floor/recommended price;
- commercial discount policy;
- Silver, Gold or Platinum recommendation rules;
- promotion simulation UI;
- Price DNA;
- Pricing Laboratory Workspace page;
- Excel export.

## Acceptance criteria

- Pricing contracts are part of the public Business Core API.
- BusinessDataModel stores prices, scenarios, summary and quality issues.
- BusinessRepository exposes indexed Pricing queries.
- Scenarios do not mutate base price facts.
- Monetary formulas use explicit and tested semantics.
- Currency is always declared and never silently mixed.
- Build, lint and test suite remain green.
