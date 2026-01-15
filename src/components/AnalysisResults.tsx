import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScenarioComparison } from './ScenarioComparison'
import { MetricCard } from './MetricCard'
import { PriorityBadge } from './PriorityBadge'
import { BenchmarkComparison } from './BenchmarkComparison'
import { StockPerformanceCard } from './StockPerformanceCard'
import { FundamentalOverview } from './FundamentalOverview'
import { MonteCarloVisualization } from './MonteCarloVisualization'
import { CustomerPresentationView } from './CustomerPresentationView'
import { InternalPlanningView } from './InternalPlanningView'
import { useMarketData, useCompleteMarketContext } from '@/hooks/useStockData'
import { getIndustryIndexInfo } from '@/lib/stock-api'
import { detectCompanyType } from '@/lib/company-detection'
import { generateMockEarningsInsights, calculateSentimentScore, extractTechThemes } from '@/lib/earnings-analysis'
import type { MonteCarloResults } from '@/lib/monte-carlo'
import type { GeneratedNarrative, NarrativeCache } from '@/lib/ai-narratives'
import {
  CheckCircle,
  Warning,
  XCircle,
  Target,
  TrendUp,
  ChartBar,
  ArrowLeft,
  PencilSimple,
  ChartLine,
  ChatCircle,
  Handshake,
  Repeat,
  SwordsCrossed,
  CloudArrowUp,
} from '@phosphor-icons/react'
import type { Analysis, DealType } from '@/lib/types'
import { DEAL_TYPE_INFO } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { industryBenchmarks } from '@/lib/benchmarks'

const dealTypeIcons: Record<DealType, React.ReactNode> = {
  'new-business': <Handshake size={16} weight="duotone" />,
  'renewal': <Repeat size={16} weight="duotone" />,
  'upsell-cross-sell': <TrendUp size={16} weight="duotone" />,
  'competitive': <SwordsCrossed size={16} weight="duotone" />,
  'azure-macc': <CloudArrowUp size={16} weight="duotone" />
}

interface AnalysisResultsProps {
  analysis: Analysis
  onBack: () => void
  onSave: () => void
  onEdit: (analysis: Analysis) => void
  isSaved: boolean
}

