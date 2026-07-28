# COMMIT PMC-003

## Scope

Materialize the Product Repository without changing BusinessDataModel or the
BusinessProductMaster identity contract.

## Architectural decision

Brand/model lookup returns an array because duplicate catalogue matches must
remain explicit. `findUniqueByBrandAndModel` returns a product only when the
match is unambiguous.

## Compatibility

Existing `BusinessRepository.product` consumers continue using ProductQueries.
No workspace migration is required in this sprint.
