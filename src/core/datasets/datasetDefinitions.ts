import type {
  DatasetDefinition,
  DatasetType,
} from './datasetTypes'

export const DATASET_DEFINITIONS:
  DatasetDefinition[] = [
  {
    type: 'sales',
    label: 'Ventas',
    description:
      'Histórico normalizado de ventas, clientes, productos, marcas y documentos.',
    updateFrequency: 'Semanal',
    displayOrder: 1,
  },
  {
    type: 'inventory',
    label: 'Inventario',
    description:
      'Existencias, disponibilidad, valor de inventario y cobertura por ubicación.',
    updateFrequency: 'Semanal',
    displayOrder: 2,
  },
  {
    type: 'salesTargets',
    label: 'Objetivos de venta',
    description:
      'Cuotas mensuales y objetivos comerciales anuales por marca, PM o unidad.',
    updateFrequency: 'Anual',
    displayOrder: 3,
  },
  {
    type: 'purchases',
    label: 'Órdenes de compra',
    description:
      'Órdenes emitidas, cantidades solicitadas, proveedores y fechas estimadas.',
    updateFrequency: 'Semanal',
    displayOrder: 4,
  },
  {
    type: 'purchaseRequests',
    label: 'Solicitudes de compra',
    description:
      'Requerimientos de abastecimiento y seguimiento de solicitudes pendientes.',
    updateFrequency: 'Semanal',
    displayOrder: 5,
  },
  {
    type: 'pricing',
    label: 'Pricing',
    description:
      'Precios, costos, descuentos, niveles comerciales y márgenes.',
    updateFrequency: 'Semanal',
    displayOrder: 6,
  },
  {
    type: 'customers',
    label: 'Clientes',
    description:
      'Maestro comercial de clientes, segmentos, regiones y clasificación.',
    updateFrequency: 'Mensual',
    displayOrder: 7,
  },
  {
    type: 'products',
    label: 'Productos',
    description:
      'Catálogo maestro de modelos, SKU, marcas, categorías y atributos.',
    updateFrequency: 'Semanal',
    displayOrder: 8,
  },
  {
    type: 'businessCalendar',
    label: 'Calendario laboral',
    description:
      'Días laborales utilizados para avance diario y proyecciones mensuales.',
    updateFrequency: 'Anual',
    displayOrder: 9,
  },
]

export function getDatasetDefinition(
  datasetType: DatasetType,
): DatasetDefinition {
  const definition =
    DATASET_DEFINITIONS.find(
      (item) =>
        item.type === datasetType,
    )

  if (!definition) {
    throw new Error(
      `No existe una definición para el dataset "${datasetType}".`,
    )
  }

  return definition
}