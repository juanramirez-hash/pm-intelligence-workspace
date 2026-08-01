import type {
  BusinessPrice,
} from '../../../core/business/entities/price'

import type {
  BusinessRepository,
} from '../../../core/business/repository'

import {
  createEngineeringScenarioFromStored,
  evaluatePriceLaboratory,
  evaluatePricingTemplateSet,
} from '../../../core/business/pricing'

import type {
  PriceEngineeringGuardrail,
  PricingLaboratoryTemplateIssue,
  PricingLaboratoryTemplateResolution,
} from '../../../core/business/pricing'

import {
  DEFAULT_PRICING_LABORATORY_WORKSPACE_REQUEST,
  PRICING_LABORATORY_WORKSPACE_METHODOLOGY,
} from '../types/pricingLaboratoryWorkspaceTypes'

import type {
  PricingLaboratoryCurrencyOption,
  PricingLaboratoryProductOption,
  PricingLaboratoryWorkspaceIssue,
  PricingLaboratoryWorkspaceModel,
  PricingLaboratoryWorkspaceRequest,
  PricingLaboratoryWorkspaceScenarioRow,
  PricingLaboratoryWorkspaceSelection,
  PricingLaboratoryWorkspaceSourcePrice,
  PricingLaboratoryWorkspaceStatus,
  PricingLaboratoryWorkspaceSummary,
  PricingLaboratoryWorkspaceUnavailableReason,
} from '../types/pricingLaboratoryWorkspaceTypes'

const WORKSPACE_LIMITATIONS = [
  'El Workspace solo orquesta simulaciones en memoria; no modifica ni publica precios.',
  'Los resultados no se persisten y no escriben en Business Repository, Data Center ni otros Workspaces.',
  'No se realizan conversiones de moneda; cada escenario conserva la moneda del precio fuente.',
  'PL-005 no recomienda, aprueba ni selecciona automáticamente un precio comercial.',
] as const

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function cloneGuardrail(
  guardrail: Readonly<PriceEngineeringGuardrail>,
): PriceEngineeringGuardrail {
  return {
    ...guardrail,
  }
}

function cloneRequest(
  request: Partial<PricingLaboratoryWorkspaceRequest> | undefined,
): PricingLaboratoryWorkspaceRequest {
  return {
    productId: request?.productId ??
      DEFAULT_PRICING_LABORATORY_WORKSPACE_REQUEST.productId,
    currency: request?.currency ??
      DEFAULT_PRICING_LABORATORY_WORKSPACE_REQUEST.currency,
    templates: (request?.templates ?? []).map((template) => ({
      ...template,
      basis: {
        ...template.basis,
      },
      guardrails: template.guardrails?.map(cloneGuardrail),
      scope: template.scope
        ? {
          ...(template.scope.brandIds
            ? { brandIds: [...template.scope.brandIds] }
            : {}),
          ...(template.scope.productIds
            ? { productIds: [...template.scope.productIds] }
            : {}),
          ...(template.scope.currencies
            ? { currencies: [...template.scope.currencies] }
            : {}),
        }
        : undefined,
    })),
    guardrailProfiles: (request?.guardrailProfiles ?? []).map(
      (profile) => ({
        ...profile,
        guardrails: profile.guardrails.map(cloneGuardrail),
      }),
    ),
    defaultGuardrails: (request?.defaultGuardrails ?? [])
      .map(cloneGuardrail),
    ...(request?.options
      ? {
        options: {
          ...request.options,
        },
      }
      : {}),
    includeStoredScenarios: request?.includeStoredScenarios ??
      DEFAULT_PRICING_LABORATORY_WORKSPACE_REQUEST.includeStoredScenarios,
    selectedScenarioKey: request?.selectedScenarioKey ??
      DEFAULT_PRICING_LABORATORY_WORKSPACE_REQUEST.selectedScenarioKey,
  }
}

function buildScenarioKey(
  origin: 'template' | 'stored',
  id: string,
): string {
  return `${origin.toLocaleUpperCase('es-MX')}:${normalizeIdentifier(id)}`
}

function createIssue(
  issue: PricingLaboratoryWorkspaceIssue,
): PricingLaboratoryWorkspaceIssue {
  return {
    ...issue,
  }
}

