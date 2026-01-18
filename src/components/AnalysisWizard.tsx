import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IndustrySelector } from './IndustrySelector'
import { ArrowRight, ArrowLeft, CheckCircle, Lightbulb, MagnifyingGlass, CloudArrowDown, Info, SpinnerGap, ArrowCounterClockwise, Handshake, ArrowsClockwise, TrendUp, Sword, CloudArrowUp } from '@phosphor-icons/react'
import { fetchCompanyFinancials, enrichFinancialsWithAI, type CompanyFinancials } from '@/lib/data-sources'
import type {
  ProjectBasics,
  BaselineMetrics,
  ImpactProjections,
  StrategicFactors,
  Industry,
  SolutionArea,
  Analysis,
  DealType,
} from '@/lib/types'
import { DEAL_TYPE_INFO } from '@/lib/types'
import { cn } from '@/lib/utils'
import { REGION_OPTIONS, getSubsidiariesForRegion } from '@/lib/regions'
import { getCompanySuggestions, isValidTickerFormat } from '@/lib/company-detection'

interface AnalysisWizardProps {
  onComplete: (data: {
    projectBasics: ProjectBasics
    baselineMetrics: BaselineMetrics
    impactProjections: ImpactProjections
    strategicFactors: StrategicFactors
    ticker?: string
  }) => void
  onCancel: () => void
  initialData?: Analysis
}

type Step = 1 | 2 | 3 | 4 | 5

type CustomerOutcomeId =
  | 'revenue-growth'
  | 'cost-reduction'
  | 'productivity'
  | 'time-to-market'
  | 'customer-experience'
  | 'risk-compliance'
  | 'data-modernization'
  | 'security'

const CUSTOMER_OUTCOMES: Array<{
  id: CustomerOutcomeId
  label: string
  description: string
  suggestedImpact: Partial<ImpactProjections>
}> = [
  {
    id: 'revenue-growth',
    label: 'Grow revenue / new channels',
    description: 'Increase sales, conversion, cross-sell, or enable new digital offerings.',
    suggestedImpact: { revenueGrowthRate: 15, timeToMarketImprovement: 5 },
  },
  {
    id: 'cost-reduction',
    label: 'Reduce operating costs',
    description: 'Automation, platform consolidation, fewer manual processes, lower run costs.',
    suggestedImpact: { costReduction: 20, efficiencyGain: 10 },
  },
  {
    id: 'productivity',
    label: 'Improve employee productivity',
    description: 'Boost throughput and reduce time spent on repetitive work.',
    suggestedImpact: { efficiencyGain: 20, costReduction: 10 },
  },
  {
    id: 'time-to-market',
    label: 'Accelerate time-to-market',
    description: 'Deliver features/products faster with better dev + data + operations.',
    suggestedImpact: { timeToMarketImprovement: 25 },
  },
  {
    id: 'customer-experience',
    label: 'Improve customer experience',
    description: 'Better service, personalization, responsiveness, and reliability.',
    suggestedImpact: { revenueGrowthRate: 10, efficiencyGain: 5 },
  },
  {
    id: 'risk-compliance',
    label: 'Reduce risk / improve compliance',
    description: 'Lower audit findings, improve resilience, and reduce operational exposure.',
    suggestedImpact: { costReduction: 5 },
  },
  {
    id: 'data-modernization',
    label: 'Modernize data & analytics',
    description: 'Improve data quality, insights, forecasting, and decision speed.',
    suggestedImpact: { efficiencyGain: 15, timeToMarketImprovement: 10 },
  },
  {
    id: 'security',
    label: 'Strengthen security posture',
    description: 'Reduce breaches/incidents and improve detection + response.',
    suggestedImpact: { costReduction: 5, efficiencyGain: 5 },
  },
]

const clampPercent = (value: number) => Math.max(0, Math.min(100, value))
const roundToStep = (value: number, step = 5) => Math.round(value / step) * step

const computeSuggestedImpact = (
  selected: string[] | undefined,
  dealType: DealType
): ImpactProjections => {
  const defaults = DEAL_TYPE_INFO[dealType]?.defaultProjections
  const base: ImpactProjections = {
    revenueGrowthRate: defaults?.revenueGrowthRate ?? 10,
    costReduction: defaults?.costReduction ?? 15,
    efficiencyGain: defaults?.efficiencyGain ?? 20,
    timeToMarketImprovement: defaults?.timeToMarketImprovement ?? 15,
  }

  const chosen = new Set((selected || []).map(String))
  const combined = CUSTOMER_OUTCOMES.reduce<ImpactProjections>((acc, outcome) => {
    if (!chosen.has(outcome.id)) return acc
    return {
      revenueGrowthRate: acc.revenueGrowthRate + (outcome.suggestedImpact.revenueGrowthRate ?? 0),
      costReduction: acc.costReduction + (outcome.suggestedImpact.costReduction ?? 0),
      efficiencyGain: acc.efficiencyGain + (outcome.suggestedImpact.efficiencyGain ?? 0),
      timeToMarketImprovement:
        acc.timeToMarketImprovement + (outcome.suggestedImpact.timeToMarketImprovement ?? 0),
    }
  }, base)

  return {
    revenueGrowthRate: roundToStep(clampPercent(combined.revenueGrowthRate)),
    costReduction: roundToStep(clampPercent(combined.costReduction)),
    efficiencyGain: roundToStep(clampPercent(combined.efficiencyGain)),
    timeToMarketImprovement: roundToStep(clampPercent(combined.timeToMarketImprovement)),
  }
}

