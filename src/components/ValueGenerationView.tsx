import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ArrowLeft, TrendUp, Export, DownloadSimple } from '@phosphor-icons/react'
import type { Analysis, SolutionArea } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { exportValueDashboardToCSV, exportSolutionAreaComparisonToCSV } from '@/lib/csv-export'
import { toast } from 'sonner'

interface ValueGenerationViewProps {
  analyses: Analysis[]
  onBack: () => void
  onSelectAnalysis: (analysis: Analysis) => void
}

export function ValueGenerationView({ analyses, onBack, onSelectAnalysis }: ValueGenerationViewProps) {
  const [selectedSolutionAreas, setSelectedSolutionAreas] = useState<SolutionArea[]>([])
  const [selectedSubsidiaries, setSelectedSubsidiaries] = useState<string[]>([])

  const allSolutionAreas: SolutionArea[] = ['AI Business Solutions', 'Cloud & AI Platforms', 'Security', 'Other']

  const solutionAreasWithData = useMemo(() => {
    const areasSet = new Set<SolutionArea>()
    analyses.forEach((analysis) => {
      if (analysis.projectBasics.solutionAreas && analysis.projectBasics.solutionAreas.length > 0) {
        analysis.projectBasics.solutionAreas.forEach(area => areasSet.add(area))
      } else {
        areasSet.add(analysis.projectBasics.solutionArea)
      }
    })
    return Array.from(areasSet).sort()
  }, [analyses])

  const subsidiariesWithData = useMemo(() => {
    const subsidiariesSet = new Set<string>()
    analyses.forEach((analysis) => {
      if (analysis.projectBasics.subsidiary) {
        subsidiariesSet.add(analysis.projectBasics.subsidiary)
      }
    })
    return Array.from(subsidiariesSet).sort()
  }, [analyses])

  const toggleSolutionArea = (area: SolutionArea) => {
    setSelectedSolutionAreas(current => 
      current.includes(area) 
        ? current.filter(a => a !== area)
        : [...current, area]
    )
  }

  const toggleSubsidiary = (subsidiary: string) => {
    setSelectedSubsidiaries(current => 
      current.includes(subsidiary) 
        ? current.filter(s => s !== subsidiary)
        : [...current, subsidiary]
    )
  }

  const filteredAnalyses = useMemo(() => {
    let filtered = analyses

    if (selectedSolutionAreas.length > 0) {
      filtered = filtered.filter((a) => {
        const areas = a.projectBasics.solutionAreas && a.projectBasics.solutionAreas.length > 0
          ? a.projectBasics.solutionAreas
          : [a.projectBasics.solutionArea]
        return areas.some(area => selectedSolutionAreas.includes(area))
      })
    }

    if (selectedSubsidiaries.length > 0) {
      filtered = filtered.filter((a) => 
        a.projectBasics.subsidiary && selectedSubsidiaries.includes(a.projectBasics.subsidiary)
      )
    }

    return filtered
  }, [analyses, selectedSolutionAreas, selectedSubsidiaries])

  const valueByAreaComparison = useMemo(() => {
    const areasMap = new Map<SolutionArea, { count: number; totalValue: number; avgROI: number }>()

    analyses.forEach((analysis) => {
      const areas = analysis.projectBasics.solutionAreas && analysis.projectBasics.solutionAreas.length > 0
        ? analysis.projectBasics.solutionAreas
        : [analysis.projectBasics.solutionArea]
      
      areas.forEach(area => {
        const existing = areasMap.get(area) || { count: 0, totalValue: 0, avgROI: 0 }

        areasMap.set(area, {
          count: existing.count + 1,
          totalValue: existing.totalValue + analysis.results.realistic.netBenefit,
          avgROI: existing.avgROI + analysis.results.realistic.roi,
        })
      })
    })

    return Array.from(areasMap.entries())
      .map(([area, data]) => ({
        area,
        count: data.count,
        totalValue: data.totalValue,
        avgROI: data.avgROI / data.count,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
  }, [analyses])

  const totalNetBenefit = useMemo(
    () => filteredAnalyses.reduce((sum, a) => sum + a.results.realistic.netBenefit, 0),
    [filteredAnalyses]
  )

  const avgROI = useMemo(() => {
    if (filteredAnalyses.length === 0) return 0
    return (
      filteredAnalyses.reduce((sum, a) => sum + a.results.realistic.roi, 0) / filteredAnalyses.length
    )
  }, [filteredAnalyses])

  const topPerformers = useMemo(
    () =>
      [...filteredAnalyses].sort((a, b) => b.results.realistic.netBenefit - a.results.realistic.netBenefit).slice(0, 10),
    [filteredAnalyses]
  )

  const handleExportTopPerformers = () => {
    try {
      exportValueDashboardToCSV(filteredAnalyses, selectedSolutionAreas, selectedSubsidiaries)
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export CSV')
    }
  }

  const handleExportSolutionAreaComparison = () => {
    try {
      exportSolutionAreaComparisonToCSV(valueByAreaComparison)
      toast.success('Solution area comparison exported!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export CSV')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2">
            <ArrowLeft className="mr-2" />
            Back to Library
          </Button>
          <div>
            <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight">
              Value Generation Dashboard
            </h1>
            <p className="text-muted-foreground">
              Analyze where your technology investments generate the most business value
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSolutionAreaComparison}>
            <DownloadSimple className="mr-2" />
            Export Areas
          </Button>
          <Button onClick={handleExportTopPerformers}>
            <Export className="mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Filter by Solution Areas</Label>
            <p className="text-sm text-muted-foreground">
              Select one or more solution areas to filter use cases. Leave all unchecked to see all areas.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {allSolutionAreas.map((area) => {
                const hasData = solutionAreasWithData.includes(area)
                return (
                  <div
                    key={area}
                    className={cn(
                      'flex items-start space-x-3 rounded-lg border p-3 transition-colors',
                      !hasData && 'opacity-50'
                    )}
                  >
                    <Checkbox
                      id={`filter-${area}`}
                      checked={selectedSolutionAreas.includes(area)}
                      onCheckedChange={() => toggleSolutionArea(area)}
                      disabled={!hasData}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`filter-${area}`}
                        className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {area}
                      </label>
                      {hasData && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {valueByAreaComparison.find(v => v.area === area)?.count || 0} use cases
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Filter by Subsidiary</Label>
            <p className="text-sm text-muted-foreground">
              Select one or more subsidiaries to filter use cases. Leave all unchecked to see all subsidiaries.
            </p>
            {subsidiariesWithData.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No subsidiaries found in use cases
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {subsidiariesWithData.map((subsidiary) => {
                  const count = analyses.filter(a => a.projectBasics.subsidiary === subsidiary).length
                  return (
                    <div
                      key={subsidiary}
                      className="flex items-start space-x-3 rounded-lg border p-3 transition-colors"
                    >
                      <Checkbox
                        id={`filter-subsidiary-${subsidiary}`}
                        checked={selectedSubsidiaries.includes(subsidiary)}
                        onCheckedChange={() => toggleSubsidiary(subsidiary)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`filter-subsidiary-${subsidiary}`}
                          className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {subsidiary}
                        </label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {count} use case{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="p-6">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Total Net Benefit</div>
          <div className="font-heading text-3xl font-bold text-primary">{formatCurrency(totalNetBenefit)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            From {filteredAnalyses.length} use case{filteredAnalyses.length !== 1 ? 's' : ''}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Average ROI</div>
          <div className="font-heading text-3xl font-bold text-primary">{avgROI.toFixed(0)}%</div>
          <div className="mt-1 text-xs text-muted-foreground">Realistic scenario average</div>
        </Card>

        <Card className="p-6">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Solution Areas</div>
          <div className="font-heading text-3xl font-bold text-primary">
            {valueByAreaComparison.length}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Active investment areas</div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-heading text-xl font-bold">Value by Solution Area</h2>
        <div className="space-y-3">
          {valueByAreaComparison.map(({ area, count, totalValue, avgROI }) => (
            <div
              key={area}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{area}</div>
                  <span className="text-xs text-muted-foreground">({count} use cases)</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">Avg ROI: {avgROI.toFixed(0)}%</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-semibold text-primary">
                  {formatCurrency(totalValue)}
                </div>
                <div className="text-xs text-muted-foreground">Total net benefit</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-heading text-xl font-bold">
          Top Performing Use Cases
          {(selectedSolutionAreas.length > 0 || selectedSubsidiaries.length > 0) && ' (filtered)'}
        </h2>
        {topPerformers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No use cases found for this solution area
          </div>
        ) : (
          <div className="space-y-3">
            {topPerformers.map((analysis, index) => (
              <div
                key={analysis.id}
                className="flex cursor-pointer items-start justify-between rounded-lg border p-4 transition-colors hover:bg-accent/5"
                onClick={() => onSelectAnalysis(analysis)}
              >
                <div className="flex flex-1 items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{analysis.projectBasics.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{analysis.projectBasics.customerName}</span>
                      {analysis.projectBasics.subsidiary && (
                        <>
                          <span>•</span>
                          <span>{analysis.projectBasics.subsidiary}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {analysis.projectBasics.solutionAreas && analysis.projectBasics.solutionAreas.length > 0
                          ? analysis.projectBasics.solutionAreas.join(', ')
                          : analysis.projectBasics.solutionArea}
                      </span>
                      <span>•</span>
                      <span>ROI: {analysis.results.realistic.roi}%</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="flex items-center gap-1 font-mono text-lg font-semibold text-primary">
                    <TrendUp weight="bold" />
                    {formatCurrency(analysis.results.realistic.netBenefit)}
                  </div>
                  <div className="text-xs text-muted-foreground">Net benefit</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
