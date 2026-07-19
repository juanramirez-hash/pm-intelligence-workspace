# PM Intelligence — Architecture V1.0

## 1. Propósito del documento

Este documento define la arquitectura técnica oficial de PM Intelligence V1.

Su objetivo es mantener consistencia entre:

- Ingestión de datos.
- Validación.
- Normalización.
- Procesamiento.
- Persistencia.
- Motor de inteligencia.
- Presentación visual.

Toda nueva funcionalidad deberá respetar estas reglas antes de incorporarse al proyecto.

---

## 2. Visión del producto

PM Intelligence es una Web Application orientada a Product Managers y responsables comerciales.

La plataforma debe evolucionar desde un dashboard visual hacia un Business Operating System capaz de:

- Recibir reportes operativos.
- Validar su estructura.
- Normalizar datos heterogéneos.
- Construir modelos comunes de negocio.
- Calcular indicadores.
- Detectar riesgos y oportunidades.
- Priorizar acciones.
- Alimentar un motor determinístico.
- Presentar información ejecutiva y operativa.
- Sustituir gradualmente datos demostrativos por datos reales.

---

## 3. Flujo general de datos

```text
Fuentes operativas
        ↓
Data Center
        ↓
Lectura y vista previa
        ↓
Validación
        ↓
Normalización
        ↓
Procesamiento
        ↓
Business Data Model
        ↓
Zustand Store
        ↓
Pulse Adapter
        ↓
Pulse Engine
        ↓
Pulse Intelligence Center