export function AnalysisWizard({ onComplete, onCancel, initialData }: AnalysisWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [solutionAreaSuggestion, setSolutionAreaSuggestion] = useState<string>('')
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false)
  const [ticker, setTicker] = useState<string>(initialData?.ticker ?? '')
  const [isPrivateCompany, setIsPrivateCompany] = useState(false)
  const [companySuggestions, setCompanySuggestions] = useState<{
    suggestedTicker: string | null
    suggestedIndustry: Industry | null
    confidence: 'high' | 'medium' | 'low'
  } | null>(null)
  
  // Financial data fetching state
  const [isFetchingFinancials, setIsFetchingFinancials] = useState(false)
  const [fetchedFinancials, setFetchedFinancials] = useState<CompanyFinancials | null>(null)
  const [financialsFetchError, setFinancialsFetchError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string | null>(null)
  const [metricExplanations, setMetricExplanations] = useState<Record<string, string>>({})
  const [hasBeenEdited, setHasBeenEdited] = useState<Record<string, boolean>>({})
  const [projectionsEdited, setProjectionsEdited] = useState(false)

  const dealTypeIcons: Record<DealType, React.ReactNode> = {
    'new-business': <Handshake className="h-5 w-5" />,
    'renewal': <ArrowsClockwise className="h-5 w-5" />,
    'upsell-cross-sell': <TrendUp className="h-5 w-5" />,
    'competitive': <Sword className="h-5 w-5" />,
    'azure-macc': <CloudArrowUp className="h-5 w-5" />,
  }

  const [projectBasics, setProjectBasics] = useState<ProjectBasics>({
    name: initialData?.projectBasics?.name ?? '',
    customerName: initialData?.projectBasics?.customerName ?? '',
    subsidiary: initialData?.projectBasics?.subsidiary ?? '',
    region: initialData?.projectBasics?.region ?? '',
    description: initialData?.projectBasics?.description ?? '',
    industry: initialData?.projectBasics?.industry ?? 'general',
    dealType: initialData?.projectBasics?.dealType ?? 'new-business',
    solutionArea: initialData?.projectBasics?.solutionArea ?? 'Other',
    solutionAreas: initialData?.projectBasics?.solutionAreas ?? [],
    customerOutcomes: initialData?.projectBasics?.customerOutcomes ?? [],
    customerOutcomesNotes: initialData?.projectBasics?.customerOutcomesNotes ?? '',
    investmentAmount: initialData?.projectBasics?.investmentAmount ?? 100000,
    timelineMonths: initialData?.projectBasics?.timelineMonths ?? 12,
    maccCommitmentAmount: initialData?.projectBasics?.maccCommitmentAmount,
    maccTermYears: initialData?.projectBasics?.maccTermYears,
    competitorName: initialData?.projectBasics?.competitorName,
    incumbentSolution: initialData?.projectBasics?.incumbentSolution,
    previousContractValue: initialData?.projectBasics?.previousContractValue,
    previousTermYears: initialData?.projectBasics?.previousTermYears,
  })

  const [baselineMetrics, setBaselineMetrics] = useState<BaselineMetrics>(
    initialData?.baselineMetrics ?? {
      currentRevenue: undefined,
      currentCosts: undefined,
      employeeCount: undefined,
      currentAssets: undefined,
      currentCashFlow: undefined,
    }
  )

  const [impactProjections, setImpactProjections] = useState<ImpactProjections>(
    initialData?.impactProjections ?? {
      revenueGrowthRate: 10,
      costReduction: 15,
      efficiencyGain: 20,
      timeToMarketImprovement: 25,
    }
  )

  const [strategicFactors, setStrategicFactors] = useState<StrategicFactors>(
    initialData?.strategicFactors ?? {
      competitiveDifferentiation: 3,
      riskMitigation: 3,
      customerExperience: 3,
      employeeProductivity: 3,
      regulatoryCompliance: 3,
      innovationEnablement: 3,
    }
  )

  // Fetch financial data from multiple sources
  const handleFetchFinancials = useCallback(async () => {
    const tickerToFetch = ticker.trim() || companySuggestions?.suggestedTicker
    if (!tickerToFetch) {
      setFinancialsFetchError('Please enter a stock ticker or company name first')
      return
    }

    setIsFetchingFinancials(true)
    setFinancialsFetchError(null)

    try {
      const result = await fetchCompanyFinancials(tickerToFetch, {
        mergeResults: true,
        timeout: 20000,
      })

      if (result.data) {
        setFetchedFinancials(result.data)
        setDataSource(result.source)
        
        // Auto-populate baseline metrics
        setBaselineMetrics({
          currentRevenue: result.data.revenue ?? undefined,
          currentCosts: result.data.totalLiabilities ?? undefined,
          employeeCount: result.data.employeeCount ?? undefined,
          currentAssets: result.data.totalAssets ?? undefined,
          currentCashFlow: result.data.operatingCashFlow ?? undefined,
        })
        
        // Generate AI enrichment for explanations
        try {
          const enrichment = await enrichFinancialsWithAI(result.data)
          setMetricExplanations(enrichment.explanations)
        } catch {
          // Use default explanations if AI fails
          setMetricExplanations({
            revenue: 'Total revenue from the latest fiscal year',
            netMargin: 'Net profit as a percentage of revenue',
            employeeCount: 'Total number of employees',
          })
        }
        
        setHasBeenEdited({})
      } else {
        setFinancialsFetchError(result.error || 'Unable to fetch financial data')
      }
    } catch (error) {
      setFinancialsFetchError(
        error instanceof Error ? error.message : 'Failed to fetch financial data'
      )
    } finally {
      setIsFetchingFinancials(false)
    }
  }, [ticker, companySuggestions?.suggestedTicker])

  // Reset to fetched values
  const handleResetToFetched = useCallback(() => {
    if (fetchedFinancials) {
      setBaselineMetrics({
        currentRevenue: fetchedFinancials.revenue ?? undefined,
        currentCosts: fetchedFinancials.totalLiabilities ?? undefined,
        employeeCount: fetchedFinancials.employeeCount ?? undefined,
        currentAssets: fetchedFinancials.totalAssets ?? undefined,
        currentCashFlow: fetchedFinancials.operatingCashFlow ?? undefined,
      })
      setHasBeenEdited({})
    }
  }, [fetchedFinancials])

  // Track edits
  const handleMetricChange = (field: keyof BaselineMetrics, value: number | undefined) => {
    setBaselineMetrics(prev => ({ ...prev, [field]: value }))
    if (fetchedFinancials) {
      setHasBeenEdited(prev => ({ ...prev, [field]: true }))
    }
  }

  // Handle deal type change - apply default projections
  const handleDealTypeChange = (dealType: DealType) => {
    const dealInfo = DEAL_TYPE_INFO[dealType]
    setProjectBasics(prev => ({ ...prev, dealType }))
    
    // Apply default projections for the deal type
    if (dealInfo.defaultProjections) {
      setImpactProjections(prev => ({
        ...prev,
        ...dealInfo.defaultProjections,
      }))
      setProjectionsEdited(false)
    }
    
    // Apply default strategic weights
    if (dealInfo.defaultStrategicWeights) {
      setStrategicFactors(prev => ({
        ...prev,
        ...dealInfo.defaultStrategicWeights,
      }))
    }
  }

  const toggleCustomerOutcome = (id: CustomerOutcomeId) => {
    const current = projectBasics.customerOutcomes || []
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]

    setProjectBasics(prev => ({ ...prev, customerOutcomes: next }))

    // If user hasn't manually edited projections, keep projections in sync with outcomes
    if (!projectionsEdited) {
      setImpactProjections(computeSuggestedImpact(next, projectBasics.dealType || 'new-business'))
    }
  }

  const applySuggestedImpact = () => {
    setImpactProjections(computeSuggestedImpact(projectBasics.customerOutcomes, projectBasics.dealType || 'new-business'))
    setProjectionsEdited(false)
  }

  // Get deal type icon
  const getDealTypeIcon = (dealType: DealType) => {
    switch (dealType) {
      case 'new-business': return <Handshake className="h-5 w-5" />
      case 'renewal': return <ArrowsClockwise className="h-5 w-5" />
      case 'upsell-cross-sell': return <TrendUp className="h-5 w-5" />
      case 'competitive': return <Sword className="h-5 w-5" />
      case 'azure-macc': return <CloudArrowUp className="h-5 w-5" />
    }
  }

  // Auto-detect company type and suggest ticker when customer name changes
  useEffect(() => {
    if (projectBasics.customerName.trim().length > 2) {
      const suggestions = getCompanySuggestions(projectBasics.customerName, isPrivateCompany)
      setCompanySuggestions(suggestions)
      
      // Auto-suggest ticker if high confidence and not already set
      if (suggestions.suggestedTicker && suggestions.confidence === 'high' && !ticker) {
        setTicker(suggestions.suggestedTicker)
      }
      
      // Auto-suggest industry if found and not already set
      if (suggestions.suggestedIndustry && projectBasics.industry === 'general') {
        setProjectBasics((prev) => ({
          ...prev,
          industry: suggestions.suggestedIndustry!,
        }))
      }
    } else {
      setCompanySuggestions(null)
    }
  }, [projectBasics.customerName, isPrivateCompany])

  const steps = [
    { number: 1, title: 'Use Case Overview' },
    { number: 2, title: 'Industry Selection' },
    { number: 3, title: 'Baseline Metrics' },
    { number: 4, title: 'Impact Projections' },
    { number: 5, title: 'Strategic Factors' },
  ]

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const handleComplete = () => {
    onComplete({
      projectBasics,
      baselineMetrics,
      impactProjections,
      strategicFactors,
      ticker: ticker.trim() || undefined,
    })
  }

  const handleGenerateSolutionAreaSuggestion = async () => {
    if (!projectBasics.name || !projectBasics.description) {
      setSolutionAreaSuggestion('Please provide a use case name and description first.')
      return
    }

    setIsGeneratingSuggestion(true)
    setSolutionAreaSuggestion('')

    try {
      const promptText = `Based on the following use case, suggest which solution areas it covers. If it covers multiple areas, explain why.

Use Case Name: ${projectBasics.name}
Description: ${projectBasics.description}

Available Solution Areas:
- AI Business Solutions (AI Workforce, AI Business Process, Copilot & Agents)
- Cloud & AI Platforms (Infrastructure, Data & AI, App Innovation)
- Security (Modern SecOps, Data Security, Protect Cloud/AI)
- Other (if it doesn't fit the above categories)

Provide a brief 2-3 sentence suggestion about which solution area(s) this use case belongs to and why. If it spans multiple areas, mention all relevant areas.`

      // AI service not available - provide fallback suggestion
      setSolutionAreaSuggestion('AI suggestion service is not configured. Please manually select the most appropriate solution area(s) based on your use case description. Consider if your project focuses on AI/automation, cloud infrastructure, security, or spans multiple areas.')
    } catch (error) {
      setSolutionAreaSuggestion('Unable to generate suggestion at this time. Please select manually.')
    } finally {
      setIsGeneratingSuggestion(false)
    }
  }

  const toggleSolutionArea = (area: SolutionArea) => {
    const currentAreas = projectBasics.solutionAreas || []
    const isSelected = currentAreas.includes(area)
    
    if (isSelected) {
      const newAreas = currentAreas.filter(a => a !== area)
      setProjectBasics({ 
        ...projectBasics, 
        solutionAreas: newAreas,
        solutionArea: newAreas.length > 0 ? newAreas[0] : area
      })
    } else {
      const newAreas = [...currentAreas, area]
      setProjectBasics({ 
        ...projectBasics, 
        solutionAreas: newAreas,
        solutionArea: area
      })
    }
  }

  const canProceed = () => {
    if (currentStep === 1) {
      return (
        projectBasics.name?.trim() !== '' &&
        projectBasics.customerName?.trim() !== '' &&
        projectBasics.subsidiary?.trim() !== '' &&
        projectBasics.region?.trim() !== '' &&
        projectBasics.investmentAmount > 0 &&
        (projectBasics.solutionAreas && projectBasics.solutionAreas.length > 0)
      )
    }
    return true
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-heading font-semibold transition-all',
                  currentStep === step.number
                    ? 'border-primary bg-primary text-primary-foreground'
                    : currentStep > step.number
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground'
                )}
              >
                {currentStep > step.number ? <CheckCircle weight="fill" /> : step.number}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-sm font-medium">{step.title}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'hidden h-0.5 w-12 lg:block',
                  currentStep > step.number ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 font-heading text-2xl font-bold">Use Case Overview</h2>
              <p className="text-muted-foreground">
                Provide basic information about the technology use case you want to evaluate.
              </p>
            </div>

            {/* Step Explanation */}
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Getting started:</strong> Enter your customer's name and the use case you're evaluating. 
                For public companies, enter their stock ticker to fetch real financial data automatically.
                Select the Microsoft solution areas that apply to enable relevant industry benchmarks.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    value={projectBasics.customerName}
                    onChange={(e) =>
                      setProjectBasics({ ...projectBasics, customerName: e.target.value })
                    }
                    placeholder="e.g., Acme Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ticker">Stock Ticker (Optional)</Label>
                    {companySuggestions?.suggestedTicker && (
                      <Badge variant="outline" className="text-xs">
                        Suggested: {companySuggestions.suggestedTicker}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="ticker"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      placeholder="e.g., AAPL, MSFT"
                      maxLength={10}
                      className={ticker && !isValidTickerFormat(ticker) ? 'border-yellow-500' : ''}
                    />
                    {companySuggestions?.suggestedTicker && !ticker && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTicker(companySuggestions.suggestedTicker!)}
                      >
                        <MagnifyingGlass className="h-4 w-4 mr-1" />
                        Use Suggested
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="private-company"
                      checked={isPrivateCompany}
                      onCheckedChange={(checked) => setIsPrivateCompany(checked === true)}
                    />
                    <Label htmlFor="private-company" className="text-xs text-muted-foreground font-normal cursor-pointer">
                      This is a private company (use industry averages)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isPrivateCompany 
                      ? 'Using industry benchmark data for analysis'
                      : 'For public companies. Leave blank to use industry index.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-name">Use Case Name *</Label>
                <Input
                  id="project-name"
                  value={projectBasics.name}
                  onChange={(e) =>
                    setProjectBasics({ ...projectBasics, name: e.target.value })
                  }
                  placeholder="e.g., AI-Powered Customer Service Platform"
                />
              </div>

              {/* Deal Type Selection */}
              <div className="space-y-3">
                <Label>Deal Type *</Label>
                <p className="text-sm text-muted-foreground">
                  Select the type of deal to apply appropriate analysis methodology and reporting emphasis
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(Object.keys(DEAL_TYPE_INFO) as DealType[]).map((dealType) => {
                    const info = DEAL_TYPE_INFO[dealType]
                    const isSelected = projectBasics.dealType === dealType
                    return (
                      <div
                        key={dealType}
                        onClick={() => handleDealTypeChange(dealType)}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all hover:border-primary/50',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border bg-card'
                        )}
                      >
                        <div className={cn(
                          'mt-0.5 shrink-0 rounded-md p-2',
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}>
                          {getDealTypeIcon(dealType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{info.shortName}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Deal type specific context */}
                {projectBasics.dealType && (
                  <div className="rounded-lg border bg-card/50 p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 rounded-md bg-primary/10 p-2 text-primary">
                        {getDealTypeIcon(projectBasics.dealType)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{DEAL_TYPE_INFO[projectBasics.dealType].name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Pricing approach:</strong> {DEAL_TYPE_INFO[projectBasics.dealType].characteristics.pricingApproach}
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">PROPOSAL EMPHASIS</p>
                            <ul className="text-xs mt-1 space-y-0.5">
                              {DEAL_TYPE_INFO[projectBasics.dealType].characteristics.proposalEmphasis.slice(0, 2).map((item, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-primary">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">KEY METRICS</p>
                            <ul className="text-xs mt-1 space-y-0.5">
                              {DEAL_TYPE_INFO[projectBasics.dealType].characteristics.keyMetrics.slice(0, 2).map((item, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-primary">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Conditional fields based on deal type */}
              {projectBasics.dealType === 'azure-macc' && (
                <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg border bg-blue-500/5 border-blue-500/20">
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <CloudArrowUp className="h-4 w-4" />
                      Azure MACC Details
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="macc-amount">MACC Commitment Amount ($)</Label>
                    <Input
                      id="macc-amount"
                      type="number"
                      value={projectBasics.maccCommitmentAmount || ''}
                      onChange={(e) =>
                        setProjectBasics({
                          ...projectBasics,
                          maccCommitmentAmount: parseFloat(e.target.value) || undefined,
                        })
                      }
                      placeholder="e.g., 5000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="macc-term">Commitment Term (Years)</Label>
                    <Select
                      value={projectBasics.maccTermYears?.toString() || ''}
                      onValueChange={(value) =>
                        setProjectBasics({
                          ...projectBasics,
                          maccTermYears: parseInt(value) || undefined,
                        })
                      }
                    >
                      <SelectTrigger id="macc-term">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Year</SelectItem>
                        <SelectItem value="2">2 Years</SelectItem>
                        <SelectItem value="3">3 Years</SelectItem>
                        <SelectItem value="4">4 Years</SelectItem>
                        <SelectItem value="5">5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {projectBasics.dealType === 'competitive' && (
                <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg border bg-orange-500/5 border-orange-500/20">
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2">
                      <Sword className="h-4 w-4" />
                      Competitive Details
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="competitor-name">Competitor Name</Label>
                    <Input
                      id="competitor-name"
                      value={projectBasics.competitorName || ''}
                      onChange={(e) =>
                        setProjectBasics({
                          ...projectBasics,
                          competitorName: e.target.value,
                        })
                      }
                      placeholder="e.g., AWS, Google Cloud, Salesforce"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incumbent-solution">Incumbent Solution</Label>
                    <Input
                      id="incumbent-solution"
                      value={projectBasics.incumbentSolution || ''}
                      onChange={(e) =>
                        setProjectBasics({
                          ...projectBasics,
                          incumbentSolution: e.target.value,
                        })
                      }
                      placeholder="e.g., AWS EC2, Google Workspace"
                    />
                  </div>
                </div>
              )}

              {projectBasics.dealType === 'renewal' && (
                <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg border bg-green-500/5 border-green-500/20">
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                      <ArrowsClockwise className="h-4 w-4" />
                      Previous Contract Details
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prev-contract-value">Previous Contract Value ($)</Label>
                    <Input
                      id="prev-contract-value"
                      type="number"
                      value={projectBasics.previousContractValue || ''}
                      onChange={(e) =>
                        setProjectBasics({
                          ...projectBasics,
                          previousContractValue: parseFloat(e.target.value) || undefined,
                        })
                      }
                      placeholder="e.g., 500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prev-term">Previous Term (Years)</Label>
                    <Select
                      value={projectBasics.previousTermYears?.toString() || ''}
                      onValueChange={(value) =>
                        setProjectBasics({
                          ...projectBasics,
                          previousTermYears: parseInt(value) || undefined,
                        })
                      }
                    >
                      <SelectTrigger id="prev-term">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Year</SelectItem>
                        <SelectItem value="2">2 Years</SelectItem>
                        <SelectItem value="3">3 Years</SelectItem>
                        <SelectItem value="4">4 Years</SelectItem>
                        <SelectItem value="5">5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="region">Region *</Label>
                  <Select
                    value={projectBasics.region}
                    onValueChange={(value) => {
                      setProjectBasics({ 
                        ...projectBasics, 
                        region: value,
                        subsidiary: '',
                      })
                    }}
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGION_OPTIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subsidiary">Subsidiary *</Label>
                  <Select
                    value={projectBasics.subsidiary}
                    onValueChange={(value) =>
                      setProjectBasics({ ...projectBasics, subsidiary: value })
                    }
                    disabled={!projectBasics.region}
                  >
                    <SelectTrigger id="subsidiary">
                      <SelectValue placeholder={projectBasics.region ? "Select subsidiary" : "Select region first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projectBasics.region && getSubsidiariesForRegion(projectBasics.region).map((subsidiary) => (
                        <SelectItem key={subsidiary} value={subsidiary}>
                          {subsidiary}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={projectBasics.description}
                  onChange={(e) =>
                    setProjectBasics({ ...projectBasics, description: e.target.value })
                  }
                  placeholder="Brief description of the use case and its objectives"
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Solution Areas *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSolutionAreaSuggestion}
                    disabled={isGeneratingSuggestion || !projectBasics.name || !projectBasics.description}
                    className="gap-2"
                  >
                    <Lightbulb weight="fill" />
                    {isGeneratingSuggestion ? 'Suggesting...' : 'Get AI Suggestion'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select all solution areas this use case covers (select at least one)
                </p>
                
                {solutionAreaSuggestion && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                      <Lightbulb weight="fill" />
                      AI Suggestion
                    </div>
                    <p className="text-sm text-foreground">{solutionAreaSuggestion}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {(['AI Business Solutions', 'Cloud & AI Platforms', 'Security', 'Other'] as SolutionArea[]).map((area) => (
                    <div key={area} className="flex items-start space-x-3 rounded-lg border p-4">
                      <Checkbox
                        id={`area-${area}`}
                        checked={(projectBasics.solutionAreas || []).includes(area)}
                        onCheckedChange={() => toggleSolutionArea(area)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`area-${area}`}
                          className="cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {area}
                        </label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {area === 'AI Business Solutions' && 'AI Workforce, AI Business Process, Copilot & Agents at Work'}
                          {area === 'Cloud & AI Platforms' && 'Infrastructure, Data & AI, App Innovation & Developer'}
                          {area === 'Security' && 'Modern SecOps, Data Security, Protect Cloud/AI Platforms & Apps'}
                          {area === 'Other' && 'General technology initiatives not covered by other areas'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="investment">Investment Amount ($) *</Label>
                  <Input
                    id="investment"
                    type="number"
                    value={projectBasics.investmentAmount}
                    onChange={(e) =>
                      setProjectBasics({
                        ...projectBasics,
                        investmentAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline (Months) *</Label>
                  <Input
                    id="timeline"
                    type="number"
                    value={projectBasics.timelineMonths}
                    onChange={(e) =>
                      setProjectBasics({
                        ...projectBasics,
                        timelineMonths: parseInt(e.target.value) || 12,
                      })
                    }
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 font-heading text-2xl font-bold">Industry Selection</h2>
              <p className="text-muted-foreground">
                Select your industry to apply relevant benchmarks and best practices.
              </p>
            </div>

            {/* Step Explanation */}
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Why industry matters:</strong> Different industries have different baseline metrics, 
                growth rates, and technology adoption patterns. Selecting the correct industry ensures your 
                analysis uses appropriate benchmarks for ROI calculations and competitive comparisons.
                {companySuggestions?.suggestedIndustry && (
                  <span className="block mt-1">
                    <strong>Suggested:</strong> Based on your company, we recommend <em>{companySuggestions.suggestedIndustry}</em>.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <IndustrySelector
              value={projectBasics.industry}
              onChange={(industry: Industry) =>
                setProjectBasics({ ...projectBasics, industry })
              }
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 font-heading text-2xl font-bold">Baseline Metrics</h2>
              <p className="text-muted-foreground">
                Enter current state metrics. These help calculate the impact of your use case.
              </p>
            </div>

            {/* Step Explanation */}
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Why these metrics matter:</strong> Baseline metrics establish the current financial state of the company.
                They're used to calculate ROI, payback period, and value generated by your technology use case.
                {ticker || companySuggestions?.suggestedTicker ? (
                  <> Click <strong>"Fetch Financial Data"</strong> to auto-populate from public financial sources.</>
                ) : (
                  <> Enter a stock ticker above to auto-fetch financial data from multiple sources.</>
                )}
              </AlertDescription>
            </Alert>

            {/* Fetch Financial Data Button */}
            {(ticker || companySuggestions?.suggestedTicker) && !isPrivateCompany && (
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <div className="flex-1">
                  <p className="font-medium text-sm">Auto-populate from financial data sources</p>
                  <p className="text-xs text-muted-foreground">
                    Fetches from Yahoo Finance, Alpha Vantage, FMP, SEC EDGAR, and more
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchFinancials}
                  disabled={isFetchingFinancials}
                  className="gap-2"
                >
                  {isFetchingFinancials ? (
                    <>
                      <SpinnerGap className="h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <CloudArrowDown className="h-4 w-4" />
                      Fetch Financial Data
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Fetch Status */}
            {fetchedFinancials && dataSource && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Data loaded from <strong>{dataSource}</strong>
                    {fetchedFinancials.lastUpdated && (
                      <span className="text-xs opacity-70 ml-1">
                        (as of {new Date(fetchedFinancials.lastUpdated).toLocaleDateString()})
                      </span>
                    )}
                  </span>
                </div>
                {Object.values(hasBeenEdited).some(Boolean) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToFetched}
                    className="gap-1 text-xs"
                  >
                    <ArrowCounterClockwise className="h-3 w-3" />
                    Reset to fetched
                  </Button>
                )}
              </div>
            )}

            {financialsFetchError && (
              <Alert variant="destructive">
                <AlertDescription>{financialsFetchError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="current-revenue">Current Annual Revenue ($)</Label>
                  {hasBeenEdited.currentRevenue && (
                    <Badge variant="outline" className="text-xs">Edited</Badge>
                  )}
                </div>
                <Input
                  id="current-revenue"
                  type="number"
                  value={baselineMetrics.currentRevenue || ''}
                  onChange={(e) =>
                    handleMetricChange('currentRevenue', parseFloat(e.target.value) || undefined)
                  }
                  placeholder="Optional"
                />
                {metricExplanations.revenue && (
                  <p className="text-xs text-muted-foreground">{metricExplanations.revenue}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="current-costs">Current Annual Costs ($)</Label>
                  {hasBeenEdited.currentCosts && (
                    <Badge variant="outline" className="text-xs">Edited</Badge>
                  )}
                </div>
                <Input
                  id="current-costs"
                  type="number"
                  value={baselineMetrics.currentCosts || ''}
                  onChange={(e) =>
                    handleMetricChange('currentCosts', parseFloat(e.target.value) || undefined)
                  }
                  placeholder="Optional"
                />
                <p className="text-xs text-muted-foreground">
                  Total operating costs including salaries, infrastructure, and overhead
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="employee-count">Employee Count</Label>
                  {hasBeenEdited.employeeCount && (
                    <Badge variant="outline" className="text-xs">Edited</Badge>
                  )}
                </div>
                <Input
                  id="employee-count"
                  type="number"
                  value={baselineMetrics.employeeCount || ''}
                  onChange={(e) =>
                    handleMetricChange('employeeCount', parseInt(e.target.value) || undefined)
                  }
                  placeholder="Optional"
                />
                {metricExplanations.employeeCount ? (
                  <p className="text-xs text-muted-foreground">{metricExplanations.employeeCount}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Total headcount; used to calculate productivity gains
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="current-assets">Current Assets ($)</Label>
                  {hasBeenEdited.currentAssets && (
                    <Badge variant="outline" className="text-xs">Edited</Badge>
                  )}
                </div>
                <Input
                  id="current-assets"
                  type="number"
                  value={baselineMetrics.currentAssets || ''}
                  onChange={(e) =>
                    handleMetricChange('currentAssets', parseFloat(e.target.value) || undefined)
                  }
                  placeholder="Optional"
                />
                <p className="text-xs text-muted-foreground">
                  Total value of assets; used to calculate return on assets
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="current-cashflow">Current Operating Cash Flow ($)</Label>
                  {hasBeenEdited.currentCashFlow && (
                    <Badge variant="outline" className="text-xs">Edited</Badge>
                  )}
                </div>
                <Input
                  id="current-cashflow"
                  type="number"
                  value={baselineMetrics.currentCashFlow || ''}
                  onChange={(e) =>
                    handleMetricChange('currentCashFlow', parseFloat(e.target.value) || undefined)
                  }
                  placeholder="Optional"
                />
                <p className="text-xs text-muted-foreground">
                  Cash generated from operations; key indicator of business health
                </p>
              </div>
            </div>

            {/* Additional fetched data preview */}
            {fetchedFinancials && (
              <div className="mt-4 p-4 rounded-lg border bg-card/50">
                <h4 className="text-sm font-medium mb-3">Additional Financial Context</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {fetchedFinancials.netMargin !== null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Net Margin</p>
                      <p className="font-medium">{fetchedFinancials.netMargin.toFixed(1)}%</p>
                    </div>
                  )}
                  {fetchedFinancials.returnOnEquity !== null && (
                    <div>
                      <p className="text-muted-foreground text-xs">ROE</p>
                      <p className="font-medium">{fetchedFinancials.returnOnEquity.toFixed(1)}%</p>
                    </div>
                  )}
                  {fetchedFinancials.debtToEquity !== null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Debt/Equity</p>
                      <p className="font-medium">{fetchedFinancials.debtToEquity.toFixed(2)}</p>
                    </div>
                  )}
                  {fetchedFinancials.peRatio !== null && (
                    <div>
                      <p className="text-muted-foreground text-xs">P/E Ratio</p>
                      <p className="font-medium">{fetchedFinancials.peRatio.toFixed(1)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 font-heading text-2xl font-bold">Impact Projections</h2>
              <p className="text-muted-foreground">
                Estimate the expected improvements from this technology use case.
              </p>
            </div>

            {/* Step Explanation with Deal Type Context */}
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Setting realistic expectations:</strong> These projections estimate how the technology 
                will impact your customer's business. 
                {projectBasics.dealType && (
                  <span className="block mt-1">
                    For <strong>{DEAL_TYPE_INFO[projectBasics.dealType].shortName}</strong> deals, 
                    we've pre-set recommended values based on typical outcomes. Adjust as needed based on your specific opportunity.
                  </span>
                )}
                Industry benchmarks suggest AI initiatives typically deliver 10-25% efficiency gains in the first year.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Label>Customer Outcomes (Benefits)</Label>
                    <p className="text-xs text-muted-foreground">
                      Start with what the customer wants to achieve. You can auto-suggest projections from these outcomes.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={applySuggestedImpact}>
                    Apply suggested projections
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {CUSTOMER_OUTCOMES.map(o => (
                    <label key={o.id} className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/40">
                      <Checkbox
                        checked={(projectBasics.customerOutcomes || []).includes(o.id)}
                        onCheckedChange={() => toggleCustomerOutcome(o.id)}
                      />
                      <div className="min-w-0">
                        <div className="font-medium leading-5">{o.label}</div>
                        <div className="text-xs text-muted-foreground">{o.description}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Outcomes Notes (optional)</Label>
                  <Textarea
                    value={projectBasics.customerOutcomesNotes || ''}
                    onChange={e =>
                      setProjectBasics(prev => ({ ...prev, customerOutcomesNotes: e.target.value }))
                    }
                    placeholder="Add any customer-specific context (e.g., target segment, current pain points, constraints, preferred metrics, timeline pressure)."
                    rows={3}
                  />
                </div>

                {!projectionsEdited && (projectBasics.customerOutcomes || []).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Projections are currently synced to selected outcomes. Move a slider to override.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Revenue Growth Rate (%)</Label>
                    <p className="text-xs text-muted-foreground">Additional revenue growth attributed to this investment</p>
                  </div>
                  <span className="font-mono text-sm font-medium">
                    {impactProjections.revenueGrowthRate}%
                  </span>
                </div>
                <Slider
                  value={[impactProjections.revenueGrowthRate]}
                  onValueChange={([value]) => {
                    setProjectionsEdited(true)
                    setImpactProjections({ ...impactProjections, revenueGrowthRate: value })
                  }}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cost Reduction (%)</Label>
                    <p className="text-xs text-muted-foreground">Reduction in operational costs from automation and optimization</p>
                  </div>
                  <span className="font-mono text-sm font-medium">
                    {impactProjections.costReduction}%
                  </span>
                </div>
                <Slider
                  value={[impactProjections.costReduction]}
                  onValueChange={([value]) => {
                    setProjectionsEdited(true)
                    setImpactProjections({ ...impactProjections, costReduction: value })
                  }}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Efficiency Gain (%)</Label>
                    <p className="text-xs text-muted-foreground">Productivity improvement for affected employees</p>
                  </div>
                  <span className="font-mono text-sm font-medium">
                    {impactProjections.efficiencyGain}%
                  </span>
                </div>
                <Slider
                  value={[impactProjections.efficiencyGain]}
                  onValueChange={([value]) => {
                    setProjectionsEdited(true)
                    setImpactProjections({ ...impactProjections, efficiencyGain: value })
                  }}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Time-to-Market Improvement (%)</Label>
                    <p className="text-xs text-muted-foreground">Faster delivery of products or services</p>
                  </div>
                  <span className="font-mono text-sm font-medium">
                    {impactProjections.timeToMarketImprovement}%
                  </span>
                </div>
                <Slider
                  value={[impactProjections.timeToMarketImprovement]}
                  onValueChange={([value]) => {
                    setProjectionsEdited(true)
                    setImpactProjections({ ...impactProjections, timeToMarketImprovement: value })
                  }}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 font-heading text-2xl font-bold">Strategic Factors</h2>
              <p className="text-muted-foreground">
                Rate the strategic value beyond pure financial returns (1 = Low, 5 = High).
              </p>
            </div>

            {/* Step Explanation */}
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Beyond the numbers:</strong> Technology investments deliver value beyond direct ROI. 
                These strategic factors capture competitive advantages, risk reduction, and long-term positioning 
                that may not immediately show in financial metrics but are critical for decision-making.
                Rate each factor based on how significantly this use case impacts that dimension.
              </AlertDescription>
            </Alert>

            {/* Deal Type Strategic Focus */}
            {(() => {
              const dealTypeStrategicAdvice: Record<DealType, { focus: string[]; advice: string }> = {
                'new-business': {
                  focus: ['competitiveDifferentiation', 'innovationEnablement'],
                  advice: 'For new business, emphasize competitive differentiation and innovation potential to demonstrate transformative value.'
                },
                'renewal': {
                  focus: ['customerExperience', 'riskMitigation'],
                  advice: 'For renewals, highlight customer experience improvements and risk mitigation from continued partnership stability.'
                },
                'upsell-cross-sell': {
                  focus: ['employeeProductivity', 'innovationEnablement'],
                  advice: 'For expansion deals, focus on productivity gains and how additional capabilities enable new innovations.'
                },
                'competitive': {
                  focus: ['competitiveDifferentiation', 'riskMitigation'],
                  advice: 'For competitive situations, strongly emphasize differentiation from alternatives and lower switching risk.'
                },
                'azure-macc': {
                  focus: ['innovationEnablement', 'regulatoryCompliance'],
                  advice: 'For Azure MACC, highlight cloud innovation enablement and compliance benefits of the Azure platform.'
                }
              }
              const currentAdvice = dealTypeStrategicAdvice[projectBasics.dealType || 'new-business']
              
              return (
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-2 mb-2">
                    {dealTypeIcons[projectBasics.dealType || 'new-business']}
                    <span className="font-medium">{DEAL_TYPE_INFO[projectBasics.dealType || 'new-business'].name} - Strategic Focus</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{currentAdvice.advice}</p>
                  <div className="flex gap-2 flex-wrap">
                    {currentAdvice.focus.map(factor => (
                      <span key={factor} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        ★ {factor.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div className="space-y-6">
              {[
                { 
                  key: 'competitiveDifferentiation', 
                  label: 'Competitive Differentiation',
                  description: 'How much does this create unique market advantage?',
                  dealTypeHints: {
                    'new-business': 'Key for winning new logos - rate high if this clearly differentiates from competitors',
                    'renewal': 'Consider value delivered vs. alternatives the customer might evaluate',
                    'upsell-cross-sell': 'Does the expanded capability create new competitive moats?',
                    'competitive': 'CRITICAL: Rate this factor generously to highlight advantages over competitor',
                    'azure-macc': 'How does Azure uniquely enable capabilities competitors can\'t match?'
                  }
                },
                { 
                  key: 'riskMitigation', 
                  label: 'Risk Mitigation',
                  description: 'Does this reduce business, operational, or compliance risk?',
                  dealTypeHints: {
                    'new-business': 'Consider security, reliability, and vendor stability',
                    'renewal': 'IMPORTANT: Emphasize risks of switching to a new platform mid-stream',
                    'upsell-cross-sell': 'Does expansion reduce gaps in current coverage?',
                    'competitive': 'Highlight incumbent switching risks and competitor platform risks',
                    'azure-macc': 'Consider Azure\'s security, compliance, and data sovereignty features'
                  }
                },
                { 
                  key: 'customerExperience', 
                  label: 'Customer Experience Improvement',
                  description: 'Impact on customer satisfaction and retention',
                  dealTypeHints: {
                    'new-business': 'Will this improve how they serve their customers?',
                    'renewal': 'KEY FACTOR: Document CX improvements achieved during current term',
                    'upsell-cross-sell': 'How do additional features enhance customer-facing capabilities?',
                    'competitive': 'Compare CX capabilities vs. competitor offering',
                    'azure-macc': 'How does Azure enable better customer experiences?'
                  }
                },
                { 
                  key: 'employeeProductivity', 
                  label: 'Employee Productivity Gains',
                  description: 'Time saved and output increased for employees',
                  dealTypeHints: {
                    'new-business': 'Quantify productivity gains where possible',
                    'renewal': 'Measure gains achieved and project future improvements',
                    'upsell-cross-sell': 'FOCUS AREA: Expansion should multiply productivity benefits',
                    'competitive': 'Compare productivity features vs. competitor',
                    'azure-macc': 'Consider Copilot, automation, and AI productivity features'
                  }
                },
                { 
                  key: 'regulatoryCompliance', 
                  label: 'Regulatory Compliance Benefits',
                  description: 'Does this help meet current or upcoming regulations?',
                  dealTypeHints: {
                    'new-business': 'Important for regulated industries (finance, healthcare, etc.)',
                    'renewal': 'Highlight ongoing compliance maintenance value',
                    'upsell-cross-sell': 'Do additional services address new compliance requirements?',
                    'competitive': 'Compare compliance certifications vs. competitor',
                    'azure-macc': 'IMPORTANT: Azure has industry-leading compliance certifications'
                  }
                },
                { 
                  key: 'innovationEnablement', 
                  label: 'Innovation Enablement',
                  description: 'Does this unlock future innovation opportunities?',
                  dealTypeHints: {
                    'new-business': 'KEY: Show how this opens doors to future capabilities',
                    'renewal': 'Roadmap alignment and future innovation potential',
                    'upsell-cross-sell': 'FOCUS: Expansion enables new innovation scenarios',
                    'competitive': 'Compare innovation roadmaps and platform extensibility',
                    'azure-macc': 'CRITICAL: Highlight Azure AI, OpenAI integration, and cloud-native innovation'
                  }
                },
              ].map((factor) => (
                <div key={factor.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label>{factor.label}</Label>
                      <p className="text-xs text-muted-foreground">{factor.description}</p>
                      <p className="text-xs text-primary/80 mt-1">
                        💡 {factor.dealTypeHints[projectBasics.dealType || 'new-business']}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-medium ml-4">
                      {strategicFactors[factor.key as keyof StrategicFactors]}/5
                    </span>
                  </div>
                  <Slider
                    value={[strategicFactors[factor.key as keyof StrategicFactors]]}
                    onValueChange={([value]) =>
                      setStrategicFactors({ ...strategicFactors, [factor.key]: value })
                    }
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={currentStep === 1 ? onCancel : handleBack}>
          <ArrowLeft className="mr-2" size={18} />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep < 5 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2" size={18} />
          </Button>
        ) : (
          <Button onClick={handleComplete}>
            <CheckCircle className="mr-2" size={18} weight="fill" />
            Generate Analysis
          </Button>
        )}
      </div>
    </div>
  )
}
