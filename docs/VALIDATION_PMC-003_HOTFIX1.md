# Validación PMC-003 HOTFIX 1

Ejecutar en la raíz del proyecto:

```bash
npm run build
npm test
npm run lint
```

Resultado esperado de la regresión reportada:

```text
src/core/business/repository/productIndexes.test.ts
✓ consulta por ID y código normalizados
✓ consulta productos por marca
✓ consulta coincidencias por marca y modelo
✓ mantiene separados los índices de marca y modelo
✓ ordena resultados de revenue y gross profit
```

La corrección debe mantener `brandId` normalizado en mayúsculas y sin espacios externos tanto para productos conciliados con el Product Master como para productos fallback construidos desde ventas.
