# Aplicación del parche UX-002.1

Copiar el contenido de esta carpeta sobre la raíz del proyecto y permitir la sustitución de archivos.

Después ejecutar:

```bash
npm run build
npm run lint
npm test
```

## Nota de arquitectura

El Commercial Health Score queda visualmente preparado, pero muestra `Pendiente de modelo` porque el resumen agregado de Brand Intelligence todavía no expone un score desde el Business Core. No se agregó una fórmula en React.