export function AnalysisResults({ analysis, onBack, onSave, onEdit, isSaved }: AnalysisResultsProps) {
  const [monteCarloResults, setMonteCarloResults] = useState<MonteCarloResults | undefined>(
    analysis.monteCarloResults as MonteCarloResults | undefined
  )
  const [narratives, setNarratives] = useState<NarrativeCache | undefined>(
    analysis.narratives as NarrativeCache | undefined
  )
  
  const { projectBasics, results, recommendation } = analysis
  const benchmark = industryBenchmarks[projectBasics.industry]
  
  // Detect if company is private (use manual flag if available in future)
  const isPrivateCompany = !analysis.ticker || detectCompanyType(projectBasics.customerName) === 'private'
  
  // Fetch complete market context (stock data + fundamentals)
  const industryInfo = getIndustryIndexInfo(projectBasics.industry)
  const marketContext = useCompleteMarketContext(
    analysis.ticker,
    projectBasics.industry,
    isPrivateCompany,
    true
  )
  
  // Backward compatibility with existing code
  const marketData = marketContext.stockData
  const isMarketLoading = marketContext.stockLoading
  const isMarketError = marketContext.stockError
  const isIndustryFallback = marketContext.isIndustryFallback
  
  // Generate mock earnings insights (in production, fetch from API)
  const earningsInsights = generateMockEarningsInsights(
    projectBasics.customerName,
    'Q4',
    new Date().getFullYear()
  )
  const sentimentScore = calculateSentimentScore(earningsInsights)
  const techThemes = extractTechThemes(earningsInsights)

  const DecisionIcon =
    recommendation.decision === 'go'
      ? CheckCircle
      : recommendation.decision === 'no-go'
        ? XCircle
        : Warning

  const decisionColor =
    recommendation.decision === 'go'
      ? 'text-green-600'
      : recommendation.decision === 'no-go'
        ? 'text-red-600'
        : 'text-amber-600'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight">
            {projectBasics.name}
          </h1>
          <p className="mb-2 text-lg font-medium text-muted-foreground">
            {projectBasics.customerName}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{benchmark.name}</span>
            <span>•</span>
            <span>{projectBasics.subsidiary}</span>
            <span>•</span>
            <span>{projectBasics.region}</span>
            <span>•</span>
            <span>{formatCurrency(projectBasics.investmentAmount)} investment</span>
            <span>•</span>
            <span>{projectBasics.timelineMonths} month timeline</span>
            {projectBasics.dealType && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {dealTypeIcons[projectBasics.dealType]}
                  {DEAL_TYPE_INFO[projectBasics.dealType].name}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2" size={18} />
            Back
          </Button>
          <Button variant="outline" onClick={() => onEdit(analysis)}>
            <PencilSimple className="mr-2" size={18} />
            Edit
          </Button>
          {!isSaved && <Button onClick={onSave}>Save Analysis</Button>}
        </div>
      </div>

      <Card className="border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-transparent p-6">
        <div className="flex items-start gap-4">
          <DecisionIcon className={decisionColor} size={48} weight="fill" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl font-bold">
                {recommendation.decision === 'go'
                  ? 'Recommended: Proceed'
                  : recommendation.decision === 'no-go'
                    ? 'Not Recommended'
                    : 'Conditional Approval'}
              </h2>
              <PriorityBadge priority={recommendation.priority} />
            </div>
            <p className="text-lg leading-relaxed text-foreground">{recommendation.reasoning}</p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="strategic">Strategic</TabsTrigger>
          <TabsTrigger value="market">Market Context</TabsTrigger>
          <TabsTrigger value="customer-view">Customer View</TabsTrigger>
          <TabsTrigger value="internal-view">Internal View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">Key Metrics</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                label="ROI (Realistic)"
                value={formatPercent(results.realistic.roi)}
                trend={results.realistic.roi}
              />
              <MetricCard
                label="NPV"
                value={formatCurrency(results.realistic.npv)}
                trend={results.realistic.npv > 0 ? 100 : -100}
              />
              <MetricCard
                label="Payback Period"
                value={`${results.realistic.paybackMonths.toFixed(1)}mo`}
              />
              <MetricCard
                label="Net Benefit"
                value={formatCurrency(results.realistic.netBenefit)}
                trend={results.realistic.netBenefit > 0 ? 100 : -100}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">Scenario Analysis</h3>
            <ScenarioComparison results={results} />
          </div>

          {projectBasics.description && (
            <div>
              <h3 className="mb-3 font-heading text-xl font-semibold">Use Case Description</h3>
              <Card className="p-4">
                <p className="leading-relaxed text-muted-foreground">
                  {projectBasics.description}
                </p>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">
              <ChartBar className="mr-2 inline" size={24} />
              Financial Impact Breakdown
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Revenue Impact"
                value={formatCurrency(results.realistic.revenueImpact)}
                size="large"
              />
              <MetricCard
                label="Cost Savings"
                value={formatCurrency(results.realistic.costSavings)}
                size="large"
              />
              <MetricCard
                label="Net Benefit"
                value={formatCurrency(results.realistic.netBenefit)}
                size="large"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">Performance vs Industry Benchmarks</h3>
            <Card className="p-6">
              <div className="space-y-6">
                <BenchmarkComparison
                  label="ROI Performance"
                  value={results.realistic.roi}
                  benchmark={benchmark.roaTarget * 20}
                  unit="%"
                  description={`Target ROI for ${benchmark.name} is ${(benchmark.roaTarget * 20).toFixed(1)}%+`}
                />
                <Separator />
                <BenchmarkComparison
                  label="Payback Period"
                  value={results.realistic.paybackMonths}
                  benchmark={18}
                  unit="months"
                  inverse={true}
                  description="Industry best practice is payback within 18 months"
                />
                <Separator />
                <BenchmarkComparison
                  label="Target Cost-to-Income Ratio"
                  value={
                    analysis.baselineMetrics.currentCosts && analysis.baselineMetrics.currentRevenue
                      ? (analysis.baselineMetrics.currentCosts / analysis.baselineMetrics.currentRevenue) * 100
                      : benchmark.costToIncomeTarget
                  }
                  benchmark={benchmark.costToIncomeTarget}
                  unit="%"
                  inverse={true}
                  description={`${benchmark.name} target: <${benchmark.costToIncomeTarget}%¹`}
                />
                <Separator />
                <BenchmarkComparison
                  label="Target Revenue Per Employee"
                  value={
                    analysis.baselineMetrics.currentRevenue && analysis.baselineMetrics.employeeCount
                      ? analysis.baselineMetrics.currentRevenue / analysis.baselineMetrics.employeeCount
                      : benchmark.revenuePerEmployee
                  }
                  benchmark={benchmark.revenuePerEmployee}
                  unit=""
                  description={`${benchmark.name} target: ${formatCurrency(benchmark.revenuePerEmployee)}+²`}
                />
                <Separator />
                <BenchmarkComparison
                  label="Target ROA (Return on Assets)"
                  value={
                    analysis.baselineMetrics.currentRevenue && analysis.baselineMetrics.currentAssets
                      ? (analysis.baselineMetrics.currentRevenue * 0.15 / analysis.baselineMetrics.currentAssets) * 100
                      : benchmark.roaTarget
                  }
                  benchmark={benchmark.roaTarget}
                  unit="%"
                  description={`${benchmark.name} target: >${benchmark.roaTarget}%³`}
                />
                <Separator />
                <BenchmarkComparison
                  label="Target Operating Margin"
                  value={
                    analysis.baselineMetrics.currentRevenue && analysis.baselineMetrics.currentCosts
                      ? ((analysis.baselineMetrics.currentRevenue - analysis.baselineMetrics.currentCosts) / analysis.baselineMetrics.currentRevenue) * 100
                      : benchmark.operatingMarginTarget
                  }
                  benchmark={benchmark.operatingMarginTarget}
                  unit="%"
                  description={`${benchmark.name} target: ${benchmark.operatingMarginTarget}%+⁴`}
                />
                <Separator />
                <BenchmarkComparison
                  label="Efficiency Improvement"
                  value={analysis.impactProjections.efficiencyGain}
                  benchmark={15}
                  unit="%"
                  description={`${benchmark.name} targets ${15}%+ efficiency gains`}
                />
                <Separator />
                <BenchmarkComparison
                  label="Cost Reduction Target"
                  value={analysis.impactProjections.costReduction}
                  benchmark={10}
                  unit="%"
                  description="Industry standard for cost optimization is 10%+ reduction"
                />
              </div>
              <div className="mt-6 space-y-1 border-t pt-4 text-xs text-muted-foreground">
                <p className="font-semibold">Benchmark Sources:</p>
                <p>¹ EY Banking & Capital Markets Research, IBM Institute for Business Value</p>
                <p>² Industry average based on SEC filings and WIPO Global Innovation Index</p>
                <p>³ Asset efficiency benchmarks from industry peer analysis (SEC 10-K filings)</p>
                <p>⁴ Operating margin targets based on industry profitability studies and digital transformation ROI research (Octaria, Resolution IT)</p>
              </div>
            </Card>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">All Scenarios</h3>
            <ScenarioComparison results={results} />
          </div>

          <div>
            <h3 className="mb-3 font-heading text-xl font-semibold">Industry Benchmarks</h3>
            <Card className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Target Cost-to-Income Ratio
                  </p>
                  <p className="mt-1 font-mono text-xl">&lt; {benchmark.costToIncomeTarget}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Target Revenue per Employee
                  </p>
                  <p className="mt-1 font-mono text-xl">
                    {formatCurrency(benchmark.revenuePerEmployee)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Target ROA
                  </p>
                  <p className="mt-1 font-mono text-xl">&gt; {benchmark.roaTarget}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Target Operating Margin
                  </p>
                  <p className="mt-1 font-mono text-xl">{benchmark.operatingMarginTarget}%</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">
              <ChartLine className="mr-2 inline" size={24} />
              Stock Performance & Market Context
            </h3>
            
            {marketContext.usingFundamentalsFallback && (
              <Alert className="mb-4">
                <AlertDescription>
                  {isPrivateCompany 
                    ? `${projectBasics.customerName} appears to be a private company. Showing industry average data from ${projectBasics.industry} sector.`
                    : 'Company financial data unavailable. Showing industry benchmark data.'}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-6 md:grid-cols-2">
              <StockPerformanceCard
                stockData={marketData}
                isLoading={isMarketLoading}
                isError={isMarketError}
                isIndustryFallback={isIndustryFallback}
                industryName={industryInfo.name}
              />
              
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Investment Context</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Project Investment</span>
                        <span className="font-semibold">{formatCurrency(projectBasics.investmentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Expected ROI</span>
                        <span className="font-semibold text-primary">{formatPercent(results.realistic.roi)}</span>
                      </div>
                      {marketData && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span>Market Performance (YTD)</span>
                            <span className={`font-semibold ${marketData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {marketData.changePercent >= 0 ? '+' : ''}{marketData.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Fundamental Analysis Section */}
          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">
              <ChartBar className="mr-2 inline" size={24} />
              Fundamental Analysis
            </h3>
            
            <FundamentalOverview
              fundamentals={marketContext.fundamentals}
              isLoading={marketContext.fundamentalsLoading}
              isError={marketContext.fundamentalsError}
              usingFallback={marketContext.usingFundamentalsFallback}
            />
          </div>

          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">
              <ChatCircle className="mr-2 inline" size={24} />
              Earnings Call Insights
            </h3>
            
            <Card className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Latest Earnings Analysis</p>
                  <p className="text-lg font-semibold">{earningsInsights.quarter} {earningsInsights.year}</p>
                </div>
                <Badge 
                  variant={
                    earningsInsights.overallSentiment === 'positive' ? 'default' :
                    earningsInsights.overallSentiment === 'negative' ? 'destructive' :
                    'secondary'
                  }
                >
                  {earningsInsights.overallSentiment} sentiment
                </Badge>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3">Technology Mentions</h4>
                <div className="space-y-3">
                  {earningsInsights.technologyMentions.map((mention, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{mention.category}</span>
                          <Badge variant="outline" className="text-xs">
                            {mention.count} mentions
                          </Badge>
                          <Badge 
                            variant={
                              mention.sentiment === 'positive' ? 'default' :
                              mention.sentiment === 'negative' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {mention.sentiment}
                          </Badge>
                        </div>
                        {mention.quotes[0] && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{mention.quotes[0]}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {earningsInsights.investmentCommitments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3">Investment Commitments</h4>
                    <div className="space-y-2">
                      {earningsInsights.investmentCommitments.map((commitment, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{commitment.category}</span>
                            {commitment.amount && (
                              <span className="font-mono text-primary">
                                {formatCurrency(commitment.amount)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground italic mt-1">
                            "{commitment.quote}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Strategic Themes</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {earningsInsights.strategicThemes.map((theme, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{theme}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Risk Factors</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {earningsInsights.riskFactors.map((risk, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Sentiment Alignment Score:</strong> {(sentimentScore * 100).toFixed(0)}%
                  <p className="text-xs mt-1">
                    {sentimentScore > 0.3 
                      ? 'Positive market sentiment aligns well with technology investment strategy'
                      : sentimentScore < -0.3
                      ? 'Negative sentiment may indicate challenges with technology adoption'
                      : 'Neutral sentiment suggests cautious but measured approach to technology investments'
                    }
                  </p>
                </AlertDescription>
              </Alert>
            </Card>
          </div>

          <div>
            <h3 className="mb-3 font-heading text-xl font-semibold">Market Validation</h3>
            <Card className="p-6">
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    {isIndustryFallback ? (
                      <p>
                        Using <strong>{industryInfo.name}</strong> as proxy for market performance.
                        This analysis compares your technology investment against industry-wide trends.
                      </p>
                    ) : (
                      <p>
                        Market data for <strong>{projectBasics.customerName}</strong> provides real-world
                        context for evaluating technology investment impact on business performance.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Technology Mention Frequency</p>
                    <div className="space-y-1">
                      {Object.entries(techThemes).slice(0, 3).map(([theme, count]) => (
                        <div key={theme} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{theme}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Investment Alignment</p>
                    <p className="text-sm text-muted-foreground">
                      Your use case aligns with {earningsInsights.technologyMentions.length} key themes
                      mentioned in recent earnings discussions, indicating strategic fit with company priorities.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-6">
          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">
              <Target className="mr-2 inline" size={24} />
              Success Metrics
            </h3>
            <Card className="p-6">
              <ul className="space-y-3">
                {recommendation.successMetrics.map((metric, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 shrink-0 text-chart-3" size={20} weight="fill" />
                    <span className="leading-relaxed">{metric}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">
              <TrendUp className="mr-2 inline" size={24} />
              Next Steps
            </h3>
            <div className="space-y-3">
              {recommendation.nextSteps.map((step, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge className="shrink-0">{index + 1}</Badge>
                    <p className="leading-relaxed">{step}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-xl font-semibold">
              <Warning className="mr-2 inline" size={24} />
              Key Risks & Mitigation
            </h3>
            <div className="space-y-3">
              {recommendation.risks.map((risk, index) => (
                <Alert key={index} className="border-l-4 border-l-amber-400">
                  <AlertDescription className="leading-relaxed">{risk}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-heading text-xl font-semibold">Implementation Timeline</h3>
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-heading font-semibold">Quick Wins (0-6 months)</h4>
                    <Badge variant="outline">Phase 1</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Initial setup, pilot programs, and foundational infrastructure deployment.
                    Target early wins to build momentum and stakeholder confidence.
                  </p>
                </div>
                <Separator />
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-heading font-semibold">Medium-term Value (6-18 months)</h4>
                    <Badge variant="outline">Phase 2</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Full rollout, optimization, and scaling. Begin realizing substantial financial
                    benefits and operational improvements.
                  </p>
                </div>
                <Separator />
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-heading font-semibold">
                      Long-term Transformation (18+ months)
                    </h4>
                    <Badge variant="outline">Phase 3</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Strategic benefits materialization, platform effects, and sustained competitive
                    advantages. Continuous improvement and innovation enablement.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <MonteCarloVisualization
            analysis={analysis}
            results={monteCarloResults}
            onResultsGenerated={setMonteCarloResults}
          />
        </TabsContent>

        <TabsContent value="customer-view" className="space-y-6">
          <CustomerPresentationView
            analysis={analysis}
            monteCarloResults={monteCarloResults}
            narrative={narratives?.customer}
            onMonteCarloComplete={setMonteCarloResults}
            onNarrativeGenerated={(narrative) =>
              setNarratives((prev) => ({ ...prev, customer: narrative }))
            }
          />
        </TabsContent>

        <TabsContent value="internal-view" className="space-y-6">
          <InternalPlanningView
            analysis={analysis}
            monteCarloResults={monteCarloResults}
            narrative={narratives?.internal}
            onMonteCarloComplete={setMonteCarloResults}
            onNarrativeGenerated={(narrative) =>
              setNarratives((prev) => ({ ...prev, internal: narrative }))
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
