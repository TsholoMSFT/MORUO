import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { IndustrySelector } from './IndustrySelector'
import { ArrowRight, ArrowLeft, CheckCircle, Lightbulb, MagnifyingGlass } from '@phosphor-icons/react'
import type {
  ProjectBasics,
  BaselineMetrics,
  ImpactProjections,
  StrategicFactors,
  Industry,
  SolutionArea,
  Analysis,
} from '@/lib/types'
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

  const [projectBasics, setProjectBasics] = useState<ProjectBasics>({
    name: initialData?.projectBasics?.name ?? '',
    customerName: initialData?.projectBasics?.customerName ?? '',
    subsidiary: initialData?.projectBasics?.subsidiary ?? '',
    region: initialData?.projectBasics?.region ?? '',
    description: initialData?.projectBasics?.description ?? '',
    industry: initialData?.projectBasics?.industry ?? 'general',
    solutionArea: initialData?.projectBasics?.solutionArea ?? 'Other',
    solutionAreas: initialData?.projectBasics?.solutionAreas ?? [],
    investmentAmount: initialData?.projectBasics?.investmentAmount ?? 100000,
    timelineMonths: initialData?.projectBasics?.timelineMonths ?? 12,
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

      const response = await window.spark.llm(promptText, 'gpt-4o-mini')
      setSolutionAreaSuggestion(response)
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
                    ? 'border-accent bg-accent text-accent-foreground'
                    : currentStep > step.number
                      ? 'border-accent bg-accent/10 text-accent'
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
                  currentStep > step.number ? 'bg-accent' : 'bg-border'
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
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-accent">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-revenue">Current Annual Revenue ($)</Label>
                <Input
                  id="current-revenue"
                  type="number"
                  value={baselineMetrics.currentRevenue || ''}
                  onChange={(e) =>
                    setBaselineMetrics({
                      ...baselineMetrics,
                      currentRevenue: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-costs">Current Annual Costs ($)</Label>
                <Input
                  id="current-costs"
                  type="number"
                  value={baselineMetrics.currentCosts || ''}
                  onChange={(e) =>
                    setBaselineMetrics({
                      ...baselineMetrics,
                      currentCosts: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee-count">Employee Count</Label>
                <Input
                  id="employee-count"
                  type="number"
                  value={baselineMetrics.employeeCount || ''}
                  onChange={(e) =>
                    setBaselineMetrics({
                      ...baselineMetrics,
                      employeeCount: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-assets">Current Assets ($)</Label>
                <Input
                  id="current-assets"
                  type="number"
                  value={baselineMetrics.currentAssets || ''}
                  onChange={(e) =>
                    setBaselineMetrics({
                      ...baselineMetrics,
                      currentAssets: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
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

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Revenue Growth Rate (%)</Label>
                  <span className="font-mono text-sm font-medium">
                    {impactProjections.revenueGrowthRate}%
                  </span>
                </div>
                <Slider
                  value={[impactProjections.revenueGrowthRate]}
                  onValueChange={([value]) =>
                    setImpactProjections({ ...impactProjections, revenueGrowthRate: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Cost Reduction (%)</Label>
                  <span className="font-mono text-sm font-medium">
                    {impactProjections.costReduction}%
                  </span>
                </div>
                <Slider
                  value={[impactProjections.costReduction]}
                  onValueChange={([value]) =>
                    setImpactProjections({ ...impactProjections, costReduction: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Efficiency Gain (%)</Label>
                  <span className="font-mono text-sm font-medium">
                    {impactProjections.efficiencyGain}%
                  </span>
                </div>
                <Slider
                  value={[impactProjections.efficiencyGain]}
                  onValueChange={([value]) =>
                    setImpactProjections({ ...impactProjections, efficiencyGain: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Time-to-Market Improvement (%)</Label>
                  <span className="font-mono text-sm font-medium">
                    {impactProjections.timeToMarketImprovement}%
                  </span>
                </div>
                <Slider
                  value={[impactProjections.timeToMarketImprovement]}
                  onValueChange={([value]) =>
                    setImpactProjections({ ...impactProjections, timeToMarketImprovement: value })
                  }
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

            <div className="space-y-6">
              {[
                { key: 'competitiveDifferentiation', label: 'Competitive Differentiation' },
                { key: 'riskMitigation', label: 'Risk Mitigation' },
                { key: 'customerExperience', label: 'Customer Experience Improvement' },
                { key: 'employeeProductivity', label: 'Employee Productivity Gains' },
                { key: 'regulatoryCompliance', label: 'Regulatory Compliance Benefits' },
                { key: 'innovationEnablement', label: 'Innovation Enablement' },
              ].map((factor) => (
                <div key={factor.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{factor.label}</Label>
                    <span className="font-mono text-sm font-medium">
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
