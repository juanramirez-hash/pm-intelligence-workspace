import type { BusinessPrice } from '../entities/price'

import {
  PRICE_ENGINEERING_EXECUTION_MODE,
} from './priceEngineeringContracts'

import type {
  PriceEngineeringGuardrail,
  PriceEngineeringScenarioInput,
} from './priceEngineeringContracts'

import {
  evaluatePriceLaboratory,
} from './priceEngineeringEngine'

import {
  findPricingLaboratoryTemplateDefinition,
} from './pricingTemplateCatalog'

import {
  PRICING_TEMPLATE_METHODOLOGY,
} from './pricingTemplateContracts'

import type {
  PricingLaboratoryGuardrailProfileInput,
  PricingLaboratoryTemplateDefinition,
  PricingLaboratoryTemplateInput,
  PricingLaboratoryTemplateIssue,
  PricingLaboratoryTemplateResolution,
  PricingLaboratoryTemplateScope,
  PricingLaboratoryTemplateSetInput,
  PricingLaboratoryTemplateSetResult,
} from './pricingTemplateContracts'

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function clonePrice(price: Readonly<BusinessPrice>): BusinessPrice {
  return {
    ...price,
  }
}

function cloneGuardrail(
  guardrail: Readonly<PriceEngineeringGuardrail>,
): PriceEngineeringGuardrail {
  return {
    ...guardrail,
  }
}

function cloneScope(
  scope: PricingLaboratoryTemplateScope | undefined,
): PricingLaboratoryTemplateScope | null {
  if (!scope) {
    return null
  }

  const clone: PricingLaboratoryTemplateScope = {}

  if (scope.brandIds) {
    clone.brandIds = [...scope.brandIds]
  }

  if (scope.productIds) {
    clone.productIds = [...scope.productIds]
  }

  if (scope.currencies) {
    clone.currencies = [...scope.currencies]
  }

  return clone
}

function createIssue(
  issue: PricingLaboratoryTemplateIssue,
): PricingLaboratoryTemplateIssue {
  return {
    ...issue,
  }
}

function findDuplicates(values: readonly string[]): Set<string> {
  const counts = new Map<string, number>()

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([value]) => value),
  )
}

function buildProfileMap(
  profiles: readonly PricingLaboratoryGuardrailProfileInput[],
): {
  profiles: Map<string, PricingLaboratoryGuardrailProfileInput>
  duplicateIds: Set<string>
  issues: PricingLaboratoryTemplateIssue[]
} {
  const normalizedIds = profiles.map((profile) =>
    normalizeIdentifier(profile.id),
  )
  const duplicateIds = findDuplicates(normalizedIds)
  const profileMap = new Map<string, PricingLaboratoryGuardrailProfileInput>()
  const issues: PricingLaboratoryTemplateIssue[] = []

  profiles.forEach((profile, index) => {
    const id = normalizedIds[index] ?? ''

    if (!id || !profile.name.trim()) {
      issues.push(createIssue({
        code: 'GUARDRAIL_PROFILE_INVALID_IDENTIFIER',
        severity: 'invalid',
        message: 'El perfil de guardrails requiere identificador y nombre.',
        configurationId: null,
        profileId: id || null,
      }))
      return
    }

    if (duplicateIds.has(id)) {
      issues.push(createIssue({
        code: 'GUARDRAIL_PROFILE_DUPLICATE_ID',
        severity: 'invalid',
        message: `El perfil ${id} está duplicado y no puede resolverse.`,
        configurationId: null,
        profileId: id,
      }))
      return
    }

    profileMap.set(id, {
      ...profile,
      id,
      name: profile.name.trim(),
      guardrails: profile.guardrails.map(cloneGuardrail),
    })
  })

  return {
    profiles: profileMap,
    duplicateIds,
    issues,
  }
}

function validateScope(
  scope: PricingLaboratoryTemplateScope | undefined,
): boolean {
  if (!scope) {
    return true
  }

  return [scope.brandIds, scope.productIds, scope.currencies]
    .filter((values): values is readonly string[] => values !== undefined)
    .every((values) =>
      values.length > 0 &&
      values.every((value) => Boolean(normalizeIdentifier(value))),
    )
}

function scopeMatchesPrice(
  scope: PricingLaboratoryTemplateScope | undefined,
  price: Readonly<BusinessPrice>,
): boolean {
  if (!scope) {
    return true
  }

  const brandId = normalizeIdentifier(price.brandId)
  const productId = normalizeIdentifier(price.productId)
  const currency = normalizeIdentifier(price.currency)

  if (
    scope.brandIds &&
    !scope.brandIds
      .map(normalizeIdentifier)
      .includes(brandId)
  ) {
    return false
  }

  if (
    scope.productIds &&
    !scope.productIds
      .map(normalizeIdentifier)
      .includes(productId)
  ) {
    return false
  }

  if (
    scope.currencies &&
    !scope.currencies
      .map(normalizeIdentifier)
      .includes(currency)
  ) {
    return false
  }

  return true
}

