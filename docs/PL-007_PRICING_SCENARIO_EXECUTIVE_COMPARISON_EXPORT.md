# PL-007 — Pricing Scenario Executive Comparison & Export

## Propósito

PL-007 cierra funcionalmente Pricing Laboratory con una salida ejecutiva bajo
demanda. El usuario puede marcar escenarios calculables, compararlos contra el
precio vigente y descargar o imprimir la evidencia de la simulación.

La salida es documental. No constituye recomendación, aprobación, autorización
ni instrucción para cambiar un precio.

## Arquitectura

```text
PricingLaboratoryWorkspaceModel
        ↓ selección explícita de filas calculables
pricing-executive-comparison-v1
        ↓
Vista ejecutiva / Excel / impresión PDF
        ↓
Sin persistencia ni efecto comercial
```

El modelo ejecutivo conserva el orden del Workspace. No ordena por margen,
precio, GP, descuento o cumplimiento de guardrails y no selecciona un ganador.

## Selección de escenarios

La tabla de PL-006 incorpora la columna `Reporte`.

Pueden seleccionarse:

- escenarios temporales creados en la sesión;
- escenarios almacenados, exclusivamente como referencias de lectura;
- resultados válidos, con advertencia o bloqueados que conserven métricas
  completas.

No pueden seleccionarse configuraciones deshabilitadas, no aplicables,
inválidas o sin métricas completas.

Crear un escenario desde el constructor lo incorpora inicialmente a la
comparación documental. El usuario puede retirarlo mediante la misma casilla.
Cambiar producto o moneda limpia la selección para evitar mezclar fuentes.

## Modelo ejecutivo

`pricing-executive-comparison-v1` publica:

- precio fuente vigente;
- claves solicitadas;
- escenarios incluidos;
- métricas y deltas;
- guardrails y señales;
- trazabilidad y explainability;
- incidencias por claves inexistentes o no calculables;
- resumen de válidos, advertencias, bloqueados y selecciones inválidas;
- contrato de aislamiento heredado del Workspace.

Estados:

- `unavailable`: no existe precio fuente seleccionado;
- `empty`: existe fuente, pero no hay escenarios seleccionados;
- `ready`: todas las selecciones son calculables;
- `partial`: existe al menos una selección válida y otra inválida o ausente.

Un escenario bloqueado puede incluirse como evidencia. Su inclusión no elimina
el bloqueo ni lo convierte en recomendación.

## Comparación ejecutiva en pantalla

La nueva sección muestra:

- producto, marca y moneda;
- precio vigente como línea base no modificable;
- escenarios elegidos;
- precio simulado y delta;
- descuento, GP y margen;
- cantidad de guardrails y señales;
- primera explicación determinística por escenario.

La sección declara de forma visible:

```text
SIMULACIÓN SIN EFECTO COMERCIAL
```

## Exportación Excel

El botón `Exportar selección` genera un libro bajo demanda con cinco hojas:

1. `Resumen Ejecutivo`
   - producto, marca, moneda, vigencia y referencia;
   - costo, lista, precio, descuento, GP, margen y factores actuales;
   - resumen de escenarios incluidos;
   - aviso de no recomendación y no efecto comercial.

2. `Comparación`
   - precio vigente y escenario;
   - deltas absolutos y relativos;
   - descuento, GP, margen y factores;
   - guardrails, señales, referencias y notas.

3. `Guardrails y Señales`
   - restricciones explícitas;
   - severidad, umbral, valor actual y mensaje del motor.

4. `Supuestos y Trazabilidad`
   - base matemática;
   - valor capturado;
   - Pricing Group;
   - referencia, notas y explainability.

5. `Metadatos`
   - versión del esquema;
   - contrato de aislamiento;
   - limitaciones e incidencias.

Los valores monetarios y porcentuales se exportan como números con formato de
Excel. No se exportan fórmulas que puedan reinterpretar el cálculo.

## Impresión y PDF

`Imprimir / PDF` utiliza el mecanismo nativo del navegador. Durante la
impresión se ocultan:

- selector de producto y moneda;
- constructor de escenarios;
- controles de sesión;
- tabla interactiva;
- detalle operativo y acciones.

Se conservan el Executive Hero y la comparación ejecutiva seleccionada. Las
tablas repiten encabezados y evitan cortes internos de filas cuando el navegador
lo permite.

## Contrato de aislamiento

```ts
executionMode: 'simulation-only'

isolation: {
  mutatesSourcePrice: false,
  persistsScenarioResults: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

Exportar o imprimir no:

- modifica costo, lista o precio de venta;
- crea o edita `BusinessPriceScenario`;
- persiste la selección ejecutiva;
- escribe en IndexedDB, Data Center o Business Repository;
- afecta Product Master, Sales, Inventory, Forecast o ERP;
- aprueba o publica precios;
- genera Price DNA;
- recomienda un escenario.

## Cierre funcional

PL-007 cierra la ruta documental basada en un precio existente:

- Data Foundation;
- importación y conciliación;
- Price Engineering Engine;
- plantillas y guardrails;
- Workspace Model;
- interfaz y constructor;
- comparación ejecutiva, Excel e impresión/PDF.

PL-008 amplía posteriormente el laboratorio con diseño desde costo para productos
y marcas que todavía no existen en catálogo. Esta ampliación no modifica el
contrato documental de PL-007 ni permite publicar precios.
