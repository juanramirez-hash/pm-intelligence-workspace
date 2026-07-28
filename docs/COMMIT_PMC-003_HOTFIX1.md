# Commit PMC-003 HOTFIX 1

```text
fix(pmc-003): materialize canonical brandId in product builder
```

- asigna `brandId` en productos provenientes del Product Master;
- asigna `brandId` en productos fallback provenientes de ventas;
- conserva `brand` como etiqueta compatible;
- elimina los dos fallos de `productIndexes.test.ts` sin modificar las pruebas.
