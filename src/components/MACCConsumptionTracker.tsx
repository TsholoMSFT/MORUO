/**
 * MACC Consumption Tracker Component
 * Visualizes Azure consumption commitment progress and projections
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CloudArrowUp,
  TrendUp,
  TrendDown,
  Warning,
  CheckCircle,
  ChartLine,
  Lightning,
  Target,
  Calendar,
  CurrencyDollar,
} from '@phosphor-icons/react'
import {
  generateMACCProjection,
  calculateConsumptionMetrics,
  formatConsumption,
  type MACCCommitment,
  type MACCProjection,
  type MACCAnalysisInput,
  type PlannedWorkload,
  AZURE_WORKLOAD_CATEGORIES,
  type WorkloadCategory,
} from '@/lib/macc-consumption'

interface MACCConsumptionTrackerProps {
  initialCommitment?: Partial<MACCCommitment>
  initialConsumption?: number
}

export function MACCConsumptionTracker({
  initialCommitment,
  initialConsumption = 50000,
}: MACCConsumptionTrackerProps) {
  // Form state
  const [commitment, setCommitment] = useState<MACCCommitment>({
    totalCommitment: initialCommitment?.totalCommitment || 1000000,
    termMonths: initialCommitment?.termMonths || 36,
    startDate: initialCommitment?.startDate || new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: initialCommitment?.endDate || new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: initialCommitment?.currency || 'USD',
  })
  
  const [currentConsumption, setCurrentConsumption] = useState(initialConsumption)
  const [growthRate, setGrowthRate] = useState(20) // 20% annual growth
  const [plannedWorkloads, setPlannedWorkloads] = useState<PlannedWorkload[]>([])
  
  // Generate projections
  const projection = useMemo(() => {
    const input: MACCAnalysisInput = {
      commitment,
      currentMonthlyConsumption: currentConsumption,
      growthRatePercent: growthRate,
      plannedWorkloads,
    }
    return generateMACCProjection(input)
  }, [commitment, currentConsumption, growthRate, plannedWorkloads])
  
  const metrics = useMemo(() => calculateConsumptionMetrics(projection), [projection])
  
  const addPlannedWorkload = () => {
    setPlannedWorkloads([
      ...plannedWorkloads,
      {
        name: 'New Workload',
        category: 'compute' as WorkloadCategory,
        estimatedMonthlyConsumption: 5000,
        startMonth: 3,
        rampUpMonths: 2,
      },
    ])
  }
  
  const removePlannedWorkload = (index: number) => {
    setPlannedWorkloads(plannedWorkloads.filter((_, i) => i !== index))
  }
  
  const updatePlannedWorkload = (index: number, updates: Partial<PlannedWorkload>) => {
    setPlannedWorkloads(plannedWorkloads.map((w, i) => 
      i === index ? { ...w, ...updates } : w
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CloudArrowUp size={28} weight="duotone" className="text-primary" />
            Azure MACC Consumption Tracker
          </h2>
          <p className="text-muted-foreground">
            Track and project your Azure consumption commitment
          </p>
        </div>
        <Badge
          variant={metrics.trajectoryStatus === 'on-track' || metrics.trajectoryStatus === 'ahead' ? 'default' : 'destructive'}
          className="text-sm px-3 py-1"
        >
          {metrics.trajectoryStatus.toUpperCase().replace('-', ' ')}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Total Commitment"
          value={formatConsumption(commitment.totalCommitment, commitment.currency)}
          icon={<CurrencyDollar size={20} />}
        />
        <SummaryCard
          label="Consumed"
          value={formatConsumption(projection.summary.totalConsumed, commitment.currency)}
          subValue={`${projection.summary.percentConsumed.toFixed(1)}%`}
          icon={<ChartLine size={20} />}
          trend={projection.summary.onTrack ? 'positive' : 'negative'}
        />
        <SummaryCard
          label="Remaining"
          value={formatConsumption(projection.summary.totalRemaining, commitment.currency)}
          subValue={`${projection.summary.monthsRemaining} months left`}
          icon={<Target size={20} />}
        />
        <SummaryCard
          label="Monthly Run Rate"
          value={formatConsumption(projection.summary.currentMonthlyRunRate, commitment.currency)}
          subValue={`Required: ${formatConsumption(metrics.requiredVelocity, commitment.currency)}`}
          icon={<Lightning size={20} />}
          trend={metrics.velocityGap <= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Consumption Progress</span>
              <span className="font-mono">{projection.summary.percentConsumed.toFixed(1)}%</span>
            </div>
            <Progress value={projection.summary.percentConsumed} className="h-4" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start: {commitment.startDate}</span>
              <span>End: {commitment.endDate}</span>
            </div>
          </div>
          
          {/* Trajectory Alert */}
          {projection.summary.riskLevel !== 'low' && (
            <Alert 
              className={`mt-4 ${
                projection.summary.riskLevel === 'high' 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-amber-500 bg-amber-500/10'
              }`}
            >
              <Warning size={16} className={projection.summary.riskLevel === 'high' ? 'text-red-500' : 'text-amber-500'} />
              <AlertDescription>
                {projection.summary.riskLevel === 'high' ? (
                  <>
                    <strong>At Risk:</strong> Current consumption is significantly behind schedule. 
                    Projected shortfall: {formatConsumption(projection.summary.projectedShortfall, commitment.currency)}
                  </>
                ) : (
                  <>
                    <strong>Attention:</strong> Consumption is slightly behind target. 
                    Consider accelerating cloud adoption to meet commitment.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="projections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="workloads">Workload Mix</TabsTrigger>
          <TabsTrigger value="planning">Planned Workloads</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="projections" className="mt-4 space-y-4">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Projection Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>Total Commitment ({commitment.currency})</Label>
                  <Input
                    type="number"
                    value={commitment.totalCommitment}
                    onChange={(e) => setCommitment({ ...commitment, totalCommitment: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Current Monthly Consumption</Label>
                  <Input
                    type="number"
                    value={currentConsumption}
                    onChange={(e) => setCurrentConsumption(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Annual Growth Rate (%)</Label>
                  <Input
                    type="number"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Term (Months)</Label>
                  <Input
                    type="number"
                    value={commitment.termMonths}
                    onChange={(e) => setCommitment({ ...commitment, termMonths: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consumption Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Consumption Timeline</CardTitle>
              <CardDescription>Historical and projected monthly consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {/* Historical bars */}
                {projection.consumptionHistory.slice(-12).map((point, i) => {
                  const heightPercent = Math.max(4, (point.consumed / projection.summary.currentMonthlyRunRate) * 50)
                  return (
                    <div
                      key={`hist-${i}`}
                      className={`flex-1 bg-primary/30 rounded-t transition-all hover:bg-primary/50 min-h-1 h-[${Math.round(heightPercent)}%]`}
                      title={`${point.month}: ${formatConsumption(point.consumed)}`}
                      role="graphics-symbol"
                      aria-label={`Historical: ${point.month}: ${formatConsumption(point.consumed)}`}
                    />
                  )
                })}
                {/* Projected bars */}
                {projection.projectedConsumption.slice(0, 12).map((point, i) => {
                  const heightPercent = Math.max(4, (point.projected / (projection.summary.currentMonthlyRunRate * 2)) * 50)
                  return (
                    <div
                      key={`proj-${i}`}
                      className={`flex-1 bg-primary rounded-t transition-all hover:bg-primary/80 border-2 border-dashed border-primary min-h-1 h-[${Math.round(heightPercent)}%]`}
                      title={`${point.month}: ${formatConsumption(point.projected)} (projected)`}
                      role="graphics-symbol"
                      aria-label={`Projected: ${point.month}: ${formatConsumption(point.projected)}`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>← Historical</span>
                <span>Projected →</span>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Velocity Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Velocity</span>
                    <span className="font-mono">{formatConsumption(metrics.monthlyVelocity)}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Required Velocity</span>
                    <span className="font-mono">{formatConsumption(metrics.requiredVelocity)}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Velocity Gap</span>
                    <span className={`font-mono ${metrics.velocityGap > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {metrics.velocityGap > 0 ? '+' : ''}{formatConsumption(metrics.velocityGap)}/mo
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">End-of-Term Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Projected Total</span>
                    <span className="font-mono">{formatConsumption(projection.summary.projectedEndConsumption)}</span>
                  </div>
                  {projection.summary.projectedShortfall > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span className="text-sm">Projected Shortfall</span>
                      <span className="font-mono">{formatConsumption(projection.summary.projectedShortfall)}</span>
                    </div>
                  )}
                  {projection.summary.projectedOverage > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span className="text-sm">Projected Overage</span>
                      <span className="font-mono">+{formatConsumption(projection.summary.projectedOverage)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Days Remaining</span>
                    <span className="font-mono">{projection.summary.monthsRemaining * 30}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Days to Consume</span>
                    <span className="font-mono">{Math.round(metrics.daysToCommitment)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workloads" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Workload Distribution</CardTitle>
              <CardDescription>Breakdown of consumption by Azure service category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projection.workloadBreakdown.map((workload, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{workload.category}</span>
                        <Badge variant="outline" className="text-xs">
                          {workload.growthRate}% growth
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-mono">{formatConsumption(workload.monthlyConsumption)}/mo</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({workload.percentOfTotal}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={workload.percentOfTotal} className="h-2" />
                    <div className="flex gap-2 flex-wrap">
                      {workload.services.map((svc, j) => (
                        <span key={j} className="text-xs px-2 py-1 bg-muted rounded flex items-center gap-1">
                          {svc.trend === 'growing' && <TrendUp size={12} className="text-green-500" />}
                          {svc.trend === 'declining' && <TrendDown size={12} className="text-red-500" />}
                          {svc.name}: {formatConsumption(svc.monthlySpend)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planned Workload Migrations</CardTitle>
              <CardDescription>Add planned workloads to see their impact on consumption projections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plannedWorkloads.map((workload, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={workload.name}
                        onChange={(e) => updatePlannedWorkload(i, { name: e.target.value })}
                        className="w-48"
                        placeholder="Workload name"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removePlannedWorkload(i)}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <Label htmlFor={`workload-category-${i}`}>Category</Label>
                        <select
                          id={`workload-category-${i}`}
                          title="Select workload category"
                          className="w-full h-10 px-3 border rounded-md bg-background"
                          value={workload.category}
                          onChange={(e) => updatePlannedWorkload(i, { category: e.target.value as WorkloadCategory })}
                        >
                          {Object.entries(AZURE_WORKLOAD_CATEGORIES).map(([key, val]) => (
                            <option key={key} value={key}>{val.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Monthly Consumption</Label>
                        <Input
                          type="number"
                          value={workload.estimatedMonthlyConsumption}
                          onChange={(e) => updatePlannedWorkload(i, { estimatedMonthlyConsumption: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Start (months from now)</Label>
                        <Input
                          type="number"
                          value={workload.startMonth}
                          onChange={(e) => updatePlannedWorkload(i, { startMonth: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Ramp-up (months)</Label>
                        <Input
                          type="number"
                          value={workload.rampUpMonths}
                          onChange={(e) => updatePlannedWorkload(i, { rampUpMonths: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" onClick={addPlannedWorkload} className="w-full">
                  + Add Planned Workload
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {plannedWorkloads.length > 0 && (
            <Alert>
              <CheckCircle size={16} className="text-green-500" />
              <AlertDescription>
                Planned workloads will add approximately{' '}
                <strong>
                  {formatConsumption(
                    plannedWorkloads.reduce((sum, w) => sum + w.estimatedMonthlyConsumption, 0) * 12
                  )}
                </strong>{' '}
                annually once fully ramped.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <div className="space-y-4">
            {projection.recommendations.map((rec, i) => (
              <Card key={i} className={`border-l-4 ${
                rec.priority === 'high' ? 'border-l-red-500' :
                rec.priority === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {rec.type === 'accelerate' && <Lightning size={20} className="text-amber-500" />}
                      {rec.type === 'migrate' && <CloudArrowUp size={20} className="text-primary" />}
                      {rec.type === 'optimize' && <Target size={20} className="text-green-500" />}
                      {rec.type === 'expand' && <TrendUp size={20} className="text-blue-500" />}
                      {rec.title}
                    </CardTitle>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{rec.description}</p>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Est. Impact: </span>
                      <span className="font-mono font-medium">
                        {rec.estimatedImpact > 0 ? '+' : ''}{formatConsumption(rec.estimatedImpact)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeline: </span>
                      <span className="font-medium">{rec.timeline}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {projection.recommendations.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                  <h3 className="font-medium text-lg mb-2">On Track!</h3>
                  <p className="text-muted-foreground">
                    Your consumption trajectory is healthy. No urgent actions required.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  trend?: 'positive' | 'negative'
}

function SummaryCard({ label, value, subValue, icon, trend }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subValue && (
              <p className={`text-xs mt-1 ${
                trend === 'positive' ? 'text-green-500' :
                trend === 'negative' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {trend === 'positive' && <CheckCircle size={12} className="inline mr-1" weight="fill" />}
                {trend === 'negative' && <Warning size={12} className="inline mr-1" weight="fill" />}
                {subValue}
              </p>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