function mergeGuardrails(
  layers: readonly (readonly PriceEngineeringGuardrail[])[],
  configurationId: string,
): {
  guardrails: PriceEngineeringGuardrail[]
  issues: PricingLaboratoryTemplateIssue[]
} {
  const byType = new Map<
    PriceEngineeringGuardrail['type'],
    PriceEngineeringGuardrail
  >()
  const overriddenTypes = new Set<PriceEngineeringGuardrail['type']>()

  layers.forEach((guardrails) => {
    guardrails.forEach((guardrail) => {
      if (byType.has(guardrail.type)) {
        overriddenTypes.add(guardrail.type)
      }

      byType.set(guardrail.type, cloneGuardrail(guardrail))
    })
  })

  return {
    guardrails: [...byType.values()].map(cloneGuardrail),
    issues: [...overriddenTypes].map((type) => createIssue({
      code: 'GUARDRAIL_OVERRIDDEN',
      severity: 'info',
      message: `El guardrail ${type} fue reemplazado por una capa más específica.`,
      configurationId,
      profileId: null,
    })),
  }
}

function buildInvalidResolution(
  template: Readonly<PricingLaboratoryTemplateInput>,
  configurationId: string,
  definition: PricingLaboratoryTemplateDefinition,
  issues: readonly PricingLaboratoryTemplateIssue[],
): PricingLaboratoryTemplateResolution {
  return {
    configurationId,
    templateId: template.templateId,
    name: template.name?.trim() || definition.label,
    definition,
    status: 'invalid',
    scope: cloneScope(template.scope),
    resolvedGuardrails: [],
    evaluation: null,
    issues: issues.map(createIssue),
    explainability: [
      'La plantilla no se evaluó porque su configuración es inválida.',
      'No se modificó el precio fuente ni se persistió ningún resultado.',
    ],
    sourceReference: template.sourceReference ?? null,
    notes: template.notes ?? null,
  }
}

function buildScenario(
  template: Readonly<PricingLaboratoryTemplateInput>,
  configurationId: string,
  definition: PricingLaboratoryTemplateDefinition,
  guardrails: readonly PriceEngineeringGuardrail[],
): PriceEngineeringScenarioInput {
  return {
    id: configurationId,
    name: template.name?.trim() || definition.label,
    kind: definition.kind,
    pricingGroupId: definition.pricingGroupId,
    basis: {
      ...template.basis,
    },
    guardrails: guardrails.map(cloneGuardrail),
  }
}

function buildExplainability(
  definition: PricingLaboratoryTemplateDefinition,
  template: Readonly<PricingLaboratoryTemplateInput>,
  guardrails: readonly PriceEngineeringGuardrail[],
): string[] {
  const explanations = [
    `${definition.label} usa valores capturados explícitamente; la plantilla no contiene descuentos ni márgenes predeterminados.`,
    `La base de cálculo seleccionada es ${template.basis.type}.`,
    `${guardrails.length} guardrail(s) explícito(s) se aplican a esta simulación.`,
  ]

  if (template.scope) {
    explanations.push('La plantilla se limita al alcance de marca, producto o moneda proporcionado.')
  }

  explanations.push('El resultado es temporal, descartable y no escribe fuera del Pricing Laboratory.')

  return explanations
}

