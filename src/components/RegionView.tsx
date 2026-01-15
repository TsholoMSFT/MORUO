import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, MapPin, Buildings, ChartBar, TrendUp, User } from '@phosphor-icons/react'
import type { Analysis } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { Badge } from '@/components/ui/badge'
import { PriorityBadge } from './PriorityBadge'
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb'

interface RegionViewProps {
  regionName: string
  analyses: Analysis[]
  onBack: () => void
  onSelectAnalysis: (analysis: Analysis) => void
  onNavigateGlobal?: () => void
  onViewCustomer?: (customerName: string) => void
  onNavigateLibrary?: () => void
}

export function RegionView({ regionName, analyses, onBack, onSelectAnalysis, onNavigateGlobal, onViewCustomer, onNavigateLibrary }: RegionViewProps) {
  const regionAnalyses = analyses.filter((a) => a.projectBasics.region === regionName)

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Library', onClick: onNavigateLibrary },
    { label: 'Global View', onClick: onBack },
    { label: regionName },
  ]

  const regionMetrics = regionAnalyses.reduce(
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
    regionMetrics.avgROI = regionMetrics.avgROI / regionAnalyses.length
    regionMetrics.avgPaybackMonths = regionMetrics.avgPaybackMonths / regionAnalyses.length
  }

  const subsidiaryMap = regionAnalyses.reduce(
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

  const subsidiaries = Object.entries(subsidiaryMap).map(([name, subsidiaryAnalyses]) => ({
    name,
    count: subsidiaryAnalyses.length,
    totalInvestment: subsidiaryAnalyses.reduce((sum, a) => sum + a.projectBasics.investmentAmount, 0),
    totalNPV: subsidiaryAnalyses.reduce((sum, a) => sum + a.results.realistic.npv, 0),
    avgROI: subsidiaryAnalyses.reduce((sum, a) => sum + a.results.realistic.roi, 0) / subsidiaryAnalyses.length,
  }))
  .sort((a, b) => b.totalNPV - a.totalNPV)

  const customerMap = regionAnalyses.reduce(
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

  const customers = Object.entries(customerMap).map(([name, customerAnalyses]) => ({
    name,
    count: customerAnalyses.length,
    totalInvestment: customerAnalyses.reduce((sum, a) => sum + a.projectBasics.investmentAmount, 0),
    totalNPV: customerAnalyses.reduce((sum, a) => sum + a.results.realistic.npv, 0),
    avgROI: customerAnalyses.reduce((sum, a) => sum + a.results.realistic.roi, 0) / customerAnalyses.length,
  }))
  .sort((a, b) => b.totalNPV - a.totalNPV)

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2">
          <ArrowLeft className="mr-2" />
          Back to Global View
        </Button>
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent p-2">
            <MapPin size={28} weight="bold" className="text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">{regionName}</h1>
            <p className="text-muted-foreground">Regional portfolio overview</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <ChartBar size={24} className="text-primary" weight="bold" />
            <div>
              <p className="text-sm text-muted-foreground">Total Use Cases</p>
              <p className="font-mono text-2xl font-bold">{regionMetrics.useCaseCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendUp size={24} className="text-primary" weight="bold" />
            <div>
              <p className="text-sm text-muted-foreground">Total Investment</p>
              <p className="font-mono text-2xl font-bold">{formatCurrency(regionMetrics.totalInvestment)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendUp size={24} className="text-primary" weight="bold" />
            <div>
              <p className="text-sm text-muted-foreground">Total NPV</p>
              <p className="font-mono text-2xl font-bold">{formatCurrency(regionMetrics.totalNPV)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendUp size={24} className="text-primary" weight="bold" />
            <div>
              <p className="text-sm text-muted-foreground">Avg ROI</p>
              <p className="font-mono text-2xl font-bold">{formatPercent(regionMetrics.avgROI)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="subsidiaries" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subsidiaries">By Subsidiary</TabsTrigger>
          <TabsTrigger value="customers">By Customer</TabsTrigger>
          <TabsTrigger value="usecases">All Use Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="subsidiaries" className="space-y-4">
          <h2 className="font-heading text-2xl font-bold">Subsidiaries in {regionName}</h2>
          <div className="grid gap-4">
            {subsidiaries.map(({ name, count, totalInvestment, totalNPV, avgROI }) => (
              <Card key={name} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-accent/10 p-3">
                      <Buildings size={24} weight="bold" className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold">{name}</h3>
                      <p className="text-sm text-muted-foreground">{count} use cases</p>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Investment</p>
                          <p className="font-mono font-semibold">{formatCurrency(totalInvestment)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total NPV</p>
                          <p className="font-mono font-semibold">{formatCurrency(totalNPV)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg ROI</p>
                          <p className="font-mono font-semibold">{formatPercent(avgROI)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={avgROI > 50 ? 'default' : 'secondary'}>
                    {avgROI > 50 ? 'Strong' : 'Moderate'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <h2 className="font-heading text-2xl font-bold">Customers in {regionName}</h2>
          <div className="grid gap-4">
            {customers.map(({ name, count, totalInvestment, totalNPV, avgROI }) => (
              <Card 
                key={name} 
                className={onViewCustomer ? "cursor-pointer p-6 transition-shadow hover:shadow-md" : "p-6"}
                onClick={() => onViewCustomer && onViewCustomer(name)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-accent/10 p-3">
                      <User size={24} weight="bold" className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold">{name}</h3>
                      <p className="text-sm text-muted-foreground">{count} use cases</p>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Investment</p>
                          <p className="font-mono font-semibold">{formatCurrency(totalInvestment)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total NPV</p>
                          <p className="font-mono font-semibold">{formatCurrency(totalNPV)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg ROI</p>
                          <p className="font-mono font-semibold">{formatPercent(avgROI)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={avgROI > 50 ? 'default' : 'secondary'}>
                    {avgROI > 50 ? 'Strong' : 'Moderate'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usecases" className="space-y-4">
          <h2 className="font-heading text-2xl font-bold">All Use Cases</h2>
          <div className="grid gap-4">{regionAnalyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="cursor-pointer p-6 transition-shadow hover:shadow-md"
              onClick={() => onSelectAnalysis(analysis)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-xl font-bold">{analysis.projectBasics.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {analysis.projectBasics.customerName} • {analysis.projectBasics.subsidiary}
                      </p>
                    </div>
                    <PriorityBadge priority={analysis.recommendation.priority} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Investment</p>
                      <p className="font-mono font-semibold">
                        {formatCurrency(analysis.projectBasics.investmentAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ROI</p>
                      <p className="font-mono font-semibold">{formatPercent(analysis.results.realistic.roi)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">NPV</p>
                      <p className="font-mono font-semibold">{formatCurrency(analysis.results.realistic.npv)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payback</p>
                      <p className="font-mono font-semibold">
                        {analysis.results.realistic.paybackMonths.toFixed(1)} mo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
