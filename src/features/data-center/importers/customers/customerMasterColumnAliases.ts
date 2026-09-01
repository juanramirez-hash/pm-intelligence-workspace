export type CustomerMasterField =
  | 'internalId'
  | 'customerId'
  | 'name'
  | 'isDuplicate'
  | 'primaryContact'
  | 'category'
  | 'salesRep'
  | 'salesRepLocation'
  | 'assignedKam'
  | 'lastSaleDate'
  | 'inactiveDate'
  | 'phone'
  | 'email'
  | 'location'
  | 'hasPhysicalLocation'
  | 'department'
  | 'specialtyBrands'
  | 'previousSalesRep'
  | 'customerRegistrationForm'
  | 'priceLevel'
  | 'whatsapp'
  | 'serviceSegment'
  | 'taxId'
  | 'catalogDelivered'
  | 'registrationDate'
  | 'portalAccessBlocked'
  | 'contactLetter'
  | 'billingVersion'
  | 'salesClassification'
  | 'frequencyClassification'
  | 'purchaseAmountClassification'
  | 'permanentFreeLocalShipping'

export const CUSTOMER_MASTER_COLUMN_ALIASES:
  Record<
    CustomerMasterField,
    readonly string[]
  > = {
    internalId: [
      'Internal ID',
      'Internal Id',
      'ERP Internal ID',
    ],

    customerId: [
      'ID',
      'Customer ID',
      'Cliente ID',
      'ID Cliente',
      'Numero de Cliente',
      'Número de Cliente',
    ],

    name: [
      'Name',
      'Customer Name',
      'Cliente',
      'Nombre',
      'Nombre Cliente',
      'Nombre del Cliente',
    ],

    isDuplicate: [
      'Duplicate',
      'Duplicado',
    ],

    primaryContact: [
      'Primary Contact',
      'Contacto Principal',
    ],

    category: [
      'Category',
      'Categoria',
      'Categoría',
    ],

    salesRep: [
      'Sales Rep',
      'Sales Representative',
      'Ejecutivo de Ventas',
      'Vendedor',
    ],

    salesRepLocation: [
      'Ubicacion del Vendedor',
      'Ubicación del Vendedor',
      'Sales Rep Location',
    ],

    assignedKam: [
      'KAM Asignado',
      'Assigned KAM',
      'KAM',
    ],

    lastSaleDate: [
      'Date of Last Sale',
      'Last Sale Date',
      'Fecha Ultima Venta',
      'Fecha Última Venta',
    ],

    inactiveDate: [
      'Fecha de Baja',
      'Inactive Date',
      'Deactivation Date',
    ],

    phone: [
      'Phone',
      'Telefono',
      'Teléfono',
    ],

    email: [
      'Email',
      'E-mail',
      'Correo',
      'Correo Electronico',
      'Correo Electrónico',
    ],

    location: [
      'Ubicacion',
      'Ubicación',
      'Location',
      'Sucursal',
    ],

    hasPhysicalLocation: [
      'Local Fisico',
      'Local Físico',
      'Physical Location',
    ],

    department: [
      'Departamento',
      'Department',
    ],

    specialtyBrands: [
      'Marcas Especialidad',
      'Specialty Brands',
    ],

    previousSalesRep: [
      'Ejecutivo de ventas anterior',
      'Ejecutivo de Ventas Anterior',
      'Previous Sales Rep',
    ],

    customerRegistrationForm: [
      'Formato Alta de Cliente',
      'Customer Registration Form',
    ],

    priceLevel: [
      'Price Level',
      'Nivel de Precio',
      'Nivel de Precios',
    ],

    whatsapp: [
      'WHATSAPP',
      'Whatsapp',
      'WhatsApp',
    ],

    serviceSegment: [
      'Segmento de atencion',
      'Segmento de atención',
      'Service Segment',
    ],

    taxId: [
      'RFC (120)',
      'RFC',
      'Tax ID',
      'Tax Id',
    ],

    catalogDelivered: [
      'Catalogo entregado',
      'Catálogo entregado',
      'Catalog Delivered',
    ],

    registrationDate: [
      'Fecha de alta',
      'Registration Date',
      'Customer Registration Date',
    ],

    portalAccessBlocked: [
      'Bloquea Acceso Portal',
      'Portal Access Blocked',
    ],

    contactLetter: [
      'CARTA DE CONTACTOS',
      'Carta de Contactos',
      'Contact Letter',
    ],

    billingVersion: [
      'Versión de Facturación',
      'Version de Facturacion',
      'Billing Version',
    ],

    salesClassification: [
      'Clasificacion por ventas',
      'Clasificación por ventas',
      'Sales Classification',
    ],

    frequencyClassification: [
      'CLASIFICACION VALOR (FRECUENCIA DE COMPRA)',
      'CLASIFICACIÓN VALOR (FRECUENCIA DE COMPRA)',
      'Frequency Classification',
    ],

    purchaseAmountClassification: [
      'CLASIFICACION MONTO DE COMPRA (HML)',
      'CLASIFICACIÓN MONTO DE COMPRA (HML)',
      'Purchase Amount Classification',
      'HML',
    ],

    permanentFreeLocalShipping: [
      'Envio local sin costo permanente',
      'Envío local sin costo permanente',
      'Permanent Free Local Shipping',
    ],
  }