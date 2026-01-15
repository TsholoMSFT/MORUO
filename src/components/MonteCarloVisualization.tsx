/**
 * Monte Carlo Simulation Visualization Components
 * Displays histogram, confidence intervals, and probability metrics
 */

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, AlertTriangle, Target, Loader2, RefreshCw } from 'lucide-react'
import type { MonteCarloResults, ConfidenceInterval, HistogramBucket } from '@/lib/monte-carlo'
import { runMonteCarloFromAnalysis, DEFAULT_MONTE_CARLO_CONFIG } from '@/lib/monte-carlo'
import type { Analysis } from '@/lib/types'

interface MonteCarloVisualizationProps {
  analysis: Analysis
  results?: MonteCarloResults
  onResultsGenerated?: (results: MonteCarloResults) => void
}

export function MonteCarloVisualization({
  analysis,
  results,
  onResultsGenerated,
}: MonteCarloVisualizationProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [localResults, setLocalResults] = useState<MonteCarloResults | undefined>(results)

  const mcResults = localResults || results

  const handleRunSimulation = async () => {
    setIsRunning(true)
    // Use setTimeout to allow UI to update before CPU-intensive work
    setTimeout(() => {
      const simResults = runMonteCarloFromAnalysis(
        analysis,
        DEFAULT_MONTE_CARLO_CONFIG
      )
      setLocalResults(simResults)
      onResultsGenerated?.(simResults)
      setIsRunning(false)
    }, 50)
  }

  if (!mcResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Monte Carlo Simulation
          </CardTitle>
          <CardDescription>
            Run probabilistic analysis to understand the range of possible outcomes
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Monte Carlo simulation runs thousands of scenarios with varying assumptions to give you
            confidence intervals and probability estimates for your financial projections.
          </p>
          <Button onClick={handleRunSimulation} disabled={isRunning} size="lg">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running {DEFAULT_MONTE_CARLO_CONFIG.iterations.toLocaleString()} simulations...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Run Monte Carlo Simulation
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with key metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Monte Carlo Results
            </CardTitle>
            <CardDescription>
              Based on {mcResults.iterations.toLocaleString()} simulations
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRunSimulation} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <ProbabilityCard
              title="Positive ROI"
              probability={mcResults.probabilityOfPositiveROI}
              icon={<TrendingUp className="h-4 w-4" />}
              color="text-chart-3"
            />
            <ProbabilityCard
              title="Payback in Timeline"
              probability={mcResults.probabilityOfPaybackWithinTimeline}
              icon={<Target className="h-4 w-4" />}
              color="text-primary"
            />
            <ProbabilityCard
              title="Exceeds Threshold"
              probability={mcResults.probabilityOfExceedingThreshold}
              icon={
                mcResults.probabilityOfExceedingThreshold >= 70 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )
              }
              color={
                mcResults.probabilityOfExceedingThreshold >= 70 ? 'text-chart-3' : 'text-chart-5'
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="roi" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roi">ROI Distribution</TabsTrigger>
          <TabsTrigger value="npv">NPV Analysis</TabsTrigger>
          <TabsTrigger value="payback">Payback Period</TabsTrigger>
        </TabsList>

        <TabsContent value="roi" className="mt-4">
          <DistributionCard
            title="ROI Distribution"
            interval={mcResults.roi}
            histogram={mcResults.roiHistogram}
            formatValue={(v) => `${v.toFixed(1)}%`}
            zeroLine={true}
          />
        </TabsContent>

        <TabsContent value="npv" className="mt-4">
          <DistributionCard
            title="NPV Distribution"
            interval={mcResults.npv}
            histogram={mcResults.npvHistogram}
            formatValue={(v) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(v)
            }
            zeroLine={true}
          />
        </TabsContent>

        <TabsContent value="payback" className="mt-4">
          <DistributionCard
            title="Payback Period Distribution"
            interval={mcResults.paybackMonths}
            histogram={mcResults.paybackHistogram}
            formatValue={(v) => `${v.toFixed(1)} mo`}
            targetLine={analysis.projectBasics.timelineMonths}
            targetLabel="Target Timeline"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ProbabilityCardProps {
  title: string
  probability: number
  icon: React.ReactNode
  color: string
}

function ProbabilityCard({ title, probability, icon, color }: ProbabilityCardProps) {
  const riskLevel = probability >= 70 ? 'low' : probability >= 40 ? 'medium' : 'high'
  const riskColors = {
    low: 'bg-chart-3/20 text-chart-3',
    medium: 'bg-chart-5/20 text-chart-5',
    high: 'bg-destructive/20 text-destructive',
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={color}>{icon}</div>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-2xl font-bold ${color}`}>{probability.toFixed(0)}%</span>
        <Badge variant="outline" className={`mb-1 ${riskColors[riskLevel]}`}>
          {riskLevel} risk
        </Badge>
      </div>
      <Progress value={probability} className="h-2" />
    </div>
  )
}

interface DistributionCardProps {
  title: string
  interval: ConfidenceInterval
  histogram: HistogramBucket[]
  formatValue: (value: number) => string
  zeroLine?: boolean
  targetLine?: number
  targetLabel?: string
}

function DistributionCard({
  title,
  interval,
  histogram,
  formatValue,
  zeroLine,
  targetLine,
  targetLabel,
}: DistributionCardProps) {
  const chartData = useMemo(
    () =>
      histogram.map((bucket) => ({
        range: formatValue((bucket.min + bucket.max) / 2),
        count: bucket.count,
        min: bucket.min,
        max: bucket.max,
        isMedianBucket: bucket.min <= interval.p50 && bucket.max >= interval.p50,
      })),
    [histogram, interval.p50, formatValue]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Confidence Interval Summary */}
        <div className="grid grid-cols-5 gap-4">
          <ConfidenceMetric label="P10 (Pessimistic)" value={formatValue(interval.p10)} />
          <ConfidenceMetric label="P25" value={formatValue(interval.p25)} />
          <ConfidenceMetric label="P50 (Median)" value={formatValue(interval.p50)} highlight />
          <ConfidenceMetric label="P75" value={formatValue(interval.p75)} />
          <ConfidenceMetric label="P90 (Optimistic)" value={formatValue(interval.p90)} />
        </div>

        {/* Histogram Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <XAxis dataKey="range" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-xl">
                        <p className="text-sm font-medium">
                          {formatValue(data.min)} to {formatValue(data.max)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.count.toLocaleString()} simulations
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {zeroLine && <ReferenceLine x={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />}
              {targetLine !== undefined && (
                <ReferenceLine
                  x={formatValue(targetLine)}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="3 3"
                  label={{ value: targetLabel, position: 'top', fontSize: 10 }}
                />
              )}
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isMedianBucket
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--primary) / 0.5)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Mean</p>
            <p className="text-lg font-semibold">{formatValue(interval.mean)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Std Dev</p>
            <p className="text-lg font-semibold">{formatValue(interval.stdDev)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Range (P10–P90)</p>
            <p className="text-lg font-semibold">
              {formatValue(interval.p90 - interval.p10)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ConfidenceMetric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`text-center p-2 rounded-lg ${highlight ? 'bg-primary/10 ring-1 ring-primary' : ''}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</p>
    </div>
  )
}

export default MonteCarloVisualization
