# ADR-006 — Business Core 1.0

- Estado: Aprobado
- Fecha: 2026-07-22
- Proyecto: PM Intelligence Workspace
- Alcance: Business Core, Analytics, Metrics, Intelligence y Workspaces
- Versión arquitectónica: Business Core 1.0

---

## 1. Propósito

Business Core 1.0 define la arquitectura central de PM Intelligence Workspace.

Su objetivo es establecer una única forma de:

- almacenar información empresarial normalizada;
- construir agregados;
- consultar información;
- calcular métricas;
- generar inteligencia;
- presentar resultados en los Workspaces.

Este documento funciona como la constitución técnica del proyecto.

Toda nueva funcionalidad relacionada con ventas, clientes, marcas, productos, inventarios, compras, pricing, forecast u objetivos deberá respetar estas reglas.

---

## 2. Flujo arquitectónico oficial

El flujo oficial del sistema es:

```text
Archivo importado
        ↓
NormalizedSalesRow[]
        ↓
buildBusinessDataModel()
        ↓
BusinessDataModel
        ↓
BusinessRepository
        ↓
BusinessMetrics
        ↓
Business Intelligence
        ↓
Workspace Models
        ↓
Interfaz de usuario