function buildProductOptions(
  repository: BusinessRepository,
  prices: readonly BusinessPrice[],
): PricingLaboratoryProductOption[] {
  const grouped = new Map<string, BusinessPrice[]>()

  prices.forEach((price) => {
    const current = grouped.get(price.productId) ?? []
    current.push(price)
    grouped.set(price.productId, current)
  })

  return [...grouped.entries()]
    .map(([productId, productPrices]) => {
      const product = repository.product.findById(productId)
      const brandId = product?.brandId ??
        product?.brand ??
        productPrices[0]?.brandId ??
        'UNKNOWN'
      const model = product?.model?.trim() || null
      const sku = product?.sku?.trim() || product?.code?.trim() || null
      const label = model ?? product?.name?.trim() ?? sku ?? productId

      return {
        productId,
        label,
        model,
        sku,
        brandId,
        currencies: [...new Set(
          productPrices.map((price) => price.currency),
        )].sort(),
        priceCount: productPrices.length,
      }
    })
    .sort((optionA, optionB) =>
      optionA.label.localeCompare(optionB.label, 'es-MX') ||
      optionA.productId.localeCompare(optionB.productId, 'es-MX'),
    )
}

function buildCurrencyOptions(
  repository: BusinessRepository,
  productId: string,
): PricingLaboratoryCurrencyOption[] {
  const prices = repository.prices.getByProduct(productId)
  const currencies = [...new Set(
    prices.map((price) => price.currency),
  )].sort()

  return currencies
    .map((currency) =>
      repository.prices.findCurrentByProduct(productId, currency),
    )
    .filter((price): price is BusinessPrice => Boolean(price))
    .map((price) => ({
      currency: price.currency,
      priceId: price.id,
      effectiveDate: price.effectiveDate,
      sellingPrice: price.sellingPrice,
      grossMargin: price.grossMargin,
      marginBand: price.marginBand,
    }))
}

function emptySummary(): PricingLaboratoryWorkspaceSummary {
  return {
    totalRows: 0,
    templateRows: 0,
    storedRows: 0,
    evaluatedRows: 0,
    disabledRows: 0,
    notApplicableRows: 0,
    validEvaluations: 0,
    warningEvaluations: 0,
    blockedEvaluations: 0,
    invalidEvaluations: 0,
    rowsWithMetrics: 0,
    templateIssueCount: 0,
    selectedScenarioKey: null,
  }
}

function buildSelection(
  request: PricingLaboratoryWorkspaceRequest,
  products: PricingLaboratoryProductOption[],
  currencies: PricingLaboratoryCurrencyOption[],
  selectedProductId: string | null,
  selectedCurrency: string | null,
): PricingLaboratoryWorkspaceSelection {
  return {
    requestedProductId: normalizeIdentifier(request.productId),
    requestedCurrency: request.currency
      ? normalizeIdentifier(request.currency)
      : null,
    selectedProductId,
    selectedCurrency,
    products,
    currencies,
  }
}

