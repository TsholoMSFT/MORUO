import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PriorityBadge } from './PriorityBadge'
import { ArrowLeft, Buildings, ChartBar, TrendUp, Calendar } from '@phosphor-icons/react'
import type { Analysis } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { industryBenchmarks } from '@/lib/benchmarks'
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb'
import { StockPerformanceCard } from './StockPerformanceCard'
import { useMarketData } from '@/hooks/useStockData'
import { getIndustryIndexInfo } from '@/lib/stock-api'

interface CustomerViewProps {
  customerName: string
  analyses: Analysis[]
  onSelectAnalysis: (analysis: Analysis) => void
  onBack: () => void
  backLabel?: string
  breadcrumbItems?: BreadcrumbItem[]
}

export function CustomerView({ 
  customerName, 
  analyses, 
  onSelectAnalysis, 
  onBack, 
  backLabel = 'Back to All Use Cases',
  breadcrumbItems 
}: CustomerViewProps) {
  // Get ticker and industry from first analysis (assuming same customer)
  const firstAnalysis = analyses[0]
  const ticker = firstAnalysis?.ticker
  const industry = firstAnalysis?.projectBasics.industry || 'general'
  const industryInfo = getIndustryIndexInfo(industry)
  
  // Fetch market data (stock or industry index as fallback)
  const { data: marketData, isLoading: isMarketLoading, isError: isMarketError, isIndustryFallback } = useMarketData(
    ticker,
    industry,
    true
  )
  
  const totalInvestment = analyses.reduce(
    (sum, a) => sum + a.projectBasics.investmentAmount,
    0
  )
  
  const avgROI = analyses.length > 0
    ? analyses.reduce((sum, a) => sum + a.results.realistic.roi, 0) / analyses.length
    : 0
  
  const totalNPV = analyses.reduce((sum, a) => sum + a.results.realistic.npv, 0)
  
  const priorityCounts = analyses.reduce(
    (acc, a) => {
      acc[a.recommendation.priority] = (acc[a.recommendation.priority] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  
  const industryCounts = analyses.reduce(
    (acc, a) => {
      const industry = a.projectBasics.industry
      acc[industry] = (acc[industry] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  
  const sortedAnalyses = [...analyses].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.recommendation.priority] - priorityOrder[b.recommendation.priority]
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2">
            <ArrowLeft className="mr-2" size={16} />
            {backLabel}
          </Button>
          {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
          <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight">
            {customerName}
          </h1>
          <p className="text-muted-foreground">
            {analyses.length} {analyses.length === 1 ? 'use case' : 'use cases'} in portfolio
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Total Investment
            </p>
            <p className="font-mono text-3xl font-semibold">{formatCurrency(totalInvestment)}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Average ROI
            </p>
            <p className="font-mono text-3xl font-semibold text-accent">{formatPercent(avgROI)}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Total NPV
            </p>
            <p className="font-mono text-3xl font-semibold">
              {formatCurrency(totalNPV)}
            </p>
          </div>
        </Card>
        
        <StockPerformanceCard
          stockData={marketData}
          isLoading={isMarketLoading}
          isError={isMarketError}
          isIndustryFallback={isIndustryFallback}
          industryName={industryInfo.name}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-heading text-lg font-semibold">Priority Distribution</h3>
          <div className="space-y-3">
            {(['critical', 'high', 'medium', 'low'] as const).map((priority) => {
              const count = priorityCounts[priority] || 0
              const percentage = analyses.length > 0 ? (count / analyses.length) * 100 : 0
              return count > 0 ? (
                <div key={priority} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={priority} />
                    <span className="text-sm capitalize">{priority}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </div>
                </div>
              ) : null
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-heading text-lg font-semibold">Industries</h3>
          <div className="space-y-3">
            {Object.entries(industryCounts).map(([industry, count]) => {
              const benchmark = industryBenchmarks[industry as keyof typeof industryBenchmarks]
              const percentage = analyses.length > 0 ? (count / analyses.length) * 100 : 0
              return (
                <div key={industry} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Buildings size={20} className="text-accent" weight="duotone" />
                    <span className="text-sm">{benchmark?.name || industry}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="font-heading text-2xl font-bold">All Use Cases</h2>
        <div className="space-y-3">
          {sortedAnalyses.map((analysis) => {
            const benchmark = industryBenchmarks[analysis.projectBasics.industry]
            const realisticROI = analysis.results.realistic.roi

            return (
              <Card
                key={analysis.id}
                className="group cursor-pointer p-6 transition-all hover:shadow-lg"
                onClick={() => onSelectAnalysis(analysis)}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <PriorityBadge priority={analysis.recommendation.priority} />
                      <div className="min-w-0">
                        <h3 className="font-heading text-lg font-semibold leading-tight transition-colors group-hover:text-accent">
                          {analysis.projectBasics.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{benchmark.name}</p>
                        <p className="text-xs font-medium text-accent">
                          {analysis.projectBasics.solutionAreas && analysis.projectBasics.solutionAreas.length > 0
                            ? analysis.projectBasics.solutionAreas.join(', ')
                            : analysis.projectBasics.solutionArea}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 sm:gap-8">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Investment
                      </p>
                      <p className="mt-1 font-mono text-lg font-medium">
                        {formatCurrency(analysis.projectBasics.investmentAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">ROI</p>
                      <p className="mt-1 font-mono text-lg font-medium text-accent">
                        {formatPercent(realisticROI)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">NPV</p>
                      <p className="mt-1 font-mono text-lg font-medium">
                        {formatCurrency(analysis.results.realistic.npv)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Payback
                      </p>
                      <p className="mt-1 font-mono text-lg font-medium">
                        {Math.round(analysis.results.realistic.paybackMonths)}mo
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
