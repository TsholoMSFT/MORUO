/**
 * Customer Presentation View
 * Polished, external-facing view for presenting business cases to customers
 * Focuses on value proposition, ROI, and confidence metrics
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  Target,
  DollarSign,
  Clock,
  Shield,
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
  ArrowRight,
  BarChart3,
} from 'lucide-react'
import type { Analysis } from '@/lib/types'
import type { MonteCarloResults } from '@/lib/monte-carlo'
import type { GeneratedNarrative } from '@/lib/ai-narratives'
import { generateNarrative } from '@/lib/ai-narratives'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { runMonteCarloFromAnalysis, DEFAULT_MONTE_CARLO_CONFIG } from '@/lib/monte-carlo'

interface CustomerPresentationViewProps {
  analysis: Analysis
  monteCarloResults?: MonteCarloResults
  narrative?: GeneratedNarrative
  onMonteCarloComplete?: (results: MonteCarloResults) => void
  onNarrativeGenerated?: (narrative: GeneratedNarrative) => void
}

export function CustomerPresentationView({
  analysis,
  monteCarloResults,
  narrative,
  onMonteCarloComplete,
  onNarrativeGenerated,
}: CustomerPresentationViewProps) {
  const [localMC, setLocalMC] = useState<MonteCarloResults | undefined>(monteCarloResults)
  const [localNarrative, setLocalNarrative] = useState<GeneratedNarrative | undefined>(narrative)
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false)
  const [isRunningMC, setIsRunningMC] = useState(false)

  const mc = localMC || monteCarloResults
  const narr = localNarrative || narrative

  const { projectBasics, results, recommendation } = analysis
  const realistic = results.realistic

  // Run Monte Carlo on mount if not provided
  useEffect(() => {
    if (!mc && !isRunningMC) {
      setIsRunningMC(true)
      setTimeout(() => {
        const simResults = runMonteCarloFromAnalysis(
          analysis,
          DEFAULT_MONTE_CARLO_CONFIG
        )
        setLocalMC(simResults)
        onMonteCarloComplete?.(simResults)
        setIsRunningMC(false)
      }, 50)
    }
  }, [mc, isRunningMC, analysis, onMonteCarloComplete])

  const handleGenerateNarrative = async () => {
    setIsGeneratingNarrative(true)
    try {
      const generated = await generateNarrative(analysis, 'customer', mc)
      setLocalNarrative(generated)
      onNarrativeGenerated?.(generated)
    } catch (error) {
      console.error('Failed to generate narrative:', error)
    } finally {
      setIsGeneratingNarrative(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="text-primary border-primary">
          Business Case Analysis
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {narr?.title || projectBasics.name}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {narr?.summary ||
            `Investment analysis for ${projectBasics.customerName} in ${projectBasics.industry} industry`}
        </p>
      </div>

      {/* Key Metrics Bar */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <KeyMetric
              icon={<TrendingUp className="h-5 w-5 text-chart-3" />}
              label="Expected ROI"
              value={formatPercent(realistic.roi)}
              sublabel={mc ? `${mc.roi.p10.toFixed(0)}%–${mc.roi.p90.toFixed(0)}% range` : undefined}
            />
            <KeyMetric
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              label="Net Benefit"
              value={formatCurrency(realistic.netBenefit)}
              sublabel="Over investment period"
            />
            <KeyMetric
              icon={<Clock className="h-5 w-5 text-chart-2" />}
              label="Payback Period"
              value={`${realistic.paybackMonths.toFixed(1)} months`}
              sublabel={`of ${projectBasics.timelineMonths} month timeline`}
            />
            <KeyMetric
              icon={<Target className="h-5 w-5 text-chart-1" />}
              label="Success Probability"
              value={mc ? `${mc.probabilityOfPositiveROI.toFixed(0)}%` : '—'}
              sublabel="Positive ROI likelihood"
            />
          </div>
        </CardContent>
      </Card>

      {/* Value Proposition */}
      {narr?.valueProposition && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Value Proposition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{narr.valueProposition}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Benefits */}
      {narr?.keyBenefits && narr.keyBenefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-chart-3" />
              Key Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {narr.keyBenefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="rounded-full bg-chart-3/20 p-2 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                  </div>
                  <p className="text-sm">{benefit}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Financial Analysis
          </CardTitle>
          <CardDescription>
            {narr?.financialHighlights || 'Detailed breakdown of projected financial outcomes'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Investment Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Total Investment</p>
              <p className="text-2xl font-bold">
                {formatCurrency(projectBasics.investmentAmount)}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-1">Timeline</p>
              <p className="text-2xl font-bold">{projectBasics.timelineMonths} months</p>
            </div>
          </div>

          <Separator />

          {/* Scenario Comparison */}
          <div>
            <h4 className="text-sm font-medium mb-4">Scenario Analysis</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <ScenarioCard
                title="Conservative"
                metrics={results.conservative}
                variant="muted"
              />
              <ScenarioCard
                title="Realistic"
                metrics={results.realistic}
                variant="primary"
              />
              <ScenarioCard
                title="Optimistic"
                metrics={results.optimistic}
                variant="muted"
              />
            </div>
          </div>

          {/* Confidence Metrics */}
          {mc && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-4">Confidence Analysis</h4>
                <div className="space-y-4">
                  <ConfidenceBar
                    label="Positive ROI Probability"
                    value={mc.probabilityOfPositiveROI}
                    color="chart-3"
                  />
                  <ConfidenceBar
                    label="Payback Within Timeline"
                    value={mc.probabilityOfPaybackWithinTimeline}
                    color="primary"
                  />
                  <ConfidenceBar
                    label="Exceeds Investment Threshold"
                    value={mc.probabilityOfExceedingThreshold}
                    color="chart-1"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Risk & Mitigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-chart-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {narr?.riskStatement ? (
            <p className="text-muted-foreground leading-relaxed">{narr.riskStatement}</p>
          ) : (
            <div className="space-y-2">
              {recommendation.risks.slice(0, 3).map((risk, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Badge variant="outline" className="shrink-0">
                    {i + 1}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{risk}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-8 text-center space-y-4">
          <h3 className="text-xl font-semibold">
            {narr?.callToAction || 'Ready to Proceed?'}
          </h3>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {recommendation.nextSteps[0] || 'Contact your account team to discuss next steps.'}
          </p>
          <div className="flex justify-center gap-4 pt-4">
            {!narr && (
              <Button onClick={handleGenerateNarrative} disabled={isGeneratingNarrative}>
                {isGeneratingNarrative ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Narrative...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Narrative
                  </>
                )}
              </Button>
            )}
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Export to PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Badge */}
      <div className="flex justify-center pb-8">
        <Badge
          variant={recommendation.decision === 'go' ? 'default' : 'outline'}
          className={`text-sm py-2 px-4 ${
            recommendation.decision === 'go'
              ? 'bg-chart-3 text-chart-3-foreground'
              : recommendation.decision === 'no-go'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-chart-5 text-chart-5-foreground'
          }`}
        >
          Recommendation: {recommendation.decision.toUpperCase()} • {recommendation.priority} Priority
        </Badge>
      </div>
    </div>
  )
}

function KeyMetric({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sublabel?: string
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  )
}

function ScenarioCard({
  title,
  metrics,
  variant,
}: {
  title: string
  metrics: { roi: number; npv: number; paybackMonths: number }
  variant: 'primary' | 'muted'
}) {
  const isPrimary = variant === 'primary'
  return (
    <div
      className={`p-4 rounded-lg border ${
        isPrimary ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20' : 'bg-muted/50'
      }`}
    >
      <h5 className={`text-sm font-medium mb-3 ${isPrimary ? 'text-primary' : ''}`}>
        {title}
        {isPrimary && (
          <Badge variant="secondary" className="ml-2 text-xs">
            Base Case
          </Badge>
        )}
      </h5>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">ROI</span>
          <span className="font-medium">{formatPercent(metrics.roi)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">NPV</span>
          <span className="font-medium">{formatCurrency(metrics.npv)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payback</span>
          <span className="font-medium">{metrics.paybackMonths.toFixed(1)} mo</span>
        </div>
      </div>
    </div>
  )
}

function ConfidenceBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-sm font-medium text-${color}`}>{value.toFixed(0)}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

export default CustomerPresentationView