function buildEmptyModel(
  status: PricingLaboratoryWorkspaceStatus,
  reason: PricingLaboratoryWorkspaceUnavailableReason,
  selection: PricingLaboratoryWorkspaceSelection,
  issues: readonly PricingLaboratoryWorkspaceIssue[],
  generatedAt: string | null,
): PricingLaboratoryWorkspaceModel {
  return {
    available: false,
    status,
    unavailableReason: reason,
    generatedAt,
    methodology: {
      workspace: PRICING_LABORATORY_WORKSPACE_METHODOLOGY,
      templates: 'pricing-template-v1',
      engineering: 'price-engineering-v1',
    },
    executionMode: 'simulation-only',
    isolation: {
      mutatesSourcePrice: false,
      persistsScenarioResults: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    selection,
    source: null,
    scenarios: [],
    selectedScenario: null,
    summary: emptySummary(),
    issues: issues.map(createIssue),
    templateIssues: [],
    explainability: [
      'El laboratorio no ejecutó escenarios porque falta una selección o una fuente válida.',
      'No se modificó ni persistió ningún precio.',
    ],
    limitations: [...WORKSPACE_LIMITATIONS],
  }
}

function mapTemplateResolution(
  resolution: PricingLaboratoryTemplateResolution,
  selectedScenarioKey: string | null,
): PricingLaboratoryWorkspaceScenarioRow {
  const key = buildScenarioKey(
    'template',
    resolution.configurationId,
  )
  const evaluation = resolution.evaluation

  return {
    key,
    origin: 'template',
    configurationId: resolution.configurationId,
    templateId: resolution.templateId,
    storedScenarioId: null,
    name: resolution.name,
    kind: resolution.definition.kind,
    pricingGroupId: resolution.definition.pricingGroupId,
    orchestrationStatus: resolution.status,
    evaluationStatus: evaluation?.status ?? null,
    basis: evaluation
      ? { ...evaluation.basis }
      : null,
    metrics: evaluation?.metrics
      ? { ...evaluation.metrics }
      : null,
    delta: evaluation?.delta
      ? { ...evaluation.delta }
      : null,
    resolvedGuardrails: resolution.resolvedGuardrails
      .map(cloneGuardrail),
    signals: (evaluation?.signals ?? []).map((signal) => ({
      ...signal,
    })),
    issues: resolution.issues.map((issue) => ({
      ...issue,
    })),
    explainability: [
      ...resolution.explainability,
      ...(evaluation?.explainability ?? []),
    ],
    sourceReference: resolution.sourceReference,
    notes: resolution.notes,
    selected: selectedScenarioKey === key,
  }
}

function buildSummary(
  rows: readonly PricingLaboratoryWorkspaceScenarioRow[],
  selectedScenarioKey: string | null,
  templateIssueCount: number,
): PricingLaboratoryWorkspaceSummary {
  return {
    totalRows: rows.length,
    templateRows: rows.filter(
      (row) => row.origin === 'template',
    ).length,
    storedRows: rows.filter(
      (row) => row.origin === 'stored',
    ).length,
    evaluatedRows: rows.filter(
      (row) => row.orchestrationStatus === 'evaluated',
    ).length,
    disabledRows: rows.filter(
      (row) => row.orchestrationStatus === 'disabled',
    ).length,
    notApplicableRows: rows.filter(
      (row) => row.orchestrationStatus === 'not_applicable',
    ).length,
    validEvaluations: rows.filter(
      (row) => row.evaluationStatus === 'valid',
    ).length,
    warningEvaluations: rows.filter(
      (row) => row.evaluationStatus === 'warning',
    ).length,
    blockedEvaluations: rows.filter(
      (row) => row.evaluationStatus === 'blocked',
    ).length,
    invalidEvaluations: rows.filter(
      (row) => row.evaluationStatus === 'invalid' ||
        row.orchestrationStatus === 'invalid',
    ).length,
    rowsWithMetrics: rows.filter(
      (row) => row.metrics !== null,
    ).length,
    templateIssueCount,
    selectedScenarioKey,
  }
}

function buildSource(
  repository: BusinessRepository,
  price: BusinessPrice,
  metrics: NonNullable<
    ReturnType<typeof evaluatePriceLaboratory>['base']
  >,
): PricingLaboratoryWorkspaceSourcePrice {
  const product = repository.product.findById(price.productId)
  const brand = repository.brand.findById(price.brandId)

  return {
    priceId: price.id,
    productId: price.productId,
    productName: product?.name?.trim() ??
      product?.model?.trim() ??
      price.productId,
    model: product?.model?.trim() || null,
    sku: product?.sku?.trim() || product?.code?.trim() || null,
    brandId: price.brandId,
    brandName: brand?.name?.trim() ?? price.brandId,
    currency: price.currency,
    effectiveDate: price.effectiveDate,
    source: price.source,
    sourceReference: price.sourceReference,
    metrics: {
      ...metrics,
    },
  }
}

function hasPartialConfiguration(
  rows: readonly PricingLaboratoryWorkspaceScenarioRow[],
  issues: readonly PricingLaboratoryWorkspaceIssue[],
  templateIssues: readonly PricingLaboratoryTemplateIssue[],
): boolean {
  return rows.some(
    (row) => row.orchestrationStatus === 'invalid',
  ) || templateIssues.some(
    (issue) => issue.severity === 'invalid',
  ) || issues.some(
    (issue) => issue.severity === 'warning' ||
      issue.severity === 'invalid',
  )
}

export function buildPricingLaboratoryWorkspace(
  repository: BusinessRepository | null,
  requestInput?: Partial<PricingLaboratoryWorkspaceRequest>,
): PricingLaboratoryWorkspaceModel {
  const request = cloneRequest(requestInput)
  const emptySelection = buildSelection(
    request,
    [],
    [],
    null,
    null,
  )

  if (!repository) {
    return buildEmptyModel(
      'unavailable',
      'repository_unavailable',
      emptySelection,
      [{
        code: 'WORKSPACE_REPOSITORY_UNAVAILABLE',
        severity: 'invalid',
        message: 'Business Repository no está disponible para el laboratorio.',
      }],
      null,
    )
  }

  const generatedAt = repository.getGeneratedAt()
  const prices = repository.prices.getAll()
  const productOptions = buildProductOptions(repository, prices)

  if (prices.length === 0) {
    return buildEmptyModel(
      'unavailable',
      'pricing_data_unavailable',
      buildSelection(request, productOptions, [], null, null),
      [{
        code: 'WORKSPACE_PRICING_DATA_UNAVAILABLE',
        severity: 'invalid',
        message: 'No existen precios normalizados disponibles para simulación.',
      }],
      generatedAt,
    )
  }

  const productId = normalizeIdentifier(request.productId)

  if (!productId) {
    return buildEmptyModel(
      'awaiting_selection',
      'product_selection_required',
      buildSelection(request, productOptions, [], null, null),
      [{
        code: 'WORKSPACE_PRODUCT_SELECTION_REQUIRED',
        severity: 'info',
        message: 'Selecciona un producto para construir el laboratorio.',
      }],
      generatedAt,
    )
  }

  const currencyOptions = buildCurrencyOptions(repository, productId)

  if (currencyOptions.length === 0) {
    return buildEmptyModel(
      'unavailable',
      'price_not_found',
      buildSelection(
        request,
        productOptions,
        currencyOptions,
        productId,
        null,
      ),
      [{
        code: 'WORKSPACE_PRICE_NOT_FOUND',
        severity: 'invalid',
        message: 'El producto seleccionado no tiene precios disponibles.',
      }],
      generatedAt,
    )
  }

  const requestedCurrency = request.currency
    ? normalizeIdentifier(request.currency)
    : null
  const selectedCurrency = requestedCurrency ??
    (currencyOptions.length === 1
      ? currencyOptions[0]?.currency ?? null
      : null)

  if (!selectedCurrency) {
    return buildEmptyModel(
      'awaiting_selection',
      'currency_selection_required',
      buildSelection(
        request,
        productOptions,
        currencyOptions,
        productId,
        null,
      ),
      [{
        code: 'WORKSPACE_CURRENCY_SELECTION_REQUIRED',
        severity: 'info',
        message: 'Selecciona una moneda para evitar mezclar canales de precio.',
      }],
      generatedAt,
    )
  }

  const sourcePrice = repository.prices.findCurrentByProduct(
    productId,
    selectedCurrency,
  )

  if (!sourcePrice) {
    return buildEmptyModel(
      'unavailable',
      'price_not_found',
      buildSelection(
        request,
        productOptions,
        currencyOptions,
        productId,
        selectedCurrency,
      ),
      [{
        code: 'WORKSPACE_PRICE_NOT_FOUND',
        severity: 'invalid',
        message: 'No existe un precio vigente para el producto y moneda seleccionados.',
      }],
      generatedAt,
    )
  }

  const templateResult = evaluatePricingTemplateSet({
    price: sourcePrice,
    templates: request.templates,
    guardrailProfiles: request.guardrailProfiles,
    defaultGuardrails: request.defaultGuardrails,
    ...(request.options ? { options: request.options } : {}),
  })

  if (!templateResult.available || !templateResult.laboratory.base) {
    return buildEmptyModel(
      'unavailable',
      'source_price_invalid',
      buildSelection(
        request,
        productOptions,
        currencyOptions,
        productId,
        selectedCurrency,
      ),
      [{
        code: 'WORKSPACE_SOURCE_PRICE_INVALID',
        severity: 'invalid',
        message: 'El precio fuente no cumple el contrato mínimo del laboratorio.',
      }],
      generatedAt,
    )
  }

  const selectedScenarioKey = request.selectedScenarioKey
    ? normalizeIdentifier(request.selectedScenarioKey)
    : null
  const templateRows = templateResult.templates.map((resolution) =>
    mapTemplateResolution(resolution, selectedScenarioKey),
  )
  const storedScenarios = request.includeStoredScenarios
    ? repository.prices.getScenarios(sourcePrice.id)
    : []
  const storedLaboratory = evaluatePriceLaboratory({
    price: sourcePrice,
    scenarios: storedScenarios.map((scenario) =>
      createEngineeringScenarioFromStored(scenario),
    ),
    defaultGuardrails: request.defaultGuardrails,
    ...(request.options ? { options: request.options } : {}),
  })
  const storedRows: PricingLaboratoryWorkspaceScenarioRow[] =
    storedLaboratory.scenarios.map((evaluation, index) => {
      const stored = storedScenarios[index]
      const key = buildScenarioKey(
        'stored',
        evaluation.scenarioId,
      )

      return {
        key,
        origin: 'stored',
        configurationId: evaluation.scenarioId,
        templateId: null,
        storedScenarioId: stored?.id ?? evaluation.scenarioId,
        name: evaluation.name,
        kind: evaluation.kind,
        pricingGroupId: evaluation.pricingGroupId,
        orchestrationStatus: 'evaluated',
        evaluationStatus: evaluation.status,
        basis: {
          ...evaluation.basis,
        },
        metrics: evaluation.metrics
          ? { ...evaluation.metrics }
          : null,
        delta: evaluation.delta
          ? { ...evaluation.delta }
          : null,
        resolvedGuardrails: request.defaultGuardrails
          .map(cloneGuardrail),
        signals: evaluation.signals.map((signal) => ({
          ...signal,
        })),
        issues: [],
        explainability: [
          'El escenario almacenado se leyó como referencia y se reevaluó en memoria.',
          ...evaluation.explainability,
          'La reevaluación no modificó ni persistió el escenario original.',
        ],
        sourceReference: stored?.sourceReference ?? null,
        notes: null,
        selected: selectedScenarioKey === key,
      }
    })

  const rows = [
    ...templateRows,
    ...storedRows,
  ]
  const issues: PricingLaboratoryWorkspaceIssue[] = []
  const product = repository.product.findById(productId)

  if (!product) {
    issues.push(createIssue({
      code: 'WORKSPACE_PRODUCT_METADATA_NOT_FOUND',
      severity: 'warning',
      message: 'El precio existe, pero Product Master no contiene metadata para el producto.',
    }))
  }

  const selectedScenario = selectedScenarioKey
    ? rows.find((row) => row.key === selectedScenarioKey) ?? null
    : null

  if (selectedScenarioKey && !selectedScenario) {
    issues.push(createIssue({
      code: 'WORKSPACE_SELECTED_SCENARIO_NOT_FOUND',
      severity: 'warning',
      message: 'El escenario solicitado no existe en la orquestación actual.',
    }))
  }

  const resolvedSelectedKey = selectedScenario?.key ?? null
  const normalizedRows = rows.map((row) => ({
    ...row,
    selected: row.key === resolvedSelectedKey,
  }))
  const resolvedSelectedScenario = resolvedSelectedKey
    ? normalizedRows.find((row) => row.key === resolvedSelectedKey) ?? null
    : null
  const status: PricingLaboratoryWorkspaceStatus =
    hasPartialConfiguration(
      normalizedRows,
      issues,
      templateResult.issues,
    )
      ? 'partial'
      : 'ready'

  return {
    available: true,
    status,
    unavailableReason: null,
    generatedAt,
    methodology: {
      workspace: PRICING_LABORATORY_WORKSPACE_METHODOLOGY,
      templates: templateResult.methodology,
      engineering: templateResult.laboratory.methodology,
    },
    executionMode: templateResult.executionMode,
    isolation: {
      ...templateResult.isolation,
    },
    selection: buildSelection(
      request,
      productOptions,
      currencyOptions,
      productId,
      selectedCurrency,
    ),
    source: buildSource(
      repository,
      sourcePrice,
      templateResult.laboratory.base,
    ),
    scenarios: normalizedRows,
    selectedScenario: resolvedSelectedScenario,
    summary: buildSummary(
      normalizedRows,
      resolvedSelectedKey,
      templateResult.issues.length,
    ),
    issues,
    templateIssues: templateResult.issues.map((issue) => ({
      ...issue,
    })),
    explainability: [
      `Se seleccionó ${sourcePrice.productId} en ${sourcePrice.currency} como precio fuente vigente.`,
      `${templateRows.length} plantilla(s) y ${storedRows.length} escenario(s) almacenado(s) fueron orquestados sin escritura.`,
      'El orden de comparación conserva primero las plantillas capturadas y después los escenarios almacenados.',
      'Ningún resultado se interpreta como recomendación, aprobación o cambio de precio.',
    ],
    limitations: [...WORKSPACE_LIMITATIONS],
  }
}
