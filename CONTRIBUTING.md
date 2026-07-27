# Contributing — PM Intelligence Workspace

## Flujo obligatorio por commit

1. Trabajar sobre el ZIP base validado.
2. Mantener un objetivo único y trazable.
3. Implementar contratos antes que UI.
4. Agregar o actualizar pruebas.
5. Ejecutar `npm run test`, `npm run build` y `npm run lint`.
6. Actualizar ADR, Changelog, Release Notes, Roadmap y documento del commit.
7. Entregar un ZIP completo.

## Reglas del Business Core

- No importar React.
- No importar componentes, layouts, páginas, hooks o stores.
- No leer estado de UI.
- No calcular KPIs en Workspaces.
- Mantener funciones puras para cálculos deterministas.
- Exponer contratos mediante `index.ts`.
- No consumir archivos internos desde capas externas.

## Convenciones

- Tipos y clases: `PascalCase`.
- Funciones, variables y archivos: `camelCase`.
- Engines: sufijo `Engine`.
- Builders: prefijo `build`.
- Tests: archivo hermano con sufijo `.test.ts`.
- Valores no evaluables: `null`, no números artificiales.

## Definición de terminado

Un commit se considera terminado sólo cuando:

- el código está integrado;
- los tests pasan;
- el build pasa;
- la documentación está actualizada;
- no rompe los límites arquitectónicos;
- existe un paquete ZIP reproducible.
