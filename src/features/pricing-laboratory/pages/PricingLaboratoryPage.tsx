import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FlaskConical,
  Home,
  Layers3,
  LockKeyhole,
  PackagePlus,
  Printer,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  ExecutiveBreadcrumbs,
  ExecutiveShell,
  KPIGrid,
  ShellActions,
  ShellActionsGroup,
} from '../../../atlas/shell'

import {
  ExecutiveHero,
} from '../../../atlas/widgets/executive'

import {
  IntelligentKpiCard,
} from '../../../atlas/widgets/kpi'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  PricingLaboratoryTemplateInput,
} from '../../../core/business/pricing'

import {
  PricingBatchDesigner,
  PricingLaboratorySelectionPanel,
  PricingNewProductDesigner,
  PricingScenarioBuilder,
  PricingScenarioDetail,
  PricingScenarioExecutiveComparison,
  PricingScenarioTable,
} from '../components'

import {
  buildPricingScenarioExecutiveComparison,
} from '../engine'

import {
  buildPricingScenarioExecutiveExport,
  downloadPricingScenarioExecutiveExport,
} from '../export'

import {
  usePricingLaboratoryWorkspace,
} from '../hooks'

import type {
  PricingLaboratoryWorkspaceStatus,
} from '../types'

import {
  formatPricingDate,
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils'

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function workspaceStatusPresentation(
  status: PricingLaboratoryWorkspaceStatus,
) {
  if (status === 'ready') {
    return {
      label: 'Laboratorio listo',
      className: 'bg-emerald-100 text-emerald-700',
      icon: <CheckCircle2 size={13} />,
    }
  }

  if (status === 'partial') {
    return {
      label: 'Disponible con incidencias',
      className: 'bg-amber-100 text-amber-800',
      icon: <AlertTriangle size={13} />,
    }
  }

  if (status === 'awaiting_selection') {
    return {
      label: 'Selección requerida',
      className: 'bg-sky-100 text-sky-700',
      icon: <SlidersHorizontal size={13} />,
    }
  }

  return {
    label: 'Pricing no disponible',
    className: 'bg-rose-100 text-rose-700',
    icon: <AlertTriangle size={13} />,
  }
}

type PricingLaboratorySourceMode = 'catalog' | 'new_product'

export function PricingLaboratoryPage() {
  const [sourceMode, setSourceMode] = useState<PricingLaboratorySourceMode>('catalog')
  const [manualDesignerVersion, setManualDesignerVersion] = useState(1)
  const [productId, setProductId] = useState('')
  const [currency, setCurrency] = useState<string | null>(null)
  const [templates, setTemplates] = useState<PricingLaboratoryTemplateInput[]>([])
  const [includeStoredScenarios, setIncludeStoredScenarios] = useState(true)
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string | null>(null)
  const [comparisonScenarioKeys, setComparisonScenarioKeys] = useState<string[]>([])
  const [scenarioSequence, setScenarioSequence] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)

  const request = useMemo(
    () => ({
      productId,
      currency,
      templates,
      guardrailProfiles: [],
      defaultGuardrails: [],
      includeStoredScenarios,
      selectedScenarioKey,
    }),
    [
      productId,
      currency,
      templates,
      includeStoredScenarios,
      selectedScenarioKey,
    ],
  )

  const workspace = usePricingLaboratoryWorkspace(request)
  const status = sourceMode === 'catalog'
    ? workspaceStatusPresentation(workspace.status)
    : {
      label: 'Diseño desde costo',
      className: 'bg-sky-100 text-sky-700',
      icon: <PackagePlus size={13} />,
    }
  const source = workspace.source
  const selectedCurrency = workspace.selection.selectedCurrency
  const sourceCurrency = source?.currency ?? selectedCurrency
  const heroSource = sourceMode === 'catalog' ? source : null
  const heroCurrency = sourceMode === 'catalog' ? sourceCurrency : null
  const executiveComparison = useMemo(
    () => buildPricingScenarioExecutiveComparison(
      workspace,
      comparisonScenarioKeys,
    ),
    [workspace, comparisonScenarioKeys],
  )
  const scenarioScope = source
    ? {
      productId: source.productId,
      currency: source.currency,
    }
    : null

  const handleProductChange = (nextProductId: string) => {
    setProductId(nextProductId)
    setCurrency(null)
    setTemplates([])
    setSelectedScenarioKey(null)
    setComparisonScenarioKeys([])
    setExportStatus(null)
    setScenarioSequence(1)
  }

  const handleCurrencyChange = (nextCurrency: string | null) => {
    setCurrency(nextCurrency)
    setTemplates([])
    setSelectedScenarioKey(null)
    setComparisonScenarioKeys([])
    setExportStatus(null)
    setScenarioSequence(1)
  }

  const handleCreateScenario = (input: PricingLaboratoryTemplateInput) => {
    const scenarioKey = `TEMPLATE:${normalizeIdentifier(input.id)}`

    setTemplates((current) => [...current, input])
    setSelectedScenarioKey(scenarioKey)
    setComparisonScenarioKeys((current) => [...current, scenarioKey])
    setExportStatus(null)
    setScenarioSequence((current) => current + 1)
  }

  const handleRemoveScenario = (configurationId: string) => {
    const scenarioKey = `TEMPLATE:${normalizeIdentifier(configurationId)}`

    setTemplates((current) => current.filter(
      (template) => template.id !== configurationId,
    ))

    if (selectedScenarioKey === scenarioKey) {
      setSelectedScenarioKey(null)
    }

    setComparisonScenarioKeys((current) => current.filter(
      (key) => key !== scenarioKey,
    ))
    setExportStatus(null)
  }

  const handleToggleComparison = (scenarioKey: string) => {
    setComparisonScenarioKeys((current) => current.includes(scenarioKey)
      ? current.filter((key) => key !== scenarioKey)
      : [...current, scenarioKey])
    setExportStatus(null)
  }

  const handleExecutiveExport = async () => {
    if (!executiveComparison.available || isExporting) {
      return
    }

    setIsExporting(true)
    setExportStatus(null)

    try {
      const payload = buildPricingScenarioExecutiveExport(
        executiveComparison,
      )

      await downloadPricingScenarioExecutiveExport(payload)
      setExportStatus(`Exportación generada: ${payload.fileName}`)
    } catch {
      setExportStatus('No fue posible generar el archivo ejecutivo de Pricing Laboratory.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    if (!executiveComparison.available) {
      return
    }

    window.print()
  }

  const resetLaboratory = () => {
    setManualDesignerVersion((current) => current + 1)
    setProductId('')
    setCurrency(null)
    setTemplates([])
    setIncludeStoredScenarios(true)
    setSelectedScenarioKey(null)
    setComparisonScenarioKeys([])
    setExportStatus(null)
    setScenarioSequence(1)
  }

  return (
    <ExecutiveShell
      beforeContent={(
        <ExecutiveBreadcrumbs
          items={[
            {
              label: 'Inicio',
              href: '/',
              icon: <Home size={14} />,
            },
            {
              label: 'Pricing Laboratory',
            },
          ]}
        />
      )}
      header={(
        <ExecutiveHero
          actions={(
            <div data-print-hidden="true">
              <ShellActions ariaLabel="Acciones de Pricing Laboratory">
                <ShellActionsGroup label="Gestión del laboratorio">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={sourceMode === 'catalog' &&
                      !productId &&
                      templates.length === 0 &&
                      selectedScenarioKey === null}
                    onClick={resetLaboratory}
                    type="button"
                  >
                    <RotateCcw size={16} />
                    Reiniciar laboratorio
                  </button>

                  {sourceMode === 'catalog' && (
                    <Link
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                      to="/data-center"
                    >
                      <Database size={16} />
                      Importar Pricing
                    </Link>
                  )}
                </ShellActionsGroup>

                {sourceMode === 'catalog' && (
                  <ShellActionsGroup label="Salida ejecutiva">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!executiveComparison.available || isExporting}
                    onClick={handleExecutiveExport}
                    type="button"
                  >
                    <FileSpreadsheet size={16} />
                    {isExporting ? 'Generando Excel...' : 'Exportar selección'}
                  </button>

                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!executiveComparison.available}
                    onClick={handlePrint}
                    type="button"
                  >
                    <Printer size={16} />
                    Imprimir / PDF
                  </button>
                  </ShellActionsGroup>
                )}
              </ShellActions>
            </div>
          )}
          description={sourceMode === 'catalog'
            ? 'Evalúa precios, descuentos, margen, GP y factores mediante escenarios temporales. Ningún resultado se guarda, aprueba o publica como precio comercial.'
            : 'Diseña precio de lista, factor y precio neto desde el costo de productos o marcas que todavía no existen en catálogo.'}
          eyebrow="Price Engineering"
          icon={<FlaskConical size={22} />}
          metadata={(
            <>
              <span>Metodología: {sourceMode === 'catalog' ? workspace.methodology.workspace : 'price-design-v1'}</span>
              <span>Generado: {sourceMode === 'catalog' ? formatPricingDate(workspace.generatedAt) : 'En memoria durante la sesión'}</span>
              <span>Modo: {sourceMode === 'catalog' ? 'catálogo / simulation-only' : 'nuevo producto / simulation-only'}</span>
            </>
          )}
          metrics={sourceMode === 'catalog'
            ? [
              {
                label: 'Precio vigente',
                value: formatPricingMoney(
                  heroSource?.metrics.sellingPrice,
                  heroCurrency,
                ),
                helper: heroSource ? `${heroSource.currency} · solo lectura` : 'Selecciona una fuente',
                icon: <BadgeDollarSign size={17} />,
              },
              {
                label: 'Costo vigente',
                value: formatPricingMoney(
                  heroSource?.metrics.cost,
                  heroCurrency,
                ),
                helper: 'Hecho fuente no modificable',
                icon: <Layers3 size={17} />,
              },
              {
                label: 'GP unitario actual',
                value: formatPricingMoney(
                  heroSource?.metrics.grossProfit,
                  heroCurrency,
                ),
                helper: 'Base de comparación',
                icon: <Target size={17} />,
                tone: 'positive',
              },
              {
                label: 'Margen actual',
                value: formatPricingPercentage(
                  heroSource?.metrics.grossMargin,
                ),
                helper: heroSource
                  ? heroSource.metrics.marginBand.replace(/_/g, ' ')
                  : 'Sin fuente',
                icon: <Sparkles size={17} />,
                tone: 'intelligence',
              },
            ]
            : [
              {
                label: 'Fuente',
                value: 'Costo manual',
                helper: 'No requiere producto existente',
                icon: <PackagePlus size={17} />,
              },
              {
                label: 'Descuento',
                value: 'Explícito',
                helper: '32%, 34% o cualquier otro',
                icon: <SlidersHorizontal size={17} />,
              },
              {
                label: 'Parámetros',
                value: 'Lista + factores',
                helper: 'Factor de lista y factor neto',
                icon: <Target size={17} />,
                tone: 'positive',
              },
              {
                label: 'Persistencia',
                value: 'Ninguna',
                helper: 'Solo memoria de la sesión',
                icon: <ShieldCheck size={17} />,
                tone: 'intelligence',
              },
            ]}
          score={{
            score: 100,
            caption: 'Aislamiento',
            label: 'Solo simulación',
            tone: 'healthy',
          }}
          status={(
            <span className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              status.className,
            ].join(' ')}>
              {status.icon}
              {status.label}
            </span>
          )}
          summaryItems={[
            {
              label: 'Producto',
              value: heroSource?.model ?? heroSource?.productName ?? (sourceMode === 'new_product' ? 'Captura manual' : 'Pendiente'),
            },
            {
              label: 'Marca',
              value: heroSource?.brandName ?? (sourceMode === 'new_product' ? 'Provisional' : '—'),
            },
            {
              label: 'Moneda',
              value: heroCurrency ?? (sourceMode === 'new_product' ? 'Captura explícita' : 'Pendiente'),
            },
            {
              label: 'Comparaciones',
              value: sourceMode === 'new_product'
                ? 'Matriz temporal'
                : workspace.summary.totalRows.toLocaleString('es-MX'),
            },
          ]}
          theme="pricing"
          title={sourceMode === 'new_product'
            ? 'Pricing Laboratory · Nuevo producto / marca'
            : source
              ? `Laboratorio · ${source.model ?? source.productName}`
              : 'Pricing Laboratory'}
        />
      )}
    >
      <ExecutivePanel
        icon={<SlidersHorizontal size={19} />}
        subtitle="Elige si la simulación parte de un precio existente o únicamente del costo de un producto nuevo."
        title="Modo del laboratorio"
        tone="intelligence"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className={[
              'rounded-2xl border p-4 text-left transition',
              sourceMode === 'catalog'
                ? 'border-rose-200 bg-rose-50 shadow-sm'
                : 'border-slate-200 bg-white hover:bg-slate-50',
            ].join(' ')}
            onClick={() => setSourceMode('catalog')}
            type="button"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Database size={17} />
              Producto existente
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Usa precio, costo y moneda disponibles en Business Repository.
            </p>
          </button>

          <button
            className={[
              'rounded-2xl border p-4 text-left transition',
              sourceMode === 'new_product'
                ? 'border-sky-200 bg-sky-50 shadow-sm'
                : 'border-slate-200 bg-white hover:bg-slate-50',
            ].join(' ')}
            onClick={() => setSourceMode('new_product')}
            type="button"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <PackagePlus size={17} />
              Nuevo producto / marca
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Parte del costo y calcula lista, factor, venta neta, GP y margen sin requerir catálogo.
            </p>
          </button>
        </div>
      </ExecutivePanel>

      {sourceMode === 'new_product' && (
        <ExecutivePanel
          icon={<PackagePlus size={19} />}
          subtitle="Calcula parámetros para altas futuras sin crear ni modificar registros comerciales."
          title="Diseño de precio para producto o marca nueva"
          tone="intelligence"
        >
          <PricingNewProductDesigner key={manualDesignerVersion} />
        </ExecutivePanel>
      )}

      {sourceMode === 'new_product' && (
        <ExecutivePanel
          icon={<Layers3 size={19} />}
          subtitle="Evalúa varios modelos, costos y descuentos con un factor de lista común para la marca."
          title="Matriz por lote de productos nuevos"
          tone="intelligence"
        >
          <PricingBatchDesigner key={`batch-${manualDesignerVersion}`} />
        </ExecutivePanel>
      )}

      <div className={sourceMode === 'catalog' ? 'contents' : 'hidden'}>
      {(workspace.issues.length > 0 || workspace.templateIssues.length > 0) && (
        <div className="grid gap-3">
          {[...workspace.issues, ...workspace.templateIssues].map((issue, index) => (
            <div
              className={[
                'rounded-2xl border px-4 py-3 text-sm',
                issue.severity === 'invalid'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : issue.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-sky-200 bg-sky-50 text-sky-700',
              ].join(' ')}
              key={`${issue.code}-${index}`}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}

      {exportStatus && (
        <div
          className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700"
          data-pricing-print-hidden="true"
        >
          {exportStatus}
        </div>
      )}

      <div className="contents" data-pricing-print-hidden="true">
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)]">
          <ExecutivePanel
            icon={<SlidersHorizontal size={19} />}
            subtitle="Define la fuente exacta que será evaluada."
            title="1. Producto y moneda"
            tone="intelligence"
          >
            <PricingLaboratorySelectionPanel
              currencies={workspace.selection.currencies}
              onCurrencyChange={handleCurrencyChange}
              onProductChange={handleProductChange}
              products={workspace.selection.products}
              selectedCurrency={selectedCurrency}
              selectedProductId={productId}
            />
          </ExecutivePanel>

          <ExecutivePanel
            icon={<FlaskConical size={19} />}
            subtitle="Crea supuestos explícitos sin guardar ni publicar resultados."
            title="2. Constructor de escenario"
            tone="critical"
          >
            <PricingScenarioBuilder
              key={`${source?.productId ?? 'none'}-${source?.currency ?? 'none'}`}
              onCreate={handleCreateScenario}
              scope={scenarioScope}
              sequence={scenarioSequence}
            />
          </ExecutivePanel>
        </div>

        <KPIGrid columns={4}>
          <IntelligentKpiCard
            context="Configuraciones temporales y referencias almacenadas."
            icon={<Layers3 size={19} />}
            insight="El total no representa opciones aprobadas."
            title="Escenarios"
            tone="intelligence"
            value={workspace.summary.totalRows.toLocaleString('es-MX')}
          />
          <IntelligentKpiCard
            context="Cumplen los límites explícitos capturados."
            icon={<CheckCircle2 size={19} />}
            insight="Válido significa calculable, no recomendado."
            title="Válidos"
            tone="positive"
            value={workspace.summary.validEvaluations.toLocaleString('es-MX')}
          />
          <IntelligentKpiCard
            context="Requieren revisar señales antes de interpretar."
            icon={<AlertTriangle size={19} />}
            insight="Las advertencias permanecen visibles para análisis."
            title="Advertencias"
            tone="attention"
            value={workspace.summary.warningEvaluations.toLocaleString('es-MX')}
          />
          <IntelligentKpiCard
            context="Incumplen al menos un guardrail bloqueante suministrado."
            icon={<ShieldCheck size={19} />}
            insight="El bloqueo no modifica ni impide consultar el precio fuente."
            title="Bloqueados"
            tone="critical"
            value={workspace.summary.blockedEvaluations.toLocaleString('es-MX')}
          />
        </KPIGrid>

        <ExecutivePanel
          count={workspace.summary.totalRows}
          footer={(
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  checked={includeStoredScenarios}
                  className="size-4 rounded border-slate-300 text-rose-600 focus:ring-rose-200"
                  onChange={(event) => {
                    const includeStored = event.target.checked
                    setIncludeStoredScenarios(includeStored)
                    setSelectedScenarioKey(null)
                    setExportStatus(null)

                    if (!includeStored) {
                      const templateKeys = new Set(
                        workspace.scenarios
                          .filter((row) => row.origin === 'template')
                          .map((row) => row.key),
                      )

                      setComparisonScenarioKeys((current) => current.filter(
                        (key) => templateKeys.has(key),
                      ))
                    }
                  }}
                  type="checkbox"
                />
                Incluir escenarios almacenados como referencia de solo lectura
              </label>
              <span>
                Marca Reporte para incluir una comparación en Excel o PDF
              </span>
            </div>
          )}
          icon={<BadgeDollarSign size={19} />}
          subtitle="Compara cada cálculo contra el precio vigente sin seleccionar un ganador automático."
          title="3. Comparación de escenarios"
          tone="intelligence"
        >
          <PricingScenarioTable
            comparisonScenarioKeys={comparisonScenarioKeys}
            currency={sourceCurrency}
            onRemove={handleRemoveScenario}
            onSelect={setSelectedScenarioKey}
            onToggleComparison={handleToggleComparison}
            rows={workspace.scenarios}
          />
        </ExecutivePanel>
      </div>

      <ExecutivePanel
        count={executiveComparison.summary.selectedRows}
        icon={<FileSpreadsheet size={19} />}
        subtitle="Documento bajo demanda con precio vigente, escenarios elegidos, supuestos, guardrails y trazabilidad."
        title="4. Comparación ejecutiva seleccionada"
        tone="intelligence"
      >
        <PricingScenarioExecutiveComparison
          comparison={executiveComparison}
        />
      </ExecutivePanel>

      <div
        className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]"
        data-pricing-print-hidden="true"
      >
        <ExecutivePanel
          icon={<Target size={19} />}
          subtitle="La selección solo abre el detalle; no constituye recomendación."
          title="5. Lectura del escenario"
          tone="critical"
        >
          <PricingScenarioDetail
            currency={sourceCurrency}
            scenario={workspace.selectedScenario}
          />
        </ExecutivePanel>

        <ExecutivePanel
          icon={<LockKeyhole size={19} />}
          subtitle="Fronteras obligatorias de PL-007."
          title="Aislamiento y metodología"
          tone="positive"
        >
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={17} />
              Contrato de solo simulación
            </div>
            <p className="mt-2 text-xs leading-5">
              La interfaz y la exportación consumen resultados en memoria. Descargar o imprimir no crea ni modifica registros comerciales.
            </p>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Muta precio fuente</dt>
              <dd className="font-semibold text-emerald-700">No</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Persiste resultados</dt>
              <dd className="font-semibold text-emerald-700">No</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Escribe Repository</dt>
              <dd className="font-semibold text-emerald-700">No</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Escribe otros Workspaces</dt>
              <dd className="font-semibold text-emerald-700">No</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Recomendación automática</dt>
              <dd className="font-semibold text-emerald-700">No</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Efecto comercial del archivo</dt>
              <dd className="font-semibold text-emerald-700">Ninguno</dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Limitaciones declaradas
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
              {workspace.limitations.map((limitation) => (
                <li className="flex gap-2" key={limitation}>
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </div>
        </ExecutivePanel>
      </div>
      </div>
    </ExecutiveShell>
  )
}
