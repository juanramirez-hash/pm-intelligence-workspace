# FW-010 Hotfix 3 — Cobertura elegible del periodo actual

## Problema observado

FW-010 Hotfix 2 clasificó correctamente como `pending_cutoff` los documentos de Facturación de proyectos posteriores al corte máximo de Ventas. Esos documentos se excluyeron del denominador de conciliación; sin embargo, cuando el periodo solo contenía pendientes por corte y ningún documento elegible, la función genérica de razón devolvía `0` para el caso `0 / 0`.

El resultado era contradictorio:

```text
Bloqueos actuales: 0
Pendientes por corte: 1
Cobertura actual: 0%
```

No existía un documento conciliable incumplido; por tanto, la cobertura no debía mostrarse como cero.

## Regla corregida

Para cada periodo se calculan:

```text
Documentos elegibles
=
Conciliados
+ Faltantes dentro del corte
+ Conflictos
```

Los documentos `pending_cutoff` permanecen fuera del universo elegible.

La cobertura queda definida como:

```text
Si documentos elegibles = 0
    cobertura = 100%
De lo contrario
    cobertura = conciliados / documentos elegibles
```

## Interpretación

Una cobertura de 100% con documentos pendientes por corte no significa que esos documentos ya estén conciliados. Significa que, con la información disponible al corte de Ventas, no existe rezago actualmente elegible.

Los pendientes continúan visibles en:

- `pendingCutoffBillingDocuments`;
- `pendingCutoffDocumentNumbers`;
- corte de Ventas;
- corte de Facturación de proyectos;
- panel de calidad y exportación.

## Alcance preservado

No cambia:

- la clasificación `pending_cutoff`;
- la separación de venta transaccional y venta de proyectos;
- los bloqueos materiales del periodo actual;
- el tratamiento de anulados;
- la fórmula `project-aware-v1`;
- los escenarios;
- la UI ni las siete hojas del Excel.
