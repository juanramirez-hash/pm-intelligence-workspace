# UX-001.1B — Atlas 2.0

## Objetivo

Conectar los componentes base de Atlas con la capa de Semantic Design Tokens introducida en UX-001.1A, manteniendo compatibilidad con los consumidores existentes.

## Cambios

### AtlasCard

- Conserva el contrato existente: `children`, `className` y atributos HTML.
- Añade variantes semánticas: `default`, `subtle`, `elevated`, `interactive`, `critical` e `intelligence`.
- Añade densidades: `none`, `compact`, `default` y `spacious`.
- El comportamiento hover deja de ser obligatorio y queda reservado a `interactive`.
- Consume colores, radios, sombras y espaciado semánticos.

### PageHeader

- Conserva `eyebrow`, `title`, `description` y `actions`.
- Añade `metadata`, `size` y `className`.
- Consume color, espaciado y tipografía semánticos.
- Permanece como encabezado general; no sustituye al futuro `ExecutiveHeader`.

### Pruebas

- Cobertura de compatibilidad básica de `AtlasCard`.
- Cobertura de variantes, padding y metadatos de `PageHeader`.

## Compatibilidad

No requiere modificar los consumidores actuales. Las nuevas propiedades son opcionales.
