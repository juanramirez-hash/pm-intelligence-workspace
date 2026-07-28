# Product Master Consolidation v0.24.5

## Cambios
- El código ERP `Name` pasa a ser el identificador principal cuando existe catálogo maestro.
- `Modelo` se conserva como modelo comercial del fabricante.
- Se agrega importador automático para el catálogo de productos NetSuite.
- La homologación de ventas se realiza por `Marca + Modelo`.
- Las coincidencias ambiguas no se asignan silenciosamente; conservan identidad fallback.
- El catálogo se integra al BusinessDataModel y al Product Workspace por medio del BusinessRepository.

## Validación
Ejecutar:

```bash
npm run build
npm run lint
npm test
```

Luego cargar primero el catálogo y después el archivo de ventas desde Data Center.
