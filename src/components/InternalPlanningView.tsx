/**
 * Internal Planning View
 * Detailed internal view for planning, prioritization, and risk analysis
 * Designed for Microsoft account teams and managers
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  FileText,
  BarChart3,
  Shield,
  Users,
  Calendar,
  Briefcase,
  PieChart,
  Activity,
} from 'lucide-react'
import type { Analysis, DealType } from '@/lib/types'
import { DEAL_TYPE_INFO } from '@/lib/types'
import type { MonteCarloResults } from '@/lib/monte-carlo'
import type { GeneratedNarrative } from '@/lib/ai-narratives'
import { generateNarrative } from '@/lib/ai-narratives'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { runMonteCarloFromAnalysis, DEFAULT_MONTE_CARLO_CONFIG } from '@/lib/monte-carlo'
import { MonteCarloVisualization } from './MonteCarloVisualization'

interface InternalPlanningViewProps {
  analysis: Analysis
  monteCarloResults?: MonteCarloResults
  narrative?: GeneratedNarrative
  onMonteCarloComplete?: (results: MonteCarloResults) => void
  onNarrativeGenerated?: (narrative: GeneratedNarrative) => void
  onRequestExport?: () => void
}

export function InternalPlanningView({
  analysis,
  monteCarloResults,
  narrative,
  onMonteCarloComplete,
  onNarrativeGenerated,
  onRequestExport,
}: InternalPlanningViewProps) {
  const [localMC, setLocalMC] = useState<MonteCarloResults | undefined>(monteCarloResults)
  const [localNarrative, setLocalNarrative] = useState<GeneratedNarrative | undefined>(narrative)
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false)
  const [isRunningMC, setIsRunningMC] = useState(false)

  const mc = localMC || monteCarloResults
  const narr = localNarrative || narrative

  const { projectBasics, results, recommendation, strategicFactors, impactProjections, baselineMetrics } = analysis
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
      const generated = await generateNarrative(analysis, 'internal', mc)
      setLocalNarrative(generated)
      onNarrativeGenerated?.(generated)
    } catch (error) {
      console.error('Failed to generate narrative:', error)
    } finally {
      setIsGeneratingNarrative(false)
    }
  }

  // Calculate strategic score
  const strategicScore = Math.round(
    (strategicFactors.competitiveDifferentiation +
      strategicFactors.customerExperience +
      strategicFactors.innovationEnablement +
      strategicFactors.riskMitigation +
      strategicFactors.employeeProductivity +
      strategicFactors.regulatoryCompliance) /
      6
  )

  // Risk assessment
  const riskLevel =
    mc?.probabilityOfPositiveROI && mc.probabilityOfPositiveROI >= 70
      ? 'low'
      : mc?.probabilityOfPositiveROI && mc.probabilityOfPositiveROI >= 40
        ? 'medium'
        : 'high'

  const priorityColors = {
    critical: 'bg-destructive text-destructive-foreground',
    high: 'bg-chart-5 text-white',
    medium: 'bg-primary text-primary-foreground',
    low: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className={priorityColors[recommendation.priority]}>
              {recommendation.priority.toUpperCase()} PRIORITY
            </Badge>
            <Badge
              variant={recommendation.decision === 'go' ? 'default' : 'outline'}
              className={
                recommendation.decision === 'go'
                  ? 'bg-chart-3 text-white'
                  : recommendation.decision === 'no-go'
                    ? 'bg-destructive text-white'
                    : 'bg-chart-5 text-white'
              }
            >
              {recommendation.decision.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{projectBasics.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-muted-foreground">
              {projectBasics.customerName} • {projectBasics.industry} •{' '}
              {projectBasics.solutionAreas?.join(', ') || projectBasics.solutionArea}
            </p>
            {projectBasics.dealType && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {DEAL_TYPE_INFO[projectBasics.dealType].name}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!narr && (
            <Button
              variant="outline"
              onClick={handleGenerateNarrative}
              disabled={isGeneratingNarrative}
            >
              {isGeneratingNarrative ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Internal Brief
            </Button>
          )}
          <Button variant="outline" onClick={onRequestExport}>
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <QuickStat
          label="Investment"
          value={formatCurrency(projectBasics.investmentAmount)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <QuickStat
          label="Expected ROI"
          value={formatPercent(realistic.roi)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={realistic.roi > 0 ? 'up' : 'down'}
        />
        <QuickStat
          label="Net Benefit"
          value={formatCurrency(realistic.netBenefit)}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <QuickStat
          label="Payback"
          value={`${realistic.paybackMonths.toFixed(1)} mo`}
          icon={<Clock className="h-4 w-4" />}
          sublabel={`of ${projectBasics.timelineMonths} mo`}
        />
        <QuickStat
          label="Success Prob."
          value={mc ? `${mc.probabilityOfPositiveROI.toFixed(0)}%` : '—'}
          icon={<Target className="h-4 w-4" />}
          variant={riskLevel}
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="strategy">Strategic Fit</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Deal Type Context */}
          {projectBasics.dealType && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Deal Type: {DEAL_TYPE_INFO[projectBasics.dealType].name}
                </CardTitle>
                <CardDescription>
                  {DEAL_TYPE_INFO[projectBasics.dealType].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-chart-3" />
                      Proposal Emphasis
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {DEAL_TYPE_INFO[projectBasics.dealType].characteristics.proposalEmphasis.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Key Metrics Focus
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {DEAL_TYPE_INFO[projectBasics.dealType].characteristics.keyMetrics.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          {narr && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Generated Internal Brief
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{narr.summary}</p>
                {narr.keyBenefits && narr.keyBenefits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Points</h4>
                    <ul className="space-y-1">
                      {narr.keyBenefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-chart-3 mt-0.5 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendation Rationale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{recommendation.reasoning}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                    Success Metrics
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {recommendation.successMetrics.map((metric, i) => (
                      <li key={i}>• {metric}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-chart-5" />
                    Key Risks
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {recommendation.risks.map((risk, i) => (
                      <li key={i}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendation.nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0 mt-0.5">
                      {i + 1}
                    </Badge>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6 mt-6">
          {/* Scenario Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Conservative</TableHead>
                    <TableHead className="text-right bg-primary/5">Realistic</TableHead>
                    <TableHead className="text-right">Optimistic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>ROI</TableCell>
                    <TableCell className="text-right">{formatPercent(results.conservative.roi)}</TableCell>
                    <TableCell className="text-right bg-primary/5 font-medium">
                      {formatPercent(results.realistic.roi)}
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(results.optimistic.roi)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>NPV</TableCell>
                    <TableCell className="text-right">{formatCurrency(results.conservative.npv)}</TableCell>
                    <TableCell className="text-right bg-primary/5 font-medium">
                      {formatCurrency(results.realistic.npv)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(results.optimistic.npv)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Payback Period</TableCell>
                    <TableCell className="text-right">{results.conservative.paybackMonths.toFixed(1)} mo</TableCell>
                    <TableCell className="text-right bg-primary/5 font-medium">
                      {results.realistic.paybackMonths.toFixed(1)} mo
                    </TableCell>
                    <TableCell className="text-right">{results.optimistic.paybackMonths.toFixed(1)} mo</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Net Benefit</TableCell>
                    <TableCell className="text-right">{formatCurrency(results.conservative.netBenefit)}</TableCell>
                    <TableCell className="text-right bg-primary/5 font-medium">
                      {formatCurrency(results.realistic.netBenefit)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(results.optimistic.netBenefit)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Revenue Impact</TableCell>
                    <TableCell className="text-right">{formatCurrency(results.conservative.revenueImpact)}</TableCell>
                    <TableCell className="text-right bg-primary/5 font-medium">
                      {formatCurrency(results.realistic.revenueImpact)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(results.optimistic.revenueImpact)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cost Savings</TableCell>
                    <TableCell className="text-right">{formatCurrency(results.conservative.costSavings)}</TableCell>
                    <TableCell className="text-right bg-primary/5 font-medium">
                      {formatCurrency(results.realistic.costSavings)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(results.optimistic.costSavings)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Impact Projections */}
          <Card>
            <CardHeader>
              <CardTitle>Impact Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ImpactMetric
                  label="Revenue Growth Rate"
                  value={impactProjections.revenueGrowthRate}
                  format="percent"
                />
                <ImpactMetric
                  label="Cost Reduction"
                  value={impactProjections.costReduction}
                  format="percent"
                />
                <ImpactMetric
                  label="Efficiency Gain"
                  value={impactProjections.efficiencyGain}
                  format="percent"
                />
                <ImpactMetric
                  label="Time to Market Improvement"
                  value={impactProjections.timeToMarketImprovement}
                  format="percent"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk" className="space-y-6 mt-6">
          {/* Monte Carlo Analysis */}
          <MonteCarloVisualization
            analysis={analysis}
            results={mc}
            onResultsGenerated={(results) => {
              setLocalMC(results)
              onMonteCarloComplete?.(results)
            }}
          />
        </TabsContent>

        {/* Strategic Fit Tab */}
        <TabsContent value="strategy" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Strategic Alignment Score
              </CardTitle>
              <CardDescription>
                Overall strategic fit: {strategicScore}/100
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <StrategicFactor
                  label="Competitive Differentiation"
                  value={strategicFactors.competitiveDifferentiation}
                />
                <StrategicFactor
                  label="Customer Experience"
                  value={strategicFactors.customerExperience}
                />
                <StrategicFactor
                  label="Innovation Enablement"
                  value={strategicFactors.innovationEnablement}
                />
                <StrategicFactor
                  label="Risk Mitigation"
                  value={strategicFactors.riskMitigation}
                />
                <StrategicFactor
                  label="Employee Productivity"
                  value={strategicFactors.employeeProductivity}
                />
                <StrategicFactor
                  label="Regulatory Compliance"
                  value={strategicFactors.regulatoryCompliance}
                />
              </div>
            </CardContent>
          </Card>

          {/* Solution Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Solution Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(projectBasics.solutionAreas || [projectBasics.solutionArea]).map((area, i) => (
                  <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                    {area}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Tab */}
        <TabsContent value="execution" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Execution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Timeline</span>
                  <span className="font-medium">{projectBasics.timelineMonths} months</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expected Payback</span>
                  <span className="font-medium">{realistic.paybackMonths.toFixed(1)} months</span>
                </div>
                <Separator />
                <div className="relative pt-4">
                  <div className="absolute left-0 top-4 w-full h-2 bg-muted rounded-full" />
                  <div
                    className="absolute left-0 top-4 h-2 bg-chart-3 rounded-full"
                    style={{
                      width: `${Math.min((realistic.paybackMonths / projectBasics.timelineMonths) * 100, 100)}%`,
                    }}
                  />
                  <div className="flex justify-between pt-4 text-xs text-muted-foreground">
                    <span>Start</span>
                    <span>Payback ({realistic.paybackMonths.toFixed(0)} mo)</span>
                    <span>End ({projectBasics.timelineMonths} mo)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Customer Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{projectBasics.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium capitalize">{projectBasics.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subsidiary</p>
                  <p className="font-medium">{projectBasics.subsidiary}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">{projectBasics.region}</p>
                </div>
              </div>
              {projectBasics.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{projectBasics.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function QuickStat({
  label,
  value,
  icon,
  sublabel,
  trend,
  variant,
}: {
  label: string
  value: string
  icon: React.ReactNode
  sublabel?: string
  trend?: 'up' | 'down'
  variant?: 'low' | 'medium' | 'high'
}) {
  const variantColors = {
    low: 'text-chart-3',
    medium: 'text-chart-5',
    high: 'text-destructive',
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={variant ? variantColors[variant] : 'text-muted-foreground'}>{icon}</span>
        </div>
        <p className={`text-lg font-bold ${trend === 'up' ? 'text-chart-3' : trend === 'down' ? 'text-destructive' : ''}`}>
          {value}
        </p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  )
}

function ImpactMetric({
  label,
  value,
  format,
}: {
  label: string
  value: number
  format: 'percent' | 'currency' | 'number'
}) {
  const formattedValue =
    format === 'percent'
      ? `${value.toFixed(1)}%`
      : format === 'currency'
        ? formatCurrency(value)
        : value.toFixed(1)

  return (
    <div className="p-4 rounded-lg border">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-semibold">{formattedValue}</p>
      <Progress value={Math.min(value, 100)} className="h-2 mt-2" />
    </div>
  )
}

function StrategicFactor({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'text-chart-3' : value >= 40 ? 'text-chart-5' : 'text-destructive'

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className={`text-sm font-medium ${color}`}>{value}/100</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

export default InternalPlanningView
