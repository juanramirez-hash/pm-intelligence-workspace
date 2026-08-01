export type PricingField =
  | 'productId'
  | 'brandId'
  | 'model'
  | 'canonicalCost'
  | 'canonicalListPrice'
  | 'canonicalSellingPrice'
  | 'canonicalCurrency'
  | 'costMxn'
  | 'listPriceMxn'
  | 'sellingPriceMxn'
  | 'costUsd'
  | 'costUsdFallback'
  | 'listPriceUsd'
  | 'sellingPriceUsd'
  | 'purchaseCurrency'
  | 'effectiveDate'
  | 'pricingGroupId'
  | 'sourceReference'
  | 'quantityPricingSchedule'

export const PRICING_COLUMN_ALIASES: Record<
  PricingField,
  readonly string[]
> = {
  productId: [
    'Name',
    'Product ID',
    'Product Id',
    'Product',
    'SKU',
    'Item',
    'Item Name',
    'Codigo',
    'Código',
    'Codigo interno',
    'Código interno',
  ],
  brandId: [
    'Marca',
    'Brand',
    'Brand ID',
    'Brand Id',
  ],
  model: [
    'Modelo',
    'Model',
  ],
  canonicalCost: [
    'Cost',
    'Costo',
    'Current Cost',
    'Costo actual',
    'Unit Cost',
    'Costo unitario',
  ],
  canonicalListPrice: [
    'List Price',
    'Precio Lista',
    'Precio de lista',
    'Current List Price',
  ],
  canonicalSellingPrice: [
    'Selling Price',
    'Precio Venta',
    'Precio de venta',
    'Net Price',
    'Precio neto',
  ],
  canonicalCurrency: [
    'Price Currency',
    'Moneda de precio',
    'Pricing Currency',
    'Currency',
  ],
  costMxn: [
    'Purchase Price',
    'Costo MXN',
    'Costo actual (MXN)',
    'Current Cost (MXN)',
    'Unit Cost (MXN)',
  ],
  listPriceMxn: [
    'Precio Lista (MXN)',
    'Precio de lista (MXN)',
    'List Price (MXN)',
  ],
  sellingPriceMxn: [
    'Precio Venta (MXN)',
    'Precio de venta (MXN)',
    'Selling Price (MXN)',
    'Net Price (MXN)',
  ],
  costUsd: [
    'Purchase Price (Foreign Currency)',
    'Costo moneda extranjera',
    'Costo en moneda extranjera',
    'Foreign Currency Cost',
    'Costo actual (USD)',
    'Current Cost (USD)',
    'Cost (USD)',
  ],
  costUsdFallback: [
    'Ultimo precio de compra (USD)',
    'Último precio de compra (USD)',
    'Ultimo precio de compra (USD)_1',
    'Último precio de compra (USD)_1',
    'costo promedio (USD)',
    'Costo promedio (USD)',
    'Average Cost USD',
  ],
  listPriceUsd: [
    'Precio USD',
    'Precio Lista (USD)',
    'Precio de lista (USD)',
    'Precio Lista Actual (USD)',
    'List Price (USD)',
  ],
  sellingPriceUsd: [
    'Precio Venta (USD)',
    'Precio de venta (USD)',
    'Selling Price (USD)',
    'Net Price (USD)',
  ],
  purchaseCurrency: [
    'Moneda',
    'Purchase Currency',
    'Moneda de compra',
  ],
  effectiveDate: [
    'Effective Date',
    'Price Effective Date',
    'Price Date',
    'Fecha de vigencia',
    'Fecha efectiva',
    'Fecha de precio',
  ],
  pricingGroupId: [
    'Pricing Group',
    'Pricing Group ID',
    'Price Group',
    'Grupo de precio',
    'Grupo de precios',
  ],
  sourceReference: [
    'Source Reference',
    'Referencia de fuente',
    'Reference',
    'Referencia',
  ],
  quantityPricingSchedule: [
    'Quantity Pricing Schedule',
    'Price Schedule',
    'Esquema de precios',
  ],
}
