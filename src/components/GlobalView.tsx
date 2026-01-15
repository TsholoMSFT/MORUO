import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Globe, MapPin, Buildings, ChartBar, TrendUp } from '@phosphor-icons/react'
import type { Analysis } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb'

interface GlobalViewProps {
  analyses: Analysis[]
  onBack: () => void
  onSelectAnalysis: (analysis: Analysis) => void
  onViewRegion: (region: string) => void
  onViewSubsidiary: (subsidiary: string) => void
  onViewCustomer: (customerName: string) => void
}

interface AggregatedMetrics {
  totalInvestment: number
  avgROI: number
  totalNPV: number
  useCaseCount: number
  avgPaybackMonths: number
}

export function GlobalView({ analyses, onBack, onSelectAnalysis, onViewRegion, onViewSubsidiary, onViewCustomer }: GlobalViewProps) {
  const globalMetrics: AggregatedMetrics = analyses.reduce(
    (acc, analysis) => ({
      totalInvestment: acc.totalInvestment + analysis.projectBasics.investmentAmount,
      avgROI: acc.avgROI + analysis.results.realistic.roi,
      totalNPV: acc.totalNPV + analysis.results.realistic.npv,
      useCaseCount: acc.useCaseCount + 1,
      avgPaybackMonths: acc.avgPaybackMonths + analysis.results.realistic.paybackMonths,
    }),
    { totalInvestment: 0, avgROI: 0, totalNPV: 0, useCaseCount: 0, avgPaybackMonths: 0 }
  )

  if (analyses.length > 0) {
    globalMetrics.avgROI = globalMetrics.avgROI / analyses.length
    globalMetrics.avgPaybackMonths = globalMetrics.avgPaybackMonths / analyses.length
  }

  const regionMap = analyses.reduce(
    (acc, analysis) => {
      const region = analysis.projectBasics.region || 'Unspecified'
      if (region !== 'Global') {
        if (!acc[region]) {
          acc[region] = []
        }
        acc[region].push(analysis)
      }
      return acc
    },
    {} as Record<string, Analysis[]>
  )

  const subsidiaryMap = analyses.reduce(
    (acc, analysis) => {
      const subsidiary = analysis.projectBasics.subsidiary || 'Unspecified'
      if (!acc[subsidiary]) {
        acc[subsidiary] = []
      }
      acc[subsidiary].push(analysis)
      return acc
    },
    {} as Record<string, Analysis[]>
  )

  const calculateRegionMetrics = (regionAnalyses: Analysis[]): AggregatedMetrics => {
    const metrics = regionAnalyses.reduce(
      (acc, analysis) => ({
        totalInvestment: acc.totalInvestment + analysis.projectBasics.investmentAmount,
        avgROI: acc.avgROI + analysis.results.realistic.roi,
        totalNPV: acc.totalNPV + analysis.results.realistic.npv,
        useCaseCount: acc.useCaseCount + 1,
        avgPaybackMonths: acc.avgPaybackMonths + analysis.results.realistic.paybackMonths,
      }),
      { totalInvestment: 0, avgROI: 0, totalNPV: 0, useCaseCount: 0, avgPaybackMonths: 0 }
    )
    
    if (regionAnalyses.length > 0) {
      metrics.avgROI = metrics.avgROI / regionAnalyses.length
      metrics.avgPaybackMonths = metrics.avgPaybackMonths / regionAnalyses.length
    }
    
    return metrics
  }

  const regions = Object.entries(regionMap)
    .map(([name, regionAnalyses]) => ({
      name,
      metrics: calculateRegionMetrics(regionAnalyses),
    }))
    .sort((a, b) => b.metrics.totalNPV - a.metrics.totalNPV)

  const subsidiaries = Object.entries(subsidiaryMap)
    .map(([name, subsidiaryAnalyses]) => ({
      name,
      metrics: calculateRegionMetrics(subsidiaryAnalyses),
    }))
    .sort((a, b) => b.metrics.totalNPV - a.metrics.totalNPV)

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Library', onClick: onBack },
    { label: 'Global View' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="w-full">
          <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2">
            <ArrowLeft className="mr-2" />
            Back to Library
          </Button>
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent p-2">
              <Globe size={28} weight="bold" className="text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Global / Corporate View</h1>
              <p className="text-muted-foreground">
                Consolidated view of all use cases across regions and subsidiaries
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <ChartBar size={24} className="text-primary" weight="bold" />
            <div>
              <p className="text-sm text-muted-foreground">Total Use Cases</p>
              <p className="font-mono text-2xl font-bold">{globalMetrics.useCaseCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendUp size={24} className="text-primary" weight="bold" />
            <div>
              <p className="text-sm text-muted-foreground">Total Investment</p>
              <p className="font-mono text-2xl font-bold">{formatCurrency(globalMetrics.totalInvestment)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendUp size={24} className="text-primary" weight="bold" />
            <div>
              <p className="text-sm text-muted-foreground">Total NPV</p>
              <p className="font-mono text-2xl font-bold">{formatCurrency(globalMetrics.totalNPV)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendUp size={24} className="text-primary" weight="bold" />
            <div>
              <p className="text-sm text-muted-foreground">Avg ROI</p>
              <p className="font-mono text-2xl font-bold">{formatPercent(globalMetrics.avgROI)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="regions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="regions">By Region</TabsTrigger>
          <TabsTrigger value="subsidiaries">By Subsidiary</TabsTrigger>
          <TabsTrigger value="customers">By Customer</TabsTrigger>
        </TabsList>

        <TabsContent value="regions" className="space-y-4">
          <div className="grid gap-4">
            {regions.map(({ name, metrics }) => (
              <Card
                key={name}
                className="cursor-pointer p-6 transition-shadow hover:shadow-md"
                onClick={() => onViewRegion(name)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-accent/10 p-3">
                      <MapPin size={24} weight="bold" className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold">{name}</h3>
                      <p className="text-sm text-muted-foreground">{metrics.useCaseCount} use cases</p>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Investment</p>
                          <p className="font-mono font-semibold">{formatCurrency(metrics.totalInvestment)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total NPV</p>
                          <p className="font-mono font-semibold">{formatCurrency(metrics.totalNPV)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg ROI</p>
                          <p className="font-mono font-semibold">{formatPercent(metrics.avgROI)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Payback</p>
                          <p className="font-mono font-semibold">{metrics.avgPaybackMonths.toFixed(1)} mo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={metrics.avgROI > 50 ? 'default' : 'secondary'}>
                    {metrics.avgROI > 50 ? 'Strong' : 'Moderate'}
                  </Badge>
                </div>
              </Card>
            ))}
            {regions.length === 0 && (
              <Card className="p-12 text-center">
                <MapPin size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No regions available</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="subsidiaries" className="space-y-4">
          <div className="grid gap-4">
            {subsidiaries.map(({ name, metrics }) => (
              <Card
                key={name}
                className="cursor-pointer p-6 transition-shadow hover:shadow-md"
                onClick={() => onViewSubsidiary(name)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-accent/10 p-3">
                      <Buildings size={24} weight="bold" className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold">{name}</h3>
                      <p className="text-sm text-muted-foreground">{metrics.useCaseCount} use cases</p>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Investment</p>
                          <p className="font-mono font-semibold">{formatCurrency(metrics.totalInvestment)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total NPV</p>
                          <p className="font-mono font-semibold">{formatCurrency(metrics.totalNPV)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg ROI</p>
                          <p className="font-mono font-semibold">{formatPercent(metrics.avgROI)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Payback</p>
                          <p className="font-mono font-semibold">{metrics.avgPaybackMonths.toFixed(1)} mo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={metrics.avgROI > 50 ? 'default' : 'secondary'}>
                    {metrics.avgROI > 50 ? 'Strong' : 'Moderate'}
                  </Badge>
                </div>
              </Card>
            ))}
            {subsidiaries.length === 0 && (
              <Card className="p-12 text-center">
                <Buildings size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No subsidiaries available</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(
              analyses.reduce(
                (acc, analysis) => {
                  const customer = analysis.projectBasics.customerName || 'Unnamed'
                  if (!acc[customer]) {
                    acc[customer] = []
                  }
                  acc[customer].push(analysis)
                  return acc
                },
                {} as Record<string, Analysis[]>
              )
            ).map(([customer, customerAnalyses]) => {
              const metrics = calculateRegionMetrics(customerAnalyses)
              return (
                <Card 
                  key={customer} 
                  className="cursor-pointer p-6 transition-shadow hover:shadow-md"
                  onClick={() => onViewCustomer(customer)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-xl font-bold">{customer}</h3>
                      <p className="text-sm text-muted-foreground">{metrics.useCaseCount} use cases</p>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Investment</p>
                          <p className="font-mono font-semibold">{formatCurrency(metrics.totalInvestment)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total NPV</p>
                          <p className="font-mono font-semibold">{formatCurrency(metrics.totalNPV)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg ROI</p>
                          <p className="font-mono font-semibold">{formatPercent(metrics.avgROI)}</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant={metrics.avgROI > 50 ? 'default' : 'secondary'}>
                      {metrics.avgROI > 50 ? 'Strong' : 'Moderate'}
                    </Badge>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