export function evaluatePricingTemplateSet(
  input: Readonly<PricingLaboratoryTemplateSetInput>,
): PricingLaboratoryTemplateSetResult {
  const sourcePrice = clonePrice(input.price)
  const profilesInput = input.guardrailProfiles ?? []
  const profileBuild = buildProfileMap(profilesInput)
  const configurationIds = input.templates.map((template) =>
    normalizeIdentifier(template.id),
  )
  const duplicateConfigurationIds = findDuplicates(configurationIds)
  const preliminary: PricingLaboratoryTemplateResolution[] = []
  const scenarios: PriceEngineeringScenarioInput[] = []
  const scenarioResolutionIndexes: number[] = []
  const issues: PricingLaboratoryTemplateIssue[] = [
    ...profileBuild.issues.map(createIssue),
  ]

  input.templates.forEach((template, index) => {
    const configurationId = configurationIds[index] ?? ''
    const definition = findPricingLaboratoryTemplateDefinition(
      template.templateId,
    )

    if (!definition) {
      const issue = createIssue({
        code: 'TEMPLATE_UNKNOWN_DEFINITION',
        severity: 'invalid',
        message: 'La plantilla solicitada no existe en el catálogo estándar.',
        configurationId: configurationId || null,
        profileId: null,
      })
      issues.push(issue)
      return
    }

    if (!configurationId || duplicateConfigurationIds.has(configurationId)) {
      const issue = createIssue({
        code: 'TEMPLATE_DUPLICATE_ID',
        severity: 'invalid',
        message: configurationId
          ? `La configuración ${configurationId} está duplicada.`
          : 'La configuración requiere un identificador.',
        configurationId: configurationId || null,
        profileId: null,
      })
      issues.push(issue)
      preliminary.push(buildInvalidResolution(
        template,
        configurationId,
        definition,
        [issue],
      ))
      return
    }

    if (!validateScope(template.scope)) {
      const issue = createIssue({
        code: 'TEMPLATE_INVALID_SCOPE',
        severity: 'invalid',
        message: 'El alcance contiene una lista vacía o un identificador inválido.',
        configurationId,
        profileId: null,
      })
      issues.push(issue)
      preliminary.push(buildInvalidResolution(
        template,
        configurationId,
        definition,
        [issue],
      ))
      return
    }

    if (template.enabled === false) {
      preliminary.push({
        configurationId,
        templateId: template.templateId,
        name: template.name?.trim() || definition.label,
        definition,
        status: 'disabled',
        scope: cloneScope(template.scope),
        resolvedGuardrails: [],
        evaluation: null,
        issues: [],
        explainability: [
          'La plantilla está deshabilitada y no fue enviada al motor de cálculo.',
          'No se modificó el precio fuente ni se persistió ningún resultado.',
        ],
        sourceReference: template.sourceReference ?? null,
        notes: template.notes ?? null,
      })
      return
    }

    if (!scopeMatchesPrice(template.scope, sourcePrice)) {
      const issue = createIssue({
        code: 'TEMPLATE_NOT_APPLICABLE',
        severity: 'info',
        message: 'La plantilla no aplica al producto, marca o moneda del precio fuente.',
        configurationId,
        profileId: null,
      })
      issues.push(issue)
      preliminary.push({
        configurationId,
        templateId: template.templateId,
        name: template.name?.trim() || definition.label,
        definition,
        status: 'not_applicable',
        scope: cloneScope(template.scope),
        resolvedGuardrails: [],
        evaluation: null,
        issues: [issue],
        explainability: [
          'La plantilla quedó fuera del alcance explícito de esta simulación.',
          'No se modificó el precio fuente ni se persistió ningún resultado.',
        ],
        sourceReference: template.sourceReference ?? null,
        notes: template.notes ?? null,
      })
      return
    }

    const profileId = template.guardrailProfileId
      ? normalizeIdentifier(template.guardrailProfileId)
      : null

    if (
      profileId &&
      (
        profileBuild.duplicateIds.has(profileId) ||
        !profileBuild.profiles.has(profileId)
      )
    ) {
      const issue = createIssue({
        code: 'TEMPLATE_PROFILE_NOT_FOUND',
        severity: 'invalid',
        message: `El perfil ${profileId} no está disponible para esta simulación.`,
        configurationId,
        profileId,
      })
      issues.push(issue)
      preliminary.push(buildInvalidResolution(
        template,
        configurationId,
        definition,
        [issue],
      ))
      return
    }

    const profileGuardrails = profileId
      ? profileBuild.profiles.get(profileId)?.guardrails ?? []
      : []
    const merged = mergeGuardrails(
      [
        input.defaultGuardrails ?? [],
        profileGuardrails,
        template.guardrails ?? [],
      ],
      configurationId,
    )
    issues.push(...merged.issues.map(createIssue))

    const scenario = buildScenario(
      template,
      configurationId,
      definition,
      merged.guardrails,
    )
    scenarios.push(scenario)
    scenarioResolutionIndexes.push(preliminary.length)
    preliminary.push({
      configurationId,
      templateId: template.templateId,
      name: scenario.name,
      definition,
      status: 'evaluated',
      scope: cloneScope(template.scope),
      resolvedGuardrails: merged.guardrails.map(cloneGuardrail),
      evaluation: null,
      issues: merged.issues.map(createIssue),
      explainability: buildExplainability(
        definition,
        template,
        merged.guardrails,
      ),
      sourceReference: template.sourceReference ?? null,
      notes: template.notes ?? null,
    })
  })

  const laboratory = evaluatePriceLaboratory({
    price: sourcePrice,
    scenarios,
    ...(input.options ? { options: input.options } : {}),
  })

  laboratory.scenarios.forEach((evaluation, index) => {
    const resolutionIndex = scenarioResolutionIndexes[index]

    if (resolutionIndex === undefined) {
      return
    }

    const resolution = preliminary[resolutionIndex]

    if (resolution) {
      resolution.evaluation = evaluation
    }
  })

  return {
    available: laboratory.available,
    methodology: PRICING_TEMPLATE_METHODOLOGY,
    executionMode: PRICE_ENGINEERING_EXECUTION_MODE,
    isolation: {
      mutatesSourcePrice: false,
      persistsScenarioResults: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    sourcePrice,
    templates: preliminary,
    laboratory,
    summary: {
      totalTemplates: preliminary.length,
      evaluatedTemplates: preliminary.filter(
        (template) => template.status === 'evaluated',
      ).length,
      disabledTemplates: preliminary.filter(
        (template) => template.status === 'disabled',
      ).length,
      notApplicableTemplates: preliminary.filter(
        (template) => template.status === 'not_applicable',
      ).length,
      invalidTemplates: preliminary.filter(
        (template) => template.status === 'invalid',
      ).length,
      guardrailProfiles: profileBuild.profiles.size,
      totalIssues: issues.length,
    },
    issues,
  }
}

export class PricingTemplateEngine {
  evaluate(
    input: Readonly<PricingLaboratoryTemplateSetInput>,
  ): PricingLaboratoryTemplateSetResult {
    return evaluatePricingTemplateSet(input)
  }
}
