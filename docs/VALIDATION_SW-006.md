# Validation — SW-006

## Validación completada durante la preparación

- Compilación completa de TypeScript con `tsc -b`.
- Ejecución funcional directa del Executive Summary Engine.
- Ejecución funcional directa del generador de exportación.
- Validación del nombre de archivo y de las siete hojas del libro.
- Verificación del contrato TypeScript para rutas diferidas.
- Verificación del contrato TSX del panel ejecutivo y acciones de salida.

## Validación requerida después de instalar

```bat
npm run build
npm run lint
npm test
```

Resultado esperado tomando como base SW-004:

```text
Test Files  44 passed (44)
Tests       183 passed (183)
```

## Revisión de bundle

El build deberá mostrar múltiples archivos JavaScript por la carga diferida. El tamaño exacto depende de Vite/Rolldown en el entorno Windows.

Validar especialmente que:

- el bundle inicial se reduzca respecto a 1,146.81 kB;
- Sales Workspace aparezca como chunk independiente;
- Data Center y `xlsx` no formen parte del chunk inicial;
- no existan errores al abrir `/sales`, `/data-center` y los directorios de marcas, clientes y productos.
